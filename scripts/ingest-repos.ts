import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { repoSources, type RepoSource } from "../data/repos";
import { slugify, titleCase } from "../lib/utils";
import type { GeneratedSeed, NormalizedTool, SourceRepoSeed, ToolInputSchema, ToolOutputSchema } from "../lib/tools/types";

const rootDir = process.cwd();
const reposDir = path.join(rootDir, ".repos");
const dataFile = path.join(rootDir, "data", "tools.generated.json");
const supportedExtensions = new Set([".md", ".mdx", ".txt", ".json", ".yaml", ".yml"]);
const maxPromptChars = 12000;
const prisma = new PrismaClient();

const domainKeywords: Array<[string, string[]]> = [
  ["SEO & GEO", ["seo", "geo", "schema", "backlink", "hreflang", "sitemap", "crawler", "citation", "aeo", "llms"]],
  ["Marketing", ["marketing", "ads", "campaign", "email", "cro", "landing", "copy", "social", "growth", "funnel", "pricing"]],
  ["Branding & Design", ["brand", "design", "figma", "visual", "creative", "prototype", "ui", "ux", "logo", "style", "landing"]],
  ["Engineering & AI Agent", ["frontend", "backend", "devops", "security", "agent", "code", "architecture", "database", "api", "mcp"]],
  ["AI Research", ["research", "paper", "latex", "experiment", "model", "fine-tuning", "rag", "eval", "training", "ml"]],
  ["C-Level Advisory", ["ceo", "cto", "cfo", "cmo", "cpo", "board", "executive", "advisor", "advisory"]]
];

const domainSamples: Record<string, Record<string, string>> = {
  "SEO & GEO": {
    projectName: "B2B SaaS Website",
    context: "The site has 120 indexed pages, weak schema coverage, and wants more citations in AI Search results.",
    goal: "Increase qualified organic pipeline and AI answer visibility within 90 days.",
    audience: "Technical buyers, founders, and growth teams",
    constraints: "Small content team, Ahrefs export available, no engineering sprint for two weeks.",
    data: "Top pages, GSC queries, Ahrefs competitors, current sitemap, and target keywords."
  },
  Marketing: {
    projectName: "Usage-Based Analytics SaaS",
    context: "PLG product with free trial, low activation, and paid search budget ready for testing.",
    goal: "Build a 30-day campaign plan with landing page, email, and CRO improvements.",
    audience: "Growth leaders at Series A SaaS companies",
    constraints: "Budget is $8k/month, two-person marketing team, no agency support.",
    data: "Current conversion rate, top channels, ICP notes, offer, and product differentiators."
  },
  "Branding & Design": {
    projectName: "Modern Wakaf Platform",
    context: "A donation product needs trustworthy brand identity, landing page direction, and reusable UI primitives.",
    goal: "Create a premium design direction and conversion-focused hero system.",
    audience: "Muslim professionals, donors, and foundation partners",
    constraints: "Must feel trustworthy, mobile-first, and easy for non-technical admins to reuse.",
    data: "Brand values, color preferences, competitors, logo notes, and content sections."
  },
  "Engineering & AI Agent": {
    projectName: "Agent Workflow Platform",
    context: "Next.js app with Prisma, API routes, background jobs, and upcoming multi-provider LLM support.",
    goal: "Review architecture and produce a shippable implementation checklist.",
    audience: "Senior engineering team",
    constraints: "Ship in two weeks, keep local SQLite support, prepare Postgres migration path.",
    data: "Repo structure, risky modules, deployment target, current incidents, and auth requirements."
  },
  "AI Research": {
    projectName: "Small Model Evaluation Study",
    context: "Research team wants to compare fine-tuned 7B models on domain-specific reasoning tasks.",
    goal: "Create survey scope, experiment plan, and paper outline.",
    audience: "ML researchers and applied AI engineers",
    constraints: "Two GPUs, four-week timeline, limited labeled data.",
    data: "Candidate papers, datasets, baseline metrics, model list, and evaluation criteria."
  },
  "C-Level Advisory": {
    projectName: "AI Automation Startup",
    context: "Founder needs an executive review before raising a seed round.",
    goal: "Produce CEO, CTO, CFO, CMO, and board-level recommendations.",
    audience: "Founder, leadership team, and investors",
    constraints: "Runway 9 months, team of 7, early revenue, high enterprise interest.",
    data: "Metrics, roadmap, pipeline, burn, org chart, and biggest strategic questions."
  }
};

