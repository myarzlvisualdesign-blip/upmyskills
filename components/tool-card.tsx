import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export type ToolCardData = {
  id: string;
  title: string;
  slug: string;
  domain: string;
  description: string;
  sourceRepo: string;
  tags: unknown;
};

function tagList(tags: unknown) {
  return Array.isArray(tags) ? tags.slice(0, 4).map(String) : [];
}

export function ToolCard({ tool }: { tool: ToolCardData }) {
  const tags = tagList(tool.tags);

  return (
    <Card className="flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-premium">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between gap-3">
          <Badge variant="secondary">{tool.domain}</Badge>
          <FileText className="size-4 text-muted-foreground" />
        </div>
        <CardTitle className="line-clamp-2">{tool.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{tool.description}</p>
        <p className="mt-4 break-all text-xs font-semibold text-muted-foreground">{tool.sourceRepo}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/tools/${tool.slug}`} className={buttonVariants({ className: "w-full" })}>
          Run tool
          <ArrowRight className="size-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
