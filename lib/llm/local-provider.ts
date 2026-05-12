import type { GenerateRequest, GeneratedOutput, LlmProvider } from "@/lib/llm/types";

function compact(value?: string) {
  return value?.trim() || "Not specified";
}

function clip(value: string, max = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 1)}...` : normalized;
}

function domainRecommendations(domain: string, input: Record<string, string>) {
  const project = compact(input.projectName);
  const audience = compact(input.audience);
  const goal = compact(input.goal);
  const data = compact(input.data);
  const base = [
    `Tie every recommendation to the goal: ${goal}.`,
    `Use the available data as the evidence base: ${clip(data)}.`,
    "Separate high-confidence actions from assumptions that need validation."
  ];

  const domainSpecific: Record<string, string[]> = {
    "SEO & GEO": [
      `Prioritize pages and queries where ${audience} is closest to a decision for ${project}.`,
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

  return [...(domainSpecific[domain] ?? []), ...base].slice(0, 6);
}

function deliverableTable(rows: Array<[string, string]>) {
  return [
    "| Item | Output |",
    "| --- | --- |",
    ...rows.map(([item, output]) => `| ${item.replaceAll("|", "/")} | ${output.replaceAll("|", "/")} |`)
  ].join("\n");
}

function concreteDeliverable(domain: string, input: Record<string, string>) {
  const project = compact(input.projectName);
  const audience = compact(input.audience);
  const goal = clip(compact(input.goal));
  const context = clip(compact(input.context || input.data), 220);
  const constraints = clip(compact(input.constraints));

  if (domain === "Branding & Design") {
    return [
      `## Design Direction for ${project}`,
      "",
      deliverableTable([
        ["Positioning", `${project} should feel useful, credible, and immediately understandable for ${audience}.`],
        ["First viewport", "Show the real product, workflow, venue, or generated mockup first; keep the headline direct and the primary action visible."],
        ["Visual tone", "Use a restrained dark interface, violet only for emphasis, teal for success/progress, and neutral surfaces for scanning."],
        ["Content priority", `Lead with ${goal}; support it with proof, steps, pricing/offer, and a concrete next action.`]
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

  if (domain === "SEO & GEO") {
    return [
      `## SEO and AI Search Workplan for ${project}`,
      "",
      deliverableTable([
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

  if (domain === "Marketing") {
    return [
      `## Campaign Plan for ${project}`,
      "",
      deliverableTable([
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

  if (domain === "Engineering & AI Agent") {
    return [
      `## Implementation Brief for ${project}`,
      "",
      deliverableTable([
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

  if (domain === "AI Research") {
    return [
      `## Research Memo for ${project}`,
      "",
      deliverableTable([
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

  if (domain === "C-Level Advisory") {
    return [
      `## Executive Memo for ${project}`,
      "",
      deliverableTable([
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
    deliverableTable([
      ["Goal", goal],
      ["Audience", audience],
      ["Context", context],
      ["Constraints", constraints],
      ["First action", "Choose the owner, define the acceptance criteria, and start with the smallest useful deliverable."]
    ])
  ].join("\n");
}

export const localProvider: LlmProvider = {
  id: "local",
  label: "Local deterministic workflow",
  async generate(request: GenerateRequest): Promise<GeneratedOutput> {
    const { tool, input } = request;
    const project = compact(input.projectName);
    const recommendations = domainRecommendations(tool.domain, input);
    const workflow = tool.workflowSteps.length
      ? tool.workflowSteps
      : [
          "Clarify inputs and success metric.",
          "Apply the source workflow.",
          "Generate prioritized actions.",
          "Create reusable deliverable.",
          "Record attribution and next steps."
        ];
    const checklist = [
      "Replace any placeholder with project-specific facts before sharing.",
      "Confirm the project context and audience are accurate.",
      "Assign one owner for the first action.",
      "Add a review date and success metric.",
      "Export the Markdown output and attach it to the project workspace."
    ];

    const deliverable = concreteDeliverable(tool.domain, input);

    const attribution = `${tool.title} was generated from ${tool.sourceRepo}${tool.sourcePath ? `/${tool.sourcePath}` : ""}. License: source dependent.`;
    const summary = `${tool.title} converted the supplied ${tool.domain} context into a prioritized workflow for ${project}.`;
    const markdown = [
      `# ${tool.title}`,
      "",
      `**Project:** ${project}`,
      `**Domain:** ${tool.domain}`,
      "",
      `## Summary`,
      summary,
      "",
      "## Workflow",
      workflow.map((item, index) => `${index + 1}. ${item}`).join("\n"),
      "",
      "## Recommendations",
      recommendations.map((item) => `- ${item}`).join("\n"),
      "",
      "## Deliverable",
      deliverable,
      "",
      "## Checklist",
      checklist.map((item) => `- [ ] ${item}`).join("\n"),
      "",
      "## Attribution",
      attribution
    ].join("\n");

    return {
      summary,
      workflow,
      recommendations,
      deliverable,
      checklist,
      attribution,
      markdown
    };
  }
};
