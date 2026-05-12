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

const state = {
  tools: [],
  totalTools: 0,
  sources: [],
  sourceCounts: {},
  domainCounts: [],
  domainCache: {},
  featuredTools: [],
  toolIndex: {},
  allToolsLoaded: false,
  skippedCount: 0,
  generatedAt: "",
  query: "",
  domain: "All",
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
  return state.tools.find((tool) => tool.slug === slug || tool.id === slug) ||
    Object.values(state.domainCache).flat().find((tool) => tool.slug === slug || tool.id === slug);
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
  if (state.domainCache[domain]) return state.domainCache[domain];
  const payload = await fetchJson(`data/tools-${domainSlug(domain)}.json`);
  const tools = (payload.tools || []).sort((a, b) => a.title.localeCompare(b.title));
  state.domainCache[domain] = tools;
  mergeTools(tools);
  return tools;
}

async function ensureAllTools() {
  if (state.allToolsLoaded) return state.tools;
  await Promise.all(Object.keys(domainMeta).map((domain) => ensureDomainTools(domain)));
  state.allToolsLoaded = true;
  return state.tools;
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
  return state.domainCounts.find((item) => item.domain === domain)?.count || state.domainCache[domain]?.length || 0;
}

function recentRuns(limit = 5) {
  return runs().slice(0, limit);
}

