import type { NormalizedTool, ToolDefinition, ToolInputField, ToolInputSchema, ToolOutputSchema } from "./types";

function field(name: string, label: string, type: ToolInputField["type"], required: boolean, placeholder: string, options?: string[]): ToolInputField {
  return { name, label, type, required, placeholder, options };
}

const commonOutputSchema: ToolOutputSchema = {
  sections: [
    { key: "score", title: "Score or status", type: "score" },
    { key: "findings", title: "Key findings", type: "issues" },
    { key: "recommendations", title: "Prioritized recommendations", type: "table" },
    { key: "analysis", title: "Detailed analysis", type: "table" },
    { key: "checklist", title: "Action checklist", type: "list" }
  ]
};

const seoFields: ToolInputSchema = {
  fields: [
    field("url", "Page URL", "text", true, "https://example.com/service-page"),
    field("pageTitle", "Page title", "text", true, "Primary keyword | Brand"),
    field("metaDescription", "Meta description", "textarea", true, "140-160 character search result summary"),
    field("headings", "Headings", "textarea", true, "One heading per line, e.g. H1: ..."),
    field("content", "Page content", "textarea", true, "Paste visible page copy"),
    field("targetKeyword", "Target keyword", "text", true, "technical seo audit"),
    field("robotsSetting", "Robots setting", "select", true, "index, follow", ["index, follow", "noindex", "blocked", "unknown"]),
    field("canonicalUrl", "Canonical URL", "text", false, "https://example.com/service-page"),
    field("schemaMarkup", "Schema markup", "textarea", false, "Paste JSON-LD or schema notes")
  ]
};

