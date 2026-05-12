import type {
  ToolAnalysisSection,
  ToolChecklistItem,
  ToolDefinition,
  ToolIssue,
  ToolIssueSeverity,
  ToolMatrixRow,
  ToolRecommendation,
  ToolRunOutput,
  ToolScore,
  ToolScoreBreakdown,
  ToolTimelineItem
} from "./types";

type AnalysisResult = Pick<ToolRunOutput, "score" | "status" | "keyFindings" | "issues" | "recommendations" | "analysisSections" | "checklist" | "timeline" | "matrix">;

function text(input: Record<string, string>, key: string) {
  return String(input[key] ?? "").trim();
}

function number(input: Record<string, string>, key: string) {
  const value = Number(text(input, key).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function words(value: string) {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function contains(value: string, term: string) {
  const clean = term.trim().toLowerCase();
  return Boolean(clean && value.toLowerCase().includes(clean));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreStatus(value: number): ToolScore["status"] {
  if (value >= 85) return "excellent";
  if (value >= 70) return "good";
  if (value >= 50) return "warning";
  return "poor";
}

function clamp(value: number, max = 100) {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function makeScore(label: string, breakdown: ToolScoreBreakdown[]): ToolScore {
  const max = breakdown.reduce((sum, item) => sum + item.max, 0) || 100;
  const value = clamp((breakdown.reduce((sum, item) => sum + item.score, 0) / max) * 100);
  return { label, value, max: 100, status: scoreStatus(value), breakdown };
}

function issue(id: string, title: string, severity: ToolIssueSeverity, category: string, detail: string, fix: string, impact = 3, effort = 2): ToolIssue {
  return { id, title, severity, category, detail, fix, impact, effort };
}

function rec(id: string, title: string, impact: number, effort: number, rationale: string, nextStep: string): ToolRecommendation {
  const priority = impact >= 5 && effort <= 2 ? "P0" : impact >= 4 ? "P1" : impact >= 3 ? "P2" : "P3";
  return { id, title, priority, impact, effort, rationale, nextStep };
}

function checklist(items: string[], owner = "Owner"): ToolChecklistItem[] {
  return items.map((label, index) => ({ id: `check-${index + 1}`, label, owner, status: "todo" }));
}

function tableSection(key: string, title: string, columns: string[], rows: Array<Array<string | number>>): ToolAnalysisSection {
  return { key, title, type: "table", table: { columns, rows } };
}

function listSection(key: string, title: string, items: string[]): ToolAnalysisSection {
  return { key, title, type: "list", items };
}

function codeSection(key: string, title: string, content: string): ToolAnalysisSection {
  return { key, title, type: "code", content };
}

function baseResult(definition: ToolDefinition, input: Record<string, string>, breakdown: ToolScoreBreakdown[], issues: ToolIssue[], sections: ToolAnalysisSection[], checklistItems: ToolChecklistItem[], timeline?: ToolTimelineItem[], matrix?: ToolMatrixRow[]): AnalysisResult {
  const score = makeScore(definition.title, breakdown);
  const recommendations = issues
    .slice()
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0) || (a.effort ?? 0) - (b.effort ?? 0))
    .slice(0, 8)
    .map((item, index) => rec(`rec-${index + 1}`, item.fix, item.impact ?? 3, item.effort ?? 2, item.detail, item.fix));

  if (!recommendations.length) {
    recommendations.push(rec("rec-1", "Keep the current workflow and monitor for regressions", 3, 1, "No blocking issues were detected from the supplied inputs.", "Schedule the next review after new data is available."));
  }

  return {
    score,
    status: score.status,
    keyFindings: issues.length
      ? issues.slice(0, 4).map((item) => `${item.severity.toUpperCase()}: ${item.title}`)
      : [`${definition.title} passed the core deterministic checks.`],
    issues,
    recommendations,
    analysisSections: sections,
    checklist: checklistItems,
    timeline,
    matrix
  };
}

function technicalSeo(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const pageTitle = text(input, "pageTitle");
  const meta = text(input, "metaDescription");
  const headings = text(input, "headings");
  const content = text(input, "content");
  const keyword = text(input, "targetKeyword");
  const canonical = text(input, "canonicalUrl");
  const schema = text(input, "schemaMarkup");
  const robots = text(input, "robotsSetting").toLowerCase();
  const titleLen = pageTitle.length;
  const metaLen = meta.length;
  const contentWords = words(content).length;
  const h1Count = (headings.match(/\bh1\s*:/gi) ?? []).length;
  const h2Count = (headings.match(/\bh2\s*:/gi) ?? []).length;
  const foundIssues: ToolIssue[] = [];

  if (titleLen < 30 || titleLen > 65) foundIssues.push(issue("seo-title", "Title length is outside the ideal 30-65 character range", "medium", "Metadata", `${titleLen} characters detected.`, "Rewrite the title to 45-60 characters with the target keyword near the front.", 4, 2));
  if (metaLen < 120 || metaLen > 165) foundIssues.push(issue("seo-meta", "Meta description length is weak", "medium", "Metadata", `${metaLen} characters detected.`, "Rewrite the meta description to 140-160 characters with a clear benefit and keyword.", 4, 2));
  if (!contains(pageTitle, keyword)) foundIssues.push(issue("seo-title-keyword", "Target keyword missing from title", "high", "Relevance", `Keyword '${keyword}' was not found in the title.`, "Add the target keyword naturally to the page title.", 5, 1));
  if (!contains(meta, keyword)) foundIssues.push(issue("seo-meta-keyword", "Target keyword missing from meta description", "medium", "Relevance", `Keyword '${keyword}' was not found in the meta description.`, "Add the keyword or a close variant to the meta description.", 3, 1));
  if (h1Count !== 1) foundIssues.push(issue("seo-h1", "Page should have exactly one H1", "high", "Heading structure", `${h1Count} H1 headings detected.`, "Use one descriptive H1 and demote duplicate H1s to H2/H3.", 5, 2));
  if (h2Count < 2) foundIssues.push(issue("seo-h2", "Page needs more section structure", "low", "Heading structure", `${h2Count} H2 headings detected.`, "Add H2s for major search intent sections and FAQs.", 2, 2));
  if (contentWords < 300) foundIssues.push(issue("seo-content", "Content is too thin for competitive organic search", "high", "Content depth", `${contentWords} words detected.`, "Expand the page with evidence, FAQs, process, examples, and comparison details.", 5, 3));
  if (robots.includes("noindex") || robots.includes("blocked")) foundIssues.push(issue("seo-robots", "Indexing is blocked or disabled", "critical", "Indexability", `Robots setting: ${robots}.`, "Change robots to index, follow unless this page should be excluded.", 5, 1));
  if (!canonical) foundIssues.push(issue("seo-canonical", "Canonical URL is missing", "medium", "Indexability", "No canonical URL supplied.", "Set a self-referencing canonical URL for the primary page.", 3, 1));
  if (!schema) foundIssues.push(issue("seo-schema", "Schema markup is missing", "medium", "Structured data", "No schema markup supplied.", "Add Service, Article, Product, FAQ, or Organization JSON-LD as appropriate.", 3, 2));

  const breakdown = [
    { key: "metadata", label: "Metadata", score: (titleLen >= 30 && titleLen <= 65 ? 10 : 4) + (metaLen >= 120 && metaLen <= 165 ? 10 : 4), max: 20, detail: `Title ${titleLen} chars, meta ${metaLen} chars.` },
    { key: "indexability", label: "Indexability", score: (!robots.includes("noindex") && !robots.includes("blocked") ? 12 : 0) + (canonical ? 8 : 0), max: 20, detail: `Robots: ${robots || "unknown"}, canonical: ${canonical ? "present" : "missing"}.` },
    { key: "content", label: "Content relevance", score: (contains(content, keyword) ? 10 : 3) + (contentWords >= 300 ? 10 : 3) + (contains(meta, keyword) ? 5 : 1), max: 25, detail: `${contentWords} words; keyword ${contains(content, keyword) ? "found" : "not found"} in content.` },
    { key: "structure", label: "Structure", score: (h1Count === 1 ? 12 : 4) + (h2Count >= 2 ? 8 : 2), max: 20, detail: `${h1Count} H1 and ${h2Count} H2 headings.` },
    { key: "schema", label: "Schema", score: schema ? 15 : 0, max: 15, detail: schema ? "Structured data supplied." : "No structured data supplied." }
  ];

  const schemaDraft = `{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "${pageTitle || "Primary service"}",
  "url": "${text(input, "url")}",
  "description": "${meta.replaceAll('"', "'")}"
}`;

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("seo-signals", "SEO signal dashboard", ["Signal", "Value"], [["Title length", titleLen], ["Meta length", metaLen], ["Word count", contentWords], ["H1 count", h1Count], ["H2 count", h2Count], ["Robots", robots || "unknown"], ["Canonical", canonical || "missing"]]),
    codeSection("schema-draft", "Recommended JSON-LD draft", schemaDraft),
    listSection("metadata", "Metadata suggestions", [`Title: ${keyword ? `${keyword} | ${pageTitle.replace(new RegExp(escapeRegExp(keyword), "i"), "").trim() || "Brand"}` : pageTitle}`, `Meta: ${metaLen >= 120 && metaLen <= 165 ? meta : `Rewrite to 140-160 characters around ${keyword || "the primary query"}.`}`])
  ], checklist(["Fix critical indexability issues.", "Rewrite title and meta where flagged.", "Normalize heading hierarchy.", "Add schema JSON-LD.", "Re-crawl and validate the page after publishing."]));
}

function geoOptimizer(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const content = text(input, "content");
  const questions = text(input, "targetQuestions").split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const entities = text(input, "entityTerms").split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
  const citations = text(input, "citations").split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const schema = text(input, "schemaMarkup");
  const foundIssues: ToolIssue[] = [];
  const answered = questions.filter((question) => contains(content, question.split(/\s+/).slice(0, 4).join(" "))).length;
  const entityHits = entities.filter((entity) => contains(content, entity)).length;

  if (questions.length && answered / questions.length < 0.5) foundIssues.push(issue("geo-answers", "Most target questions do not have direct answer blocks", "high", "Answer coverage", `${answered}/${questions.length} questions appear directly answered.`, "Add concise answer paragraphs under each target question.", 5, 2));
  if (citations.length < 2) foundIssues.push(issue("geo-citations", "Citation support is thin", "high", "Citations", `${citations.length} citations supplied.`, "Add at least 3 source-backed facts or citations.", 5, 2));
  if (entities.length && entityHits / entities.length < 0.6) foundIssues.push(issue("geo-entities", "Entity coverage is incomplete", "medium", "Entities", `${entityHits}/${entities.length} target entities found in content.`, "Add missing entities with context and relationships.", 4, 2));
  if (!schema) foundIssues.push(issue("geo-schema", "Schema is missing for answer extraction", "medium", "Schema", "No structured data supplied.", "Add FAQPage, Article, Organization, Product, or HowTo JSON-LD.", 3, 2));
  if (!/^\s*(what|how|why|when|where|who|which)/im.test(content)) foundIssues.push(issue("geo-format", "Content lacks explicit question-answer formatting", "low", "Extractability", "No clear Q&A sections detected.", "Add FAQ blocks and concise answer snippets.", 2, 2));

  const breakdown = [
    { key: "answers", label: "Answer coverage", score: questions.length ? Math.round((answered / questions.length) * 30) : 10, max: 30, detail: `${answered}/${questions.length || 1} target questions covered.` },
    { key: "citations", label: "Citation readiness", score: Math.min(25, citations.length * 8), max: 25, detail: `${citations.length} citations supplied.` },
    { key: "entities", label: "Entity coverage", score: entities.length ? Math.round((entityHits / entities.length) * 20) : 8, max: 20, detail: `${entityHits}/${entities.length || 1} entities found.` },
    { key: "schema", label: "Schema readiness", score: schema ? 15 : 0, max: 15, detail: schema ? "Schema supplied." : "Schema missing." },
    { key: "format", label: "Extractability", score: /(\n-|\n\d+\.|\|)/.test(content) ? 10 : 4, max: 10, detail: "Checks for lists, tables, and compact snippets." }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("geo-coverage", "AI answer readiness", ["Metric", "Value"], [["Questions covered", `${answered}/${questions.length}`], ["Entity hits", `${entityHits}/${entities.length}`], ["Citations", citations.length], ["Schema", schema ? "present" : "missing"]]),
    listSection("snippet-plan", "Answer snippet plan", questions.slice(0, 6).map((question) => `Create a 40-70 word direct answer for: ${question}`))
  ], checklist(["Add direct answer blocks for priority questions.", "Attach source-backed facts to claims.", "Add schema JSON-LD.", "Add entity definitions and relationships.", "Re-test content in target AI search surfaces."]));
}

