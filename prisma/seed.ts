import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import type { GeneratedSeed } from "../lib/tools/types";

const prisma = new PrismaClient();

async function main() {
  const seedPath = path.join(process.cwd(), "data", "tools.generated.json");
  if (!fs.existsSync(seedPath)) {
    throw new Error("data/tools.generated.json is missing. Run npm run ingest:repos first.");
  }

  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8")) as GeneratedSeed;

  await prisma.run.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.sourceRepo.deleteMany();

  for (const source of seed.sources) {
    await prisma.sourceRepo.create({
      data: {
        id: source.id,
        name: source.name,
        url: source.url,
        license: source.license,
        lastIngestedAt: new Date(source.lastIngestedAt),
        notes: source.notes
      }
    });
  }

  for (const tool of seed.tools) {
    await prisma.tool.create({
      data: {
        id: tool.id,
        title: tool.title,
        slug: tool.slug,
        domain: tool.domain,
        description: tool.description,
        sourceRepo: tool.sourceRepo,
        sourcePath: tool.sourcePath,
        license: tool.license,
        inputSchema: tool.inputSchema,
        promptTemplate: tool.promptTemplate,
        outputSchema: tool.outputSchema,
        workflowSteps: tool.workflowSteps,
        exampleOutput: tool.exampleOutput,
        sampleInput: tool.sampleInput,
        tags: tool.tags
      }
    });
  }

  console.log(`Seeded ${seed.tools.length} tools from ${seed.sources.length} sources.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
