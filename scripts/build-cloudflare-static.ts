import fs from "node:fs";
import path from "node:path";
import type { GeneratedSeed, NormalizedTool } from "../lib/tools/types";

const root = process.cwd();
const inputPath = path.join(root, "data", "tools.generated.json");
const outputDir = path.join(root, "cloudflare-static");
const dataDir = path.join(outputDir, "data");
const domainCatalogDir = path.join(dataDir, "catalogs");

const domainSlugOverrides: Record<string, string> = {
  "SEO & GEO": "seo-geo",
  "Branding & Design": "branding-design",
  "Engineering & AI Agent": "engineering-ai-agent",
  Marketing: "marketing",
  "AI Research": "ai-research",
  "C-Level Advisory": "c-level-advisory"
};

const preferredFeaturedSlugs = [
  "seo-and-geo-technical-seo-audit",
  "seo-and-geo-schema-generator",
  "seo-and-geo-ai-search-citation-optimizer",
  "marketing-paid-ads-strategy-builder",
  "marketing-social-media-calendar",
  "marketing-landing-page-generator",
  "branding-and-design-brand-identity-generator",
  "branding-and-design-design-system-generator",
  "branding-and-design-landing-page-copy-visual-direction",
  "engineering-and-ai-agent-senior-frontend-reviewer",
  "engineering-and-ai-agent-backend-architecture-reviewer",
  "engineering-and-ai-agent-agent-persona-builder",
  "ai-research-literature-survey-builder",
  "ai-research-experiment-planner",
  "ai-research-paper-outline-generator",
  "c-level-advisory-ceo-review-tool",
  "c-level-advisory-board-memo-generator",
  "c-level-advisory-cto-architecture-review"
];

function compactTool(tool: NormalizedTool) {
  const title = cleanTitle(tool.title);

  return {
    id: tool.id,
    title,
    slug: tool.slug,
    domain: tool.domain,
    description: cleanDescription(tool.description, title, tool.domain),
    sourceRepo: tool.sourceRepo,
    sourcePath: tool.sourcePath,
    license: tool.license,
    inputSchema: tool.inputSchema,
    workflowSteps: tool.workflowSteps,
    sampleInput: tool.sampleInput,
    tags: tool.tags
  };
}

function catalogTool(tool: ReturnType<typeof compactTool>) {
  return {
    id: tool.id,
    title: tool.title,
    slug: tool.slug,
    domain: tool.domain,
    description: tool.description.slice(0, 140),
    sourceRepo: tool.sourceRepo,
    tags: tool.tags.slice(0, 4)
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

function cleanDescription(description: string, title: string, domain: string) {
  const stripped = description
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_#>\[\](){}]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (
    !stripped ||
    stripped.length < 24 ||
    /^(div|section|p|span|img)\b/i.test(stripped) ||
    /^instructions for using this template/i.test(stripped) ||
    /^one-line value proposition$/i.test(stripped)
  ) {
    return `Executable ${domain} workflow for ${title || "this tool"}.`;
  }

  return stripped.slice(0, 220);
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
      !/[<>{}]/.test(tool.title) &&
      !/^[:/]/.test(tool.title.trim()) &&
      !/\b(agent name|skill title|topic rules)\b/i.test(tool.title) &&
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

const preferredFeaturedTools = preferredFeaturedSlugs
  .map((slug) => tools.find((tool) => tool.slug === slug))
  .filter((tool): tool is ReturnType<typeof compactTool> => Boolean(tool));

const fallbackFeaturedTools = domainCounts
  .flatMap(({ domain }) =>
    (domainGroups.get(domain) ?? [])
      .filter(isFeaturedCandidate)
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 3)
  );

const featuredTools = [...preferredFeaturedTools, ...fallbackFeaturedTools.filter((tool) => !preferredFeaturedTools.some((item) => item.id === tool.id))]
  .slice(0, 18);

const manifest = {
  generatedAt: seed.generatedAt,
  toolsCount: tools.length,
  sources: seed.sources,
  skippedCount: seed.skipped.length + (seed.tools.length - tools.length),
  domainCounts,
  sourceCounts,
  featuredTools: featuredTools.map(catalogTool)
};

fs.mkdirSync(outputDir, { recursive: true });
fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });
fs.rmSync(path.join(outputDir, "tools.json"), { force: true });

const toolDir = path.join(dataDir, "tools");
fs.mkdirSync(toolDir, { recursive: true });
fs.mkdirSync(domainCatalogDir, { recursive: true });

for (const tool of tools) {
  fs.writeFileSync(path.join(toolDir, `${tool.slug}.json`), `${JSON.stringify(tool)}\n`);
}

for (const [domain, items] of domainGroups.entries()) {
  const domainCatalog = items
    .map(catalogTool)
    .sort((a, b) => a.title.localeCompare(b.title));
  fs.writeFileSync(
    path.join(domainCatalogDir, `${staticDomainSlug(domain)}.json`),
    `${JSON.stringify({ generatedAt: seed.generatedAt, domain, tools: domainCatalog })}\n`
  );
}

const manifestPath = path.join(dataDir, "manifest.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`);
fs.writeFileSync(
  path.join(dataDir, "catalog.json"),
  `${JSON.stringify({ generatedAt: seed.generatedAt, note: "Deprecated. Use data/catalogs/{domain}.json for lazy loading.", domains: domainCounts })}\n`
);
console.log(`Wrote lazy Cloudflare data with ${tools.length} executable tools across ${domainGroups.size} domains.`);

function staticDomainSlug(domain: string) {
  if (domainSlugOverrides[domain]) return domainSlugOverrides[domain];
  return domain
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isFeaturedCandidate(tool: ReturnType<typeof compactTool>) {
  return Boolean(
    tool.title &&
      tool.description &&
      !/[<>{}]/.test(tool.title) &&
      !/^[:/]/.test(tool.title) &&
      !/\b(agent name|skill title|topic rules|roadmap|complete|test results)\b/i.test(tool.title) &&
      !/\b(readme|reference|template|official documentation|api reference)\b/i.test(tool.title) &&
      !/\b(import|this document|context\s*:|instructions for using this template|one-line value proposition)\b/i.test(tool.description)
  );
}
