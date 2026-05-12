const app = document.getElementById("app");
const toast = document.getElementById("toast");

const domainMeta = {
  "SEO & GEO": {
    slug: "seo-geo",
    accent: "AI search visibility, schema, audits, and citation workflows.",
    marker: "Search"
  },
  Marketing: {
    slug: "marketing",
    accent: "Campaign planning, paid ads, CRO, email, content, and growth.",
    marker: "Growth"
  },
  "Branding & Design": {
    slug: "branding-design",
    accent: "Brand identity, design systems, visual direction, and audits.",
    marker: "Brand"
  },
  "Engineering & AI Agent": {
    slug: "engineering-ai-agent",
    accent: "Architecture, frontend, backend, DevOps, security, and agents.",
    marker: "Build"
  },
  "AI Research": {
    slug: "ai-research",
    accent: "Literature surveys, ideas, experiments, papers, and LaTeX drafts.",
    marker: "Research"
  },
  "C-Level Advisory": {
    slug: "c-level-advisory",
    accent: "CEO, CTO, CFO, CMO, CPO, board memo, and strategy reviews.",
    marker: "Advisory"
  }
};

const PAGE_SIZE = 48;
const catalogPromises = {};

const state = {
  tools: [],
  totalTools: 0,
  sources: [],
  sourceCounts: {},
  domainCounts: [],
  loadedDomains: {},
  allCatalogLoaded: false,
  toolDetails: {},
  featuredTools: [],
  skippedCount: 0,
  generatedAt: "",
  query: "",
  domain: "All",
  visibleCount: PAGE_SIZE,
  output: null,
  formValues: {}
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sentence(value) {
  return escapeHtml(value || "Not specified.");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function routeParts() {
  return window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
}

function domainSlug(domain) {
  return domainMeta[domain]?.slug || domain.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function domainFromSlug(slug) {
  return Object.keys(domainMeta).find((domain) => domainSlug(domain) === slug);
}

function toolBySlug(slug) {
  return Object.values(state.toolDetails).find((tool) => tool.slug === slug || tool.id === slug) ||
    state.tools.find((tool) => tool.slug === slug || tool.id === slug);
}

function loadingState(message = "Loading...") {
  return `
    <section class="loading card">
      <div>
        <div class="spinner"></div>
        <p>${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
  return response.json();
}

function mergeTools(tools) {
  const byId = new Map(state.tools.map((tool) => [tool.id, tool]));
  for (const tool of tools) byId.set(tool.id, tool);
  state.tools = Array.from(byId.values()).sort((a, b) => `${a.domain}${a.title}`.localeCompare(`${b.domain}${b.title}`));
}

async function ensureDomainTools(domain) {
  await ensureDomainCatalog(domain);
  return state.tools.filter((tool) => tool.domain === domain);
}

async function ensureAllTools() {
  return ensureAllCatalogs();
}

async function ensureDomainCatalog(domain) {
  if (state.loadedDomains[domain]) {
    return state.tools.filter((tool) => tool.domain === domain);
  }

  if (catalogPromises[domain]) {
    await catalogPromises[domain];
    return state.tools.filter((tool) => tool.domain === domain);
  }

  catalogPromises[domain] = fetchJson(`data/catalogs/${domainSlug(domain)}.json`)
    .then((payload) => {
      mergeTools(payload.tools || []);
      state.loadedDomains[domain] = true;
    })
    .finally(() => {
      delete catalogPromises[domain];
    });

  await catalogPromises[domain];
  return state.tools.filter((tool) => tool.domain === domain);
}

async function ensureAllCatalogs() {
  if (state.allCatalogLoaded) return state.tools;
  await Promise.all(Object.keys(domainMeta).map((domain) => ensureDomainCatalog(domain)));
  state.allCatalogLoaded = true;
  return state.tools;
}

async function ensureToolDetail(slugOrId) {
  const cached = toolBySlug(slugOrId);
  if (cached?.inputSchema) return cached;

  const catalogSummary = toolBySlug(slugOrId);
  const slug = catalogSummary?.slug || slugOrId;

  if (state.toolDetails[slug]) return state.toolDetails[slug];

  const tool = await fetchJson(`data/tools/${slug}.json`);
  state.toolDetails[tool.slug] = tool;
  mergeTools([tool]);
  return tool;
}

function runs() {
  try {
    return JSON.parse(localStorage.getItem("upmyskills:runs") || "[]");
  } catch {
    return [];
  }
}

function saveRuns(items) {
  localStorage.setItem("upmyskills:runs", JSON.stringify(items.slice(0, 120)));
}

function sourceUrl(sourceRepo) {
  if (!sourceRepo) return "";
  if (sourceRepo.startsWith("http")) return sourceRepo;
  return `https://github.com/${sourceRepo}`;
}

function shortSource(sourceRepo) {
  return sourceRepo ? sourceRepo.replace(/^https:\/\/github.com\//, "") : "Inspired wrapper";
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function domainCount(domain) {
  return state.domainCounts.find((item) => item.domain === domain)?.count || 0;
}

function recentRuns(limit = 5) {
  return runs().slice(0, limit);
}

function matchingTools() {
  const query = state.query.trim().toLowerCase();
  const baseTools = state.domain === "All" ? state.tools : state.tools.filter((tool) => tool.domain === state.domain);
  return baseTools.filter((tool) => {
    const domainOk = state.domain === "All" || tool.domain === state.domain;
    if (!domainOk) return false;
    if (!query) return true;
    const haystack = [
      tool.title,
      tool.description,
      tool.domain,
      tool.sourceRepo,
      tool.sourcePath,
      ...(tool.tags || [])
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function domainCards() {
  return Object.entries(domainMeta).map(([domain, meta]) => `
    <a class="card pad domain-card" href="#/domains/${meta.slug}">
      <p class="section-kicker">${escapeHtml(meta.marker)}</p>
      <h3>${escapeHtml(domain)}</h3>
      <p class="muted">${escapeHtml(meta.accent)}</p>
      <div class="pill-row">
        <span class="pill strong">${domainCount(domain).toLocaleString()} tools</span>
        <span class="pill">Executable forms</span>
      </div>
    </a>
  `).join("");
}

function toolCard(tool) {
  const tags = (tool.tags || []).slice(0, 4).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("");
  return `
    <a class="card tool-card" href="#/tool/${encodeURIComponent(tool.slug)}">
      <div class="card-body">
        <div class="pill-row">
          <span class="pill strong">${escapeHtml(tool.domain)}</span>
          <span class="pill">${escapeHtml(tool.license || "Unknown license")}</span>
        </div>
        <h3>${escapeHtml(tool.title)}</h3>
        <p class="muted small">${escapeHtml(tool.description)}</p>
        <div class="pill-row">${tags}</div>
        <p class="source small muted">${escapeHtml(shortSource(tool.sourceRepo))}<br>${escapeHtml(tool.sourcePath || "Generated workflow wrapper")}</p>
      </div>
    </a>
  `;
}

function statsHtml() {
  return `
    <div class="hero-panel">
      <div class="metric"><strong>${state.totalTools.toLocaleString()}</strong><span>Executable tools extracted</span></div>
      <div class="metric"><strong>${state.sources.length}</strong><span>Source repositories attributed</span></div>
      <div class="metric"><strong>${runs().length}</strong><span>Saved local generations</span></div>
    </div>
  `;
}

function renderLanding() {
  const featured = state.featuredTools.slice(0, 6).map(toolCard).join("");
  app.innerHTML = `
    <section class="hero">
      <div>
        <p class="eyebrow"><span>2026</span> Executable AI Skills Studio</p>
        <h1>AI Skills, Ready to Run.</h1>
        <h2>Built for Real Workflows.</h2>
        <p>UpMySkills converts Claude and AI skill repositories into usable web tools with forms, outputs, history, Markdown export, search, filters, and attribution.</p>
        <div class="actions">
          <a class="button primary aurora-button" href="#/dashboard">Open dashboard <span aria-hidden="true">→</span></a>
          <a class="button dark" href="#/tools">Browse tools</a>
        </div>
        <div class="marquee-wrap">
          <div class="marquee-track">
            <span>SEO & GEO</span><span>∞</span><span>MARKETING</span><span>∞</span><span>DESIGN</span><span>∞</span><span>AGENTS</span><span>∞</span><span>RESEARCH</span><span>∞</span><span>ADVISORY</span><span>∞</span>
            <span>SEO & GEO</span><span>∞</span><span>MARKETING</span><span>∞</span><span>DESIGN</span><span>∞</span><span>AGENTS</span><span>∞</span><span>RESEARCH</span><span>∞</span><span>ADVISORY</span><span>∞</span>
          </div>
        </div>
      </div>
      ${statsHtml()}
    </section>
    <section class="section">
      <p class="section-kicker">Domains</p>
      <h2>Six product workspaces from the source repos.</h2>
      <div class="grid cards-3 section">${domainCards()}</div>
    </section>
    <section class="section">
      <p class="section-kicker">Popular executable tools</p>
      <div class="grid cards-3">${featured}</div>
    </section>
  `;
}

function renderDashboard() {
  const recent = recentRuns(6);
  app.innerHTML = `
    <section class="grid dashboard-layout">
      <div>
        <div class="card pad">
          <p class="section-kicker">Dashboard</p>
          <h1>UpMySkills workspace</h1>
          <p class="muted">Browse domains, launch high-signal tools, and continue saved generations. This Cloudflare build runs locally in the browser, so it has no paid backend dependency.</p>
          <div class="actions">
            <a class="button primary" href="#/tools">Search all tools</a>
            <a class="button" href="#/sources">View attribution</a>
          </div>
        </div>
        <div class="grid cards-3 section">${domainCards()}</div>
      </div>
      <aside class="card pad">
        <p class="section-kicker">Recent history</p>
        ${recent.length ? recent.map(historyCard).join("") : `<div class="output-empty"><p class="muted">No saved generations yet. Run any tool and it will appear here.</p></div>`}
      </aside>
    </section>
  `;
}

function toolsToolbar(domainLock = "") {
  const options = [`<option value="All">All domains</option>`].concat(Object.keys(domainMeta).map((domain) => (
    `<option value="${escapeHtml(domain)}" ${state.domain === domain ? "selected" : ""}>${escapeHtml(domain)}</option>`
  ))).join("");
  return `
    <div class="toolbar">
      <input id="toolSearch" aria-label="Search tools" placeholder="Search tools, repo, tags, or workflow..." value="${escapeHtml(state.query)}" />
      <select id="domainFilter" aria-label="Filter domain" ${domainLock ? "disabled" : ""}>${options}</select>
      <a class="button" href="#/history">History</a>
      <a class="button primary" href="#/sources">Sources</a>
    </div>
  `;
}

function toolResultsHtml(matched) {
  const visible = matched.slice(0, state.visibleCount);
  const remaining = Math.max(0, matched.length - visible.length);
  return `
    <div id="toolGrid" class="grid cards-3">${visible.map(toolCard).join("") || emptyState("No tools match this filter.")}</div>
    ${remaining ? `<div class="load-row"><button type="button" data-action="load-more">Load ${Math.min(PAGE_SIZE, remaining).toLocaleString()} more</button></div>` : ""}
  `;
}

function isGlobalOverview() {
  return state.domain === "All" && !state.query.trim() && !state.allCatalogLoaded;
}

function toolsOverviewHtml() {
  const featured = state.featuredTools.slice(0, 9).map(toolCard).join("");
  return `
    <div class="card pad lazy-note">
      <p class="section-kicker">Lightweight mode</p>
      <h2>No full catalog loaded yet.</h2>
      <p class="muted">Choose one domain to load only that catalog, or type at least 2 characters to search across all domains. This keeps the first tools screen light.</p>
      <div class="grid cards-3 section">${domainCards()}</div>
    </div>
    <div class="section">
      <p class="section-kicker">Featured tools</p>
      <div class="grid cards-3">${featured || emptyState("Featured tools will appear after data generation.")}</div>
    </div>
  `;
}

function renderTools(domainLock = "") {
  if (domainLock) state.domain = domainLock;
  const overview = !domainLock && isGlobalOverview();
  const matched = overview ? [] : matchingTools();
  app.innerHTML = `
    <section>
      <p class="section-kicker">Tool library</p>
      <h1>${domainLock ? escapeHtml(domainLock) : "Executable tools"}</h1>
      <p class="muted">${overview ? "Pick a domain or search intentionally. The full multi-thousand-tool catalog is not loaded on first paint." : `${matched.length.toLocaleString()} matching tools. Results are paginated so the page stays light.`}</p>
      ${toolsToolbar(domainLock)}
      <div id="toolCount" class="small muted">${overview ? `${state.totalTools.toLocaleString()} tools available across ${state.domainCounts.length} domains.` : `${matched.length.toLocaleString()} tools match your filter.`}</div>
      <div id="toolResults" class="section">${overview ? toolsOverviewHtml() : toolResultsHtml(matched)}</div>
    </section>
  `;
}

async function renderToolsRoute(domainLock = "") {
  state.visibleCount = PAGE_SIZE;
  if (domainLock) {
    app.innerHTML = loadingState(`Loading ${domainLock} catalog...`);
    state.domain = domainLock;
    await ensureDomainCatalog(domainLock);
  } else {
    state.domain = "All";
    state.query = "";
  }
  renderTools(domainLock);
}

function refreshToolGrid() {
  if (isGlobalOverview()) {
    const count = document.getElementById("toolCount");
    const results = document.getElementById("toolResults");
    if (count) count.textContent = `${state.totalTools.toLocaleString()} tools available across ${state.domainCounts.length} domains.`;
    if (results) results.innerHTML = toolsOverviewHtml();
    return;
  }

  const matched = matchingTools();
  const count = document.getElementById("toolCount");
  const results = document.getElementById("toolResults");
  if (count) count.textContent = `${matched.length.toLocaleString()} tools match your filter.`;
  if (results) results.innerHTML = toolResultsHtml(matched);
}

function showToolResultsLoading(message) {
  const results = document.getElementById("toolResults");
  const count = document.getElementById("toolCount");
  if (count) count.textContent = message;
  if (results) results.innerHTML = loadingState(message);
}

function inputHtml(tool, field) {
  const values = state.formValues[tool.id] || {};
  const sample = tool.sampleInput || {};
  const value = values[field.name] ?? sample[field.name] ?? "";
  const required = field.required ? "required" : "";
  const label = `${escapeHtml(field.label)}${field.required ? " *" : ""}`;
  const helper = field.helperText ? `<span class="small muted">${escapeHtml(field.helperText)}</span>` : "";

  if (field.type === "textarea") {
    return `<label>${label}<textarea name="${escapeHtml(field.name)}" ${required} placeholder="${escapeHtml(field.placeholder || "")}">${escapeHtml(value)}</textarea>${helper}</label>`;
  }

  if (field.type === "select") {
    const options = (field.options?.length ? field.options : ["Standard", "Detailed", "Executive"]).map((option) => (
      `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? "selected" : ""}>${escapeHtml(option)}</option>`
    )).join("");
    return `<label>${label}<select name="${escapeHtml(field.name)}" ${required}>${options}</select>${helper}</label>`;
  }

  return `<label>${label}<input name="${escapeHtml(field.name)}" type="${field.type === "number" ? "number" : "text"}" ${required} value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || "")}" />${helper}</label>`;
}

function renderToolPage(tool) {
  const output = state.output?.toolId === tool.id ? state.output : null;
  const fields = (tool.inputSchema?.fields || []).map((field) => inputHtml(tool, field)).join("");
  app.innerHTML = `
    <section class="runner">
      <form id="toolForm" class="card pad runner-form" data-tool-id="${escapeHtml(tool.id)}">
        <p class="section-kicker">${escapeHtml(tool.domain)}</p>
        <h1>${escapeHtml(tool.title)}</h1>
        <p class="muted">${escapeHtml(tool.description)}</p>
        <div class="source-box small">
          <strong>Source:</strong> <a href="${escapeHtml(sourceUrl(tool.sourceRepo))}" target="_blank" rel="noreferrer">${escapeHtml(shortSource(tool.sourceRepo))}</a><br>
          <strong>Path:</strong> ${escapeHtml(tool.sourcePath || "Generated wrapper")}<br>
          <strong>License:</strong> ${escapeHtml(tool.license || "Unknown")}
        </div>
        <div class="form-grid section">${fields}</div>
        <div class="actions">
          <button class="primary" type="submit">${output ? "Regenerate" : "Generate output"}</button>
          <button type="button" data-action="sample" data-tool-id="${escapeHtml(tool.id)}">Load sample</button>
          <a class="button" href="#/tools">Back to tools</a>
        </div>
      </form>
      <aside class="card pad output-panel">
        <div class="actions" style="margin-top:0; justify-content:space-between;">
          <div>
            <p class="section-kicker">Generated output</p>
            <h2>${output ? escapeHtml(output.summary) : "Ready to run"}</h2>
          </div>
          <div class="actions" style="margin-top:0;">
            <button type="button" data-action="copy" ${output ? "" : "disabled"}>Copy</button>
            <button type="button" data-action="export" ${output ? "" : "disabled"}>Export MD</button>
          </div>
        </div>
        ${output ? outputHtml(output) : `<div class="output-empty"><p class="muted">Fill the form and generate. Output includes workflow steps, recommendations, checklist, Markdown deliverable, and attribution.</p></div>`}
      </aside>
    </section>
  `;
}

async function renderToolRoute(slug) {
  app.innerHTML = loadingState("Loading tool...");
  try {
    const tool = await ensureToolDetail(slug);
    return tool ? renderToolPage(tool) : (app.innerHTML = emptyState("Tool not found."));
  } catch (error) {
    app.innerHTML = emptyState(error.message || "Tool not found.");
  }
}

function outputHtml(output) {
  return `
    <div class="output-section">
      <h3>Workflow</h3>
      <ol>${output.workflow.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
    </div>
    <div class="output-section">
      <h3>Recommendations</h3>
      <ul>${output.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    <div class="output-section">
      <h3>Checklist</h3>
      <ul>${output.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    ${output.deliverable ? `
      <div class="output-section">
        <h3>Concrete deliverable</h3>
        <pre>${escapeHtml(output.deliverable)}</pre>
      </div>
    ` : ""}
    <div class="output-section">
      <h3>Markdown deliverable</h3>
      <pre>${escapeHtml(output.markdown)}</pre>
    </div>
  `;
}

function inputValue(input, keys, fallback = "Not specified") {
  for (const key of keys) {
    const value = String(input[key] || "").trim();
    if (value) return value;
  }
  return fallback;
}

function clipText(value, max = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function table(rows) {
  return [
    "| Item | Output |",
    "| --- | --- |",
    ...rows.map(([item, output]) => `| ${item.replaceAll("|", "/")} | ${output.replaceAll("|", "/")} |`)
  ].join("\n");
}

function projectName(input, tool) {
  return inputValue(input, ["projectName", "project", "business", "website", "product", "company", "topic"], tool.title);
}

function generatedRecommendations(tool, input) {
  const project = projectName(input, tool);
  const audience = inputValue(input, ["audience", "customer", "targetAudience", "market"], "the intended audience");
  const goal = clipText(inputValue(input, ["goal", "objective", "task"], "the requested outcome"), 130);
  const base = [
    `Anchor every section to ${project} and the goal: ${goal}.`,
    "Use only claims that can be checked from the supplied context, data, or source workflow.",
    "End with owners, review points, and a first action that can start today."
  ];
  const byDomain = {
    "SEO & GEO": [
      `Prioritize pages and queries where ${audience} is already closest to a decision.`,
      "Ship schema, internal links, answer snippets, canonical checks, and citation targets as one release bundle.",
      "Measure indexed pages, AI-answer mentions, CTR, assisted conversions, and crawl errors every week."
    ],
    Marketing: [
      `Split the campaign into audience capture, proof, offer, and conversion steps for ${audience}.`,
      "Create three hooks, two landing-page angles, and one retention follow-up before increasing spend.",
      "Review CAC, CVR, payback, creative fatigue, lead quality, and channel attribution together."
    ],
    "Branding & Design": [
      `Turn ${project}'s positioning into visible choices: layout density, palette, type scale, imagery, and component behavior.`,
      "Design the first viewport around the actual product, object, place, or workflow instead of abstract decoration.",
      "Validate the direction across mobile, desktop, social preview, email, and a repeated card/list component."
    ],
    "Engineering & AI Agent": [
      "Convert requirements into interfaces, data contracts, permissions, tests, observability, and rollout gates.",
      "Keep the first release reversible with small PRs, feature flags, migrations, and clear failure handling.",
      "Define agent tools, context limits, eval cases, escalation rules, and human approval boundaries."
    ],
    "AI Research": [
      `Make the research question testable for ${project}, with a baseline and a failure condition.`,
      "Track every paper by claim, method, dataset, metric, limitation, and reusable implementation detail.",
      "Write the paper outline before final experiments so results map directly to sections."
    ],
    "C-Level Advisory": [
      `Frame the leadership decision for ${project} as a tradeoff with financial, people, execution, and timing impact.`,
      "Separate facts, assumptions, risks, options, recommendation, owner, budget, and deadline.",
      "Define what new evidence would change the recommendation."
    ]
  };
  return [...(byDomain[tool.domain] || []), ...base].slice(0, 6);
}

function concreteDeliverable(tool, input) {
  const project = projectName(input, tool);
  const audience = inputValue(input, ["audience", "customer", "targetAudience", "market"], "primary users");
  const context = clipText(inputValue(input, ["context", "data", "notes"], "No source context supplied"), 220);
  const goal = clipText(inputValue(input, ["goal", "objective", "task"], "Create a useful execution artifact"), 180);
  const constraints = clipText(inputValue(input, ["constraints", "limits", "requirements"], "No constraints supplied"), 180);

  if (tool.domain === "Branding & Design") {
    return [
      `## Design Direction for ${project}`,
      "",
      table([
        ["Positioning", `${project} should feel useful, credible, and immediately understandable for ${audience}.`],
        ["First viewport", "Show the real product, workflow, venue, or generated mockup first; keep the headline direct and the primary action visible."],
        ["Visual tone", "Use a restrained dark interface, violet only for emphasis, teal for success/progress, and neutral surfaces for scanning."],
        ["Content priority", `Lead with ${goal}; support it with proof, steps, pricing/offer, and a concrete next action.`]
      ]),
      "",
      "### First Screen Blueprint",
      table([
        ["Navigation", "Compact brand mark, Dashboard, Tools, Domains, History, Sources, primary CTA."],
        ["Hero", `Headline: ${project}. Supporting line: ${goal}. Visual: a real generated screen/mockup, not dots or abstract decoration.`],
        ["Proof strip", "3 metrics: tools available, source repos, saved runs or outcomes."],
        ["Next section", "Show domain cards or tool cards partially above the fold so scrolling has a clear target."]
      ]),
      "",
      "### Component System",
      "- Buttons: 8px radius, icon plus label for actions, solid primary only for the main command.",
      "- Cards: only for repeated domain/tool/history items; no nested cards.",
      "- Typography: tight operational headings, readable 14-16px body copy, no viewport-scaled body text.",
      "- Assets: generate one clean product mockup or workflow preview for the hero and reuse cropped variants in cards.",
      "",
      `### Constraints Applied\n${constraints}`
    ].join("\n");
  }

  if (tool.domain === "SEO & GEO") {
    return [
      `## SEO and AI Search Workplan for ${project}`,
      "",
      table([
        ["Primary intent", `${audience} needs pages that answer the decision behind: ${goal}.`],
        ["Technical release", "Validate robots, sitemap, canonical tags, status codes, page speed, structured data, and internal links."],
        ["Entity coverage", "Add organization, product/service, FAQ, breadcrumb, review/proof, and author/source signals where relevant."],
        ["AI answer readiness", "Create concise answer blocks, comparison tables, cited facts, and source-backed summaries."]
      ]),
      "",
      "### 10-Day Queue",
      "1. Crawl the site and export errors, duplicate titles, missing canonicals, and slow templates.",
      "2. Pick 5 priority pages by revenue intent or lead quality.",
      "3. Rewrite each page's H1, intro answer, FAQ, schema, internal links, and evidence block.",
      "4. Submit updated sitemap and monitor indexation, impressions, CTR, AI-answer mentions, and conversions.",
      "",
      `### Evidence Base\n${context}`
    ].join("\n");
  }

  if (tool.domain === "Marketing") {
    return [
      `## Campaign Plan for ${project}`,
      "",
      table([
        ["Audience", audience],
        ["Offer", `Package the offer around ${goal}.`],
        ["Hook 1", `Before/after outcome for ${audience}.`],
        ["Hook 2", "Risk reversal, proof, guarantee, demo, or fast-start result."],
        ["Conversion path", "Ad or post -> focused landing page -> proof block -> form/checkout -> follow-up sequence."]
      ]),
      "",
      "### 14-Day Launch Calendar",
      "1. Day 1-2: finalize offer, proof points, landing page outline, and tracking.",
      "2. Day 3-5: create 3 ad angles, 5 organic posts, 2 email/SMS follow-ups.",
      "3. Day 6-10: run low-budget tests, remove weak hooks, keep winning proof.",
      "4. Day 11-14: scale one channel and produce a learning memo with CAC, CVR, lead quality, and next test.",
      "",
      `### Constraints Applied\n${constraints}`
    ].join("\n");
  }

  if (tool.domain === "Engineering & AI Agent") {
    return [
      `## Implementation Brief for ${project}`,
      "",
      table([
        ["Scope", goal],
        ["Interfaces", "Define inputs, outputs, auth, data ownership, retries, and error states before coding."],
        ["Agent boundary", "List allowed tools, forbidden actions, context sources, approval gates, and audit logs."],
        ["Verification", "Add unit tests for contracts, integration tests for flows, and smoke tests for deployment."],
        ["Rollout", "Ship behind a flag, monitor errors/latency/cost, and keep rollback instructions ready."]
      ]),
      "",
      "### Ticket Slice",
      "1. Data model and validation contract.",
      "2. UI or API workflow with empty/loading/error/success states.",
      "3. Provider integration with timeout, retry, and structured output parsing.",
      "4. Observability, permission checks, and release gate.",
      "",
      `### Context\n${context}`
    ].join("\n");
  }

  if (tool.domain === "AI Research") {
    return [
      `## Research Memo for ${project}`,
      "",
      table([
        ["Question", goal],
        ["Hypothesis", `A measurable intervention can improve the target outcome for ${audience}.`],
        ["Baseline", "Run a simple baseline before custom modeling or complex experiments."],
        ["Evaluation", "Track dataset, metric, split, failure cases, confidence interval, and qualitative examples."],
        ["Deliverable", "Produce an annotated bibliography, experiment table, and paper-style outline."]
      ]),
      "",
      "### Experiment Spine",
      "1. Literature pass: 8-12 papers, grouped by claim and limitation.",
      "2. Baseline: smallest reproducible model or method that answers the question.",
      "3. Ablation: one variable changed at a time.",
      "4. Write-up: abstract, method, results, limitations, and next experiment.",
      "",
      `### Available Data\n${context}`
    ].join("\n");
  }

  if (tool.domain === "C-Level Advisory") {
    return [
      `## Executive Memo for ${project}`,
      "",
      table([
        ["Decision", goal],
        ["Recommendation", "Proceed with a narrow first move, clear owner, measurable checkpoint, and explicit stop condition."],
        ["Upside", `Improves speed, clarity, or revenue quality for ${audience}.`],
        ["Risk", `Main constraint: ${constraints}.`],
        ["Ask", "Approve owner, budget/time box, success metric, and next review date."]
      ]),
      "",
      "### Board-Ready Narrative",
      "1. What changed: summarize the trigger and current state.",
      "2. Options: do nothing, small controlled move, larger strategic bet.",
      "3. Recommendation: choose one path with owner and metric.",
      "4. Risk control: name the signal that stops or changes the plan.",
      "",
      `### Context\n${context}`
    ].join("\n");
  }

  return [
    `## Execution Artifact for ${project}`,
    "",
    table([
      ["Goal", goal],
      ["Audience", audience],
      ["Context", context],
      ["Constraints", constraints],
      ["First action", "Choose the owner, define the acceptance criteria, and start with the smallest useful deliverable."]
    ])
  ].join("\n");
}

function workflowFor(tool, input) {
  const project = projectName(input, tool);
  const sourceSteps = (tool.workflowSteps || []).slice(0, 3);
  return [
    `Frame ${tool.title} around ${project} and one measurable outcome.`,
    "Extract the useful constraints, facts, and source workflow instructions.",
    ...sourceSteps,
    "Produce a concrete artifact the team can review, copy, and execute.",
    "Assign owners, validation checks, and the next run date."
  ].slice(0, 7);
}

function checklistFor(tool) {
  const shared = [
    "Replace any placeholder with project-specific facts before sharing.",
    "Assign one owner for the first action.",
    "Add a review date and success metric.",
    "Export the Markdown and attach it to the working document."
  ];
  const extra = {
    "Branding & Design": "Check desktop and mobile screenshots for text overflow, weak contrast, and decorative noise.",
    "SEO & GEO": "Validate schema, canonical tags, sitemap, indexation, and internal links after publishing.",
    Marketing: "Confirm tracking pixels, UTMs, CRM stages, and conversion events before launch.",
    "Engineering & AI Agent": "Run tests, permission checks, timeout handling, and rollback steps before release.",
    "AI Research": "Log dataset versions, baseline config, metrics, and negative results.",
    "C-Level Advisory": "Confirm the recommendation has a budget owner and a decision deadline."
  };
  return [extra[tool.domain] || "Confirm assumptions against the available evidence.", ...shared];
}

function markdownFor(tool, input, output) {
  const inputLines = Object.entries(input).map(([key, value]) => `- ${key}: ${value || "Not specified"}`).join("\n");
  return `# ${tool.title}

## Summary
${output.summary}

## Inputs
${inputLines}

## Workflow
${output.workflow.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Recommendations
${output.recommendations.map((item) => `- ${item}`).join("\n")}

## Concrete Deliverable
${output.deliverable}

## Execution Checklist
${output.checklist.map((item) => `- [ ] ${item}`).join("\n")}

## Attribution
Source: ${shortSource(tool.sourceRepo)}
Path: ${tool.sourcePath || "Generated wrapper"}
License: ${tool.license || "Unknown"}

Generated by UpMySkills.`;
}

function generateOutput(tool, input) {
  const project = projectName(input, tool);
  const recommendations = generatedRecommendations(tool, input);
  const output = {
    toolId: tool.id,
    summary: `${tool.title} generated a ${tool.domain} deliverable for ${project}.`,
    workflow: workflowFor(tool, input),
    recommendations,
    deliverable: concreteDeliverable(tool, input),
    checklist: checklistFor(tool),
    attribution: {
      sourceRepo: tool.sourceRepo,
      sourcePath: tool.sourcePath,
      license: tool.license
    },
    markdown: ""
  };
  output.markdown = markdownFor(tool, input, output);
  return output;
}

function collectForm(form, tool) {
  const data = new FormData(form);
  const input = {};
  for (const field of tool.inputSchema?.fields || []) {
    input[field.name] = String(data.get(field.name) || "").trim();
  }
  return input;
}

function handleToolSubmit(form) {
  const tool = state.tools.find((item) => item.id === form.dataset.toolId);
  if (!tool) return;
  const input = collectForm(form, tool);
  state.formValues[tool.id] = input;
  const missing = (tool.inputSchema?.fields || []).filter((field) => field.required && !input[field.name]);
  if (missing.length) {
    showToast(`Missing required field: ${missing[0].label}`);
    return;
  }
  const output = generateOutput(tool, input);
  state.output = output;
  const run = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    toolId: tool.id,
    toolSlug: tool.slug,
    title: tool.title,
    domain: tool.domain,
    input,
    output,
    createdAt: new Date().toISOString()
  };
  saveRuns([run, ...runs()]);
  renderToolPage(tool);
  showToast("Output generated and saved to history.");
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  showToast("Copied to clipboard.");
}

function exportMarkdown(output) {
  const blob = new Blob([output.markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${output.summary.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "upmyskills-output"}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Markdown exported.");
}

function historyCard(run) {
  return `
    <a class="card pad history-card" href="#/tool/${encodeURIComponent(run.toolSlug)}" data-run-id="${escapeHtml(run.id)}">
      <p class="section-kicker">${escapeHtml(run.domain)}</p>
      <h3>${escapeHtml(run.title)}</h3>
      <p class="muted small">${escapeHtml(run.output?.summary || "Generated output")}</p>
      <span class="pill">${escapeHtml(formatDate(run.createdAt))}</span>
    </a>
  `;
}

function renderHistory() {
  const items = runs();
  app.innerHTML = `
    <section>
      <p class="section-kicker">History</p>
      <h1>Saved generations</h1>
      <p class="muted">History is stored in this browser with localStorage. No account or paid API key is required for this deployed runner.</p>
      <div class="actions">
        <button data-action="clear-history" ${items.length ? "" : "disabled"}>Clear history</button>
        <a class="button primary" href="#/tools">Run another tool</a>
      </div>
      <div class="grid cards-3 section">${items.map(historyCard).join("") || emptyState("No saved generations yet.")}</div>
    </section>
  `;
}

function renderSources() {
  const sourceRows = state.sources.map((source) => {
    const count = state.sourceCounts[source.name] || 0;
    return `
      <div class="card pad">
        <h3><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.name)}</a></h3>
        <p class="muted small">${escapeHtml(source.notes || "Ingested source repository.")}</p>
        <div class="pill-row">
          <span class="pill strong">${count.toLocaleString()} tools</span>
          <span class="pill">${escapeHtml(source.license || "Unknown license")}</span>
          <span class="pill">Ingested ${escapeHtml(formatDate(source.lastIngestedAt))}</span>
        </div>
      </div>
    `;
  }).join("");
  app.innerHTML = `
    <section>
      <p class="section-kicker">Sources and attribution</p>
      <h1>Repository lineage</h1>
      <p class="muted">Every executable tool carries source repo, source path, and license information. Ambiguous files were skipped or converted into clean inspired wrappers only when the workflow was usable.</p>
      <div class="grid cards-2 section">${sourceRows}</div>
      <div class="card pad section">
        <h3>Ingestion quality</h3>
        <p class="muted">${state.totalTools.toLocaleString()} tools extracted. ${state.skippedCount.toLocaleString()} files skipped because they were ambiguous, duplicate, or not usable as a web workflow.</p>
      </div>
    </section>
  `;
}

function renderSettings() {
  app.innerHTML = `
    <section class="card pad">
      <p class="section-kicker">Settings</p>
      <h1>Provider configuration</h1>
      <p class="muted">This deployed Cloudflare Pages build uses the local deterministic provider so tools are usable immediately and can be run repeatedly from the browser. The Next.js app in the repository includes an LLM provider abstraction for OpenAI, Anthropic, or local providers when a backend is attached.</p>
      <div class="grid cards-3 section">
        <div class="card pad"><h3>Current provider</h3><p class="muted">Local browser runner</p></div>
        <div class="card pad"><h3>History storage</h3><p class="muted">Browser localStorage</p></div>
        <div class="card pad"><h3>Generated tools</h3><p class="muted">${state.totalTools.toLocaleString()} executable workflows</p></div>
      </div>
    </section>
  `;
}

function emptyState(message) {
  return `<div class="output-empty card"><p class="muted">${escapeHtml(message)}</p></div>`;
}

async function render() {
  const parts = routeParts();
  state.output = null;
  if (!parts.length) return renderLanding();
  if (parts[0] === "dashboard") return renderDashboard();
  if (parts[0] === "tools") return renderToolsRoute();
  if (parts[0] === "domains") {
    const domain = domainFromSlug(parts[1] || "seo-geo") || "SEO & GEO";
    return renderToolsRoute(domain);
  }
  if (parts[0] === "tool") {
    return renderToolRoute(decodeURIComponent(parts.slice(1).join("/")));
  }
  if (parts[0] === "history") return renderHistory();
  if (parts[0] === "sources") return renderSources();
  if (parts[0] === "settings") return renderSettings();
  renderLanding();
}

document.addEventListener("submit", (event) => {
  if (event.target?.id === "toolForm") {
    event.preventDefault();
    handleToolSubmit(event.target);
  }
});

document.addEventListener("input", async (event) => {
  if (event.target?.id === "toolSearch") {
    state.query = event.target.value;
    state.visibleCount = PAGE_SIZE;

    if (state.domain === "All" && state.query.trim().length === 1 && !state.allCatalogLoaded) {
      const count = document.getElementById("toolCount");
      const results = document.getElementById("toolResults");
      if (count) count.textContent = "Type at least 2 characters to search all domains.";
      if (results) results.innerHTML = toolsOverviewHtml();
      return;
    }

    if (state.domain === "All" && state.query.trim().length >= 2 && !state.allCatalogLoaded) {
      showToolResultsLoading("Loading searchable catalogs once...");
      await ensureAllCatalogs();
    }

    refreshToolGrid();
  }
});

document.addEventListener("change", async (event) => {
  if (event.target?.id === "domainFilter") {
    state.domain = event.target.value;
    state.visibleCount = PAGE_SIZE;

    if (state.domain !== "All") {
      showToolResultsLoading(`Loading ${state.domain} catalog...`);
      await ensureDomainCatalog(state.domain);
    } else if (state.query.trim().length >= 2 && !state.allCatalogLoaded) {
      showToolResultsLoading("Loading searchable catalogs once...");
      await ensureAllCatalogs();
    }

    refreshToolGrid();
  }
});

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "sample") {
    const tool = state.tools.find((item) => item.id === event.target.closest("[data-tool-id]")?.dataset.toolId);
    if (!tool) return;
    state.formValues[tool.id] = { ...(tool.sampleInput || {}) };
    renderToolPage(tool);
    showToast("Sample input loaded.");
  }

  if (action === "copy" && state.output) {
    await copyText(state.output.markdown);
  }

  if (action === "export" && state.output) {
    exportMarkdown(state.output);
  }

  if (action === "load-more") {
    state.visibleCount += PAGE_SIZE;
    refreshToolGrid();
  }

  if (action === "clear-history") {
    saveRuns([]);
    renderHistory();
    showToast("History cleared.");
  }
});

window.addEventListener("hashchange", render);

fetch("data/manifest.json", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error(`Unable to load manifest (${response.status})`);
    return response.json();
  })
  .then((payload) => {
    state.totalTools = payload.toolsCount || 0;
    state.sources = payload.sources || [];
    state.sourceCounts = payload.sourceCounts || {};
    state.domainCounts = payload.domainCounts || [];
    state.featuredTools = payload.featuredTools || [];
    state.skippedCount = payload.skippedCount || 0;
    state.generatedAt = payload.generatedAt || "";
    render();
  })
  .catch((error) => {
    app.innerHTML = `<section class="error card"><div><h1>Tools failed to load</h1><p class="muted">${escapeHtml(error.message)}</p></div></section>`;
  });
