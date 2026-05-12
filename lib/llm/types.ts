import type { NormalizedTool } from "@/lib/tools/types";

export type GenerateRequest = {
  tool: Pick<NormalizedTool, "title" | "domain" | "description" | "promptTemplate" | "workflowSteps" | "sourceRepo" | "sourcePath" | "outputSchema">;
  input: Record<string, string>;
  provider?: string;
};

export type GeneratedOutput = {
  summary: string;
  workflow: string[];
  recommendations: string[];
  deliverable: string;
  checklist: string[];
  attribution: string;
  markdown: string;
};

export interface LlmProvider {
  id: string;
  label: string;
  generate(request: GenerateRequest): Promise<GeneratedOutput>;
}
