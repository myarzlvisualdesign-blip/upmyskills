"use client";

import { CheckCircle2, Clipboard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeneratedOutput } from "@/lib/llm/types";

type OutputPanelProps = {
  output: GeneratedOutput | null;
  loading: boolean;
  error: string | null;
};

function downloadMarkdown(markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "upmyskills-output.md";
  link.click();
  URL.revokeObjectURL(url);
}

export function OutputPanel({ output, loading, error }: OutputPanelProps) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Generating output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-40 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle>Generation failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!output) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Fill the form, load a sample, or run the tool to create a structured workflow output. Saved runs will
            appear in history automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            Generated output
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(output.markdown)}>
              <Clipboard className="size-4" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadMarkdown(output.markdown)}>
              <Download className="size-4" />
              Export MD
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Summary</h3>
          <p className="text-sm leading-6">{output.summary}</p>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Recommendations</h3>
          <ul className="space-y-2 text-sm leading-6">
            {output.recommendations.map((item) => (
              <li key={item} className="rounded-md border bg-muted/35 p-3">
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Markdown deliverable</h3>
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md bg-up-ink p-4 text-xs leading-6 text-up-cream">
            {output.markdown}
          </pre>
        </section>
      </CardContent>
    </Card>
  );
}
