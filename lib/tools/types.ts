export type ToolFieldType = "text" | "textarea" | "select" | "number";

export type ToolInputField = {
  name: string;
  label: string;
  type: ToolFieldType;
  required: boolean;
  placeholder?: string;
  helperText?: string;
  options?: string[];
};

export type ToolInputSchema = {
  fields: ToolInputField[];
};

export type ToolOutputSection = {
  key: string;
  title: string;
  type: "markdown" | "list" | "table" | "score";
};

export type ToolOutputSchema = {
  sections: ToolOutputSection[];
};

export type ToolExampleOutput = {
  title: string;
  markdown: string;
};

export type NormalizedTool = {
  id: string;
  title: string;
  slug: string;
  domain: string;
  description: string;
  sourceRepo: string;
  sourcePath?: string;
  license: string;
  inputSchema: ToolInputSchema;
  promptTemplate: string;
  outputSchema: ToolOutputSchema;
  workflowSteps: string[];
  exampleOutput: ToolExampleOutput;
  sampleInput: Record<string, string>;
  tags: string[];
};

export type SourceRepoSeed = {
  id: string;
  name: string;
  url: string;
  license: string;
  lastIngestedAt: string;
  notes: string;
};

export type GeneratedSeed = {
  generatedAt: string;
  tools: NormalizedTool[];
  sources: SourceRepoSeed[];
  skipped: Array<{ repo: string; path: string; reason: string }>;
};