function campaignBuilder(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const budget = number(input, "budget");
  const duration = Math.max(1, number(input, "duration"));
  const channels = text(input, "channels").split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
  const goal = text(input, "goal") || "Pipeline";
  const foundIssues: ToolIssue[] = [];
  if (budget < 1000) foundIssues.push(issue("campaign-budget", "Budget may be too low for multi-channel learning", "medium", "Budget", `$${budget} budget detected.`, "Start with one primary paid channel plus owned channels until spend increases.", 4, 1));
  if (channels.length < 2) foundIssues.push(issue("campaign-channel", "Campaign needs at least two channels", "medium", "Channel mix", `${channels.length} channel supplied.`, "Use one acquisition channel and one nurture/retention channel.", 3, 1));
  if (!text(input, "offer")) foundIssues.push(issue("campaign-offer", "Offer is missing", "high", "Positioning", "No offer supplied.", "Define one measurable offer before launch.", 5, 1));

  const paidChannels = channels.filter((item) => /ads|google|meta|linkedin|tiktok|paid/i.test(item));
  const ownedChannels = channels.filter((item) => /email|seo|organic|webinar|content/i.test(item));
  const paidShare = paidChannels.length ? 0.55 : 0.25;
  const budgetRows = channels.map((channel, index) => {
    const isPaid = paidChannels.includes(channel);
    const pool = isPaid ? budget * paidShare : budget * (1 - paidShare);
    const count = isPaid ? paidChannels.length || 1 : channels.length - paidChannels.length || 1;
    return [channel, `$${Math.round(pool / count).toLocaleString()}`, index < 2 ? "Acquisition" : "Nurture"];
  });
  const timeline = [
    { period: "Week 1", title: "Foundation", actions: ["Finalize offer and tracking.", "Build landing page and first creative set."] },
    { period: "Week 2", title: "Launch tests", actions: ["Launch first channel batch.", "Review early CTR, CVR, and lead quality."] },
    { period: "Week 3", title: "Optimize", actions: ["Pause weak hooks.", "Move budget to best audience/offer pair."] },
    { period: "Week 4", title: "Scale or learn", actions: ["Scale the winning channel.", "Write learning memo and next test backlog."] }
  ].slice(0, Math.max(1, Math.ceil(duration / 7)));

  const breakdown = [
    { key: "positioning", label: "Positioning completeness", score: ["product", "audience", "price", "offer", "goal"].filter((key) => text(input, key)).length * 5, max: 25, detail: "Checks product, audience, price, offer, and goal." },
    { key: "channelFit", label: "Channel fit", score: Math.min(25, channels.length * 7 + ownedChannels.length * 3), max: 25, detail: `${channels.length} channels supplied.` },
    { key: "budget", label: "Budget feasibility", score: budget >= 5000 ? 20 : budget >= 1000 ? 12 : 6, max: 20, detail: `$${budget.toLocaleString()} over ${duration} days.` },
    { key: "measurement", label: "Measurement readiness", score: goal ? 15 : 5, max: 15, detail: `Goal: ${goal}.` },
    { key: "execution", label: "Execution plan", score: duration >= 14 ? 15 : 8, max: 15, detail: `${duration}-day timeline.` }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("budget", "Channel budget allocation", ["Channel", "Budget", "Funnel stage"], budgetRows),
    tableSection("kpis", "KPI targets", ["Metric", "Target"], [["Primary goal", goal], ["Daily budget", `$${Math.round(budget / duration).toLocaleString()}`], ["Qualified lead target", Math.max(10, Math.round(budget / 250))], ["Review cadence", "Twice weekly"]]),
    tableSection("ad-angles", "Ad angle matrix", ["Angle", "Hook", "Proof"], [["Pain", `Stop losing ${text(input, "audience") || "buyers"} to unclear positioning`, "Problem-aware proof"], ["Outcome", `Reach ${goal.toLowerCase()} faster with ${text(input, "product")}`, "Metric or case study"], ["Risk reversal", `${text(input, "offer") || "Low-friction offer"}`, "Guarantee, trial, or demo"]])
  ], checklist(["Confirm tracking and UTMs.", "Publish focused landing page.", "Launch first creative set.", "Review lead quality within 72 hours.", "Move spend to winning channel."], "Marketing"), timeline);
}