const outputSections: ToolOutputSchema = {
  sections: [
    { key: "summary", title: "Executive Summary", type: "markdown" },
    { key: "workflow", title: "Workflow", type: "list" },
    { key: "recommendations", title: "Recommendations", type: "list" },
    { key: "deliverable", title: "Reusable Deliverable", type: "markdown" },
    { key: "checklist", title: "Execution Checklist", type: "list" },
    { key: "attribution", title: "Source Attribution", type: "markdown" }
  ]
};

const requiredWrappers = [
  ["Brand Identity Generator", "Branding & Design", "nexu-io/open-design", "Create a brand strategy, visual direction, typography system, color system, and identity usage rules."],
  ["Design System Generator", "Branding & Design", "nexu-io/open-design", "Generate reusable UI tokens, components, states, layout rules, and implementation notes."],
  ["Landing Page Copy + Visual Direction", "Branding & Design", "nexu-io/open-design", "Produce landing page copy blocks with visual art direction and section-by-section design notes."],
  ["Brand Audit", "Branding & Design", "rampstackco/claude-skills", "Audit brand consistency, trust signals, messaging clarity, and conversion readiness."],
  ["Content SEO Growth Plan", "Branding & Design", "kostja94/marketing-skills", "Connect brand positioning with content, SEO, and growth channel planning."],
  ["Senior Frontend Reviewer", "Engineering & AI Agent", "alirezarezvani/claude-skills", "Review UI architecture, accessibility, performance, maintainability, and release risk."],
  ["Backend Architecture Reviewer", "Engineering & AI Agent", "alirezarezvani/claude-skills", "Review API boundaries, data model, scaling, observability, and failure modes."],
  ["DevOps Checklist Generator", "Engineering & AI Agent", "alirezarezvani/claude-skills", "Generate deployment, CI/CD, secrets, monitoring, rollback, and incident readiness checklists."],
  ["Security Audit Assistant", "Engineering & AI Agent", "alirezarezvani/claude-skills", "Turn product context into a pragmatic security review and remediation plan."],
  ["AI/ML Engineering Planner", "Engineering & AI Agent", "Orchestra-Research/AI-Research-SKILLs", "Plan model, data, evaluation, serving, and monitoring work for AI engineering projects."],
  ["Agent Persona Builder", "Engineering & AI Agent", "alirezarezvani/claude-skills", "Design role-specific agent personas, scope, inputs, outputs, and escalation rules."],
  ["Literature Survey Builder", "AI Research", "Orchestra-Research/AI-Research-SKILLs", "Create a scoped literature review plan, search strategy, synthesis table, and research gaps."],
  ["Research Ideation Tool", "AI Research", "Orchestra-Research/AI-Research-SKILLs", "Generate research questions, hypotheses, novelty angles, and feasibility checks."],
  ["Experiment Planner", "AI Research", "Orchestra-Research/AI-Research-SKILLs", "Create an experiment protocol with baselines, metrics, datasets, compute, and risks."],
  ["Paper Outline Generator", "AI Research", "Orchestra-Research/AI-Research-SKILLs", "Draft paper structure, claims, figures, tables, and evaluation narrative."],
  ["LaTeX Paper Draft Assistant", "AI Research", "Orchestra-Research/AI-Research-SKILLs", "Produce a LaTeX-ready paper skeleton and section writing plan."],
  ["CEO Review Tool", "C-Level Advisory", "garrytan profile via VoltAgent index", "Review company strategy, focus, speed, narrative, and executive operating cadence."],
  ["CTO Architecture Review", "C-Level Advisory", "alirezarezvani/claude-skills", "Turn architecture context into executive-level technical risk and investment recommendations."],
  ["CFO Model Reviewer", "C-Level Advisory", "alirezarezvani/claude-skills", "Analyze unit economics, runway, pricing, revenue quality, and board-ready financial questions."],
  ["CMO Growth Review", "C-Level Advisory", "coreyhaines31/marketingskills", "Review positioning, acquisition loops, conversion, budget allocation, and growth experiments."],
  ["CPO Product Review", "C-Level Advisory", "alirezarezvani/claude-skills", "Evaluate roadmap, activation, retention, customer evidence, and product strategy tradeoffs."],
  ["Board Memo Generator", "C-Level Advisory", "garrytan profile via VoltAgent index", "Generate a concise board memo with metrics, risks, decisions, and asks."],
  ["SEO Campaign Builder", "Marketing", "kostja94/marketing-skills", "Build an SEO campaign plan with keywords, pages, distribution, and measurement."],
  ["Paid Ads Strategy Builder", "Marketing", "AgriciDaniel/claude-ads", "Create paid media strategy, channel split, creative tests, budget, and reporting plan."],
  ["Social Media Calendar", "Marketing", "kostja94/marketing-skills", "Generate a multi-channel social calendar with themes, hooks, and cadence."],
  ["Email Sequence Generator", "Marketing", "coreyhaines31/marketingskills", "Create onboarding, nurture, or launch email sequences tied to conversion goals."],
  ["CRO Audit", "Marketing", "coreyhaines31/marketingskills", "Audit landing pages, signup flow, pricing, forms, and conversion friction."],
  ["Landing Page Generator", "Marketing", "coreyhaines31/marketingskills", "Produce landing page structure, copy, CTA hierarchy, and experiment plan."],
  ["Technical SEO Audit", "SEO & GEO", "AgriciDaniel/claude-seo", "Review crawlability, indexing, canonicalization, sitemap, performance, and technical SEO risk."],
  ["Schema Generator", "SEO & GEO", "AgriciDaniel/claude-seo", "Generate schema strategy, JSON-LD plan, validation steps, and page mapping."],
  ["Backlink Analysis Brief", "SEO & GEO", "AgriciDaniel/claude-seo", "Turn backlink data into authority gaps, risks, targets, and outreach strategy."],
  ["GEO/AEO Optimization Tool", "SEO & GEO", "zubair-trabzada/geo-seo-claude", "Optimize content for answer engines, AI Search, citations, and entity clarity."],
  ["AI Search Citation Optimizer", "SEO & GEO", "zubair-trabzada/geo-seo-claude", "Create a plan to make pages more citable by ChatGPT, Perplexity, and AI Overviews."],
  ["Ahrefs/Semrush Data Interpretation Tool", "SEO & GEO", "AgriciDaniel/claude-seo", "Interpret keyword, competitor, and backlink exports into prioritized SEO actions."]
] as const;

