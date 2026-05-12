"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Checklist,
  DetailedAnalysis,
  ExportButtons,
  IssueList,
  Matrix,
  RecommendationTable,
  ScoreCard,
  SourceAttribution,
  Timeline
} from "@/components/tool-result-sections";
import type { ToolRunOutput } from "@/lib/tools/types";

type OutputPanelProps = {
  output: ToolRunOutput | null;
  loading: boolean;
  error: string | null;
};

export function OutputPanel({ output, loading, error }: OutputPanelProps) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Running tool</CardTitle>
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
          <CardTitle>Tool run failed</CardTitle>
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
          <CardTitle>Tool result</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Fill the form, load a sample, or run the tool to create a scored result with findings, recommendations,
            analysis, exports, and saved history.
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
            Tool result
          </CardTitle>
          <ExportButtons output={output} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-black uppercase text-muted-foreground">Summary</h3>
          <p className="text-sm leading-6">{output.summary}</p>
        </section>
        <ScoreCard output={output} />
        <IssueList output={output} />
        <RecommendationTable output={output} />
        <DetailedAnalysis output={output} />
        <Timeline output={output} />
        <Matrix output={output} />
        <Checklist output={output} />
        <SourceAttribution output={output} />
      </CardContent>
    </Card>
  );
}