function paidAds(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const spend = number(input, "monthlySpend");
  const ctr = number(input, "ctr");
  const cvr = number(input, "conversionRate");
  const cpa = number(input, "cpa");
  const roas = number(input, "roas");
  const landing = number(input, "landingPageConversion");
  const tracking = text(input, "trackingStatus");
  const creativeCount = number(input, "creativeCount");
  const foundIssues: ToolIssue[] = [];
  if (ctr < 1) foundIssues.push(issue("ads-ctr", "CTR is below a healthy benchmark", "medium", "Creative", `${ctr}% CTR supplied.`, "Refresh hooks, tighten audience, and test clearer first-frame/value proposition.", 4, 2));
  if (cvr < 2) foundIssues.push(issue("ads-cvr", "Conversion rate is low", "high", "Conversion", `${cvr}% CVR supplied.`, "Audit landing page message match, form friction, proof, and offer clarity.", 5, 3));
  if (/partial|broken|unknown/i.test(tracking)) foundIssues.push(issue("ads-tracking", "Tracking is not reliable", "critical", "Measurement", `Tracking status: ${tracking}.`, "Fix pixels, conversion events, UTMs, offline imports, and attribution before scaling.", 5, 2));
  if (creativeCount < 6) foundIssues.push(issue("ads-creative", "Creative volume is too low for learning", "medium", "Creative", `${creativeCount} active creatives.`, "Run at least 6-10 active variants across hooks and formats.", 3, 2));
  if (roas && roas < 1.5) foundIssues.push(issue("ads-roas", "ROAS is below scaling threshold", "high", "Efficiency", `${roas} ROAS supplied.`, "Pause weak segments and focus spend on highest-intent audiences.", 5, 2));

  const breakdown = [
    { key: "efficiency", label: "Media efficiency", score: (ctr >= 1.5 ? 10 : 5) + (cvr >= 3 ? 10 : 4) + (cpa > 0 && spend / cpa >= 10 ? 8 : 4) + (roas >= 2 ? 7 : 3), max: 35, detail: `CTR ${ctr}%, CVR ${cvr}%, CPA ${cpa}, ROAS ${roas || "n/a"}.` },
    { key: "tracking", label: "Tracking health", score: /complete/i.test(tracking) ? 25 : /partial/i.test(tracking) ? 12 : 4, max: 25, detail: tracking || "unknown" },
    { key: "creative", label: "Creative coverage", score: creativeCount >= 10 ? 20 : creativeCount >= 6 ? 14 : 6, max: 20, detail: `${creativeCount} creatives.` },
    { key: "landing", label: "Landing conversion", score: landing >= 5 ? 20 : landing >= 2 ? 12 : 6, max: 20, detail: `${landing || 0}% landing conversion.` }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("ads-kpis", "Paid ads KPI dashboard", ["Metric", "Value"], [["Monthly spend", `$${spend.toLocaleString()}`], ["CTR", `${ctr}%`], ["CVR", `${cvr}%`], ["CPA", `$${cpa}`], ["ROAS", roas || "n/a"], ["Tracking", tracking], ["Creative count", creativeCount]]),
    tableSection("waste", "Optimization queue", ["Area", "Action"], [["Tracking", "Fix measurement before scaling."], ["Creative", "Test new hooks and formats."], ["Landing page", "Improve message match and proof."], ["Budget", "Shift spend to segments above target CPA."]])
  ], checklist(["Fix tracking gaps.", "Pause high-CPA ad sets.", "Launch 6 new creative variants.", "Audit landing page form and proof.", "Review budget allocation every 72 hours."], "Growth"));
}