function run(command: string, args: string[], options: { cwd?: string; ignoreFailure?: boolean } = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd ?? rootDir,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8"
    }).trim();
  } catch (error) {
    if (options.ignoreFailure) return "";
    throw error;
  }
}

function cloneOrFetch(source: RepoSource) {
  fs.mkdirSync(reposDir, { recursive: true });
  const target = path.join(reposDir, source.id);
  if (source.id === "garrytan") {
    return { target, cloned: false, note: "Profile URL is not a cloneable repository; generated inspired-by advisory tools." };
  }

  if (fs.existsSync(path.join(target, ".git"))) {
    run("git", ["fetch", "--depth=1", "origin"], { cwd: target, ignoreFailure: true });
    run("git", ["pull", "--ff-only"], { cwd: target, ignoreFailure: true });
    return { target, cloned: true, note: "Fetched existing checkout." };
  }

  const cloneArgs = ["clone", "--depth=1", source.cloneUrl, target];
  const primaryOutput = run("git", cloneArgs, { ignoreFailure: true });
  if (fs.existsSync(path.join(target, ".git"))) {
    return { target, cloned: true, note: primaryOutput || "Cloned primary URL." };
  }

  if (source.fallbackUrl) {
    const fallbackOutput = run("git", ["clone", "--depth=1", source.fallbackUrl, target], { ignoreFailure: true });
    if (fs.existsSync(path.join(target, ".git"))) {
      return { target, cloned: true, note: fallbackOutput || `Primary failed; cloned fallback ${source.fallbackUrl}.` };
    }
  }

  return { target, cloned: false, note: "Clone failed; no files ingested for this source." };
}

