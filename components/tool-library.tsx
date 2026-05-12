"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ToolCard, type ToolCardData } from "@/components/tool-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function ToolLibrary({ tools, domains }: { tools: ToolCardData[]; domains: string[] }) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesDomain = domain === "All" || tool.domain === domain;
      const text = `${tool.title} ${tool.description} ${tool.sourceRepo} ${tool.domain}`.toLowerCase();
      return matchesDomain && (!normalized || text.includes(normalized));
    });
  }, [tools, domain, query]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_240px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search tools, sources, workflows..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <Select value={domain} onChange={(event) => setDomain(event.target.value)}>
          <option value="All">All domains</option>
          {domains.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">{filtered.length.toLocaleString("id-ID")} executable tools</p>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-10 text-center">
          <h2 className="text-xl font-black">No tools found</h2>
          <p className="mt-2 text-sm text-muted-foreground">Adjust the search query or domain filter.</p>
        </div>
      )}
    </div>
  );
}
