import type { ToolExportFormat, ToolRunOutput } from "./types";

function escapeCell(value: string | number) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function rowsToCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\n");
}

export function exportToolResult(format: ToolExportFormat, output: ToolRunOutput) {
  if (format === "json") return JSON.stringify(output, null, 2);
  if (format === "csv") return exportCsv(output);
  if (format === "html") return exportHtml(output);
  return exportMarkdown(output);
}

export function exportMarkdown(output: ToolRunOutput) {
  const issueLines = output.issues.length
    ? output.issues.map((item) => `- **${item.severity.toUpperCase()}** ${item.title}: ${item.fix}`).join("\n")
    : "- No blocking issues detected.";
  const recommendationLines = output.recommendations
    .map((item) => `- **${item.priority}** ${item.title} (impact ${item.impact}/5, effort ${item.effort}/5): ${item.nextStep}`)
    .join("\n");
  const checklistLines = output.checklist.map((item) => `- [ ] ${item.label}${item.owner ? ` (${item.owner})` : ""}`).join("\n");
  const analysis = output.analysisSections
    .map((section) => {
      if (section.type === "table" && section.table) {
        return [
          `### ${section.title}`,
          "",
          `| ${section.table.columns.join(" | ")} |`,
          `| ${section.table.columns.map(() => "---").join(" | ")} |`,
          ...section.table.rows.map((row) => `| ${row.map((cell) => String(cell).replaceAll("|", "/")).join(" | ")} |`)
        ].join("\n");
      }
      if (section.items?.length) return [`### ${section.title}`, "", section.items.map((item) => `- ${item}`).join("\n")].join("\n");
      return [`### ${section.title}`, "", section.content ?? ""].join("\n");
    })
    .join("\n\n");

  return [
    `# ${output.summary}`,
    "",
    `**Status:** ${output.status}`,
    output.score ? `**Score:** ${output.score.value}/${output.score.max}` : "",
    "",
    "## Key Findings",
    output.keyFindings.map((item) => `- ${item}`).join("\n"),
    "",
    "## Issues",
    issueLines,
    "",
    "## Prioritized Recommendations",
    recommendationLines,
    "",
    "## Detailed Analysis",
    analysis,
    "",
    "## Action Checklist",
    checklistLines,
    "",
    "## Source Attribution",
    `Source: ${output.attribution.sourceRepo}`,
    output.attribution.sourcePath ? `Path: ${output.attribution.sourcePath}` : "",
    output.attribution.license ? `License: ${output.attribution.license}` : ""
  ].filter(Boolean).join("\n");
}

export function exportCsv(output: ToolRunOutput) {
  const recommendationRows = output.recommendations.map((item) => [
    "recommendation",
    item.priority,
    item.title,
    item.impact,
    item.effort,
    item.nextStep
  ]);
  const issueRows = output.issues.map((item) => ["issue", item.severity, item.title, item.impact ?? "", item.effort ?? "", item.fix]);
  return rowsToCsv([["type", "priority_or_severity", "title", "impact", "effort", "next_step_or_fix"], ...recommendationRows, ...issueRows]);
}

export function exportHtml(output: ToolRunOutput) {
  const escape = (value: string | number | undefined) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const recommendations = output.recommendations.map((item) => `<tr><td>${escape(item.priority)}</td><td>${escape(item.title)}</td><td>${item.impact}</td><td>${item.effort}</td><td>${escape(item.nextStep)}</td></tr>`).join("");
  const issues = output.issues.map((item) => `<li><strong>${escape(item.severity)}</strong> ${escape(item.title)} - ${escape(item.fix)}</li>`).join("");
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>${escape(output.summary)}</title></head>
  <body>
    <h1>${escape(output.summary)}</h1>
    <p>Status: ${escape(output.status)}${output.score ? ` | Score: ${output.score.value}/${output.score.max}` : ""}</p>
    <h2>Key Findings</h2>
    <ul>${output.keyFindings.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>
    <h2>Issues</h2>
    <ul>${issues || "<li>No blocking issues detected.</li>"}</ul>
    <h2>Recommendations</h2>
    <table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Priority</th><th>Title</th><th>Impact</th><th>Effort</th><th>Next step</th></tr></thead><tbody>${recommendations}</tbody></table>
  </body>
</html>`;
}

export function attachExports(output: ToolRunOutput, formats: ToolExportFormat[]): ToolRunOutput {
  const next: ToolRunOutput = { ...output, exports: {} };
  for (const format of formats) {
    next.exports[format] = exportToolResult(format, next);
  }
  next.markdown = next.exports.markdown ?? exportMarkdown(next);
  return next;
}
