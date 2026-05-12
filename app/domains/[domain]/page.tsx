import { notFound } from "next/navigation";
import { ToolCard } from "@/components/tool-card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { domains, slugToDomain } from "@/lib/tools/domains";

export const dynamic = "force-dynamic";

export default async function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: domainSlug } = await params;
  const domainName = slugToDomain(domainSlug);
  if (!domainName) notFound();

  const domain = domains.find((item) => item.name === domainName);
  const tools = await prisma.tool.findMany({
    where: { domain: domainName },
    select: {
      id: true,
      title: true,
      slug: true,
      domain: true,
      description: true,
      sourceRepo: true,
      tags: true
    },
    orderBy: { title: "asc" }
  });

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <Badge variant="secondary">{tools.length.toLocaleString("id-ID")} executable tools</Badge>
        <h1 className="mt-4 text-4xl font-black tracking-tight">{domainName}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{domain?.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
