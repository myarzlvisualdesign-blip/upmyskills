import Link from "next/link";
import { Database, Sparkles, Workflow } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HeroSection from "@/components/ui/quantam-mysh-hero";
import { DomainCard } from "@/components/domain-card";
import { domains, domainToSlug } from "@/lib/tools/domains";
import { getToolStats } from "@/lib/tools/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stats = await getToolStats().catch(() => ({ tools: 0, runs: 0, sources: 0, grouped: [] }));
  const counts = new Map(stats.grouped.map((item) => [item.domain, item._count._all]));

  return (
    <div className="space-y-8">
      <HeroSection
        eyebrow="Executable AI Skills Studio"
        titleTop={`${stats.tools.toLocaleString("id-ID")} AI Skills, Ready to Run.`}
        titleBottom="Built for Real Workflows."
        descriptionTop="UpMySkills converts Claude and AI skill repositories into usable web tools."
        descriptionBottom="Forms, generated outputs, local history, Markdown export, search, filters, and source attribution."
      />

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
