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
        <p class="source small muted">${escapeHtml(shortSource(tool.sourceRepo))}<br>${escapeHtml(tool.sourcePath || "Workflow wrapper")}</p>
      </div>
    </a>
  `;
}

function statsHtml() {
  return `
    <div class="hero-panel">
      <div class="metric"><strong>${state.totalTools.toLocaleString()}</strong><span>Executable tools extracted</span></div>
      <div class="metric"><strong>${state.sources.length}</strong><span>Source repositories attributed</span></div>
      <div class="metric"><strong>${runs().length}</strong><span>Saved tool runs</span></div>
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
        <p>UpMySkills converts Claude and AI skill repositories into usable web tools with structured forms, scoring, exports, history, search, filters, and attribution.</p>
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
          <p class="muted">Browse domains, launch high-signal tools, and continue saved runs. This Cloudflare build runs locally in the browser, so it has no paid backend dependency.</p>
          <div class="actions">
            <a class="button primary" href="#/tools">Search all tools</a>
            <a class="button" href="#/sources">View attribution</a>
          </div>
        </div>
        <div class="grid cards-3 section">${domainCards()}</div>
      </div>
      <aside class="card pad">
        <p class="section-kicker">Recent history</p>
        ${recent.length ? recent.map(historyCard).join("") : `<div class="output-empty"><p class="muted">No saved tool runs yet. Run any tool and it will appear here.</p></div>`}
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
          <strong>Path:</strong> ${escapeHtml(tool.sourcePath || "Workflow wrapper")}<br>
          <strong>License:</strong> ${escapeHtml(tool.license || "Unknown")}
        </div>
        <div class="form-grid section">${fields}</div>
        <div class="actions">
          <button class="primary" type="submit">${output ? "Run again" : "Run tool"}</button>
          <button type="button" data-action="sample" data-tool-id="${escapeHtml(tool.id)}">Load sample</button>
          <a class="button" href="#/tools">Back to tools</a>
        </div>
      </form>
      <aside class="card pad output-panel">
        <div class="actions" style="margin-top:0; justify-content:space-between;">
          <div>
            <p class="section-kicker">Tool result</p>
            <h2>${output ? escapeHtml(output.summary) : "Ready to run"}</h2>
          </div>
          <div class="actions" style="margin-top:0;">
            <button type="button" data-action="copy" ${output ? "" : "disabled"}>Copy</button>
            <button type="button" data-action="export" data-format="markdown" ${output ? "" : "disabled"}>MD</button>
            <button type="button" data-action="export" data-format="json" ${output ? "" : "disabled"}>JSON</button>
            <button type="button" data-action="export" data-format="csv" ${output ? "" : "disabled"}>CSV</button>
            <button type="button" data-action="export" data-format="html" ${output ? "" : "disabled"}>HTML</button>
          </div>
        </div>
        ${output ? outputHtml(output) : `<div class="output-empty"><p class="muted">Fill the form and run the workflow. Results include validation, score, issues, recommendations, detailed analysis, checklist, exports, and attribution.</p></div>`}
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
  const score = output.score ? `
    <div class="score-card">
      <div>
        <p class="section-kicker">${escapeHtml(output.score.label || "Score")}</p>
        <strong>${escapeHtml(output.score.value)}/${escapeHtml(output.score.max || 100)}</strong>
      </div>
      <span class="pill strong">${escapeHtml(output.score.status || output.status || "ready")}</span>
    </div>
    <div class="score-breakdown">
      ${(output.score.breakdown || []).map((item) => `
        <div class="metric compact">
          <strong>${escapeHtml(item.score)}/${escapeHtml(item.max)}</strong>
          <span>${escapeHtml(item.label)}<br>${escapeHtml(item.detail || "")}</span>
        </div>
      `).join("")}
    </div>
  ` : "";

  return `
    <div class="output-section">
      <h3>Summary</h3>
      <p>${escapeHtml(output.summary)}</p>
    </div>
    ${score}
    <div class="output-section">
      <h3>Key findings</h3>
      <ul>${(output.keyFindings || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    <div class="output-section">
      <h3>Issues</h3>
      ${output.issues?.length ? output.issues.map((item) => `
        <div class="result-card">
          <div class="pill-row"><span class="pill strong">${escapeHtml(item.severity)}</span><span class="pill">${escapeHtml(item.category)}</span></div>
          <h4>${escapeHtml(item.title)}</h4>
          <p class="muted small">${escapeHtml(item.detail)}</p>
          <p class="small">${escapeHtml(item.fix)}</p>
        </div>
      `).join("") : `<p class="muted">No blocking issues detected from the supplied inputs.</p>`}
    </div>
    <div class="output-section">
      <h3>Prioritized recommendations</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Priority</th><th>Recommendation</th><th>Impact</th><th>Effort</th><th>Next step</th></tr></thead>
          <tbody>${(output.recommendations || []).map((item) => `<tr><td>${escapeHtml(item.priority)}</td><td>${escapeHtml(item.title)}<br><span class="muted small">${escapeHtml(item.rationale || "")}</span></td><td>${escapeHtml(item.impact)}/5</td><td>${escapeHtml(item.effort)}/5</td><td>${escapeHtml(item.nextStep)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </div>
    ${(output.analysisSections || []).map(analysisSectionHtml).join("")}
    ${timelineHtml(output)}
    ${matrixHtml(output)}
    <div class="output-section">
      <h3>Action checklist</h3>
      <ul>${(output.checklist || []).map((item) => `<li>${escapeHtml(item.label || item)}${item.owner ? ` <span class="muted small">- ${escapeHtml(item.owner)}</span>` : ""}</li>`).join("")}</ul>
    </div>
    <div class="output-section source-box small">
      <h3>Source attribution</h3>
      <p>${escapeHtml(output.attribution?.sourceRepo || "")}${output.attribution?.sourcePath ? `/${escapeHtml(output.attribution.sourcePath)}` : ""}</p>
      ${output.attribution?.license ? `<p>License: ${escapeHtml(output.attribution.license)}</p>` : ""}
    </div>
  `;
}

function analysisSectionHtml(section) {
  if (section.type === "table" && section.table) {
    return `
      <div class="output-section">
        <h3>${escapeHtml(section.title)}</h3>
        <div class="table-wrap">
          <table>
            <thead><tr>${section.table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
            <tbody>${section.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
        </div>
      </div>
    `;
  }
  if (section.type === "code" || section.type === "json") {
    return `<div class="output-section"><h3>${escapeHtml(section.title)}</h3><pre>${escapeHtml(section.content || "")}</pre></div>`;
  }
  return `<div class="output-section"><h3>${escapeHtml(section.title)}</h3><ul>${(section.items || [section.content || ""]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
}

function timelineHtml(output) {
  if (!output.timeline?.length) return "";
  return `
    <div class="output-section">
      <h3>Timeline</h3>
      <div class="timeline-grid">${output.timeline.map((item) => `
        <div class="result-card">
          <p class="section-kicker">${escapeHtml(item.period)}</p>
          <h4>${escapeHtml(item.title)}</h4>
          <ul>${item.actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul>
        </div>
      `).join("")}</div>
    </div>
  `;
}

function matrixHtml(output) {
  if (!output.matrix?.length) return "";
  return `
    <div class="output-section">
      <h3>Matrix</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Option</th><th>Score</th><th>Rationale</th><th>Recommendation</th></tr></thead>
          <tbody>${output.matrix.map((item) => `<tr><td>${escapeHtml(item.option)}</td><td>${escapeHtml(item.score)}</td><td>${escapeHtml(item.rationale)}</td><td>${escapeHtml(item.recommendation)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
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
  const issueLines = output.issues?.length ? output.issues.map((item) => `- ${item.severity.toUpperCase()}: ${item.title} - ${item.fix}`).join("\n") : "- No blocking issues detected.";
  const recommendationLines = (output.recommendations || []).map((item) => `- ${item.priority}: ${item.title} (impact ${item.impact}/5, effort ${item.effort}/5) - ${item.nextStep}`).join("\n");
  const checklistLines = (output.checklist || []).map((item) => `- [ ] ${item.label || item}`).join("\n");
  const analysisLines = (output.analysisSections || []).map((section) => {
    if (section.type === "table" && section.table) {
      return [
        `### ${section.title}`,
        `| ${section.table.columns.join(" | ")} |`,
        `| ${section.table.columns.map(() => "---").join(" | ")} |`,
        ...section.table.rows.map((row) => `| ${row.map((cell) => String(cell).replaceAll("|", "/")).join(" | ")} |`)
      ].join("\n");
    }
    if (section.items?.length) return [`### ${section.title}`, section.items.map((item) => `- ${item}`).join("\n")].join("\n");
    return [`### ${section.title}`, section.content || ""].join("\n");
  }).join("\n\n");
  return `# ${tool.title}

## Summary
${output.summary}

${output.score ? `Score: ${output.score.value}/${output.score.max} (${output.score.status})` : ""}

## Inputs
${inputLines}

## Workflow
${(output.workflow || []).map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Key Findings
${(output.keyFindings || []).map((item) => `- ${item}`).join("\n")}

## Issues
${issueLines}

## Recommendations
${recommendationLines}

## Detailed Analysis
${analysisLines}

## Execution Checklist
${checklistLines}

## Attribution
Source: ${shortSource(tool.sourceRepo)}
Path: ${tool.sourcePath || "Workflow wrapper"}
License: ${tool.license || "Unknown"}

Built by UpMySkills.`;
}

function numeric(input, key) {
  const value = Number(String(input[key] || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function wordCount(value) {
  return (String(value || "").toLowerCase().match(/[a-z0-9]+/g) || []).length;
}

function outputStatus(score) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "warning";
  return "poor";
}

function buildScore(label, breakdown) {
  const max = breakdown.reduce((sum, item) => sum + item.max, 0) || 100;
  const value = Math.max(0, Math.min(100, Math.round((breakdown.reduce((sum, item) => sum + item.score, 0) / max) * 100)));
  return { label, value, max: 100, status: outputStatus(value), breakdown };
}

function makeIssue(id, title, severity, category, detail, fix, impact = 3, effort = 2) {
  return { id, title, severity, category, detail, fix, impact, effort };
}

function makeRec(item, index) {
  const impact = item.impact || 3;
  const effort = item.effort || 2;
  return {
    id: `rec-${index + 1}`,
    title: item.fix,
    priority: impact >= 5 && effort <= 2 ? "P0" : impact >= 4 ? "P1" : impact >= 3 ? "P2" : "P3",
    impact,
    effort,
    rationale: item.detail,
    nextStep: item.fix
  };
}

function checklistItems(items, owner = "Owner") {
  return items.map((label, index) => ({ id: `check-${index + 1}`, label, owner, status: "todo" }));
}

function tableSection(key, title, columns, rows) {
  return { key, title, type: "table", table: { columns, rows } };
}

function listSection(key, title, items) {
  return { key, title, type: "list", items };
}

function codeSection(key, title, content) {
  return { key, title, type: "code", content };
}

function finishToolOutput(tool, input, rendererType, breakdown, issues, sections, checklist, timeline, matrix) {
  const score = buildScore(tool.title, breakdown);
  const recommendations = issues.length ? issues.slice().sort((a, b) => (b.impact || 0) - (a.impact || 0)).slice(0, 8).map(makeRec) : [{
    id: "rec-1",
    title: "Keep the current workflow and monitor for regressions",
    priority: "P2",
    impact: 3,
    effort: 1,
    rationale: "No blocking issues were detected from the supplied inputs.",
    nextStep: "Schedule the next review after new data is available."
  }];
  const output = {
    toolId: tool.id,
    rendererType,
    summary: `${tool.title} completed ${issues.length} checks with ${recommendations.length} prioritized actions.`,
    status: score.status,
    score,
    keyFindings: issues.length ? issues.slice(0, 4).map((item) => `${item.severity.toUpperCase()}: ${item.title}`) : [`${tool.title} passed the core deterministic checks.`],
    issues,
    recommendations,
    analysisSections: sections,
    checklist,
    timeline,
    matrix,
    exports: {},
    attribution: { sourceRepo: tool.sourceRepo, sourcePath: tool.sourcePath, license: tool.license },
    workflow: tool.workflowSteps || []
  };
  output.markdown = markdownFor(tool, input, output);
  output.exports = {
    markdown: output.markdown,
    json: JSON.stringify(output, null, 2),
    csv: csvForOutput(output),
    html: htmlForOutput(output)
  };
  return output;
}

function csvForOutput(output) {
  const rows = [["type", "priority_or_severity", "title", "impact", "effort", "next_step_or_fix"]];
  for (const item of output.recommendations || []) rows.push(["recommendation", item.priority, item.title, item.impact, item.effort, item.nextStep]);
  for (const item of output.issues || []) rows.push(["issue", item.severity, item.title, item.impact || "", item.effort || "", item.fix]);
  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}

function htmlForOutput(output) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(output.summary)}</title></head><body><h1>${escapeHtml(output.summary)}</h1><p>Score: ${output.score?.value || ""}/${output.score?.max || ""}</p><h2>Issues</h2><ul>${(output.issues || []).map((item) => `<li>${escapeHtml(item.severity)}: ${escapeHtml(item.title)} - ${escapeHtml(item.fix)}</li>`).join("")}</ul><h2>Recommendations</h2><ul>${(output.recommendations || []).map((item) => `<li>${escapeHtml(item.priority)}: ${escapeHtml(item.title)}</li>`).join("")}</ul></body></html>`;
}

function generateOutput(tool, input) {
  const slug = tool.slug;
  if (slug === "seo-and-geo-technical-seo-audit") return seoToolOutput(tool, input);
  if (slug === "seo-and-geo-ai-search-citation-optimizer") return geoToolOutput(tool, input);
  if (slug === "marketing-seo-campaign-builder") return campaignToolOutput(tool, input);
  if (slug === "marketing-ads-multi-platform-paid-advertising-audit-and-optimization") return paidAdsToolOutput(tool, input);
  if (slug === "branding-and-design-brand-identity-generator") return brandToolOutput(tool, input);
  if (slug === "branding-and-design-design-system-generator") return designSystemToolOutput(tool, input);
  if (slug === "engineering-and-ai-agent-backend-architecture-reviewer") return architectureToolOutput(tool, input);
  if (slug === "engineering-and-ai-agent-security-audit-assistant") return securityToolOutput(tool, input);
  if (slug === "ai-research-experiment-planner") return researchToolOutput(tool, input);
  if (slug === "c-level-advisory-board-memo-generator") return boardMemoToolOutput(tool, input);
  return genericToolOutput(tool, input);
}

function seoToolOutput(tool, input) {
  const title = input.pageTitle || "";
  const meta = input.metaDescription || "";
  const content = input.content || "";
  const keyword = input.targetKeyword || "";
  const headings = input.headings || "";
  const robots = String(input.robotsSetting || "").toLowerCase();
  const h1 = (headings.match(/\bh1\s*:/gi) || []).length;
  const h2 = (headings.match(/\bh2\s*:/gi) || []).length;
  const wc = wordCount(content);
  const issues = [];
  if (title.length < 30 || title.length > 65) issues.push(makeIssue("title", "Title length is outside ideal range", "medium", "Metadata", `${title.length} characters detected.`, "Rewrite title to 45-60 characters with the target keyword.", 4, 2));
  if (meta.length < 120 || meta.length > 165) issues.push(makeIssue("meta", "Meta description length is weak", "medium", "Metadata", `${meta.length} characters detected.`, "Rewrite meta description to 140-160 characters.", 4, 2));
  if (keyword && !title.toLowerCase().includes(keyword.toLowerCase())) issues.push(makeIssue("keyword-title", "Target keyword missing from title", "high", "Relevance", `${keyword} not found in title.`, "Add the target keyword naturally to the title.", 5, 1));
  if (h1 !== 1) issues.push(makeIssue("h1", "Page should have exactly one H1", "high", "Headings", `${h1} H1 headings detected.`, "Use one descriptive H1 and demote duplicates.", 5, 2));
  if (wc < 300) issues.push(makeIssue("thin-content", "Content is thin", "high", "Content", `${wc} words detected.`, "Expand the page with evidence, examples, FAQs, and comparison details.", 5, 3));
  if (robots.includes("noindex") || robots.includes("blocked")) issues.push(makeIssue("robots", "Indexing is blocked", "critical", "Indexability", `Robots: ${robots}`, "Change robots to index, follow unless intentionally excluded.", 5, 1));
  if (!input.canonicalUrl) issues.push(makeIssue("canonical", "Canonical URL is missing", "medium", "Indexability", "No canonical supplied.", "Set a self-referencing canonical URL.", 3, 1));
  if (!input.schemaMarkup) issues.push(makeIssue("schema", "Schema markup is missing", "medium", "Structured data", "No schema supplied.", "Add Service, Article, FAQ, Product, or Organization JSON-LD.", 3, 2));
  const breakdown = [
    { key: "metadata", label: "Metadata", score: (title.length >= 30 && title.length <= 65 ? 10 : 4) + (meta.length >= 120 && meta.length <= 165 ? 10 : 4), max: 20, detail: `Title ${title.length}, meta ${meta.length}.` },
    { key: "indexability", label: "Indexability", score: (!robots.includes("noindex") && !robots.includes("blocked") ? 12 : 0) + (input.canonicalUrl ? 8 : 0), max: 20, detail: `Robots ${robots || "unknown"}.` },
    { key: "content", label: "Content relevance", score: (content.toLowerCase().includes(keyword.toLowerCase()) ? 10 : 3) + (wc >= 300 ? 10 : 3) + (meta.toLowerCase().includes(keyword.toLowerCase()) ? 5 : 1), max: 25, detail: `${wc} words.` },
    { key: "structure", label: "Heading structure", score: (h1 === 1 ? 12 : 4) + (h2 >= 2 ? 8 : 2), max: 20, detail: `${h1} H1, ${h2} H2.` },
    { key: "schema", label: "Schema", score: input.schemaMarkup ? 15 : 0, max: 15, detail: input.schemaMarkup ? "Present." : "Missing." }
  ];
  return finishToolOutput(tool, input, "audit", breakdown, issues, [
    tableSection("signals", "SEO signal dashboard", ["Signal", "Value"], [["Title length", title.length], ["Meta length", meta.length], ["Word count", wc], ["H1 count", h1], ["H2 count", h2], ["Robots", robots || "unknown"], ["Canonical", input.canonicalUrl || "missing"]]),
    codeSection("schema", "Recommended JSON-LD draft", `{"@context":"https://schema.org","@type":"Service","name":"${title.replaceAll('"', "'")}","url":"${input.url || ""}","description":"${meta.replaceAll('"', "'")}"}`)
  ], checklistItems(["Fix critical indexability issues.", "Rewrite metadata where flagged.", "Normalize heading hierarchy.", "Add schema JSON-LD.", "Re-crawl after publishing."], "SEO"));
}

function geoToolOutput(tool, input) {
  const content = input.content || "";
  const questions = String(input.targetQuestions || "").split(/\n+/).filter(Boolean);
  const entities = String(input.entityTerms || "").split(/[,\n]+/).filter(Boolean);
  const citations = String(input.citations || "").split(/\n+/).filter(Boolean);
  const answered = questions.filter((q) => content.toLowerCase().includes(q.toLowerCase().split(/\s+/).slice(0, 4).join(" "))).length;
  const entityHits = entities.filter((e) => content.toLowerCase().includes(e.trim().toLowerCase())).length;
  const issues = [];
  if (questions.length && answered / questions.length < 0.5) issues.push(makeIssue("answers", "Target questions need direct answer blocks", "high", "Answer coverage", `${answered}/${questions.length} questions appear answered.`, "Add concise answers under each target question.", 5, 2));
  if (citations.length < 2) issues.push(makeIssue("citations", "Citation support is thin", "high", "Citations", `${citations.length} citations supplied.`, "Add at least 3 source-backed facts or citations.", 5, 2));
  if (entities.length && entityHits / entities.length < 0.6) issues.push(makeIssue("entities", "Entity coverage is incomplete", "medium", "Entities", `${entityHits}/${entities.length} entities found.`, "Add missing entities with context.", 4, 2));
  if (!input.schemaMarkup) issues.push(makeIssue("schema", "Schema is missing", "medium", "Schema", "No structured data supplied.", "Add FAQPage, Article, Organization, Product, or HowTo JSON-LD.", 3, 2));
  const breakdown = [
    { key: "answers", label: "Answer coverage", score: questions.length ? Math.round((answered / questions.length) * 30) : 10, max: 30, detail: `${answered}/${questions.length || 1} covered.` },
    { key: "citations", label: "Citation readiness", score: Math.min(25, citations.length * 8), max: 25, detail: `${citations.length} citations.` },
    { key: "entities", label: "Entity coverage", score: entities.length ? Math.round((entityHits / entities.length) * 20) : 8, max: 20, detail: `${entityHits}/${entities.length || 1} found.` },
    { key: "schema", label: "Schema readiness", score: input.schemaMarkup ? 15 : 0, max: 15, detail: input.schemaMarkup ? "Present." : "Missing." },
    { key: "format", label: "Extractability", score: /(\n-|\n\d+\.|\|)/.test(content) ? 10 : 4, max: 10, detail: "Checks lists, tables, snippets." }
  ];
  return finishToolOutput(tool, input, "optimizer", breakdown, issues, [
    tableSection("coverage", "AI answer readiness", ["Metric", "Value"], [["Questions covered", `${answered}/${questions.length}`], ["Entity hits", `${entityHits}/${entities.length}`], ["Citations", citations.length], ["Schema", input.schemaMarkup ? "present" : "missing"]]),
    listSection("snippets", "Answer snippet plan", questions.slice(0, 6).map((q) => `Create a 40-70 word direct answer for: ${q}`))
  ], checklistItems(["Add direct answer blocks.", "Attach source-backed facts.", "Add schema JSON-LD.", "Add entity definitions.", "Re-test in AI search surfaces."], "SEO"));
}

function campaignToolOutput(tool, input) {
  const budget = numeric(input, "budget");
  const duration = Math.max(1, numeric(input, "duration"));
  const channels = String(input.channels || "").split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
  const issues = [];
  if (budget < 1000) issues.push(makeIssue("budget", "Budget may be too low for multi-channel learning", "medium", "Budget", `$${budget} supplied.`, "Start with one primary paid channel plus owned channels.", 4, 1));
  if (channels.length < 2) issues.push(makeIssue("channels", "Campaign needs at least two channels", "medium", "Channel mix", `${channels.length} channel supplied.`, "Use one acquisition channel and one nurture channel.", 3, 1));
  if (!input.offer) issues.push(makeIssue("offer", "Offer is missing", "high", "Positioning", "No offer supplied.", "Define one measurable offer before launch.", 5, 1));
  const paid = channels.filter((c) => /ads|google|meta|linkedin|tiktok|paid/i.test(c));
  const paidShare = paid.length ? 0.55 : 0.25;
  const rows = channels.map((c) => {
    const isPaid = paid.includes(c);
    const pool = isPaid ? budget * paidShare : budget * (1 - paidShare);
    const count = isPaid ? paid.length || 1 : channels.length - paid.length || 1;
    return [c, `$${Math.round(pool / count).toLocaleString()}`, isPaid ? "Acquisition" : "Nurture"];
  });
  const breakdown = [
    { key: "positioning", label: "Positioning", score: ["product", "audience", "price", "offer", "goal"].filter((k) => input[k]).length * 5, max: 25, detail: "Product, audience, price, offer, goal." },
    { key: "channel", label: "Channel fit", score: Math.min(25, channels.length * 7), max: 25, detail: `${channels.length} channels.` },
    { key: "budget", label: "Budget feasibility", score: budget >= 5000 ? 20 : budget >= 1000 ? 12 : 6, max: 20, detail: `$${budget} over ${duration} days.` },
    { key: "measurement", label: "Measurement", score: input.goal ? 15 : 5, max: 15, detail: input.goal || "No goal." },
    { key: "execution", label: "Execution", score: duration >= 14 ? 15 : 8, max: 15, detail: `${duration} days.` }
  ];
  return finishToolOutput(tool, input, "campaign", breakdown, issues, [
    tableSection("budget", "Channel budget allocation", ["Channel", "Budget", "Stage"], rows),
    tableSection("kpis", "KPI targets", ["Metric", "Target"], [["Primary goal", input.goal], ["Daily budget", `$${Math.round(budget / duration).toLocaleString()}`], ["Qualified lead target", Math.max(10, Math.round(budget / 250))], ["Review cadence", "Twice weekly"]]),
    tableSection("angles", "Ad angle matrix", ["Angle", "Hook", "Proof"], [["Pain", `Stop losing ${input.audience || "buyers"} to unclear positioning`, "Problem-aware proof"], ["Outcome", `Reach ${String(input.goal || "growth").toLowerCase()} faster with ${input.product || "the product"}`, "Metric or case study"], ["Risk reversal", input.offer || "Low-friction offer", "Guarantee, trial, or demo"]])
  ], checklistItems(["Confirm tracking and UTMs.", "Publish focused landing page.", "Launch first creative set.", "Review lead quality within 72 hours.", "Move spend to winning channel."], "Marketing"), [
    { period: "Week 1", title: "Foundation", actions: ["Finalize offer and tracking.", "Build landing page and creative."] },
    { period: "Week 2", title: "Launch tests", actions: ["Launch first channel batch.", "Review CTR, CVR, lead quality."] },
    { period: "Week 3", title: "Optimize", actions: ["Pause weak hooks.", "Move budget to winners."] },
    { period: "Week 4", title: "Scale or learn", actions: ["Scale best channel.", "Write learning memo."] }
  ]);
}

function paidAdsToolOutput(tool, input) {
  const ctr = numeric(input, "ctr");
  const cvr = numeric(input, "conversionRate");
  const roas = numeric(input, "roas");
  const tracking = input.trackingStatus || "Unknown";
  const creativeCount = numeric(input, "creativeCount");
  const issues = [];
  if (ctr < 1) issues.push(makeIssue("ctr", "CTR is below healthy benchmark", "medium", "Creative", `${ctr}% CTR supplied.`, "Refresh hooks and tighten audience.", 4, 2));
  if (cvr < 2) issues.push(makeIssue("cvr", "Conversion rate is low", "high", "Conversion", `${cvr}% CVR supplied.`, "Audit landing message match, proof, and form friction.", 5, 3));
  if (/partial|broken|unknown/i.test(tracking)) issues.push(makeIssue("tracking", "Tracking is not reliable", "critical", "Measurement", `Tracking status: ${tracking}.`, "Fix pixels, conversion events, UTMs, and attribution before scaling.", 5, 2));
  if (creativeCount < 6) issues.push(makeIssue("creative", "Creative volume is too low", "medium", "Creative", `${creativeCount} active creatives.`, "Run at least 6-10 active variants.", 3, 2));
  if (roas && roas < 1.5) issues.push(makeIssue("roas", "ROAS is below scaling threshold", "high", "Efficiency", `${roas} ROAS supplied.`, "Pause weak segments and focus on highest-intent audiences.", 5, 2));
  const breakdown = [
    { key: "efficiency", label: "Media efficiency", score: (ctr >= 1.5 ? 10 : 5) + (cvr >= 3 ? 10 : 4) + (roas >= 2 ? 15 : 6), max: 35, detail: `CTR ${ctr}%, CVR ${cvr}%, ROAS ${roas || "n/a"}.` },
    { key: "tracking", label: "Tracking health", score: /complete/i.test(tracking) ? 25 : /partial/i.test(tracking) ? 12 : 4, max: 25, detail: tracking },
    { key: "creative", label: "Creative coverage", score: creativeCount >= 10 ? 20 : creativeCount >= 6 ? 14 : 6, max: 20, detail: `${creativeCount} creatives.` },
    { key: "landing", label: "Landing conversion", score: numeric(input, "landingPageConversion") >= 5 ? 20 : 10, max: 20, detail: `${numeric(input, "landingPageConversion") || 0}% landing CVR.` }
  ];
  return finishToolOutput(tool, input, "audit", breakdown, issues, [
    tableSection("kpis", "Paid ads KPI dashboard", ["Metric", "Value"], [["Monthly spend", `$${numeric(input, "monthlySpend").toLocaleString()}`], ["CTR", `${ctr}%`], ["CVR", `${cvr}%`], ["CPA", `$${numeric(input, "cpa")}`], ["ROAS", roas || "n/a"], ["Tracking", tracking], ["Creatives", creativeCount]]),
    tableSection("queue", "Optimization queue", ["Area", "Action"], [["Tracking", "Fix measurement before scaling."], ["Creative", "Test new hooks and formats."], ["Landing page", "Improve message match and proof."], ["Budget", "Shift spend to segments above target CPA."]])
  ], checklistItems(["Fix tracking gaps.", "Pause high-CPA ad sets.", "Launch 6 new creative variants.", "Audit landing page.", "Review budget every 72 hours."], "Growth"));
}

function brandToolOutput(tool, input) {
  const personality = String(input.personality || "").toLowerCase();
  const archetype = /trust|safe|reliable|foundation/.test(personality) ? "Sage/Caregiver" : /bold|rebel|disrupt/.test(personality) ? "Hero/Rebel" : /premium|luxury|exclusive/.test(personality) ? "Ruler" : "Creator";
  const issues = [];
  if (!input.competitors) issues.push(makeIssue("competitors", "Competitor contrast is missing", "medium", "Positioning", "No competitors supplied.", "Add 3-5 competitor references and define what to avoid.", 3, 1));
  if (wordCount(input.positioning) < 8) issues.push(makeIssue("positioning", "Positioning is too thin", "high", "Positioning", "Statement lacks detail.", "Write category, audience, benefit, and proof.", 5, 2));
  const breakdown = [
    { key: "positioning", label: "Positioning clarity", score: Math.min(30, wordCount(input.positioning) * 2), max: 30, detail: "Category, audience, benefit, proof." },
    { key: "differentiation", label: "Differentiation", score: input.competitors ? 20 : 8, max: 20, detail: input.competitors ? "Competitors supplied." : "No competitor contrast." },
    { key: "tone", label: "Tone usability", score: personality ? 20 : 6, max: 20, detail: personality || "No personality inputs." },
    { key: "visual", label: "Visual coherence", score: input.visualPreferences ? 20 : 8, max: 20, detail: input.visualPreferences || "No visual preferences." },
    { key: "system", label: "System readiness", score: 7, max: 10, detail: "Starter tokens generated." }
  ];
  return finishToolOutput(tool, input, "brand-kit", breakdown, issues, [
    tableSection("kit", "Brand kit", ["Element", "Recommendation"], [["Archetype", archetype], ["Tone", "Clear, specific, proof-led."], ["Color", "Deep neutral, trust accent, action accent."], ["Typography", "Humanist sans for UI, confident display for hero."], ["Logo", "Simple symbol plus wordmark."]]),
    tableSection("tokens", "Starter tokens", ["Token", "Value"], [["radius", "8px"], ["primary", "#7c3aed"], ["success", "#10b981"], ["surface", "#0f172a"], ["text", "#f8fafc"]]),
    listSection("hero", "Sample landing hero", [`Headline: ${input.businessName || "Brand"}`, `Subhead: ${input.positioning || "Positioning statement"}`, "CTA: Start assessment"])
  ], checklistItems(["Validate archetype.", "Choose accessible color tokens.", "Create logo brief.", "Write voice examples.", "Apply to one landing page."], "Brand"));
}

function designSystemToolOutput(tool, input) {
  const components = String(input.components || "").split(/[,\n]+/).filter(Boolean);
  const states = String(input.states || "").split(/[,\n]+/).filter(Boolean);
  const colors = String(input.brandColors || "").split(/[,\n]+/).filter(Boolean);
  const issues = [];
  if (components.length < 6) issues.push(makeIssue("components", "Core component coverage is incomplete", "medium", "Components", `${components.length} components supplied.`, "Add forms, tables, navigation, feedback, overlays, and empty states.", 4, 2));
  if (!states.some((s) => /focus/i.test(s))) issues.push(makeIssue("focus", "Focus state is missing", "high", "Accessibility", "No focus state supplied.", "Define visible focus rings for all interactive components.", 5, 1));
  if (colors.length < 3) issues.push(makeIssue("colors", "Color token set is too small", "medium", "Tokens", `${colors.length} colors supplied.`, "Define background, surface, text, border, primary, success, warning, danger.", 3, 2));
  const breakdown = [
    { key: "tokens", label: "Token coverage", score: Math.min(25, colors.length * 5 + (input.tokens ? 5 : 0)), max: 25, detail: `${colors.length} colors.` },
    { key: "components", label: "Component coverage", score: Math.min(25, components.length * 4), max: 25, detail: `${components.length} components.` },
    { key: "states", label: "State coverage", score: Math.min(20, states.length * 4), max: 20, detail: `${states.length} states.` },
    { key: "a11y", label: "Accessibility", score: /aa|aaa/i.test(input.accessibilityTarget || "") ? 20 : 10, max: 20, detail: input.accessibilityTarget || "" },
    { key: "implementation", label: "Implementation", score: input.density ? 10 : 4, max: 10, detail: input.density || "" }
  ];
  return finishToolOutput(tool, input, "design-system", breakdown, issues, [
    tableSection("tokens", "Design tokens", ["Token", "Value"], [["radius.card", "8px"], ["space.1", "4px"], ["space.2", "8px"], ["color.primary", colors[0] || "#7c3aed"], ["density", input.density || "Compact"]]),
    tableSection("components", "Component map", ["Component", "States"], components.slice(0, 12).map((c) => [c.trim(), states.join(", ") || "default, hover, focus, disabled"])),
    listSection("rules", "Implementation rules", ["Use 8px or smaller radius.", "Never nest cards inside cards.", "Every input needs label, helper/error, disabled, focus, and loading states.", "Contrast target must match accessibility target."])
  ], checklistItems(["Approve token names.", "Build buttons and inputs.", "Add table/modal/toast/empty states.", "Run contrast checks.", "Document examples."], "Design"));
}

function architectureToolOutput(tool, input) {
  const combined = `${input.architecture || ""} ${input.deployment || ""} ${input.risks || ""}`;
  const issues = [];
  if (!/queue|worker|job|async/i.test(combined)) issues.push(makeIssue("queue", "No async boundary detected", "medium", "Scalability", "No queue or worker mentioned.", "Add a queue/worker boundary for slow or retryable work.", 4, 3));
  if (!/rbac|role|permission|mfa|oauth|sso/i.test(input.auth || "")) issues.push(makeIssue("auth", "Auth model lacks role detail", "high", "Security", input.auth || "No auth details.", "Document roles, permissions, MFA/SSO, and admin boundaries.", 5, 2));
  if (!input.monitoring) issues.push(makeIssue("observability", "Observability plan is missing", "high", "Observability", "No monitoring supplied.", "Add logs, metrics, traces, alerts, and dashboards.", 5, 2));
  const breakdown = [
    { key: "scalability", label: "Scalability", score: /cache|queue|worker|cdn|replica/i.test(combined) ? 25 : 12, max: 25, detail: "Caching, queues, workers, CDN, replicas." },
    { key: "security", label: "Security", score: /rbac|role|permission|mfa|oauth|sso/i.test(input.auth || "") ? 25 : 10, max: 25, detail: input.auth || "No auth detail." },
    { key: "maintainability", label: "Maintainability", score: /service|module|api|contract/i.test(combined) ? 20 : 10, max: 20, detail: "Module and contract clarity." },
    { key: "observability", label: "Observability", score: input.monitoring ? 15 : 3, max: 15, detail: input.monitoring || "Missing." },
    { key: "deployment", label: "Deployment safety", score: /rollback|migration|staging|canary|flag/i.test(combined) ? 15 : 7, max: 15, detail: input.deployment || "" }
  ];
  return finishToolOutput(tool, input, "architecture-review", breakdown, issues, [
    tableSection("risks", "Risk register", ["Risk", "Severity", "Mitigation"], issues.map((i) => [i.title, i.severity, i.fix])),
    tableSection("scores", "Category scores", ["Category", "Score"], breakdown.map((i) => [i.label, `${i.score}/${i.max}`])),
    listSection("roadmap", "Implementation roadmap", ["Document interfaces.", "Add permission matrix.", "Add observability.", "Add rollback plan.", "Load-test peak path."])
  ], checklistItems(["Review auth and permissions.", "Add metrics/logs/traces.", "Create rollback plan.", "Load-test peak path.", "Write tickets for top risks."], "Engineering"));
}

function securityToolOutput(tool, input) {
  const all = Object.values(input).join(" ").toLowerCase();
  const issues = [];
  if (!/mfa|2fa|sso|oauth/i.test(input.auth || "")) issues.push(makeIssue("mfa", "MFA/SSO is not described", "high", "Auth", "Auth lacks MFA/SSO detail.", "Require MFA for admins and SSO/OAuth for privileged access.", 5, 2));
  if (/pii|billing|payment|health|customer/i.test(input.dataTypes || "") && !/encrypt|token|mask|redact/i.test(all)) issues.push(makeIssue("data", "Sensitive data controls are unclear", "critical", "Data protection", "Sensitive data is present without controls.", "Define encryption, retention, redaction, access logs, and minimization.", 5, 3));
  if (!/rate|waf|captcha|limit/i.test(input.exposure || "")) issues.push(makeIssue("abuse", "Abuse protection is missing", "medium", "Exposure", "Public exposure lacks rate limits or WAF notes.", "Add rate limits, bot checks, WAF rules, and abuse monitoring.", 4, 2));
  const breakdown = [
    { key: "auth", label: "Auth and access", score: /mfa|2fa|sso|oauth|rbac|role/i.test(input.auth || "") ? 25 : 10, max: 25, detail: input.auth || "" },
    { key: "data", label: "Data exposure", score: /encrypt|token|mask|redact|retention/i.test(all) ? 25 : 8, max: 25, detail: input.dataTypes || "" },
    { key: "dependencies", label: "Dependency risk", score: input.dependencies ? 15 : 4, max: 15, detail: input.dependencies || "Missing." },
    { key: "cloud", label: "Cloud controls", score: /secret|iam|cloudflare|aws|gcp/i.test(input.cloud || all) ? 20 : 8, max: 20, detail: input.cloud || "" },
    { key: "compliance", label: "Compliance", score: input.compliance ? 10 : 7, max: 15, detail: input.compliance || "No target." }
  ];
  return finishToolOutput(tool, input, "security-audit", breakdown, issues, [
    tableSection("register", "Security risk register", ["Risk", "Severity", "Fix"], issues.map((i) => [i.title, i.severity, i.fix])),
    listSection("controls", "Recommended controls", ["Admin MFA/SSO", "Rate limits", "Secrets rotation", "Dependency scanning", "Audit logs", "Incident response runbook"])
  ], checklistItems(["Require MFA.", "Inventory sensitive data.", "Add rate limits.", "Run dependency scanning.", "Document incident response."], "Security"));
}

function researchToolOutput(tool, input) {
  const methods = String(input.methods || "").split(/[,\n]+/).map((m) => m.trim()).filter(Boolean);
  const issues = [];
  if (!/\b(compare|improve|reduce|increase|outperform|measure|test)\b/i.test(input.hypothesis || "")) issues.push(makeIssue("hypothesis", "Hypothesis is not clearly testable", "high", "Research question", "Hypothesis lacks measurable direction.", "Rewrite as a falsifiable claim with baseline and metric.", 5, 2));
  if (!input.availableData) issues.push(makeIssue("data", "Available data is missing", "critical", "Data", "No data supplied.", "Identify datasets, splits, labels, and access constraints.", 5, 3));
  if (!methods.length) issues.push(makeIssue("methods", "Candidate methods are missing", "medium", "Methods", "No methods supplied.", "List baseline, proposed method, ablation, and fallback.", 3, 2));
  const matrix = (methods.length ? methods : ["Baseline prompting", "RAG", "LoRA fine-tuning", "Ablation study"]).map((method, index) => ({ option: method, score: Math.max(30, 90 - index * 10), rationale: "Ranked by feasibility against constraints and data readiness.", recommendation: index === 0 ? "Run first as baseline." : "Run after baseline if resources remain." }));
  const breakdown = [
    { key: "question", label: "Question clarity", score: (input.hypothesis || "").length > 40 ? 25 : 12, max: 25, detail: input.hypothesis || "" },
    { key: "data", label: "Data readiness", score: input.availableData ? 20 : 0, max: 20, detail: input.availableData || "Missing." },
    { key: "feasibility", label: "Feasibility", score: input.constraints ? 20 : 10, max: 25, detail: input.constraints || "" },
    { key: "evaluation", label: "Evaluation quality", score: 12, max: 20, detail: "Baseline metrics generated." },
    { key: "reproducibility", label: "Reproducibility", score: 6, max: 10, detail: "Checklist generated." }
  ];
  return finishToolOutput(tool, input, "research-plan", breakdown, issues, [
    listSection("queries", "Literature search queries", [`"${input.topic}" benchmark`, `"${input.topic}" evaluation metrics`, `"${String(input.hypothesis || "").slice(0, 70)}"`]),
    tableSection("metrics", "Evaluation metrics", ["Metric", "Purpose"], [["Primary task metric", "Measures target outcome."], ["Baseline delta", "Compares against simplest method."], ["Cost/latency", "Captures practical tradeoff."], ["Failure cases", "Qualitative error analysis."]]),
    listSection("outline", "Paper outline", ["Abstract", "Introduction", "Related work", "Method", "Experiments", "Results", "Limitations", "Reproducibility appendix"])
  ], checklistItems(["Lock research question.", "Run baseline first.", "Version datasets/configs.", "Track seeds and negative results.", "Write against paper outline."], "Research"), undefined, matrix);
}

function boardMemoToolOutput(tool, input) {
  const runway = numeric(input, "runway");
  const team = numeric(input, "teamSize");
  const issues = [];
  if (runway && runway < 6) issues.push(makeIssue("runway", "Runway is critical", "critical", "Financial risk", `${runway} months runway.`, "Freeze nonessential spend and approve a 30-day runway extension plan.", 5, 2));
  else if (runway < 12) issues.push(makeIssue("runway-watch", "Runway requires board attention", "high", "Financial risk", `${runway} months runway.`, "Create a 60-day plan to improve burn multiple or revenue quality.", 4, 2));
  if (team > 0 && runway < 12) issues.push(makeIssue("team", "Team size and runway create execution pressure", "medium", "People", `${team} people and ${runway} months runway.`, "Assign owners to revenue, cost, product, and retention workstreams.", 4, 2));
  const matrix = [
    { option: "Do nothing", score: runway < 12 ? 20 : 45, rationale: "Preserves focus but does not reduce current risk.", recommendation: "Reject unless problem is trending down." },
    { option: "Focused 30-day intervention", score: 85, rationale: "Creates evidence while limiting disruption.", recommendation: "Recommended default." },
    { option: "Large strategic pivot", score: runway < 6 ? 35 : 60, rationale: "May be necessary but carries execution risk.", recommendation: "Use only if current strategy is clearly failing." }
  ];
  const breakdown = [
    { key: "urgency", label: "Urgency", score: runway < 6 ? 30 : runway < 12 ? 22 : 12, max: 30, detail: `${runway} months runway.` },
    { key: "execution", label: "Execution clarity", score: (input.goal || "").length > 25 ? 18 : 8, max: 20, detail: input.goal || "" },
    { key: "financial", label: "Financial risk", score: input.revenue ? 15 : 6, max: 20, detail: input.revenue || "" },
    { key: "decision", label: "Decision quality", score: (input.currentProblem || "").length > 30 ? 16 : 8, max: 20, detail: input.currentProblem || "" },
    { key: "communication", label: "Board readiness", score: 8, max: 10, detail: "Memo structure generated." }
  ];
  return finishToolOutput(tool, input, "executive-memo", breakdown, issues, [
    tableSection("memo", "Executive memo", ["Section", "Content"], [["Decision needed", input.goal || ""], ["Current state", input.currentProblem || ""], ["Recommendation", "Approve a focused 30-day intervention with named owners and weekly board updates."], ["Board ask", "Approve owner map, metric targets, and constraints."]]),
    tableSection("owners", "Owner map", ["Workstream", "Owner role"], [["Revenue", "CEO / Growth lead"], ["Product", "CPO / Product lead"], ["Finance", "CFO / Ops"], ["People", "COO / People lead"]])
  ], checklistItems(["Approve recommended option.", "Assign owner roles.", "Set weekly metrics.", "Prepare board update template.", "Review at 30/60/90 days."], "CEO"), [
    { period: "30 days", title: "Stabilize", actions: ["Freeze low-return work.", "Pick one revenue or risk metric.", "Start weekly review."] },
    { period: "60 days", title: "Improve", actions: ["Scale working intervention.", "Pause failing workstreams.", "Update board on evidence."] },
    { period: "90 days", title: "Decide", actions: ["Choose continue, pivot, or fundraising/cost action.", "Document next operating plan."] }
  ], matrix);
}

function genericToolOutput(tool, input) {
  const fields = tool.inputSchema?.fields || [];
  const filled = fields.filter((field) => input[field.name]).length;
  const detailed = fields.filter((field) => wordCount(input[field.name]) >= 8).length;
  const issues = fields.filter((field) => field.required && !input[field.name]).map((field) => makeIssue(`missing-${field.name}`, `${field.label} is missing`, "high", "Input validation", "Required input is empty.", `Fill ${field.label.toLowerCase()} before using the result.`, 5, 1));
  if (detailed < 2) issues.push(makeIssue("specificity", "Inputs are too thin for a strong workflow result", "medium", "Specificity", `${detailed} fields contain detailed context.`, "Add concrete data, constraints, examples, or current state notes.", 4, 1));
  const breakdown = [
    { key: "completeness", label: "Input completeness", score: Math.round((filled / Math.max(1, fields.length)) * 30), max: 30, detail: `${filled}/${fields.length} fields completed.` },
    { key: "specificity", label: "Specificity", score: Math.min(25, detailed * 8), max: 25, detail: `${detailed} detailed fields.` },
    { key: "evidence", label: "Evidence quality", score: input.data || input.context ? 20 : 8, max: 20, detail: "Checks context/data fields." },
    { key: "workflow", label: "Workflow coverage", score: tool.workflowSteps?.length ? 15 : 7, max: 15, detail: `${tool.workflowSteps?.length || 0} workflow steps.` },
    { key: "actionability", label: "Actionability", score: input.goal ? 10 : 5, max: 10, detail: input.goal || "No goal supplied." }
  ];
  return finishToolOutput(tool, input, "workflow", breakdown, issues, [
    tableSection("validation", "Input validation", ["Field", "Status"], fields.map((field) => [field.label, input[field.name] ? "supplied" : field.required ? "missing" : "optional"])),
    listSection("workflow", "Workflow steps", tool.workflowSteps || []),
    listSection("actions", "Action plan", ["Validate assumptions with the owner.", "Run the first priority action.", "Export the result.", "Re-run when new data is available."])
  ], checklistItems(["Review missing context.", "Assign owner.", "Execute first recommendation.", "Export result.", "Schedule follow-up."], "Owner"));
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
  showToast("Tool result saved to history.");
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  showToast("Copied to clipboard.");
}

function exportResult(output, format = "markdown") {
  const safeFormat = ["markdown", "json", "csv", "html"].includes(format) ? format : "markdown";
  const content = output.exports?.[safeFormat] || output.exports?.markdown || output.markdown || "";
  const extension = { markdown: "md", json: "json", csv: "csv", html: "html" }[safeFormat];
  const mime = {
    markdown: "text/markdown;charset=utf-8",
    json: "application/json;charset=utf-8",
    csv: "text/csv;charset=utf-8",
    html: "text/html;charset=utf-8"
  }[safeFormat];
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${output.summary.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "upmyskills-output"}.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`${safeFormat.toUpperCase()} exported.`);
}

function historyCard(run) {
  return `
    <a class="card pad history-card" href="#/tool/${encodeURIComponent(run.toolSlug)}" data-run-id="${escapeHtml(run.id)}">
      <p class="section-kicker">${escapeHtml(run.domain)}</p>
      <h3>${escapeHtml(run.title)}</h3>
      <p class="muted small">${escapeHtml(run.output?.summary || "Tool result")}</p>
      <span class="pill">${escapeHtml(formatDate(run.createdAt))}</span>
    </a>
  `;
}

function renderHistory() {
  const items = runs();
  app.innerHTML = `
    <section>
      <p class="section-kicker">History</p>
      <h1>Saved tool runs</h1>
      <p class="muted">History is stored in this browser with localStorage. No account or paid API key is required for this deployed runner.</p>
      <div class="actions">
        <button data-action="clear-history" ${items.length ? "" : "disabled"}>Clear history</button>
        <a class="button primary" href="#/tools">Run another tool</a>
      </div>
      <div class="grid cards-3 section">${items.map(historyCard).join("") || emptyState("No saved tool runs yet.")}</div>
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
        <div class="card pad"><h3>Available tools</h3><p class="muted">${state.totalTools.toLocaleString()} executable workflows</p></div>
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
    await copyText(state.output.exports?.markdown || state.output.markdown || "");
  }

  if (action === "export" && state.output) {
    const format = event.target.closest("[data-action]")?.dataset.format || "markdown";
    exportResult(state.output, format);
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