export const priorityToolDefinitions: ToolDefinition[] = [
  {
    id: "priority-technical-seo-audit",
    slug: "seo-and-geo-technical-seo-audit",
    title: "Technical SEO Audit",
    domain: "SEO & GEO",
    description: "Audit a page for indexability, metadata, headings, keyword coverage, schema readiness, and AI-search visibility.",
    inputSchema: seoFields,
    outputSchema: commonOutputSchema,
    workflowSteps: ["Validate required page signals.", "Score metadata, headings, content, canonical, robots, and schema.", "Classify issues by severity.", "Generate fixes and a technical checklist."],
    deterministicChecks: ["title-length", "meta-length", "heading-structure", "keyword-placement", "content-length", "robots", "canonical", "schema"],
    aiEnhancementPrompt: "Improve explanations and prioritization only. Do not replace deterministic SEO checks.",
    scoringRules: [
      { key: "metadata", label: "Metadata", weight: 20, description: "Title and meta description quality." },
      { key: "indexability", label: "Indexability", weight: 20, description: "Robots and canonical signals." },
      { key: "content", label: "Content relevance", weight: 25, description: "Keyword placement and content depth." },
      { key: "structure", label: "Structure", weight: 20, description: "Heading hierarchy." },
      { key: "schema", label: "Schema", weight: 15, description: "Structured data presence." }
    ],
    exportFormats: ["markdown", "json", "csv", "html"],
    rendererType: "audit",
    sampleInput: {
      url: "https://example.com/technical-seo-services",
      pageTitle: "Technical SEO Audit Services | Example",
      metaDescription: "Technical SEO audit services covering crawlability, indexation, schema, Core Web Vitals, and search visibility improvements.",
      headings: "H1: Technical SEO Audit Services\nH2: Crawlability and Indexation\nH2: Schema and Technical Fixes\nH3: Reporting",
      content: "Our technical SEO audit reviews crawlability, indexation, canonical tags, schema markup, internal linking, performance, and technical SEO priorities for growth teams.",
      targetKeyword: "technical seo audit",
      robotsSetting: "index, follow",
      canonicalUrl: "https://example.com/technical-seo-services",
      schemaMarkup: "{\"@context\":\"https://schema.org\",\"@type\":\"Service\"}"
    },
    tags: ["seo", "audit", "technical", "schema"]
  },
  {
    id: "priority-geo-aeo-optimizer",
    slug: "seo-and-geo-ai-search-citation-optimizer",
    title: "GEO/AEO Optimizer",
    domain: "SEO & GEO",
    description: "Score content for AI answer readiness, citation clarity, entity coverage, and answer-engine structure.",
    inputSchema: {
      fields: [
        field("brand", "Brand or site", "text", true, "ExampleCo"),
        field("content", "Content draft", "textarea", true, "Paste the article, page, or answer content"),
        field("targetQuestions", "Target questions", "textarea", true, "One user question per line"),
        field("entityTerms", "Entity terms", "textarea", false, "Products, people, locations, topics, standards"),
        field("citations", "Citations or sources", "textarea", false, "Paste source URLs or citation notes"),
        field("schemaMarkup", "Schema markup", "textarea", false, "FAQ, Article, Product, Organization, or HowTo JSON-LD"),
        field("platformTargets", "AI platforms", "text", false, "Google AI Overviews, ChatGPT Search, Perplexity")
      ]
    },
    outputSchema: commonOutputSchema,
    workflowSteps: ["Parse target questions.", "Check answer blocks and citations.", "Score entity and schema coverage.", "Create optimization tasks."],
    deterministicChecks: ["question-coverage", "citation-count", "entity-coverage", "answer-blocks", "schema-presence"],
    aiEnhancementPrompt: "Refine answer snippets and prioritization without inventing facts or citations.",
    scoringRules: [
      { key: "answers", label: "Answer coverage", weight: 30, description: "Direct answers for target questions." },
      { key: "citations", label: "Citation readiness", weight: 25, description: "Clear sources and factual support." },
      { key: "entities", label: "Entity coverage", weight: 20, description: "Named entities and topic clarity." },
      { key: "schema", label: "Schema readiness", weight: 15, description: "Structured data suitability." },
      { key: "format", label: "Extractability", weight: 10, description: "Tables, bullets, concise snippets." }
    ],
    exportFormats: ["markdown", "json", "csv", "html"],
    rendererType: "optimizer",
    sampleInput: {
      brand: "ExampleCo",
      content: "ExampleCo helps B2B SaaS teams audit technical SEO, structure answers, and publish evidence-backed guides with clear citations. The page includes FAQs, comparison tables, and named product use cases.",
      targetQuestions: "What is a technical SEO audit?\nHow can SaaS teams improve AI search visibility?\nWhich schema types help answer engines cite a page?",
      entityTerms: "Technical SEO, AI Overviews, ChatGPT Search, schema markup, SaaS growth",
      citations: "https://developers.google.com/search/docs\nhttps://schema.org/FAQPage\nhttps://schema.org/Article",
      schemaMarkup: "{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\"}",
      platformTargets: "Google AI Overviews, ChatGPT Search, Perplexity"
    },
    tags: ["geo", "aeo", "ai-search", "citations"]
  },
  {
    id: "priority-marketing-campaign-builder",
    slug: "marketing-seo-campaign-builder",
    title: "Marketing Campaign Builder",
    domain: "Marketing",
    description: "Build a channel mix, budget allocation, campaign calendar, KPI dashboard, ad angles, and launch checklist.",
    inputSchema: {
      fields: [
        field("product", "Product", "text", true, "Usage-based analytics SaaS"),
        field("audience", "Audience", "text", true, "Series A SaaS growth leaders"),
        field("price", "Price or ACV", "text", true, "$199/month or $18k ACV"),
        field("offer", "Offer", "textarea", true, "Free audit, trial, demo, bundle, discount, or launch offer"),
        field("goal", "Campaign goal", "select", true, "Pipeline", ["Pipeline", "Leads", "Revenue", "Activation", "Awareness"]),
        field("channels", "Channels", "text", true, "Google Ads, LinkedIn, Email, SEO, Webinar"),
        field("budget", "Budget", "number", true, "8000"),
        field("duration", "Duration in days", "number", true, "30")
      ]
    },
    outputSchema: commonOutputSchema,
    workflowSteps: ["Validate offer and audience fit.", "Allocate budget by channel.", "Map funnel stages.", "Create campaign calendar and KPI targets."],
    deterministicChecks: ["budget-allocation", "channel-fit", "funnel-map", "timeline", "kpi-targets"],
    aiEnhancementPrompt: "Improve ad angles and messaging hierarchy, keeping deterministic budget math unchanged.",
    scoringRules: [
      { key: "positioning", label: "Positioning completeness", weight: 25, description: "Product, audience, price, offer, and goal clarity." },
      { key: "channelFit", label: "Channel fit", weight: 25, description: "Channel and audience alignment." },
      { key: "budget", label: "Budget feasibility", weight: 20, description: "Budget relative to channel mix and duration." },
      { key: "measurement", label: "Measurement readiness", weight: 15, description: "KPI and goal clarity." },
      { key: "execution", label: "Execution plan", weight: 15, description: "Calendar and launch checklist." }
    ],
    exportFormats: ["markdown", "json", "csv", "html"],
    rendererType: "campaign",
    sampleInput: {
      product: "Usage-based analytics SaaS",
      audience: "Series A SaaS growth leaders",
      price: "$199/month",
      offer: "Free funnel audit plus 14-day trial",
      goal: "Pipeline",
      channels: "Google Ads, LinkedIn, Email, SEO, Webinar",
      budget: "8000",
      duration: "30"
    },
    tags: ["marketing", "campaign", "budget", "calendar"]
  },
  {
    id: "priority-paid-ads-audit",
    slug: "marketing-ads-multi-platform-paid-advertising-audit-and-optimization",
    title: "Paid Ads Audit",
    domain: "Marketing",
    description: "Audit paid media performance, tracking, budget waste, creative fatigue, conversion quality, and optimization priorities.",
    inputSchema: {
      fields: [
        field("platforms", "Platforms", "text", true, "Google Ads, Meta Ads, TikTok Ads"),
        field("monthlySpend", "Monthly spend", "number", true, "12000"),
        field("ctr", "CTR (%)", "number", true, "1.8"),
        field("cpc", "CPC", "number", true, "3.5"),
        field("conversionRate", "Conversion rate (%)", "number", true, "2.4"),
        field("cpa", "CPA", "number", true, "145"),
        field("roas", "ROAS", "number", false, "2.1"),
        field("landingPageConversion", "Landing page CVR (%)", "number", false, "4.2"),
        field("trackingStatus", "Tracking status", "select", true, "Partial", ["Complete", "Partial", "Broken", "Unknown"]),
        field("creativeCount", "Active creative count", "number", true, "8")
      ]
    },
    outputSchema: commonOutputSchema,
    workflowSteps: ["Validate metric completeness.", "Score media efficiency and tracking health.", "Detect waste and creative fatigue.", "Rank optimization actions."],
    deterministicChecks: ["ctr", "cpc", "cvr", "cpa", "roas", "tracking", "creative-count"],
    aiEnhancementPrompt: "Refine the plain-English audit narrative only. Keep metric scoring unchanged.",
    scoringRules: [
      { key: "efficiency", label: "Media efficiency", weight: 35, description: "CTR, CPC, CVR, CPA, and ROAS." },
      { key: "tracking", label: "Tracking health", weight: 25, description: "Conversion and attribution reliability." },
      { key: "creative", label: "Creative coverage", weight: 20, description: "Creative volume and fatigue risk." },
      { key: "landing", label: "Landing conversion", weight: 20, description: "Post-click conversion quality." }
    ],
    exportFormats: ["markdown", "json", "csv", "html"],
    rendererType: "audit",
    sampleInput: {
      platforms: "Google Ads, LinkedIn Ads, Meta Ads",
      monthlySpend: "12000",
      ctr: "1.8",
      cpc: "3.5",
      conversionRate: "2.4",
      cpa: "145",
      roas: "2.1",
      landingPageConversion: "4.2",
      trackingStatus: "Partial",
      creativeCount: "8"
    },
    tags: ["paid-ads", "audit", "roas", "tracking"]
  },
  {
    id: "priority-brand-identity",
    slug: "branding-and-design-brand-identity-generator",
    title: "Brand Identity Builder",
    domain: "Branding & Design",
    description: "Create a brand kit with archetype, tone rules, visual direction, messaging hierarchy, and usage checklist.",
    inputSchema: {
      fields: [
        field("businessName", "Business name", "text", true, "Modern Wakaf Platform"),
        field("industry", "Industry", "text", true, "Fintech donation platform"),
        field("audience", "Audience", "text", true, "Muslim professionals and foundation partners"),
        field("positioning", "Positioning", "textarea", true, "Trusted digital donation infrastructure"),
        field("competitors", "Competitors", "textarea", false, "List competitors or adjacent brands"),
        field("personality", "Personality sliders", "text", true, "Trustworthy 9, Modern 8, Warm 6, Premium 7"),
        field("visualPreferences", "Visual preferences", "textarea", false, "Dark interface, emerald accents, minimal ornament")
      ]
    },
    outputSchema: commonOutputSchema,
    workflowSteps: ["Map positioning to archetype.", "Score differentiation and tone clarity.", "Generate tokens and usage rules.", "Create sample hero direction."],
    deterministicChecks: ["archetype", "tone-rules", "color-recommendations", "messaging-hierarchy", "usage-rules"],
    aiEnhancementPrompt: "Improve naming, tone examples, and visual rationale without changing selected archetype logic.",
    scoringRules: [
      { key: "positioning", label: "Positioning clarity", weight: 30, description: "Specific audience, value, and category." },
      { key: "differentiation", label: "Differentiation", weight: 20, description: "Competitor contrast and memorable attributes." },
      { key: "tone", label: "Tone usability", weight: 20, description: "Voice rules that can guide copy." },
      { key: "visual", label: "Visual coherence", weight: 20, description: "Color, type, imagery, and interface direction." },
      { key: "system", label: "System readiness", weight: 10, description: "Reusable tokens and usage rules." }
    ],
    exportFormats: ["markdown", "json", "html"],
    rendererType: "brand-kit",
    sampleInput: {
      businessName: "Modern Wakaf Platform",
      industry: "Fintech donation platform",
      audience: "Muslim professionals and foundation partners",
      positioning: "Trusted digital donation infrastructure for transparent recurring wakaf programs",
      competitors: "Kitabisa, LaunchGood, foundation donation portals",
      personality: "Trustworthy 9, Modern 8, Warm 6, Premium 7",
      visualPreferences: "Dark interface, emerald accents, calm editorial photography, minimal ornament"
    },
    tags: ["brand", "identity", "archetype", "tokens"]
  },
  {
    id: "priority-design-system",
    slug: "branding-and-design-design-system-generator",
    title: "Design System Builder",
    domain: "Branding & Design",
    description: "Generate design tokens, component inventory, states, accessibility checks, and implementation rules.",
    inputSchema: {
      fields: [
        field("productName", "Product name", "text", true, "Ops Dashboard"),
        field("platforms", "Platforms", "text", true, "Web, mobile web"),
        field("components", "Required components", "textarea", true, "Buttons, inputs, table, sidebar, modal, toast"),
        field("brandColors", "Brand colors", "text", true, "#7c3aed, #10b981, #0f172a"),
        field("accessibilityTarget", "Accessibility target", "select", true, "WCAG AA", ["WCAG A", "WCAG AA", "WCAG AAA"]),
        field("density", "UI density", "select", true, "Compact", ["Compact", "Comfortable", "Spacious"]),
        field("states", "States required", "text", true, "hover, focus, active, disabled, loading, error"),
        field("tokens", "Existing tokens", "textarea", false, "Paste existing colors, spacing, font, or radius tokens")
      ]
    },
    outputSchema: commonOutputSchema,
    workflowSteps: ["Normalize token inputs.", "Map components and interaction states.", "Score accessibility and coverage.", "Generate implementation-ready system rules."],
    deterministicChecks: ["token-coverage", "component-coverage", "state-coverage", "accessibility", "density"],
    aiEnhancementPrompt: "Clarify naming and usage notes only. Keep token and coverage logic deterministic.",
    scoringRules: [
      { key: "tokens", label: "Token coverage", weight: 25, description: "Color, spacing, radius, typography, and shadow tokens." },
      { key: "components", label: "Component coverage", weight: 25, description: "Core UI controls and layouts." },
      { key: "states", label: "State coverage", weight: 20, description: "Interactive and validation states." },
      { key: "a11y", label: "Accessibility readiness", weight: 20, description: "Contrast, focus, hit targets, and labels." },
      { key: "implementation", label: "Implementation clarity", weight: 10, description: "Rules engineers can apply." }
    ],
    exportFormats: ["markdown", "json", "csv", "html"],
    rendererType: "design-system",
    sampleInput: {
      productName: "Ops Dashboard",
      platforms: "Web, mobile web",
      components: "Buttons, inputs, table, sidebar, modal, toast, tabs, dropdown, date picker",
      brandColors: "#7c3aed, #10b981, #0f172a",
      accessibilityTarget: "WCAG AA",
      density: "Compact",
      states: "hover, focus, active, disabled, loading, error, selected",
      tokens: "spacing 4/8/12/16/24, radius 6, font Inter"
    },
    tags: ["design-system", "tokens", "components", "accessibility"]
  },
  {
    id: "priority-architecture-reviewer",
    slug: "engineering-and-ai-agent-backend-architecture-reviewer",
    title: "Engineering Architecture Reviewer",
    domain: "Engineering & AI Agent",
    description: "Review scalability, security, maintainability, observability, deployment risk, and implementation roadmap.",
    inputSchema: {
      fields: [
        field("stack", "Stack", "text", true, "Next.js, Prisma, Postgres, Cloudflare Pages"),
        field("architecture", "Architecture description", "textarea", true, "Describe services, data flow, queues, APIs, clients"),
        field("traffic", "Traffic profile", "text", true, "50k MAU, 200 rps peak"),
        field("database", "Database", "text", true, "Postgres with read replicas"),
        field("deployment", "Deployment", "text", true, "Cloudflare Pages + Workers"),
        field("auth", "Auth model", "text", true, "OAuth, RBAC, API keys"),
        field("risks", "Known risks", "textarea", false, "Scaling, migrations, vendor lock-in, background jobs"),
        field("monitoring", "Monitoring", "textarea", false, "Logs, metrics, alerts, traces")
      ]
    },
    outputSchema: commonOutputSchema,
    workflowSteps: ["Parse architecture signals.", "Score scalability, security, maintainability, and observability.", "Build a risk register.", "Create implementation roadmap."],
    deterministicChecks: ["scalability", "security", "maintainability", "observability", "deployment"],
    aiEnhancementPrompt: "Improve architecture explanations and roadmap language without changing risk scoring.",
    scoringRules: [
      { key: "scalability", label: "Scalability", weight: 25, description: "Traffic, caching, queues, and database scaling." },
      { key: "security", label: "Security", weight: 25, description: "Auth, secrets, data boundaries, and abuse controls." },
      { key: "maintainability", label: "Maintainability", weight: 20, description: "Modularity and operational simplicity." },
      { key: "observability", label: "Observability", weight: 15, description: "Metrics, logs, traces, and alerts." },
      { key: "deployment", label: "Deployment safety", weight: 15, description: "Rollback, migrations, and release gates." }
    ],
    exportFormats: ["markdown", "json", "csv", "html"],
    rendererType: "architecture-review",
    sampleInput: {
      stack: "Next.js, Prisma, Postgres, Cloudflare Pages, Workers",
      architecture: "Monolith Next.js app with API routes, Prisma data layer, background import jobs, local static build, and optional AI provider calls.",
      traffic: "50k MAU, 200 rps peak, imports can spike CPU",
      database: "Postgres primary with backups, planned read replicas",
      deployment: "Cloudflare Pages for frontend, Workers for APIs, preview deployments",
      auth: "OAuth, RBAC, admin role, API keys for integrations",
      risks: "Long-running imports, cache invalidation, schema migrations, provider failures",
      monitoring: "Application logs, uptime checks, basic metrics, no distributed tracing yet"
    },
    tags: ["architecture", "review", "scalability", "observability"]
  },
  {
    id: "priority-security-audit",
    slug: "engineering-and-ai-agent-security-audit-assistant",
    title: "Security Audit Assistant",
    domain: "Engineering & AI Agent",
    description: "Audit application security posture, auth, data exposure, dependencies, cloud risk, and compliance readiness.",
    inputSchema: {
      fields: [
        field("appType", "Application type", "text", true, "B2B SaaS dashboard"),
        field("auth", "Auth and roles", "textarea", true, "OAuth, admin role, user role, API keys"),
        field("dataTypes", "Sensitive data", "textarea", true, "Customer PII, billing data, access logs"),
        field("exposure", "Public exposure", "textarea", true, "Public forms, API endpoints, admin dashboard"),
        field("dependencies", "Dependencies", "textarea", false, "Next.js, Prisma, Stripe, auth provider, background jobs"),
        field("cloud", "Cloud/deployment", "text", true, "Cloudflare Pages, Workers, R2, D1"),
        field("compliance", "Compliance needs", "text", false, "SOC 2, GDPR, HIPAA, PCI"),
        field("knownRisks", "Known risks", "textarea", false, "Weak admin auth, missing rate limits, old dependencies")
      ]
    },
    outputSchema: commonOutputSchema,
    workflowSteps: ["Classify data and exposure.", "Check auth, dependency, cloud, and compliance signals.", "Score risk.", "Create mitigation checklist."],
    deterministicChecks: ["auth", "data-exposure", "dependencies", "cloud-controls", "compliance"],
    aiEnhancementPrompt: "Improve mitigation wording and sequencing. Do not invent vulnerabilities not supported by inputs.",
    scoringRules: [
      { key: "auth", label: "Auth and access", weight: 25, description: "Roles, MFA, API keys, session risk." },
      { key: "data", label: "Data exposure", weight: 25, description: "Sensitive data and public surfaces." },
      { key: "dependencies", label: "Dependency risk", weight: 15, description: "Third-party package and integration exposure." },
      { key: "cloud", label: "Cloud controls", weight: 20, description: "Secrets, storage, network, and deployment." },
      { key: "compliance", label: "Compliance readiness", weight: 15, description: "Policy and audit requirements." }
    ],
    exportFormats: ["markdown", "json", "csv", "html"],
    rendererType: "security-audit",
    sampleInput: {
      appType: "B2B SaaS dashboard",
      auth: "OAuth login, admin role, user role, service API keys, no enforced MFA yet",
      dataTypes: "Customer PII, billing metadata, usage logs, integration tokens",
      exposure: "Public marketing pages, authenticated dashboard, API endpoints, webhook receiver",
      dependencies: "Next.js, Prisma, Stripe, auth provider, background jobs",
      cloud: "Cloudflare Pages, Workers, R2, D1",
      compliance: "SOC 2, GDPR",
      knownRisks: "Missing rate limits on some endpoints, old dependencies, weak admin review process"
    },
    tags: ["security", "audit", "risk", "compliance"]
  },
  {
    id: "priority-research-planner",
    slug: "ai-research-experiment-planner",
    title: "AI Research Planner",
    domain: "AI Research",
    description: "Plan research questions, literature queries, experiment options, evaluation metrics, paper outline, and reproducibility checklist.",
    inputSchema: {
      fields: [
        field("topic", "Research topic", "text", true, "Small model reasoning evaluation"),
        field("hypothesis", "Hypothesis", "textarea", true, "Fine-tuned 7B models can match larger models on domain tasks"),
        field("constraints", "Constraints", "textarea", true, "Two GPUs, four weeks, limited labeled data"),
        field("availableData", "Available data", "textarea", true, "Internal QA pairs, public benchmark, domain docs"),
        field("targetVenue", "Target output or venue", "text", true, "Workshop paper, technical report, blog"),
        field("methods", "Candidate methods", "textarea", false, "SFT, RAG, LoRA, baseline prompting")
      ]
    },
    outputSchema: commonOutputSchema,
    workflowSteps: ["Make the hypothesis testable.", "Build literature search queries.", "Rank experiment options.", "Create metrics and reproducibility plan."],
    deterministicChecks: ["hypothesis", "constraints", "data-fit", "experiment-ranking", "metrics"],
    aiEnhancementPrompt: "Improve research framing and paper narrative only. Keep experiment ranking logic deterministic.",
    scoringRules: [
      { key: "question", label: "Question clarity", weight: 25, description: "Specific, falsifiable research question." },
      { key: "data", label: "Data readiness", weight: 20, description: "Data availability and fit." },
      { key: "feasibility", label: "Feasibility", weight: 25, description: "Methods vs constraints." },
      { key: "evaluation", label: "Evaluation quality", weight: 20, description: "Metrics, baselines, and ablations." },
      { key: "reproducibility", label: "Reproducibility", weight: 10, description: "Logging, seeds, artifacts." }
    ],
    exportFormats: ["markdown", "json", "csv", "html"],
    rendererType: "research-plan",
    sampleInput: {
      topic: "Small model reasoning evaluation",
      hypothesis: "Fine-tuned 7B models can match larger models on narrow domain reasoning tasks when retrieval context is controlled.",
      constraints: "Two GPUs, four weeks, limited labeled data, one engineer",
      availableData: "Internal QA pairs, public benchmark, domain docs, evaluation logs",
      targetVenue: "Workshop paper",
      methods: "SFT, RAG, LoRA, baseline prompting, ablation study"
    },
    tags: ["research", "experiments", "metrics", "paper"]
  },
  {
    id: "priority-board-memo",
    slug: "c-level-advisory-board-memo-generator",
    title: "C-Level Board Memo Builder",
    domain: "C-Level Advisory",
    description: "Create an executive memo, urgency score, risk profile, decision matrix, owner map, and 30/60/90-day plan.",
    inputSchema: {
      fields: [
        field("companyStage", "Company stage", "select", true, "Series A", ["Pre-seed", "Seed", "Series A", "Series B+", "Growth", "Enterprise"]),
        field("revenue", "Revenue", "text", true, "$1.2M ARR"),
        field("teamSize", "Team size", "number", true, "18"),
        field("runway", "Runway in months", "number", true, "9"),
        field("currentProblem", "Current problem", "textarea", true, "Pipeline slowing while burn remains high"),
        field("goal", "Leadership goal", "textarea", true, "Extend runway and return to efficient growth"),
        field("constraints", "Constraints", "textarea", false, "No major hiring, board wants a plan in two weeks")
      ]
    },
    outputSchema: commonOutputSchema,
    workflowSteps: ["Compute urgency and risk profile.", "Build decision matrix.", "Create executive memo.", "Assign owners and 30/60/90-day plan."],
    deterministicChecks: ["runway-risk", "team-scale", "decision-matrix", "owner-map", "90-day-plan"],
    aiEnhancementPrompt: "Improve board memo clarity and executive tone while preserving computed urgency and decision matrix.",
    scoringRules: [
      { key: "urgency", label: "Urgency", weight: 30, description: "Runway and severity of current problem." },
      { key: "execution", label: "Execution clarity", weight: 20, description: "Owners and operating cadence." },
      { key: "financial", label: "Financial risk", weight: 20, description: "Revenue, runway, and constraints." },
      { key: "decision", label: "Decision quality", weight: 20, description: "Options, tradeoffs, and recommendation." },
      { key: "communication", label: "Board readiness", weight: 10, description: "Memo structure and asks." }
    ],
    exportFormats: ["markdown", "json", "html"],
    rendererType: "executive-memo",
    sampleInput: {
      companyStage: "Series A",
      revenue: "$1.2M ARR",
      teamSize: "18",
      runway: "9",
      currentProblem: "Pipeline is slowing while burn remains high and sales cycle length is increasing.",
      goal: "Extend runway and return to efficient growth within two quarters.",
      constraints: "No major hiring, board wants a decision plan in two weeks, product team is mid-release."
    },
    tags: ["board", "memo", "strategy", "90-day-plan"]
  }
];