function walkFiles(dir: string, files: string[] = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".next") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else if (supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function readLicense(repoPath: string) {
  const licenseFile = fs
    .readdirSync(repoPath, { withFileTypes: true })
    .find((entry) => entry.isFile() && /^licen[cs]e/i.test(entry.name));
  if (!licenseFile) return "Unknown";
  const content = fs.readFileSync(path.join(repoPath, licenseFile.name), "utf8").slice(0, 1200).toLowerCase();
  if (content.includes("mit license")) return "MIT";
  if (content.includes("apache license")) return "Apache";
  if (content.includes("gnu general public license")) return "GPL";
  return licenseFile.name;
}

function isSkillFile(relativePath: string, content: string) {
  const lower = `${relativePath}\n${content.slice(0, 2000)}`.toLowerCase();
  if (relativePath.endsWith("SKILL.md")) return true;
  if (/(prompt|skill|agent|workflow|playbook|template)/.test(lower) && /^#\s+/m.test(content)) return true;
  return false;
}

function extractTitle(relativePath: string, content: string) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading.replace(/[`*_]/g, "").slice(0, 86);
  const folder = path.basename(path.dirname(relativePath));
  return titleCase(folder === "." ? path.basename(relativePath, path.extname(relativePath)) : folder);
}

function extractDescription(content: string, fallback: string) {
  const lines = content
    .replace(/^---[\s\S]*?---/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("```") && !line.startsWith("|"));
  const first = lines.find((line) => /[a-zA-Z]/.test(line));
  return (first ?? fallback).replace(/\s+/g, " ").slice(0, 280);
}

function inferDomain(source: RepoSource, relativePath: string, title: string, content: string) {
  if (source.id === "claude-seo" || source.id === "geo-seo-claude") return "SEO & GEO";
  if (source.id === "claude-ads" || source.id === "marketingskills") return "Marketing";
  if (source.id === "open-design") return "Branding & Design";
  if (source.id === "ai-research-skills") return "AI Research";
  const haystack = `${source.domain} ${relativePath} ${title} ${content.slice(0, 4000)}`.toLowerCase();
  let best = source.domain;
  let bestScore = 0;
  for (const [domain, keywords] of domainKeywords) {
    const score = keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      best = domain;
      bestScore = score;
    }
  }
  return best;
}

function buildInputSchema(domain: string): ToolInputSchema {
  return {
    fields: [
      { name: "projectName", label: "Project name", type: "text", required: true, placeholder: "Product, website, brand, or team name" },
      { name: "context", label: "Context", type: "textarea", required: true, placeholder: "Describe the current situation, assets, market, product, or repo." },
      { name: "goal", label: "Primary goal", type: "textarea", required: true, placeholder: "What should this tool help you decide, create, or improve?" },
      { name: "audience", label: "Audience", type: "text", required: true, placeholder: "Customers, users, donors, buyers, team, board, or reviewers" },
      { name: "constraints", label: "Constraints", type: "textarea", required: false, placeholder: "Timeline, budget, channels, stack, compliance, brand, or operational limits" },
      { name: "data", label: domain === "SEO & GEO" ? "SEO/GEO data" : "Available data", type: "textarea", required: false, placeholder: "Paste exports, notes, metrics, pages, examples, links, or assumptions" }
    ]
  };
}

function workflowFor(domain: string, title: string) {
  const shared = [
    `Clarify the project, audience, constraints, and success metric for ${title}.`,
    "Extract the strongest signals from the supplied context and data.",
    "Apply the source skill workflow as a structured web-tool process.",
    "Generate a prioritized, reusable deliverable rather than generic advice.",
    "Return action steps, risks, and a checklist that can be executed immediately."
  ];
  const domainLead: Record<string, string> = {
    "SEO & GEO": "Audit crawlability, intent, entity clarity, schema, authority, and AI-answer citability.",
    Marketing: "Map the funnel, offer, audience, channel, creative, conversion, and measurement plan.",
    "Branding & Design": "Translate positioning into identity, visual system, copy tone, and page direction.",
    "Engineering & AI Agent": "Review architecture, maintainability, reliability, security, and agent boundaries.",
    "AI Research": "Frame the research question, related work, experiment design, evaluation, and paper artifact.",
    "C-Level Advisory": "Evaluate strategy, metrics, execution risk, operating cadence, and board-level decisions."
  };
  return [domainLead[domain] ?? shared[0], ...shared.slice(1)];
}

function tagsFrom(relativePath: string, title: string, domain: string) {
  const raw = `${domain} ${relativePath} ${title}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2 && !["skill", "skills", "main", "readme"].includes(part));
  return Array.from(new Set(raw)).slice(0, 8);
}

function buildPromptTemplate(title: string, domain: string, source: string, sourcePath: string, sourceContent: string, inspired = false) {
  return [
    `You are running the UpMySkills tool "${title}" in the ${domain} domain.`,
    `Source attribution: ${source}${sourcePath ? ` (${sourcePath})` : ""}.`,
    inspired ? "This tool is a clean wrapper inspired by the source because the original source is not directly executable as a web form." : "Use the source skill as the operating method, not as raw README content.",
    "",
    "User inputs:",
    "- Project: {{projectName}}",
    "- Context: {{context}}",
    "- Goal: {{goal}}",
    "- Audience: {{audience}}",
    "- Constraints: {{constraints}}",
    "- Data: {{data}}",
    "",
    "Produce a structured, useful output with summary, workflow, recommendations, reusable deliverable, checklist, and source attribution.",
    "",
    "Source skill excerpt:",
    sourceContent.slice(0, maxPromptChars)
  ].join("\n");
}

function exampleOutput(title: string, domain: string, sourceRepo: string) {
  return {
    title: `${title} sample output`,
    markdown: [
      `## ${title}`,
      `A ${domain} workflow generated from ${sourceRepo}.`,
      "",
      "### Summary",
      "Prioritize the highest-leverage fixes first, document assumptions, and convert the result into a reusable operating artifact.",
      "",
      "### Next Actions",
      "- Validate the inputs.",
      "- Run the workflow.",
      "- Review risks and attribution.",
      "- Export the final Markdown for execution."
    ].join("\n")
  };
}