function brandIdentity(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const personality = text(input, "personality").toLowerCase();
  const archetype = /trust|safe|reliable|foundation/.test(personality) ? "Sage/Caregiver" : /bold|rebel|disrupt/.test(personality) ? "Hero/Rebel" : /premium|luxury|exclusive/.test(personality) ? "Ruler" : "Creator";
  const competitors = text(input, "competitors");
  const foundIssues: ToolIssue[] = [];
  if (!competitors) foundIssues.push(issue("brand-competitors", "Competitor contrast is missing", "medium", "Positioning", "No competitors supplied.", "Add 3-5 competitor references and define what the brand must avoid.", 3, 1));
  if (words(text(input, "positioning")).length < 8) foundIssues.push(issue("brand-positioning", "Positioning is too thin", "high", "Positioning", "Positioning statement lacks detail.", "Write category, audience, benefit, and proof in one paragraph.", 5, 2));

  const breakdown = [
    { key: "positioning", label: "Positioning clarity", score: Math.min(30, words(text(input, "positioning")).length * 2), max: 30, detail: "Checks category, audience, benefit, and proof." },
    { key: "differentiation", label: "Differentiation", score: competitors ? 20 : 8, max: 20, detail: competitors ? "Competitors supplied." : "No competitor contrast." },
    { key: "tone", label: "Tone usability", score: personality ? 20 : 6, max: 20, detail: personality || "No personality inputs." },
    { key: "visual", label: "Visual coherence", score: text(input, "visualPreferences") ? 20 : 8, max: 20, detail: text(input, "visualPreferences") || "No visual preferences." },
    { key: "system", label: "System readiness", score: 7, max: 10, detail: "Base system generated from deterministic archetype." }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("brand-kit", "Brand kit", ["Element", "Recommendation"], [["Archetype", archetype], ["Tone", "Clear, specific, proof-led, and consistent across support and sales."], ["Color direction", "Primary deep neutral, one trust accent, one action accent, accessible contrast."], ["Typography", "Humanist sans for UI, confident display weight for hero moments."], ["Logo direction", "Simple symbol plus wordmark, scalable at favicon size."]]),
    tableSection("tokens", "Starter design tokens", ["Token", "Value"], [["radius", "8px"], ["primary", "#7c3aed"], ["success", "#10b981"], ["surface", "#0f172a"], ["text", "#f8fafc"]]),
    listSection("hero", "Sample landing hero", [`Headline: ${text(input, "businessName")}`, `Subhead: ${text(input, "positioning")}`, "CTA: Start assessment", "Proof: Show one metric, partner, or trust marker."])
  ], checklist(["Validate archetype with stakeholders.", "Choose accessible color tokens.", "Create logo exploration brief.", "Write voice examples for sales/support/product.", "Apply the system to one landing page and one dashboard view."], "Brand"));
}

