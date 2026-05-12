import Link from "next/link";
import { Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function summaryOf(output: unknown) {
  if (output && typeof output === "object" && "summary" in output) return String((output as { summary: unknown }).summary);
  return "Saved tool result";
}

export default async function HistoryPage() {
  const runs = await prisma.run.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tool: {
        select: {
          id: true,
          title: true,
          slug: true,
          domain: true
        }
      }
    },
    take: 100
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase text-up-rust">History</p>
        <h1 className="text-4xl font-black tracking-tight">Saved tool runs</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Each tool run is stored locally through Prisma so users can revisit structured results and rerun the source tool.
        </p>
      </div>

      {runs.length ? (
        <div className="grid gap-4">
          {runs.map((run) => (
            <Card key={run.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>{run.tool.title}</CardTitle>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {run.createdAt.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{run.tool.domain}</Badge>
                    <Badge variant="outline">{run.provider}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{summaryOf(run.output)}</p>
                <Link href={`/tools/${run.tool.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Open tool
                  <ExternalLink className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <h2 className="text-xl font-black">No history yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Run any tool and the structured result will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
