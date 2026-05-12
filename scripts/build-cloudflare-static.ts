import fs from "node:fs";
import path from "node:path";
import type { GeneratedSeed, NormalizedTool } from "../lib/tools/types";

const root = process.cwd();
const inputPath = path.join(root, "data", "tools.generated.json");
const outputDir = path.join(root, "cloudflare-static");
const dataDir = path.join(outputDir, "data");

function compactTool(tool: NormalizedTool) {
  const title = cleanTitle(tool.title);

  return {
    id: tool.id,
    title,
    slug: tool.slug,
    domain: tool.domain,
    description: tool.description,
    sourceRepo: tool.sourceRepo,
    sourcePath: tool.sourcePath,
    license: tool.license,
    inputSchema: tool.inputSchema,
    workflowSteps: tool.workflowSteps,
    sampleInput: tool.sampleInput,
    tags: tool.tags
  };
}

function cleanTitle(title: string) {
  const normalized = humanizeCommandTitle(title);
  const cleaned = normalized
    .replace(/\[[^\]]+\]/g, "")
    .replace(/<PLACEHOLDERS?>/gi, "")
    .replace(/\bfill in\b/gi, "")
    .replace(/\s+[—-]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleaned || cleaned.toLowerCase() === "skill title") {
    return "";
  }

  if (/template$/i.test(cleaned) || /generator$/i.test(cleaned)) {
    return cleaned;
  }

  if (/\bbrief\b|\breport\b|\bdashboard\b|\brunbook\b|\bcalendar\b|\bdefinition\b|\bcode\b/i.test(cleaned)) {
    return `${cleaned} Generator`;
  }

  return cleaned;
}

function humanizeCommandTitle(title: string) {
  const value = title.trim();

  if (value.startsWith("@") && value.includes("/")) {
    return titleCase(value.split("/").pop() || value);
  }

  if (!value.startsWith("/")) {
    return value;
  }

  const namedParts = value.split(/\s+[\u2013\u2014-]\s+/);
  if (namedParts.length > 1 && namedParts[namedParts.length - 1]) {
    return namedParts[namedParts.length - 1].trim();
  }

  return titleCase(
    value
      .replace(/^\//, "")
      .replace(/^[a-z]+:/i, "")
      .replace(/[-_:/]+/g, " ")
  );
}

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function isUsableStaticTool(tool: NormalizedTool) {
  const title = cleanTitle(tool.title);
  return Boolean(
    title &&
      tool.inputSchema?.fields?.length &&
      !/^\[.+\]$/.test(tool.title.trim()) &&
      !/\btodo\b/i.test(tool.title)
  );
}

const seed = JSON.parse(fs.readFileSync(inputPath, "utf8")) as GeneratedSeed;
const tools = seed.tools.filter(isUsableStaticTool).map(compactTool);
const domainGroups = new Map<string, ReturnType<typeof compactTool>[]>();
const sourceCounts: Record<string, number> = {};

for (const tool of tools) {
  const current = domainGroups.get(tool.domain) ?? [];
  current.push(tool);
  domainGroups.set(tool.domain, current);
  sourceCounts[tool.sourceRepo] = (sourceCounts[tool.sourceRepo] ?? 0) + 1;
}

const domainCounts = Array.from(domainGroups.entries())
  .map(([domain, items]) => ({
    domain,
    slug: staticDomainSlug(domain),
    count: items.length
  }))
  .sort((a, b) => a.domain.localeCompare(b.domain));

const featuredTools = tools
  .slice()
  .sort((a, b) => `${a.domain}${a.title}`.localeCompare(`${b.domain}${b.title}`))
  .slice(0, 18);

const manifest = {
  generatedAt: seed.generatedAt,
  toolsCount: tools.length,
  sources: seed.sources,
  skippedCount: seed.skipped.length + (seed.tools.length - tools.length),
  domainCounts,
  sourceCounts,
  featuredTools,
  toolIndex: Object.fromEntries(tools.map((tool) => [tool.slug, tool.domain]))
};

fs.mkdirSync(outputDir, { recursive: true });
fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });
fs.rmSync(path.join(outputDir, "tools.json"), { force: true });

for (const [domain, items] of domainGroups.entries()) {
  const slug = staticDomainSlug(domain);
  const filePath = path.join(dataDir, `tools-${slug}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify({ domain, slug, tools: items })}\n`);
}

const manifestPath = path.join(dataDir, "manifest.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
console.log(`Wrote split Cloudflare data with ${tools.length} executable tools across ${domainGroups.size} domains.`);

function staticDomainSlug(domain: string) {
  return domain
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