function designSystem(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const components = text(input, "components").split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
  const states = text(input, "states").split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
  const colors = text(input, "brandColors").split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
  const foundIssues: ToolIssue[] = [];
  if (components.length < 6) foundIssues.push(issue("ds-components", "Core component coverage is incomplete", "medium", "Components", `${components.length} components supplied.`, "Add forms, tables, navigation, feedback, overlays, and empty states.", 4, 2));
  if (!states.some((state) => /focus/i.test(state))) foundIssues.push(issue("ds-focus", "Focus state is missing", "high", "Accessibility", "No focus state supplied.", "Define visible focus rings for all interactive components.", 5, 1));
  if (colors.length < 3) foundIssues.push(issue("ds-colors", "Color token set is too small", "medium", "Tokens", `${colors.length} colors supplied.`, "Define background, surface, text, border, primary, success, warning, danger tokens.", 3, 2));

  const breakdown = [
    { key: "tokens", label: "Token coverage", score: Math.min(25, colors.length * 5 + (text(input, "tokens") ? 5 : 0)), max: 25, detail: `${colors.length} color tokens plus existing token notes.` },
    { key: "components", label: "Component coverage", score: Math.min(25, components.length * 4), max: 25, detail: `${components.length} components supplied.` },
    { key: "states", label: "State coverage", score: Math.min(20, states.length * 4), max: 20, detail: `${states.length} states supplied.` },
    { key: "a11y", label: "Accessibility readiness", score: /aa|aaa/i.test(text(input, "accessibilityTarget")) ? 20 : 10, max: 20, detail: text(input, "accessibilityTarget") },
    { key: "implementation", label: "Implementation clarity", score: text(input, "density") ? 10 : 4, max: 10, detail: `Density: ${text(input, "density") || "not specified"}.` }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("tokens", "Design tokens", ["Token", "Value"], [["radius.card", "8px"], ["space.1", "4px"], ["space.2", "8px"], ["space.3", "12px"], ["color.primary", colors[0] || "#7c3aed"], ["color.success", colors[1] || "#10b981"], ["density", text(input, "density") || "Compact"]]),
    tableSection("component-map", "Component coverage map", ["Component", "Required states"], components.slice(0, 12).map((component) => [component, states.join(", ") || "default, hover, focus, disabled"])),
    listSection("rules", "Implementation rules", ["Use 8px or smaller radius for operational UI.", "Never nest cards inside cards.", "Every input needs label, helper/error, disabled, focus, and loading states.", "Contrast target must match the selected accessibility target."])
  ], checklist(["Approve token names.", "Build buttons and inputs first.", "Add table, modal, toast, and empty states.", "Run contrast checks.", "Document usage rules with examples."], "Design"));
}