function normalizeTool(params: {
  title: string;
  domain: string;
  sourceRepo: string;
  sourcePath?: string;
  sourceUrl: string;
  license: string;
  content: string;
  description?: string;
  inspired?: boolean;
}) {
  const baseSlug = slugify(`${params.domain}-${params.title}`);
  const id = slugify(`${params.sourceRepo}-${params.sourcePath ?? params.title}`);
  const description =
    params.description ??
    extractDescription(params.content, `Interactive ${params.domain} workflow based on ${params.sourceRepo}.`);
  return {
    id,
    title: params.title,
    slug: baseSlug,
    domain: params.domain,
    description,
    sourceRepo: params.sourceRepo,
    sourcePath: params.sourcePath ?? (params.inspired ? "inspired-wrapper" : undefined),
    license: params.license,
    inputSchema: buildInputSchema(params.domain),
    promptTemplate: buildPromptTemplate(
      params.title,
      params.domain,
      params.sourceRepo,
      params.sourcePath ?? "",
      params.content,
      params.inspired
    ),
    outputSchema: outputSections,
    workflowSteps: workflowFor(params.domain, params.title),
    exampleOutput: exampleOutput(params.title, params.domain, params.sourceRepo),
    sampleInput: domainSamples[params.domain] ?? domainSamples.Marketing,
    tags: tagsFrom(params.sourcePath ?? params.title, params.title, params.domain)
  } satisfies NormalizedTool;
}

function dedupe(tools: NormalizedTool[]) {
  const bySlug = new Map<string, NormalizedTool>();
  const counts = new Map<string, number>();
  const idCounts = new Map<string, number>();
  for (const tool of tools) {
    const count = counts.get(tool.slug) ?? 0;
    counts.set(tool.slug, count + 1);
    const slug = count ? `${tool.slug}-${count + 1}` : tool.slug;
    const idCount = idCounts.get(tool.id) ?? 0;
    idCounts.set(tool.id, idCount + 1);
    const id = idCount ? `${tool.id}-${idCount + 1}` : tool.id;
    const existing = bySlug.get(slug);
    if (!existing) bySlug.set(slug, { ...tool, id, slug });
  }
  return Array.from(bySlug.values());
}

