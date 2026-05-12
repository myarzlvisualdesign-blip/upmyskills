import fs from "node:fs";
import path from "node:path";
import type { GeneratedSeed, NormalizedTool } from "../lib/tools/types";

const root = process.cwd();
const inputPath = path.join(root, "data", "tools.generated.json");
const outputDir = path.join(root, "cloudflare-static");
const outputPath = path.join(outputDir, "tools.json");

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
const compact = {
  generatedAt: seed.generatedAt,
  tools,
  sources: seed.sources,
  skippedCount: seed.skipped.length + (seed.tools.length - tools.length)
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(compact)}\n`);
console.log(`Wrote ${path.relative(root, outputPath)} with ${compact.tools.length} executable tools.`);
