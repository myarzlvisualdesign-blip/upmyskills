import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DomainCardProps = {
  name: string;
  slug: string;
  description: string;
  count: number;
  icon: LucideIcon;
  accent: string;
};

export function DomainCard({ name, slug, description, count, icon: Icon, accent }: DomainCardProps) {
  return (
    <Link href={`/domains/${slug}`} className="group block h-full no-underline">
      <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-premium">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <span className={cn("grid size-11 place-items-center rounded-md", accent)}>
              <Icon className="size-5" />
            </span>
            <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <CardTitle>{name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="min-h-16 text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <span className="text-sm font-semibold text-muted-foreground">Executable tools</span>
            <span className="text-2xl font-black">{count}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
