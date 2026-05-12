import { prisma } from "@/lib/prisma";

export async function getToolStats() {
  const [tools, runs, sources] = await Promise.all([
    prisma.tool.count(),
    prisma.run.count(),
    prisma.sourceRepo.count()
  ]);
  const grouped = await prisma.tool.groupBy({
    by: ["domain"],
    _count: { _all: true },
    orderBy: { domain: "asc" }
  });
  return { tools, runs, sources, grouped };
}

export async function getPopularTools(limit = 8) {
  return prisma.tool.findMany({
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      domain: true,
      description: true,
      sourceRepo: true,
      tags: true
    },
    orderBy: [{ runs: { _count: "desc" } }, { title: "asc" }]
  });
}

export async function getRecentRuns(limit = 8) {
  return prisma.run.findMany({
    take: limit,
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
    }
  });
}