function architectureReview(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const arch = text(input, "architecture");
  const auth = text(input, "auth");
  const monitoring = text(input, "monitoring");
  const risks = text(input, "risks");
  const foundIssues: ToolIssue[] = [];
  if (!/queue|worker|job|async/i.test(arch)) foundIssues.push(issue("arch-queue", "No async processing boundary detected", "medium", "Scalability", "Architecture does not mention queues or background jobs.", "Add a queue/worker boundary for slow, retryable, or bursty workloads.", 4, 3));
  if (!/rbac|role|permission|mfa|oauth|sso/i.test(auth)) foundIssues.push(issue("arch-auth", "Auth model lacks role or permission detail", "high", "Security", auth || "No auth details.", "Document roles, permissions, MFA/SSO, and admin boundaries.", 5, 2));
  if (!monitoring) foundIssues.push(issue("arch-observability", "Observability plan is missing", "high", "Observability", "No monitoring supplied.", "Add logs, metrics, traces, alerts, and dashboards for core flows.", 5, 2));
  if (/migration|database|data/i.test(risks) && !/rollback|backup/i.test(arch + risks)) foundIssues.push(issue("arch-migration", "Migration rollback plan is unclear", "medium", "Deployment", "Database risk mentioned without rollback details.", "Add backup, rollback, and migration verification steps.", 4, 2));

  const breakdown = [
    { key: "scalability", label: "Scalability", score: /cache|queue|worker|cdn|replica/i.test(arch) ? 25 : 12, max: 25, detail: "Checks caching, queues, workers, CDN, and replicas." },
    { key: "security", label: "Security", score: /rbac|role|permission|mfa|oauth|sso/i.test(auth) ? 25 : 10, max: 25, detail: auth || "No auth detail." },
    { key: "maintainability", label: "Maintainability", score: /service|module|api|contract/i.test(arch) ? 20 : 10, max: 20, detail: "Checks module and contract clarity." },
    { key: "observability", label: "Observability", score: monitoring ? 15 : 3, max: 15, detail: monitoring || "Missing." },
    { key: "deployment", label: "Deployment safety", score: /rollback|migration|staging|canary|flag/i.test(text(input, "deployment") + arch) ? 15 : 7, max: 15, detail: text(input, "deployment") }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("risk-register", "Risk register", ["Risk", "Severity", "Mitigation"], foundIssues.map((item) => [item.title, item.severity, item.fix])),
    tableSection("category-scores", "Architecture category scores", ["Category", "Score"], breakdown.map((item) => [item.label, `${item.score}/${item.max}`])),
    listSection("roadmap", "Implementation roadmap", ["Document interfaces and data contracts.", "Add permission matrix.", "Add observability to core flows.", "Add rollback and migration playbook.", "Load-test the highest-risk path."])
  ], checklist(["Review auth and permissions.", "Add metrics/logs/traces.", "Create migration rollback plan.", "Load test peak path.", "Write implementation tickets for top risks."], "Engineering"));
}

function securityAudit(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const all = Object.values(input).join(" ").toLowerCase();
  const foundIssues: ToolIssue[] = [];
  if (!/mfa|2fa|sso|oauth/i.test(text(input, "auth"))) foundIssues.push(issue("sec-mfa", "MFA/SSO is not described", "high", "Auth", "Auth input lacks MFA/SSO detail.", "Require MFA for admins and SSO/OAuth for privileged access.", 5, 2));
  if (/pii|billing|payment|health|customer/i.test(text(input, "dataTypes")) && !/encrypt|token|mask|redact/i.test(all)) foundIssues.push(issue("sec-data", "Sensitive data controls are unclear", "critical", "Data protection", "Sensitive data is present without encryption/redaction controls.", "Define encryption, retention, redaction, access logs, and data minimization.", 5, 3));
  if (!/rate|waf|captcha|limit/i.test(text(input, "exposure"))) foundIssues.push(issue("sec-abuse", "Abuse protection is missing from public surfaces", "medium", "Exposure", "Public exposure exists without rate limits or WAF notes.", "Add rate limits, bot checks, WAF rules, and abuse monitoring.", 4, 2));
  if (!text(input, "dependencies")) foundIssues.push(issue("sec-deps", "Dependency inventory is missing", "medium", "Dependencies", "No dependency list supplied.", "Inventory dependencies and run vulnerability scanning.", 3, 2));
  if (text(input, "compliance") && !/audit|policy|log|retention/i.test(all)) foundIssues.push(issue("sec-compliance", "Compliance evidence is thin", "medium", "Compliance", `${text(input, "compliance")} mentioned without evidence controls.`, "Add audit logs, retention policy, access review, and incident response docs.", 4, 3));

  const breakdown = [
    { key: "auth", label: "Auth and access", score: /mfa|2fa|sso|oauth|rbac|role/i.test(text(input, "auth")) ? 25 : 10, max: 25, detail: text(input, "auth") },
    { key: "data", label: "Data exposure", score: /encrypt|token|mask|redact|retention/i.test(all) ? 25 : 8, max: 25, detail: text(input, "dataTypes") },
    { key: "dependencies", label: "Dependency risk", score: text(input, "dependencies") ? 15 : 4, max: 15, detail: text(input, "dependencies") || "Missing." },
    { key: "cloud", label: "Cloud controls", score: /secret|iam|r2|worker|cloudflare|aws|gcp/i.test(text(input, "cloud") + all) ? 20 : 8, max: 20, detail: text(input, "cloud") },
    { key: "compliance", label: "Compliance readiness", score: text(input, "compliance") ? 10 : 7, max: 15, detail: text(input, "compliance") || "No compliance target." }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("security-register", "Security risk register", ["Risk", "Severity", "Fix"], foundIssues.map((item) => [item.title, item.severity, item.fix])),
    listSection("controls", "Recommended controls", ["Admin MFA/SSO", "Rate limits on public endpoints", "Secrets rotation", "Dependency scanning", "Audit logs for sensitive actions", "Incident response runbook"])
  ], checklist(["Require MFA for privileged roles.", "Inventory sensitive data.", "Add rate limits and WAF rules.", "Run dependency scanning.", "Document incident response and access reviews."], "Security"));
}

