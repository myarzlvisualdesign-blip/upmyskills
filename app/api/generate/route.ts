import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runToolEngine, ToolValidationException, type ToolAiEnhancer } from "@/lib/tools/engine";
import type { NormalizedTool, ToolInputSchema, ToolOutputSchema } from "@/lib/tools/types";

const requestSchema = z.object({
  toolId: z.string().min(1),
  input: z.record(z.string(), z.string().optional()).transform((value) => {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item ?? ""]));
  }),
  provider: z.string().optional()
});

const openAiEnhancer: ToolAiEnhancer = async ({ definition, input, deterministicOutput }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions:
        "You are an enhancement layer for a deterministic software tool. Do not replace scores or checks. Return compact JSON only: {\"notes\":[\"...\"],\"provider\":\"openai\"}.",
      input: JSON.stringify({
        tool: {
          title: definition.title,
          domain: definition.domain,
          rendererType: definition.rendererType,
          aiEnhancementPrompt: definition.aiEnhancementPrompt
        },
        normalizedInput: input,
        deterministicOutput: {
          score: deterministicOutput.score,
          keyFindings: deterministicOutput.keyFindings,
          issues: deterministicOutput.issues.slice(0, 8),
          recommendations: deterministicOutput.recommendations.slice(0, 8)
        }
      })
    })
  });

  if (!response.ok) return null;
  const payload = await response.json();
  const outputText = typeof payload.output_text === "string" ? payload.output_text : "";
  if (!outputText) return null;

  try {
    const parsed = JSON.parse(outputText) as { notes?: string[]; provider?: string };
    return { provider: parsed.provider || "openai", notes: Array.isArray(parsed.notes) ? parsed.notes.slice(0, 3) : [] };
  } catch {
    return { provider: "openai", notes: [outputText.slice(0, 220)] };
  }
};

function asNormalizedTool(tool: Awaited<ReturnType<typeof prisma.tool.findUnique>>): NormalizedTool {
  if (!tool) throw new Error("Tool not found");
  const tags = Array.isArray(tool.tags) ? tool.tags.filter((tag): tag is string => typeof tag === "string") : [];
  return {
    id: tool.id,
    title: tool.title,
    slug: tool.slug,
    domain: tool.domain,
    description: tool.description,
    sourceRepo: tool.sourceRepo,
    sourcePath: tool.sourcePath ?? undefined,
    license: tool.license,
    inputSchema: tool.inputSchema as ToolInputSchema,
    promptTemplate: tool.promptTemplate,
    outputSchema: tool.outputSchema as ToolOutputSchema,
    workflowSteps: tool.workflowSteps as string[],
    exampleOutput: tool.exampleOutput as NormalizedTool["exampleOutput"],
    sampleInput: tool.sampleInput as Record<string, string>,
    tags
  };
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const tool = await prisma.tool.findUnique({ where: { id: body.toolId } });

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    const provider = body.provider || process.env.UPMYSKILLS_PROVIDER || "local";
    const output = await runToolEngine({
      input: body.input,
      tool: asNormalizedTool(tool),
      aiEnhancer: provider === "openai" ? openAiEnhancer : undefined
    });

    const run = await prisma.run.create({
      data: {
        toolId: tool.id,
        input: body.input,
        output,
        provider
      }
    });

    return NextResponse.json({ runId: run.id, output });
  } catch (error) {
    if (error instanceof ToolValidationException) {
      return NextResponse.json({ error: error.message, validationErrors: error.errors }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Tool execution failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
