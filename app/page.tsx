import Link from "next/link";
import { ArrowRight, Database, Sparkles, Workflow } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DomainCard } from "@/components/domain-card";
import { domains, domainToSlug } from "@/lib/tools/domains";
import { getToolStats } from "@/lib/tools/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getToolStats().catch(() => ({ tools: 0, runs: 0, sources: 0, grouped: [] }));
  const counts = new Map(stats.grouped.map((item) => [item.domain, item._count._all]));

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-lg border bg-up-ink text-up-cream shadow-premium">
        <div className="grid gap-8 p-6 md:p-10 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-black uppercase text-up-mint">Production AI skills workspace</p>
            <h1 className="max-w-4xl text-balance text-5xl font-black leading-none tracking-tight md:text-7xl">
              Turn GitHub skill repos into tools people can run.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-up-cream/74">
              UpMySkills ingests Claude and AI skill repositories, normalizes prompts into forms, runs structured
              workflows, stores history, and exports reusable Markdown deliverables.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "bg-up-cream text-up-ink hover:bg-up-cream/90" })}>
                Open dashboard
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/tools" className={buttonVariants({ variant: "outline", size: "lg", className: "border-up-cream/25 bg-transparent text-up-cream hover:bg-up-cream/10" })}>
                Browse tools
              </Link>
            </div>
          </div>
          <div className="grid content-center gap-3">
            {[
              ["Executable tools", stats.tools],
              ["Ingested sources", stats.sources],
              ["Saved generations", stats.runs]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-up-cream/15 bg-up-cream/8 p-5">
                <div className="text-4xl font-black">{Number(value).toLocaleString("id-ID")}</div>
                <div className="mt-1 text-sm font-semibold text-up-cream/64">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <Sparkles className="mb-4 size-6 text-up-violet" />
            <h2 className="text-lg font-black">Real web tools</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Every visible tool has a form, sample inputs, generation output, copy, export, and history.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Workflow className="mb-4 size-6 text-up-green" />
            <h2 className="text-lg font-black">Normalized workflows</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Markdown skills are converted into input schemas, prompt templates, output schemas, and steps.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Database className="mb-4 size-6 text-up-rust" />
            <h2 className="text-lg font-black">Saved runs</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Generated outputs are stored with Prisma and SQLite for local development.</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-up-rust">Domains</p>
            <h2 className="text-3xl font-black tracking-tight">Choose a workstream</h2>
          </div>
          <Link href={`/domains/${domainToSlug("SEO & GEO")}`} className={buttonVariants({ variant: "outline", className: "hidden sm:inline-flex" })}>
            Start with SEO & GEO
          </Link>
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
    </div>
  );
}
