const tools = [
  {
    id: "marketing-skills",
    name: "Marketing Skills",
    repo: "kostja94/marketing-skills",
    url: "https://github.com/kostja94/marketing-skills",
    homepage: "https://alignify.co/skills",
    category: "Marketing",
    signal: "160+ skills",
    stars: 457,
    updated: "2026-05-11T11:26:30Z",
    source: "Repo from screenshot 1",
    summary:
      "Agent skills for SEO, content, social, influencer, paid ads, channel planning, and 40+ page types.",
    capabilities: ["SEO and content campaigns", "Paid channel planning", "Landing page and page type playbooks"],
    tags: ["SEO", "Content", "Paid ads"]
  },
  {
    id: "marketingskills",
    name: "Marketing Skills by Corey Haines",
    repo: "coreyhaines31/marketingskills",
    url: "https://github.com/coreyhaines31/marketingskills",
    homepage: "https://marketing-skills.com",
    category: "Marketing",
    signal: "CRO + copy",
    stars: 27850,
    updated: "2026-05-11T16:00:41Z",
    source: "Repo from screenshot 1",
    summary:
      "Claude Code and agent skills focused on CRO, copywriting, SEO, analytics, growth engineering, and email.",
    capabilities: ["CRO review workflows", "Copy and email sequence prompts", "Analytics and growth engineering"],
    tags: ["CRO", "Copywriting", "Email"]
  },
  {
    id: "claude-ads",
    name: "Claude Ads",
    repo: "AgriciDaniel/claude-ads",
    url: "https://github.com/AgriciDaniel/claude-ads",
    homepage: "https://agricidaniel.com/blog/claude-code-ad-agency",
    category: "Marketing",
    signal: "250+ checks",
    stars: 4716,
    updated: "2026-05-11T15:29:11Z",
    source: "Mentioned in screenshot 1",
    summary:
      "Paid advertising audit and optimization skill across Google, Meta, YouTube, LinkedIn, TikTok, Microsoft, and Apple Ads.",
    capabilities: ["Weighted ad account scoring", "Platform-specific audit checks", "CMO-ready report outputs"],
    tags: ["Google Ads", "Meta", "TikTok"]
  },
  {
    id: "claude-seo",
    name: "Claude SEO",
    repo: "AgriciDaniel/claude-seo",
    url: "https://github.com/AgriciDaniel/claude-seo",
    homepage: "https://claude-seo.md",
    category: "SEO & GEO",
    signal: "25 skills + 18 agents",
    stars: 6362,
    updated: "2026-05-11T15:37:53Z",
    source: "Repo from screenshot 2",
    summary:
      "Universal SEO skill for technical SEO, E-E-A-T, schema, GEO/AEO, backlinks, local SEO, and reporting.",
    capabilities: ["Technical SEO and schema", "GEO/AEO content optimization", "PDF and Excel reporting"],
    tags: ["SEO", "AEO", "Schema"]
  },
  {
    id: "geo-seo-claude",
    name: "GEO SEO Claude",
    repo: "zubair-trabzada/geo-seo-claude",
    url: "https://github.com/zubair-trabzada/geo-seo-claude",
    homepage: "https://www.skool.com/aiworkshop",
    category: "SEO & GEO",
    signal: "AI citations",
    stars: 7144,
    updated: "2026-05-11T15:47:37Z",
    source: "Valid renamed repo from screenshot 2",
    summary:
      "GEO-first SEO skill for AI search optimization, citability scoring, crawler analysis, brand authority, and reports.",
    capabilities: ["AI Search citation analysis", "Crawler readiness scoring", "Platform-specific optimization"],
    tags: ["GEO", "AI Search", "Citability"]
  },
  {
    id: "brand-build-skills",
    name: "Brand Build Skills",
    repo: "rampstackco/claude-skills",
    url: "https://github.com/rampstackco/claude-skills",
    homepage: "https://rampstack.co/",
    category: "Branding & Design",
    signal: "59 skills",
    stars: 155,
    updated: "2026-05-11T06:30:09Z",
    source: "Valid renamed repo from screenshot 3",
    summary:
      "Stack-agnostic skills for the full website lifecycle: brand, design, content, SEO, dev, ops, growth, and research.",
    capabilities: ["Brand identity planning", "Website lifecycle workflows", "Growth and research handoff"],
    tags: ["Brand", "Website", "Growth"]
  },
  {
    id: "open-design",
    name: "Open Design",
    repo: "nexu-io/open-design",
    url: "https://github.com/nexu-io/open-design",
    homepage: "https://open-design.ai",
    category: "Branding & Design",
    signal: "19 skills + 71 systems",
    stars: 37185,
    updated: "2026-05-11T16:14:34Z",
    source: "Repo from screenshot 3",
    summary:
      "Local-first open-source design system and prototype generator with brand-grade systems and export workflows.",
    capabilities: ["Design system generation", "Web, desktop, and mobile prototypes", "HTML, PDF, PPTX, and MP4 export"],
    tags: ["Design systems", "Prototype", "Export"]
  },
  {
    id: "awesome-claude-skills",
    name: "Awesome Claude Skills",
    repo: "ComposioHQ/awesome-claude-skills",
    url: "https://github.com/ComposioHQ/awesome-claude-skills",
    homepage: "",
    category: "Branding & Design",
    signal: "Curated index",
    stars: 59236,
    updated: "2026-05-11T16:11:39Z",
    source: "Index from screenshot 3",
    summary:
      "Curated list of Claude Skills, resources, and workflow tools. Used here as an index source for brand-build skills.",
    capabilities: ["Skill discovery", "Workflow automation references", "Cross-agent resource list"],
    tags: ["Index", "Claude", "Automation"]
  },
  {
    id: "claude-skills-engineering",
    name: "Claude Skills Mega Library",
    repo: "alirezarezvani/claude-skills",
    url: "https://github.com/alirezarezvani/claude-skills",
    homepage: "https://alirezarezvani.medium.com/",
    category: "Engineering & AI Agent",
    signal: "245+ skills",
    stars: 14425,
    updated: "2026-05-11T15:43:06Z",
    source: "Repo from screenshots 4 and 6",
    summary:
      "Open-source skill and agent plugin library for engineering, marketing, product, compliance, and C-level advisory.",
    capabilities: ["Frontend, backend, devops, security, AI/ML", "Agent personas", "C-level advisory skill groups"],
    tags: ["Engineering", "Security", "Advisory"]
  },
  {
    id: "awesome-agent-skills",
    name: "Awesome Agent Skills",
    repo: "VoltAgent/awesome-agent-skills",
    url: "https://github.com/VoltAgent/awesome-agent-skills",
    homepage: "https://officialskills.sh/",
    category: "Engineering & AI Agent",
    signal: "1000+ skills",
    stars: 21245,
    updated: "2026-05-11T15:54:02Z",
    source: "Index source for Garry Tan skills from screenshots 4 and 6",
    summary:
      "Curated collection of agent skills from official teams and the community, including Garry Tan skill references.",
    capabilities: ["Cross-agent skill discovery", "Codex, Claude, Gemini, Cursor compatibility", "Community skill catalog"],
    tags: ["Index", "Codex", "Claude"]
  },
  {
    id: "ai-research-skills",
    name: "AI Research Skills",
    repo: "Orchestra-Research/AI-Research-SKILLs",
    url: "https://github.com/Orchestra-Research/AI-Research-SKILLs",
    homepage: "http://orchestra-research.com",
    category: "AI Research",
    signal: "98 skills",
    stars: 8228,
    updated: "2026-05-11T14:35:01Z",
    source: "Repo from screenshot 5",
    summary:
      "AI research and engineering skills covering literature survey, ideation, experiments, synthesis, and LaTeX paper output.",
    capabilities: ["Literature survey loop", "Experiment planning", "LaTeX research paper output"],
    tags: ["Research", "LaTeX", "Experiments"]
  },
  {
    id: "garrytan-advisory",
    name: "Garry Tan Advisory Skills",
    repo: "garrytan profile via VoltAgent index",
    url: "https://github.com/garrytan",
    homepage: "https://github.com/VoltAgent/awesome-agent-skills",
    category: "C-Level Advisory",
    signal: "28 skills",
    stars: 0,
    updated: "2026-05-11T15:54:02Z",
    source: "Profile/index mention from screenshots 4 and 6",
    summary:
      "Operator-style advisory skills referenced in the screenshots for product review, CTO planning, and design consultation.",
    capabilities: ["Product review office hours", "Plan CTO review", "Design consultation"],
    tags: ["CEO", "CTO", "Product"]
  }
];

