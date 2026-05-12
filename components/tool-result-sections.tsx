"use client";

import { Clipboard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToolAnalysisSection, ToolExportFormat, ToolRunOutput } from "@/lib/tools/types";

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "upmyskills-result";
}

const mimeByFormat: Record<ToolExportFormat, string> = {
  markdown: "text/markdown;charset=utf-8",
  json: "application/json;charset=utf-8",
  csv: "text/csv;charset=utf-8",
  html: "text/html;charset=utf-8"
};

const extByFormat: Record<ToolExportFormat, string> = {
  markdown: "md",
  json: "json",
  csv: "csv",
  html: "html"
};

export function ScoreCard({ output }: { output: ToolRunOutput }) {
  if (!output.score) {
    return (
      <section className="rounded-lg border bg-muted/30 p-4">
        <h3 className="text-sm font-black uppercase text-muted-foreground">Status</h3>
        <p className="mt-2 text-2xl font-black">{output.status}</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-sm font-black uppercase text-muted-foreground">{output.score.label}</h3>
          <p className="mt-2 text-4xl font-black">{output.score.value}/{output.score.max}</p>
        </div>
        <span className="rounded-md border px-3 py-2 text-sm font-black uppercase text-primary">{output.score.status}</span>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {output.score.breakdown.map((item) => (
          <div key={item.key} className="rounded-md border bg-background/40 p-3">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span>{item.label}</span>
              <span>{item.score}/{item.max}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function IssueList({ output }: { output: ToolRunOutput }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Key findings</h3>
      <div className="space-y-2">
        {output.issues.length ? output.issues.map((item) => (
          <div key={item.id} className="rounded-md border bg-muted/25 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border px-2 py-1 text-xs font-black uppercase text-primary">{item.severity}</span>
              <strong className="text-sm">{item.title}</strong>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
            <p className="mt-1 text-sm leading-6">{item.fix}</p>
          </div>
        )) : (
          <div className="rounded-md border bg-muted/25 p-3 text-sm">No blocking issues detected from the supplied inputs.</div>
        )}
      </div>
    </section>
  );
}

export function RecommendationTable({ output }: { output: ToolRunOutput }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Prioritized recommendations</h3>
      <div className="overflow-auto rounded-md border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Priority</th>
              <th className="p-3">Recommendation</th>
              <th className="p-3">Impact</th>
              <th className="p-3">Effort</th>
              <th className="p-3">Next step</th>
            </tr>
          </thead>
          <tbody>
            {output.recommendations.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3 font-black text-primary">{item.priority}</td>
                <td className="p-3">{item.title}<p className="mt-1 text-xs text-muted-foreground">{item.rationale}</p></td>
                <td className="p-3">{item.impact}/5</td>
                <td className="p-3">{item.effort}/5</td>
                <td className="p-3">{item.nextStep}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Checklist({ output }: { output: ToolRunOutput }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Action checklist</h3>
      <ul className="space-y-2 text-sm">
        {output.checklist.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-md border bg-muted/25 p-3">
            <span className="mt-1 size-3 rounded border" />
            <span>{item.label}{item.owner ? <span className="text-muted-foreground"> - {item.owner}</span> : null}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AnalysisSection({ section }: { section: ToolAnalysisSection }) {
  if (section.type === "table" && section.table) {
    return (
      <section>
        <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">{section.title}</h3>
        <div className="overflow-auto rounded-md border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>{section.table.columns.map((column) => <th key={column} className="p-3">{column}</th>)}</tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, index) => (
                <tr key={index} className="border-t">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (section.type === "code" || section.type === "json") {
    return (
      <section>
        <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">{section.title}</h3>
        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-md bg-up-ink p-4 text-xs leading-6 text-up-cream">{section.content}</pre>
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">{section.title}</h3>
      {section.items?.length ? (
        <ul className="space-y-2 text-sm">{section.items.map((item) => <li key={item} className="rounded-md border bg-muted/25 p-3">{item}</li>)}</ul>
      ) : (
        <p className="text-sm leading-6">{section.content}</p>
      )}
    </section>
  );
}

export function DetailedAnalysis({ output }: { output: ToolRunOutput }) {
  return <>{output.analysisSections.map((section) => <AnalysisSection key={section.key} section={section} />)}</>;
}

export function Timeline({ output }: { output: ToolRunOutput }) {
  if (!output.timeline?.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Timeline</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {output.timeline.map((item) => (
          <div key={item.period} className="rounded-md border bg-muted/25 p-3">
            <p className="text-xs font-black uppercase text-primary">{item.period}</p>
            <h4 className="mt-1 font-black">{item.title}</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{item.actions.map((action) => <li key={action}>{action}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Matrix({ output }: { output: ToolRunOutput }) {
  if (!output.matrix?.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Matrix</h3>
      <div className="overflow-auto rounded-md border">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Option</th><th className="p-3">Score</th><th className="p-3">Rationale</th><th className="p-3">Recommendation</th></tr>
          </thead>
          <tbody>{output.matrix.map((item) => <tr key={item.option} className="border-t"><td className="p-3">{item.option}</td><td className="p-3">{item.score}</td><td className="p-3">{item.rationale}</td><td className="p-3">{item.recommendation}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

export function ExportButtons({ output }: { output: ToolRunOutput }) {
  const formats = Object.keys(output.exports) as ToolExportFormat[];
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(output.exports.markdown ?? output.markdown)}>
        <Clipboard className="size-4" />
        Copy
      </Button>
      {formats.map((format) => (
        <Button key={format} variant="outline" size="sm" onClick={() => downloadFile(`${slug(output.summary)}.${extByFormat[format]}`, output.exports[format] ?? "", mimeByFormat[format])}>
          <Download className="size-4" />
          {format.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}

export function SourceAttribution({ output }: { output: ToolRunOutput }) {
  return (
    <section className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
      <h3 className="mb-1 text-xs font-black uppercase">Source attribution</h3>
      <p>{output.attribution.sourceRepo}{output.attribution.sourcePath ? `/${output.attribution.sourcePath}` : ""}</p>
      {output.attribution.license ? <p>License: {output.attribution.license}</p> : null}
    </section>
  );
}
