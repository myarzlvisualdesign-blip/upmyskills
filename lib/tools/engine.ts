import { attachExports } from "./exporters";
import { resolveToolDefinition } from "./schemas";
import { runDeterministicAnalysis } from "./scoring";
import type { NormalizedTool, ToolDefinition, ToolRunOutput, ToolValidationError } from "./types";

export type ToolAiEnhancer = (request: {
  definition: ToolDefinition;
  input: Record<string, string>;
  deterministicOutput: ToolRunOutput;
}) => Promise<{ provider: string; notes: string[] } | null>;

export type RunToolEngineRequest = {
  tool: NormalizedTool;
  input: Record<string, string>;
  aiEnhancer?: ToolAiEnhancer;
};

export class ToolValidationException extends Error {
  readonly errors: ToolValidationError[];

  constructor(errors: ToolValidationError[]) {
    super(errors.map((error) => `${error.field}: ${error.message}`).join("; "));
    this.name = "ToolValidationException";
    this.errors = errors;
  }
}

function normalizeValue(value: string) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim();
}

export function normalizeInput(definition: ToolDefinition, input: Record<string, string>) {
  return Object.fromEntries(definition.inputSchema.fields.map((field) => [field.name, normalizeValue(input[field.name] ?? "")]));
}

export function validateToolInput(definition: ToolDefinition, input: Record<string, string>) {
  const errors: ToolValidationError[] = [];

  for (const field of definition.inputSchema.fields) {
    const value = normalizeValue(input[field.name] ?? "");
    if (field.required && !value) {
      errors.push({ field: field.name, message: `${field.label} is required.` });
    }
    if (field.type === "number" && value && !Number.isFinite(Number(value.replace(/[^0-9.-]/g, "")))) {
      errors.push({ field: field.name, message: `${field.label} must be numeric.` });
    }
    if (field.type === "select" && value && field.options?.length && !field.options.includes(value)) {
      errors.push({ field: field.name, message: `${field.label} must be one of: ${field.options.join(", ")}.` });
    }
  }

  if (errors.length) throw new ToolValidationException(errors);
}

function sourceFor(tool: NormalizedTool, definition: ToolDefinition) {
  return {
    sourceRepo: definition.sourceRepo ?? tool.sourceRepo,
    sourcePath: definition.sourcePath ?? tool.sourcePath,
    license: definition.license ?? tool.license
  };
}

export async function runToolEngine({ tool, input, aiEnhancer }: RunToolEngineRequest): Promise<ToolRunOutput> {
  const definition = resolveToolDefinition(tool);
  const normalizedInput = normalizeInput(definition, input);
  validateToolInput(definition, normalizedInput);

  const deterministic = runDeterministicAnalysis(definition, normalizedInput);
  let output: ToolRunOutput = {
    toolId: tool.id,
    rendererType: definition.rendererType,
    summary: `${definition.title} completed ${deterministic.issues.length} checks with ${deterministic.recommendations.length} prioritized actions.`,
    status: deterministic.status,
    score: deterministic.score,
    keyFindings: deterministic.keyFindings,
    issues: deterministic.issues,
    recommendations: deterministic.recommendations,
    analysisSections: deterministic.analysisSections,
    checklist: deterministic.checklist,
    timeline: deterministic.timeline,
    matrix: deterministic.matrix,
    exports: {},
    attribution: sourceFor(tool, definition),
    workflow: definition.workflowSteps,
    markdown: ""
  };

  if (aiEnhancer) {
    const aiEnhancement = await aiEnhancer({ definition, input: normalizedInput, deterministicOutput: output });
    if (aiEnhancement?.notes?.length) {
      output = {
        ...output,
        aiEnhancement,
        keyFindings: [...output.keyFindings, ...aiEnhancement.notes.slice(0, 2).map((note) => `AI refinement: ${note}`)]
      };
    }
  }

  return attachExports(output, definition.exportFormats);
}