function matchingTools() {
  const query = state.query.trim().toLowerCase();
  const baseTools = state.domain === "All" ? state.tools : state.domainCache[state.domain] || [];
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

function renderTools(domainLock = "") {
  if (domainLock) state.domain = domainLock;
  const matched = matchingTools();
  const visible = matched.slice(0, 180);
  app.innerHTML = `
    <section>
      <p class="section-kicker">Tool library</p>
      <h1>${domainLock ? escapeHtml(domainLock) : "Executable tools"}</h1>
      <p class="muted">${matched.length.toLocaleString()} matching tools. Showing ${visible.length.toLocaleString()} at a time for fast browsing.</p>
      ${toolsToolbar(domainLock)}
      <div id="toolCount" class="small muted">${matched.length.toLocaleString()} tools match your filter.</div>
      <div id="toolGrid" class="grid cards-3 section">${visible.map(toolCard).join("") || emptyState("No tools match this filter.")}</div>
    </section>
  `;
}

async function renderToolsRoute(domainLock = "") {
  app.innerHTML = loadingState(domainLock ? `Loading ${domainLock} tools...` : "Loading tool library...");
  if (domainLock) {
    state.domain = domainLock;
    await ensureDomainTools(domainLock);
  } else if (state.domain === "All") {
    await ensureAllTools();
  } else {
    await ensureDomainTools(state.domain);
  }
  renderTools(domainLock);
}

function refreshToolGrid() {
  const matched = matchingTools();
  const visible = matched.slice(0, 180);
  const count = document.getElementById("toolCount");
  const grid = document.getElementById("toolGrid");
  if (count) count.textContent = `${matched.length.toLocaleString()} tools match your filter.`;
  if (grid) grid.innerHTML = visible.map(toolCard).join("") || emptyState("No tools match this filter.");
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
  let tool = toolBySlug(slug);
  if (!tool) {
    const indexedDomain = state.toolIndex[slug];
    if (indexedDomain) {
      await ensureDomainTools(indexedDomain);
      tool = toolBySlug(slug);
    }
  }
  return tool ? renderToolPage(tool) : (app.innerHTML = emptyState("Tool not found."));
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
    <div class="output-section">
      <h3>Markdown deliverable</h3>
      <pre>${escapeHtml(output.markdown)}</pre>
    </div>
  `;
}

function generatedRecommendations(tool, input) {
  const primary = input.business || input.website || input.product || input.topic || input.company || input.project || "the target initiative";
  const audience = input.audience || input.customer || input.targetAudience || input.market || "the intended audience";
  const base = [
    `Define the exact decision this ${tool.title} output must support for ${primary}.`,
    `Prioritize evidence that can be checked by the team before acting.`,
    `Turn the final answer into owners, dates, and review points instead of leaving it as advice.`
  ];
  const byDomain = {
    "SEO & GEO": [
      `Map the highest-intent query set for ${audience} and align each page to one search intent.`,
      "Add schema, citation targets, FAQ evidence, and AI answer snippets before publishing.",
      "Track rankings, indexed pages, AI Overview mentions, and assisted conversions weekly."
    ],
    Marketing: [
      `Split the campaign into awareness, capture, conversion, and retention motions for ${audience}.`,
      "Use separate hooks, offers, and proof points for cold, warm, and returning traffic.",
      "Review spend, creative fatigue, CAC, CVR, and payback before scaling."
    ],
    "Branding & Design": [
      `Create a clear positioning spine before choosing visuals for ${primary}.`,
      "Translate brand values into typography, color, imagery, interface density, and motion rules.",
      "Stress test the system across landing pages, social posts, email, and product screens."
    ],
    "Engineering & AI Agent": [
      "Separate product requirements, technical risks, data boundaries, and rollout gates.",
      "Prefer small interfaces, observable workflows, automated checks, and reversible releases.",
      "Document the agent role, allowed tools, failure modes, escalation points, and eval cases."
    ],
    "AI Research": [
      `Frame the research question around a testable claim, not a broad topic like ${primary}.`,
      "Keep literature notes, experiment configs, datasets, and negative results traceable.",
      "Write the paper outline before running final experiments so evidence maps to sections."
    ],
    "C-Level Advisory": [
      `Summarize the board-level decision, tradeoff, and downside risk for ${primary}.`,
      "Convert strategy into operating metrics, budget implications, and accountable owners.",
      "State what would change the recommendation if new evidence appears."
    ]
  };
  return [...(byDomain[tool.domain] || base), ...base].slice(0, 6);
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

## Execution Checklist
${output.checklist.map((item) => `- [ ] ${item}`).join("\n")}

## Attribution
Source: ${shortSource(tool.sourceRepo)}
Path: ${tool.sourcePath || "Generated wrapper"}
License: ${tool.license || "Unknown"}

Generated by UpMySkills.`;
}

function generateOutput(tool, input) {
  const workflow = (tool.workflowSteps?.length ? tool.workflowSteps : [
    "Clarify the objective and target audience.",
    "Collect the strongest available inputs and constraints.",
    "Produce a prioritized execution plan.",
    "Create a review checklist and next actions."
  ]).slice(0, 8);
  const recommendations = generatedRecommendations(tool, input);
  const checklist = [
    "Confirm the input assumptions with the owner.",
    "Review the generated plan against source constraints.",
    "Assign one owner for each priority action.",
    "Export the Markdown and attach it to the working doc.",
    "Re-run the tool after fresh data or stakeholder feedback."
  ];
  const primary = input.business || input.website || input.product || input.topic || input.company || input.project || tool.title;
  const output = {
    toolId: tool.id,
    summary: `${tool.title} plan for ${primary}`,
    workflow,
    recommendations,
    checklist,
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

document.addEventListener("input", (event) => {
  if (event.target?.id === "toolSearch") {
    state.query = event.target.value;
    refreshToolGrid();
  }
});

document.addEventListener("change", async (event) => {
  if (event.target?.id === "domainFilter") {
    state.domain = event.target.value;
    if (state.domain === "All") {
      await ensureAllTools();
    } else {
      await ensureDomainTools(state.domain);
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
    state.toolIndex = payload.toolIndex || [];
    state.skippedCount = payload.skippedCount || 0;
    state.generatedAt = payload.generatedAt || "";
    render();
  })
  .catch((error) => {
    app.innerHTML = `<section class="error card"><div><h1>Tools failed to load</h1><p class="muted">${escapeHtml(error.message)}</p></div></section>`;
  });
