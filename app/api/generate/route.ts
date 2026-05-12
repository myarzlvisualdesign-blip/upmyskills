import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateWithProvider } from "@/lib/llm";
import type { ToolOutputSchema } from "@/lib/tools/types";

const requestSchema = z.object({
  toolId: z.string().min(1),
  input: z.record(z.string(), z.string().optional()).transform((value) => {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item ?? ""]));
  }),
  provider: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const tool = await prisma.tool.findUnique({ where: { id: body.toolId } });

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    const output = await generateWithProvider({
      provider: body.provider,
      input: body.input,
      tool: {
        title: tool.title,
        domain: tool.domain,
        description: tool.description,
        promptTemplate: tool.promptTemplate,
        workflowSteps: tool.workflowSteps as string[],
        sourceRepo: tool.sourceRepo,
        sourcePath: tool.sourcePath ?? undefined,
        outputSchema: tool.outputSchema as ToolOutputSchema
      }
    });

    const run = await prisma.run.create({
      data: {
        toolId: tool.id,
        input: body.input,
        output,
        provider: body.provider || process.env.UPMYSKILLS_PROVIDER || "local"
      }
    });

    return NextResponse.json({ runId: run.id, output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