function researchPlanner(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const constraints = text(input, "constraints");
  const data = text(input, "availableData");
  const methods = text(input, "methods").split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
  const foundIssues: ToolIssue[] = [];
  if (!/\b(compare|improve|reduce|increase|outperform|measure|test)\b/i.test(text(input, "hypothesis"))) foundIssues.push(issue("research-hypothesis", "Hypothesis is not clearly testable", "high", "Research question", "Hypothesis lacks measurable direction.", "Rewrite as a falsifiable claim with baseline and metric.", 5, 2));
  if (!data) foundIssues.push(issue("research-data", "Available data is missing", "critical", "Data", "No data supplied.", "Identify datasets, splits, labels, and access constraints.", 5, 3));
  if (!methods.length) foundIssues.push(issue("research-methods", "Candidate methods are missing", "medium", "Methods", "No methods supplied.", "List baseline, proposed method, ablation, and fallback method.", 3, 2));

  const experimentOptions = (methods.length ? methods : ["Baseline prompting", "RAG", "LoRA fine-tuning", "Ablation study"]).map((method, index) => ({
    option: method,
    score: clamp(90 - index * 10 - (/limited|two|small|low/i.test(constraints) && /fine|train|large/i.test(method) ? 20 : 0)),
    rationale: "Ranked by feasibility against constraints and data readiness.",
    recommendation: index === 0 ? "Run first as baseline." : "Run after baseline if resources remain."
  }));
  const breakdown = [
    { key: "question", label: "Question clarity", score: text(input, "hypothesis").length > 40 ? 25 : 12, max: 25, detail: text(input, "hypothesis") },
    { key: "data", label: "Data readiness", score: data ? 20 : 0, max: 20, detail: data || "Missing." },
    { key: "feasibility", label: "Feasibility", score: constraints ? 20 : 10, max: 25, detail: constraints || "No constraints." },
    { key: "evaluation", label: "Evaluation quality", score: 12, max: 20, detail: "Baseline metrics generated from topic and target output." },
    { key: "reproducibility", label: "Reproducibility", score: 6, max: 10, detail: "Checklist generated." }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    listSection("queries", "Literature search queries", [`"${text(input, "topic")}" benchmark`, `"${text(input, "topic")}" evaluation metrics`, `"${text(input, "hypothesis").slice(0, 70)}"`, `${text(input, "targetVenue")} related work ${text(input, "topic")}`]),
    tableSection("metrics", "Evaluation metrics", ["Metric", "Purpose"], [["Primary task metric", "Measures target outcome."], ["Baseline delta", "Compares against simplest method."], ["Cost/latency", "Captures practical tradeoff."], ["Failure cases", "Qualitative error analysis."]]),
    listSection("outline", "Paper outline", ["Abstract", "Introduction and claim", "Related work", "Method", "Experimental setup", "Results", "Limitations", "Reproducibility appendix"])
  ], checklist(["Lock the research question.", "Run baseline before new methods.", "Version datasets and configs.", "Track seeds and negative results.", "Write results against the paper outline."], "Research"), undefined, experimentOptions);
}