const priorityBySlug = new Map(priorityToolDefinitions.map((definition) => [definition.slug, definition]));
const priorityTitleMatchers = [
  [/technical seo audit/i, "seo-and-geo-technical-seo-audit"],
  [/(geo|aeo|ai search).*(optimizer|citation|visibility)/i, "seo-and-geo-ai-search-citation-optimizer"],
  [/campaign.*(builder|plan)|seo campaign builder/i, "marketing-seo-campaign-builder"],
  [/paid.*advertising.*audit|paid ads/i, "marketing-ads-multi-platform-paid-advertising-audit-and-optimization"],
  [/brand identity/i, "branding-and-design-brand-identity-generator"],
  [/design system/i, "branding-and-design-design-system-generator"],
  [/(architecture reviewer|architecture review|backend architecture)/i, "engineering-and-ai-agent-backend-architecture-reviewer"],
  [/security audit/i, "engineering-and-ai-agent-security-audit-assistant"],
  [/(research planner|experiment planner)/i, "ai-research-experiment-planner"],
  [/board memo/i, "c-level-advisory-board-memo-generator"]
] as const;

export function getPriorityToolDefinition(tool: Pick<NormalizedTool, "slug" | "title" | "domain">): ToolDefinition | undefined {
  const direct = priorityBySlug.get(tool.slug);
  if (direct) return direct;

  const label = `${tool.title} ${tool.slug} ${tool.domain}`;
  const match = priorityTitleMatchers.find(([pattern]) => pattern.test(label));
  return match ? priorityBySlug.get(match[1]) : undefined;
}

