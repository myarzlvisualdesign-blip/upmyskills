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
  type: "markdown" | "list" | "table" | "score" | "issues" | "timeline" | "matrix" | "json";
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
  deterministicChecks?: string[];
  aiEnhancementPrompt?: string;
  scoringRules?: ToolScoringRule[];
  exportFormats?: ToolExportFormat[];
  rendererType?: ToolRendererType;
  exampleOutput: ToolExampleOutput;
  sampleInput: Record<string, string>;
  tags: string[];
};

export type ToolExportFormat = "markdown" | "json" | "csv" | "html";

export type ToolRendererType =
  | "audit"
  | "optimizer"
  | "campaign"
  | "brand-kit"
  | "design-system"
  | "architecture-review"
  | "security-audit"
  | "research-plan"
  | "executive-memo"
  | "workflow";

export type ToolScoringRule = {
  key: string;
  label: string;
  weight: number;
  description: string;
};

export type ToolDefinition = {
  id: string;
  slug: string;
  title: string;
  domain: string;
  description: string;
  inputSchema: ToolInputSchema;
  outputSchema: ToolOutputSchema;
  workflowSteps: string[];
  deterministicChecks: string[];
  aiEnhancementPrompt: string;
  scoringRules: ToolScoringRule[];
  exportFormats: ToolExportFormat[];
  rendererType: ToolRendererType;
  sourceRepo?: string;
  sourcePath?: string;
  license?: string;
  sampleInput?: Record<string, string>;
  tags?: string[];
};

export type ToolValidationError = {
  field: string;
  message: string;
};

export type ToolIssueSeverity = "critical" | "high" | "medium" | "low" | "info";

export type ToolIssue = {
  id: string;
  title: string;
  severity: ToolIssueSeverity;
  category: string;
  detail: string;
  fix: string;
  impact?: number;
  effort?: number;
};

export type ToolRecommendation = {
  id: string;
  title: string;
  priority: "P0" | "P1" | "P2" | "P3";
  impact: number;
  effort: number;
  rationale: string;
  nextStep: string;
};

export type ToolChecklistItem = {
  id: string;
  label: string;
  owner?: string;
  status?: "todo" | "doing" | "done";
};

export type ToolScoreBreakdown = {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
};

export type ToolScore = {
  label: string;
  value: number;
  max: number;
  status: "excellent" | "good" | "warning" | "poor";
  breakdown: ToolScoreBreakdown[];
};

export type ToolAnalysisTable = {
  columns: string[];
  rows: Array<Array<string | number>>;
};

export type ToolAnalysisSection = {
  key: string;
  title: string;
  type: "text" | "list" | "table" | "code" | "json";
  content?: string;
  items?: string[];
  table?: ToolAnalysisTable;
};

export type ToolTimelineItem = {
  period: string;
  title: string;
  actions: string[];
};

export type ToolMatrixRow = {
  option: string;
  score: number;
  rationale: string;
  recommendation: string;
};

export type ToolRunOutput = {
  toolId: string;
  rendererType: ToolRendererType;
  summary: string;
  status: string;
  score?: ToolScore;
  keyFindings: string[];
  issues: ToolIssue[];
  recommendations: ToolRecommendation[];
  analysisSections: ToolAnalysisSection[];
  checklist: ToolChecklistItem[];
  timeline?: ToolTimelineItem[];
  matrix?: ToolMatrixRow[];
  exports: Partial<Record<ToolExportFormat, string>>;
  attribution: {
    sourceRepo: string;
    sourcePath?: string;
    license?: string;
  };
  workflow: string[];
  markdown: string;
  aiEnhancement?: {
    provider: string;
    notes: string[];
  };
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
