import fs from "node:fs";
import path from "node:path";

const cacheDir = process.env.UPMYSKILLS_TREE_CACHE || "/private/tmp/upmyskills-api";

const sources = [
  {
    id: "marketing-skills",
    name: "Marketing Skills",
    repo: "kostja94/marketing-skills",
    category: "Marketing",
    treeFile: "kostja-tree.json"
  },
  {
    id: "marketingskills",
    name: "Marketing Skills by Corey Haines",
    repo: "coreyhaines31/marketingskills",
    category: "Marketing",
    treeFile: "corey-tree.json"
  },
  {
    id: "claude-ads",
    name: "Claude Ads",
    repo: "AgriciDaniel/claude-ads",
    category: "Marketing",
    treeFile: "ads-tree.json"
  },
  {
    id: "claude-seo",
    name: "Claude SEO",
    repo: "AgriciDaniel/claude-seo",
    category: "SEO & GEO",
    treeFile: "seo-tree.json"
  },
  {
    id: "geo-seo-claude",
    name: "GEO SEO Claude",
    repo: "zubair-trabzada/geo-seo-claude",
    category: "SEO & GEO",
    treeFile: "geo-tree.json"
  },
  {
    id: "brand-build-skills",
    name: "Brand Build Skills",
    repo: "rampstackco/claude-skills",
    category: "Branding & Design",
    treeFile: "rampstack-tree.json"
  },
  {
    id: "open-design",
    name: "Open Design",
    repo: "nexu-io/open-design",
    category: "Branding & Design",
    treeFile: "open-design-tree.json"
  },
  {
    id: "claude-skills-engineering",
    name: "Claude Skills Mega Library",
    repo: "alirezarezvani/claude-skills",
    category: "Engineering & AI Agent",
    treeFile: "alireza-tree.json"
  },
  {
    id: "ai-research-skills",
    name: "AI Research Skills",
    repo: "Orchestra-Research/AI-Research-SKILLs",
    category: "AI Research",
    treeFile: "orchestra-tree.json"
  },
  {
    id: "awesome-claude-skills",
    name: "Awesome Claude Skills",
    repo: "ComposioHQ/awesome-claude-skills",
    category: "Index",
    treeFile: "composio-tree.json"
  },
  {
    id: "awesome-agent-skills",
    name: "Awesome Agent Skills",
    repo: "VoltAgent/awesome-agent-skills",
    category: "Index",
    treeFile: "voltagent-tree.json"
  }
];

const skipSegments = new Set(["README", "TEMPLATE"]);

function titleCase(slug) {
  return slug
    .replace(/\.[^.]+$/, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function skillNameFromPath(filePath) {
  const segments = filePath.split("/");
  const folder = segments.at(-2) || segments.at(-1).replace(/\.md$/i, "");
  return titleCase(folder);
}

function subcategoryFromPath(filePath) {
  const segments = filePath.split("/");
  if (segments.length <= 2) return "Root";
  const meaningful = segments.filter((segment) => !["skills", ".gemini", ".claude", "design-templates"].includes(segment));
  return titleCase(meaningful[0] || segments[0]);
}

function shouldIncludeSkill(filePath) {
  if (!/(^|\/)SKILL\.md$/.test(filePath)) return false;
  const segments = filePath.split("/");
  const folder = segments.at(-2) || "";
  if (skipSegments.has(folder)) return false;
  if (filePath.includes("sample-skill/")) return false;
  return true;
}

function readTree(source) {
  const filePath = path.join(cacheDir, source.treeFile);
  if (!fs.existsSync(filePath)) return { tree: [], truncated: false, missing: true };
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const skills = [];
const sourceSummaries = [];

for (const source of sources) {
  const payload = readTree(source);
  const tree = Array.isArray(payload.tree) ? payload.tree : [];
  const skillFiles = tree.filter((entry) => entry.type === "blob" && shouldIncludeSkill(entry.path));

  sourceSummaries.push({
    id: source.id,
    name: source.name,
    repo: source.repo,
    category: source.category,
    count: skillFiles.length,
    status: payload.missing ? "tree cache missing" : skillFiles.length ? "verified SKILL.md paths" : "index/no SKILL.md files",
    truncated: Boolean(payload.truncated)
  });

  for (const entry of skillFiles) {
    const folderUrl = `https://github.com/${source.repo}/tree/main/${entry.path.replace(/\/SKILL\.md$/, "")}`;
    const rawUrl = `https://raw.githubusercontent.com/${source.repo}/main/${entry.path}`;
    skills.push({
      id: `${source.id}:${entry.path}`,
      name: skillNameFromPath(entry.path),
      sourceId: source.id,
      sourceName: source.name,
      repo: source.repo,
      category: source.category,
      subcategory: subcategoryFromPath(entry.path),
      path: entry.path,
      url: folderUrl,
      rawUrl,
      status: "Verified SKILL.md path",
      size: entry.size || 0
    });
  }
}

skills.sort((a, b) => a.category.localeCompare(b.category) || a.sourceName.localeCompare(b.sourceName) || a.name.localeCompare(b.name));

const output = {
  generatedAt: new Date().toISOString(),
  totalSkills: skills.length,
  sourceCount: sourceSummaries.length,
  sources: sourceSummaries,
  skills
};

fs.writeFileSync(
  path.join(process.cwd(), "public", "skill-catalog.js"),
  `window.UPMYSKILLS_SKILL_CATALOG = ${JSON.stringify(output, null, 2)};\n`
);

console.log(`Generated ${skills.length} verified skill entries from ${sourceSummaries.length} sources.`);