function wrapperTools(existing: NormalizedTool[]) {
  const current = new Set(existing.map((tool) => slugify(`${tool.domain}-${tool.title}`)));
  return requiredWrappers
    .filter(([title, domain]) => !current.has(slugify(`${domain}-${title}`)))
    .map(([title, domain, sourceRepo, description]) =>
      normalizeTool({
        title,
        domain,
        sourceRepo,
        sourceUrl: `https://github.com/${sourceRepo}`,
        sourcePath: "inspired-wrapper",
        license: "Source dependent",
        content: `${description}\n\nThis is a production web wrapper created from the source repository idea and normalized into an executable UpMySkills workflow.`,
        description,
        inspired: true
      })
    );
}

async function seedDatabase(seed: GeneratedSeed) {
  run("npx", ["prisma", "db", "push"], { cwd: rootDir });
  await prisma.run.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.sourceRepo.deleteMany();

  for (const source of seed.sources) {
    await prisma.sourceRepo.create({
      data: {
        ...source,
        lastIngestedAt: new Date(source.lastIngestedAt)
      }
    });
  }

  for (const tool of seed.tools) {
    await prisma.tool.create({
      data: {
        ...tool,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        workflowSteps: tool.workflowSteps,
        exampleOutput: tool.exampleOutput,
        sampleInput: tool.sampleInput,
        tags: tool.tags
      }
    });
  }
}

async function main() {
  const extracted: NormalizedTool[] = [];
  const sources: SourceRepoSeed[] = [];
  const skipped: GeneratedSeed["skipped"] = [];

  for (const source of repoSources) {
    console.log(`\nIngesting ${source.name}`);
    const checkout = cloneOrFetch(source);
    const license = checkout.cloned ? readLicense(checkout.target) : "Profile/source dependent";
    sources.push({
      id: source.id,
      name: source.name,
      url: source.fallbackUrl?.replace(/\.git$/, "") ?? source.url,
      license,
      lastIngestedAt: new Date().toISOString(),
      notes: `${source.notes} ${checkout.note}`.trim()
    });

    if (!checkout.cloned) {
      skipped.push({ repo: source.id, path: source.url, reason: checkout.note });
      continue;
    }

    const files = walkFiles(checkout.target);
    for (const file of files) {
      const relativePath = path.relative(checkout.target, file);
      let content = "";
      try {
        content = fs.readFileSync(file, "utf8");
      } catch (error) {
        skipped.push({ repo: source.id, path: relativePath, reason: "File was discovered but could not be read from checkout." });
        continue;
      }
      if (!isSkillFile(relativePath, content)) {
        skipped.push({ repo: source.id, path: relativePath, reason: "Not detected as skill or prompt file." });
        continue;
      }

      const title = extractTitle(relativePath, content);
      const domain = inferDomain(source, relativePath, title, content);
      extracted.push(
        normalizeTool({
          title,
          domain,
          sourceRepo: source.fallbackUrl?.replace("https://github.com/", "").replace(/\.git$/, "") ?? source.url.replace("https://github.com/", ""),
          sourceUrl: source.fallbackUrl?.replace(/\.git$/, "") ?? source.url,
          sourcePath: relativePath,
          license,
          content,
          description: extractDescription(content, `Interactive ${domain} workflow based on ${title}.`)
        })
      );
    }

    console.log(`  scanned ${files.length} supported files`);
  }

  const withWrappers = [...extracted, ...wrapperTools(extracted)];
  const tools = dedupe(withWrappers).sort((a, b) => a.domain.localeCompare(b.domain) || a.title.localeCompare(b.title));
  const seed: GeneratedSeed = {
    generatedAt: new Date().toISOString(),
    tools,
    sources,
    skipped
  };

  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, `${JSON.stringify(seed, null, 2)}\n`);
  await seedDatabase(seed);

  console.log(`\nExtracted ${tools.length} executable tools.`);
  console.log(`Skipped ${skipped.length} non-tool or ambiguous files.`);
  console.log(`Wrote ${path.relative(rootDir, dataFile)} and seeded Prisma SQLite.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