function boardMemo(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const runway = number(input, "runway");
  const teamSize = number(input, "teamSize");
  const problem = text(input, "currentProblem");
  const foundIssues: ToolIssue[] = [];
  if (runway && runway < 6) foundIssues.push(issue("board-runway", "Runway is critical", "critical", "Financial risk", `${runway} months runway supplied.`, "Freeze nonessential spend and approve a 30-day runway extension plan.", 5, 2));
  else if (runway < 12) foundIssues.push(issue("board-runway-watch", "Runway requires board attention", "high", "Financial risk", `${runway} months runway supplied.`, "Create a 60-day plan to improve burn multiple or revenue quality.", 4, 2));
  if (teamSize > 0 && runway < 12) foundIssues.push(issue("board-team", "Team size and runway create execution pressure", "medium", "People", `${teamSize} people and ${runway} months runway.`, "Assign owners to revenue, cost, product, and customer retention workstreams.", 4, 2));
  if (!/customer|revenue|pipeline|burn|retention|churn|margin/i.test(problem)) foundIssues.push(issue("board-problem", "Problem statement may be too broad for board action", "medium", "Decision quality", problem || "Missing problem.", "Rewrite the problem in financial, customer, or operating metric terms.", 3, 1));

  const options: ToolMatrixRow[] = [
    { option: "Do nothing", score: runway < 12 ? 20 : 45, rationale: "Preserves focus but does not reduce current risk.", recommendation: "Reject unless problem is already trending down." },
    { option: "Focused 30-day intervention", score: 85, rationale: "Fastest way to create evidence while limiting disruption.", recommendation: "Recommended default." },
    { option: "Large strategic pivot", score: runway < 6 ? 35 : 60, rationale: "May be necessary but carries execution and morale risk.", recommendation: "Use only if current strategy is clearly failing." }
  ];
  const breakdown = [
    { key: "urgency", label: "Urgency", score: runway < 6 ? 30 : runway < 12 ? 22 : 12, max: 30, detail: `${runway} months runway.` },
    { key: "execution", label: "Execution clarity", score: text(input, "goal").length > 25 ? 18 : 8, max: 20, detail: text(input, "goal") },
    { key: "financial", label: "Financial risk", score: text(input, "revenue") ? 15 : 6, max: 20, detail: text(input, "revenue") },
    { key: "decision", label: "Decision quality", score: problem.length > 30 ? 16 : 8, max: 20, detail: problem },
    { key: "communication", label: "Board readiness", score: 8, max: 10, detail: "Memo structure generated." }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("memo", "Executive memo", ["Section", "Content"], [["Decision needed", text(input, "goal")], ["Current state", problem], ["Recommendation", "Approve a focused 30-day intervention with named owners and weekly board updates."], ["Board ask", "Approve owner map, metric targets, and constraints."]]),
    tableSection("owners", "Owner map", ["Workstream", "Owner role"], [["Revenue", "CEO / Growth lead"], ["Product", "CPO / Product lead"], ["Finance", "CFO / Ops"], ["People", "COO / People lead"]])
  ], checklist(["Approve the recommended option.", "Assign owner roles.", "Set weekly operating metrics.", "Prepare board update template.", "Review progress at 30/60/90 days."], "CEO"), [
    { period: "30 days", title: "Stabilize", actions: ["Freeze low-return work.", "Pick one revenue or risk metric.", "Start weekly operating review."] },
    { period: "60 days", title: "Improve", actions: ["Scale the working intervention.", "Cut or pause failing workstreams.", "Update board on evidence."] },
    { period: "90 days", title: "Decide", actions: ["Choose continue, pivot, or fundraising/cost action.", "Document next operating plan."] }
  ], options);
}

function genericWorkflow(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  const fields = definition.inputSchema.fields;
  const filled = fields.filter((field) => text(input, field.name)).length;
  const required = fields.filter((field) => field.required);
  const missingRequired = required.filter((field) => !text(input, field.name));
  const longInputs = fields.filter((field) => words(text(input, field.name)).length >= 8).length;
  const foundIssues = missingRequired.map((field) => issue(`missing-${field.name}`, `${field.label} is missing`, "high", "Input validation", "Required input is empty.", `Fill ${field.label.toLowerCase()} before using the result.`, 5, 1));
  if (longInputs < 2) foundIssues.push(issue("generic-specificity", "Inputs are too thin for a strong workflow result", "medium", "Specificity", `${longInputs} fields contain detailed context.`, "Add concrete data, constraints, examples, or current state notes.", 4, 1));

  const breakdown = [
    { key: "completeness", label: "Input completeness", score: Math.round((filled / Math.max(1, fields.length)) * 30), max: 30, detail: `${filled}/${fields.length} fields completed.` },
    { key: "specificity", label: "Specificity", score: Math.min(25, longInputs * 8), max: 25, detail: `${longInputs} detailed fields.` },
    { key: "evidence", label: "Evidence quality", score: text(input, "data") || text(input, "context") ? 20 : 8, max: 20, detail: "Checks context/data fields." },
    { key: "workflow", label: "Workflow coverage", score: definition.workflowSteps.length ? 15 : 7, max: 15, detail: `${definition.workflowSteps.length} workflow steps.` },
    { key: "actionability", label: "Actionability", score: text(input, "goal") ? 10 : 5, max: 10, detail: text(input, "goal") || "No goal supplied." }
  ];

  return baseResult(definition, input, breakdown, foundIssues, [
    tableSection("input-review", "Input validation", ["Field", "Status"], fields.map((field) => [field.label, text(input, field.name) ? "supplied" : field.required ? "missing" : "optional"])),
    listSection("workflow", "Workflow steps", definition.workflowSteps),
    listSection("next-actions", "Action plan", ["Validate assumptions with the owner.", "Run the first priority action.", "Export the result and attach it to the project workspace.", "Re-run when new data is available."])
  ], checklist(["Review missing context.", "Assign owner.", "Execute first recommendation.", "Export result.", "Schedule follow-up."], "Owner"));
}

export function runDeterministicAnalysis(definition: ToolDefinition, input: Record<string, string>): AnalysisResult {
  switch (definition.slug) {
    case "seo-and-geo-technical-seo-audit":
      return technicalSeo(definition, input);
    case "seo-and-geo-ai-search-citation-optimizer":
      return geoOptimizer(definition, input);
    case "marketing-seo-campaign-builder":
      return campaignBuilder(definition, input);
    case "marketing-ads-multi-platform-paid-advertising-audit-and-optimization":
      return paidAds(definition, input);
    case "branding-and-design-brand-identity-generator":
      return brandIdentity(definition, input);
    case "branding-and-design-design-system-generator":
      return designSystem(definition, input);
    case "engineering-and-ai-agent-backend-architecture-reviewer":
      return architectureReview(definition, input);
    case "engineering-and-ai-agent-security-audit-assistant":
      return securityAudit(definition, input);
    case "ai-research-experiment-planner":
      return researchPlanner(definition, input);
    case "c-level-advisory-board-memo-generator":
      return boardMemo(definition, input);
    default:
      return genericWorkflow(definition, input);
  }
}
