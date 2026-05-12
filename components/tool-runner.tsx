"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OutputPanel } from "@/components/output-panel";
import type { GeneratedOutput } from "@/lib/llm/types";
import type { ToolInputSchema } from "@/lib/tools/types";

type ToolRunnerProps = {
  tool: {
    id: string;
    title: string;
    description: string;
    domain: string;
    sourceRepo: string;
    sourcePath: string | null;
    license: string;
    inputSchema: unknown;
    sampleInput: unknown;
    workflowSteps: unknown;
  };
};

function schemaOf(value: unknown): ToolInputSchema {
  if (value && typeof value === "object" && "fields" in value && Array.isArray((value as ToolInputSchema).fields)) {
    return value as ToolInputSchema;
  }
  return { fields: [] };
}

function recordOf(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, String(item ?? "")]));
}

export function ToolRunner({ tool }: ToolRunnerProps) {
  const schema = useMemo(() => schemaOf(tool.inputSchema), [tool.inputSchema]);
  const sampleInput = useMemo(() => recordOf(tool.sampleInput), [tool.sampleInput]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    return Object.fromEntries(schema.fields.map((field) => [field.name, ""]));
  });
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function runTool(nextValues = values) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, input: nextValues, provider: "local" })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Tool execution failed");
      setOutput(payload.output);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tool execution failed");
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    const nextValues = { ...values, ...sampleInput };
    setValues(nextValues);
  }

  function resetForm() {
    setValues(Object.fromEntries(schema.fields.map((field) => [field.name, ""])));
    setOutput(null);
    setError(null);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{tool.title}</CardTitle>
          <CardDescription>{tool.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 rounded-md border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            <p>
              <strong className="text-foreground">Source:</strong> {tool.sourceRepo}
              {tool.sourcePath ? `/${tool.sourcePath}` : ""}
            </p>
            <p>
              <strong className="text-foreground">License:</strong> {tool.license}
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              runTool();
            }}
          >
            {schema.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    value={values[field.name] ?? ""}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                  />
                ) : field.type === "select" ? (
                  <Select
                    id={field.name}
                    value={values[field.name] ?? ""}
                    required={field.required}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                  >
                    <option value="">Choose...</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === "number" ? "number" : "text"}
                    value={values[field.name] ?? ""}
                    placeholder={field.placeholder}
                    required={field.required}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                  />
                )}
                {field.helperText ? <p className="text-xs text-muted-foreground">{field.helperText}</p> : null}
              </div>
            ))}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={loading}>
                <Wand2 className="size-4" />
                {output ? "Regenerate" : "Run tool"}
              </Button>
              <Button type="button" variant="outline" onClick={loadSample}>
                Load sample
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <OutputPanel output={output} loading={loading} error={error} />
    </div>
  );
}
