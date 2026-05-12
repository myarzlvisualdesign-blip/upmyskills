import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DomainCard } from "@/components/domain-card";
import { ToolCard } from "@/components/tool-card";
import { domains } from "@/lib/tools/domains";
import { getPopularTools, getRecentRuns, getToolStats } from "@/lib/tools/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, popularTools, recentRuns] = await Promise.all([getToolStats(), getPopularTools(6), getRecentRuns(6)]);
  const counts = new Map(stats.grouped.map((item) => [item.domain, item._count._all]));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-black uppercase text-up-rust">Dashboard</p>
        <h1 className="text-4xl font-black tracking-tight">Run normalized AI skill tools</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Choose a domain, run a tool, save outputs to history, and export reusable deliverables.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Executable tools", stats.tools],
          ["Sources", stats.sources],
          ["Saved runs", stats.runs]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="text-4xl font-black">{Number(value).toLocaleString("id-ID")}</div>
              <div className="mt-1 text-sm font-semibold text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">Domains</h2>
          <Link href="/tools" className="text-sm font-semibold text-primary">View all tools</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {domains.map((domain) => (
            <DomainCard
              key={domain.slug}
              name={domain.name}
              slug={domain.slug}
              description={domain.description}
              count={counts.get(domain.name) ?? 0}
              icon={domain.icon}
              accent={domain.accent}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-up-violet" />
            <h2 className="text-2xl font-black tracking-tight">Popular tools</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {popularTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Recent outputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRuns.length ? (
              <div className="space-y-3">
                {recentRuns.map((run) => (
                  <Link key={run.id} href={`/tools/${run.tool.slug}`} className="block rounded-md border p-3 hover:bg-muted/50">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{run.tool.title}</p>
                      <Badge variant="outline">{run.tool.domain}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{run.createdAt.toLocaleString("id-ID")}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">No generations yet. Run a tool to create history.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