export function buildGenericToolDefinition(tool: Pick<NormalizedTool, "id" | "slug" | "title" | "domain" | "description" | "inputSchema" | "outputSchema" | "workflowSteps" | "sourceRepo" | "sourcePath" | "license" | "sampleInput" | "tags">): ToolDefinition {
  return {
    id: tool.id,
    slug: tool.slug,
    title: tool.title,
    domain: tool.domain,
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema?.sections?.length ? tool.outputSchema : commonOutputSchema,
    workflowSteps: tool.workflowSteps?.length ? tool.workflowSteps : ["Validate inputs.", "Run deterministic checks.", "Score the result.", "Create an action plan."],
    deterministicChecks: ["input-completeness", "specificity", "constraint-coverage", "evidence-quality", "actionability"],
    aiEnhancementPrompt: "Improve explanations only after deterministic checks are complete. Do not expose raw prompts to users.",
    scoringRules: [
      { key: "completeness", label: "Input completeness", weight: 30, description: "Required inputs are present." },
      { key: "specificity", label: "Specificity", weight: 25, description: "Inputs contain concrete details." },
      { key: "evidence", label: "Evidence quality", weight: 20, description: "Data, constraints, and examples are supplied." },
      { key: "workflow", label: "Workflow coverage", weight: 15, description: "Source workflow can be translated into steps." },
      { key: "actionability", label: "Actionability", weight: 10, description: "Output can drive next actions." }
    ],
    exportFormats: ["markdown", "json", "html"],
    rendererType: "workflow",
    sourceRepo: tool.sourceRepo,
    sourcePath: tool.sourcePath,
    license: tool.license,
    sampleInput: tool.sampleInput,
    tags: tool.tags
  };
}

export function resolveToolDefinition(tool: NormalizedTool): ToolDefinition {
  return getPriorityToolDefinition(tool) ?? buildGenericToolDefinition(tool);
}
