import Link from "next/link";
import { Search } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { domainNames } from "@/lib/tools/domains";

export const dynamic = "force-dynamic";

type ToolsSearchParams = {
  q?: string;
  domain?: string;
  page?: string;
};

export default async function ToolsPage({ searchParams }: { searchParams: Promise<ToolsSearchParams> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const domain = params.domain ?? "All";
  const pageSize = 48;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const where = {
    AND: [
      domain !== "All" ? { domain } : {},
      q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { sourceRepo: { contains: q } },
              { domain: { contains: q } }
            ]
          }
        : {}
    ]
  };

  const [tools, total] = await Promise.all([
    prisma.tool.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        domain: true,
        description: true,
        sourceRepo: true,
        tags: true
      },
      orderBy: [{ domain: "asc" }, { title: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.tool.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (domain !== "All") baseParams.set("domain", domain);
  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams(baseParams);
    next.set("page", String(nextPage));
    return `/tools?${next.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase text-up-rust">Tool library</p>
        <h1 className="text-4xl font-black tracking-tight">Search executable tools</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Server-side search keeps the library responsive even with thousands of normalized tools.
        </p>
      </div>

      <form action="/tools" className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_240px_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" className="pl-9" placeholder="Search tools, sources, workflows..." defaultValue={q} />
        </label>
        <Select name="domain" defaultValue={domain}>
          <option value="All">All domains</option>
          {domainNames.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Button type="submit">Search</Button>
        <Link href="/tools" className={cn(buttonVariants({ variant: "outline" }), "min-h-10")}>
          Reset
        </Link>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">
          Showing {tools.length.toLocaleString("id-ID")} of {total.toLocaleString("id-ID")} executable tools
        </p>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Previous
            </Link>
          ) : null}
          <span className="text-xs text-muted-foreground">
            Page {page.toLocaleString("id-ID")} of {totalPages.toLocaleString("id-ID")}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Next
            </Link>
          ) : null}
        </div>
      </div>

      {tools.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
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
