import { DomainCard } from "@/components/domain-card";
import { domains } from "@/lib/tools/domains";
import { getToolStats } from "@/lib/tools/queries";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const stats = await getToolStats();
  const counts = new Map(stats.grouped.map((item) => [item.domain, item._count._all]));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase text-up-rust">Domains</p>
        <h1 className="text-4xl font-black tracking-tight">Pick an operating domain</h1>
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
    </div>
  );
}
