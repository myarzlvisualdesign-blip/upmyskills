import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToolRunner } from "@/components/tool-runner";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const tool = await prisma.tool.findFirst({
    where: {
      OR: [{ slug: toolId }, { id: toolId }]
    }
  });

  if (!tool) notFound();

  return (
    <div className="space-y-5">
      <Link href="/tools" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" />
        Back to tools
      </Link>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{tool.domain}</Badge>
            <Badge variant="outline">{tool.license}</Badge>
          </div>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight">{tool.title}</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{tool.description}</p>
        </div>
      </div>
      <ToolRunner tool={tool} />
    </div>
  );
}
