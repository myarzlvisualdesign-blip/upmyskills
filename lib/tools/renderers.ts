import type { ToolAnalysisSection, ToolRunOutput } from "./types";

export function orderedResultSections(output: ToolRunOutput) {
  return [
    { key: "summary", title: "Summary", type: "summary" as const },
    ...(output.score ? [{ key: "score", title: "Score or status", type: "score" as const }] : []),
    { key: "findings", title: "Key findings", type: "findings" as const },
    { key: "recommendations", title: "Prioritized recommendations", type: "recommendations" as const },
    { key: "issues", title: "Issues", type: "issues" as const },
    ...output.analysisSections.map((section) => ({ key: section.key, title: section.title, type: "analysis" as const, section })),
    ...(output.timeline?.length ? [{ key: "timeline", title: "Timeline", type: "timeline" as const }] : []),
    ...(output.matrix?.length ? [{ key: "matrix", title: "Decision matrix", type: "matrix" as const }] : []),
    { key: "checklist", title: "Action checklist", type: "checklist" as const },
    { key: "attribution", title: "Source attribution", type: "attribution" as const }
  ];
}

export function summarizeAnalysisSection(section: ToolAnalysisSection) {
  if (section.type === "table" && section.table) {
    return `${section.table.rows.length} rows across ${section.table.columns.length} columns.`;
  }
  if (section.items?.length) return `${section.items.length} items.`;
  return section.content?.slice(0, 140) ?? "";
}