const goalMap = {
  full: tools.map((tool) => tool.id),
  marketing: ["marketing-skills", "marketingskills", "claude-ads", "claude-seo", "geo-seo-claude"],
  seo: ["claude-seo", "geo-seo-claude", "marketing-skills", "awesome-claude-skills"],
  brand: ["brand-build-skills", "open-design", "awesome-claude-skills", "marketingskills"],
  engineering: ["claude-skills-engineering", "awesome-agent-skills", "open-design", "ai-research-skills"],
  research: ["ai-research-skills", "claude-skills-engineering", "awesome-agent-skills"],
  advisory: ["garrytan-advisory", "claude-skills-engineering", "awesome-agent-skills", "marketingskills"]
};

const state = {
  category: "All",
  query: "",
  sort: "stars",
  selected: new Set(goalMap.full)
};

const categories = ["All", ...Array.from(new Set(tools.map((tool) => tool.category)))];

const nodes = {
  categoryTabs: document.querySelector("#categoryTabs"),
  toolGrid: document.querySelector("#toolGrid"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  libraryTitle: document.querySelector("#libraryTitle"),
  sourceCount: document.querySelector("#sourceCount"),
  categoryCount: document.querySelector("#categoryCount"),
  selectedCount: document.querySelector("#selectedCount"),
  selectedRepoCount: document.querySelector("#selectedRepoCount"),
  selectedList: document.querySelector("#selectedList"),
  commandOutput: document.querySelector("#commandOutput"),
  promptOutput: document.querySelector("#promptOutput"),
  goalSelect: document.querySelector("#goalSelect"),
  toast: document.querySelector("#toast")
};

function formatStars(count) {
  if (!count) return "Index";
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k stars`;
  return `${count} stars`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function normalize(value) {
  return value.toLowerCase();
}

function getFilteredTools() {
  const query = normalize(state.query.trim());
  const filtered = tools.filter((tool) => {
    const matchesCategory = state.category === "All" || tool.category === state.category;
    const text = normalize(
      `${tool.name} ${tool.repo} ${tool.category} ${tool.summary} ${tool.tags.join(" ")} ${tool.capabilities.join(" ")}`
    );
    return matchesCategory && (!query || text.includes(query));
  });

  return filtered.sort((a, b) => {
    if (state.sort === "updated") return new Date(b.updated) - new Date(a.updated);
    if (state.sort === "name") return a.name.localeCompare(b.name);
    return b.stars - a.stars;
  });
}

function renderTabs() {
  nodes.categoryTabs.innerHTML = categories
    .map(
      (category) => `
        <button type="button" data-category="${category}" aria-selected="${category === state.category}">
          ${category}
        </button>
      `
    )
    .join("");
}

function renderTools() {
  const filtered = getFilteredTools();
  nodes.libraryTitle.textContent = state.category === "All" ? "Semua tools" : state.category;

  if (!filtered.length) {
    nodes.toolGrid.innerHTML = `
      <article class="tool-card">
        <div class="tool-title">
          <h3>Tidak ada tool yang cocok</h3>
          <p class="tool-description">Ubah kata kunci atau pilih kategori lain.</p>
        </div>
      </article>
    `;
    return;
  }

  nodes.toolGrid.innerHTML = filtered
    .map((tool) => {
      const selected = state.selected.has(tool.id);
      const cloneCommand =
        tool.repo.includes("/") && !tool.repo.includes(" profile ")
          ? `git clone ${tool.url}.git`
          : `open ${tool.url}`;

      return `
        <article class="tool-card ${selected ? "is-selected" : ""}">
          <div class="tool-head">
            <div class="tool-title">
              <h3>${tool.name}</h3>
              <a href="${tool.url}" target="_blank" rel="noreferrer">${tool.repo}</a>
            </div>
            <button class="select-toggle" type="button" aria-pressed="${selected}" data-toggle="${tool.id}" title="Toggle ${tool.name}">
              <span aria-hidden="true"></span>
            </button>
          </div>

          <p class="tool-description">${tool.summary}</p>

          <div class="tool-meta">
            <span class="pill strong">${tool.signal}</span>
            <span class="pill">${formatStars(tool.stars)}</span>
            <span class="pill">Updated ${formatDate(tool.updated)}</span>
          </div>

          <ul class="capability-list">
            ${tool.capabilities.map((capability) => `<li>${capability}</li>`).join("")}
          </ul>

          <div class="tool-meta">
            ${tool.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}
          </div>

          <div class="tool-actions">
            <a href="${tool.url}" target="_blank" rel="noreferrer">Open repo</a>
            <button type="button" data-copy="${encodeURIComponent(cloneCommand)}">Copy setup</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function getSelectedTools() {
  return tools.filter((tool) => state.selected.has(tool.id));
}

function buildCommands(selectedTools) {
  const cloneables = selectedTools.filter((tool) => tool.repo.includes("/") && !tool.repo.includes(" profile "));
  const profiles = selectedTools.filter((tool) => tool.repo.includes(" profile "));
  const lines = ["mkdir -p ~/upmyskills-tools", "cd ~/upmyskills-tools", ""];

  cloneables.forEach((tool) => {
    const folder = tool.repo.split("/").pop();
    lines.push(`# ${tool.name}`);
    lines.push(`[ -d "${folder}" ] || git clone ${tool.url}.git`);
    lines.push("");
  });

  profiles.forEach((tool) => {
    lines.push(`# ${tool.name}`);
    lines.push(`# Profile/index source: ${tool.url}`);
    if (tool.homepage) lines.push(`# Index: ${tool.homepage}`);
    lines.push("");
  });

  return lines.join("\n").trim();
}

function buildPrompt(selectedTools) {
  const goal = nodes.goalSelect.options[nodes.goalSelect.selectedIndex].text;
  const lines = [
    `Goal: ${goal}`,
    "",
    "Use these Upmyskills sources as the operating stack:",
    ...selectedTools.map((tool, index) => `${index + 1}. ${tool.name} (${tool.repo}) - ${tool.summary}`),
    "",
    "Working mode:",
    "1. Pick the smallest set of skills that directly match the task.",
    "2. Read the selected repo instructions before executing.",
    "3. Convert outputs into a concrete plan, checklist, report, or implementation artifact.",
    "4. When a repo is only an index, search inside the index for the named skill source first.",
    "5. Cite the source repo used for each recommendation."
  ];

  return lines.join("\n");
}

function renderStack() {
  const selectedTools = getSelectedTools();
  nodes.sourceCount.textContent = String(tools.length);
  nodes.categoryCount.textContent = String(categories.length - 1);
  nodes.selectedCount.textContent = String(selectedTools.length);
  nodes.selectedRepoCount.textContent = String(selectedTools.length);

  nodes.selectedList.innerHTML =
    selectedTools
      .map(
        (tool) => `
          <li>
            <span><strong>${tool.name}</strong></span>
            <span>${tool.category}</span>
          </li>
        `
      )
      .join("") || "<li><span>No tools selected</span><span>0</span></li>";

  nodes.commandOutput.textContent = buildCommands(selectedTools);
  nodes.promptOutput.value = buildPrompt(selectedTools);
}

function render() {
  renderTabs();
  renderTools();
  renderStack();
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} copied`);
  } catch (error) {
    showToast("Copy gagal. Pilih teks secara manual.");
  }
}

function showToast(message) {
  nodes.toast.textContent = message;
  nodes.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => nodes.toast.classList.remove("is-visible"), 2200);
}

nodes.categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  render();
});

nodes.toolGrid.addEventListener("click", (event) => {
  const toggle = event.target.closest("button[data-toggle]");
  const copy = event.target.closest("button[data-copy]");

  if (toggle) {
    const id = toggle.dataset.toggle;
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    render();
  }

  if (copy) {
    copyText(decodeURIComponent(copy.dataset.copy), "Setup command");
  }
});

nodes.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderTools();
});

nodes.sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderTools();
});

document.querySelector("#selectAllButton").addEventListener("click", () => {
  state.selected = new Set(tools.map((tool) => tool.id));
  render();
});

document.querySelector("#clearButton").addEventListener("click", () => {
  state.selected.clear();
  render();
});

nodes.goalSelect.addEventListener("change", (event) => {
  state.selected = new Set(goalMap[event.target.value]);
  render();
});

document.querySelector("#copyStackButton").addEventListener("click", () => {
  copyText(nodes.commandOutput.textContent, "Command pack");
});

document.querySelector("#copyCommandsInline").addEventListener("click", () => {
  copyText(nodes.commandOutput.textContent, "Command pack");
});

document.querySelector("#copyPromptButton").addEventListener("click", () => {
  copyText(nodes.promptOutput.value, "Prompt kerja");
});

render();
