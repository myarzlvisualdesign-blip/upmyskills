import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const [sources, toolCounts] = await Promise.all([
    prisma.sourceRepo.findMany({ orderBy: { name: "asc" } }),
    prisma.tool.groupBy({ by: ["sourceRepo"], _count: { _all: true } })
  ]);
  const countByRepo = new Map(toolCounts.map((item) => [item.sourceRepo, item._count._all]));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase text-up-rust">Attribution</p>
        <h1 className="text-4xl font-black tracking-tight">Source repositories</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          UpMySkills turns source skills into executable workflow tools while keeping repo attribution and license notes visible.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <Card key={source.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle>{source.name}</CardTitle>
                <Badge variant="outline">{source.license}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{source.notes}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <span className="text-sm font-semibold text-muted-foreground">
                  {countByRepo.get(source.url.replace("https://github.com/", "")) ?? 0} tools available
                </span>
                <Link href={source.url} target="_blank" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Open source
                  <ExternalLink className="size-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
