import type { GenerateRequest, GeneratedOutput, LlmProvider } from "@/lib/llm/types";

function compact(value?: string) {
  return value?.trim() || "Not specified";
}

function domainRecommendations(domain: string, input: Record<string, string>) {
  const goal = compact(input.goal);
  const data = compact(input.data);
  const base = [
    `Tie every recommendation to the goal: ${goal}.`,
    `Use the available data as the evidence base: ${data.slice(0, 180)}.`,
    "Separate high-confidence actions from assumptions that need validation."
  ];

  const domainSpecific: Record<string, string[]> = {
    "SEO & GEO": [
      "Prioritize technical blockers, schema coverage, internal links, and pages most likely to earn AI-search citations.",
      "Create one entity-rich content brief per priority cluster and map it to measurable search intent.",
      "Add validation steps for robots, sitemap, canonical tags, structured data, and answer-engine readability."
    ],
    Marketing: [
      "Build the campaign around one sharp offer, one primary audience, and one conversion metric.",
      "Sequence acquisition, nurture, CRO, and reporting work so each channel produces reusable learning.",
      "Define creative tests before spend increases."
    ],
    "Branding & Design": [
      "Translate brand values into concrete tokens: voice, typography, color, imagery, component style, and page rhythm.",
      "Create a hero system and reusable section patterns before designing individual pages.",
      "Use trust signals and proof blocks as part of the identity, not as afterthoughts."
    ],
    "Engineering & AI Agent": [
      "Review interfaces, data flows, error handling, observability, security boundaries, and deployment risk.",
      "Turn architecture concerns into ranked implementation tickets.",
      "Define agent permissions, context inputs, output contracts, and escalation rules."
    ],
    "AI Research": [
      "Start with a falsifiable research question and a small baseline before expensive experiments.",
      "Track papers by claim, method, dataset, metric, limitation, and reusable implementation detail.",
      "Plan the paper narrative before running secondary experiments."
    ],
    "C-Level Advisory": [
      "Separate strategy, execution, metrics, people, and capital allocation decisions.",
      "Identify the one decision leadership must make now and the information needed to make it well.",
      "Convert the review into a board-ready memo with risks, asks, and owner accountability."
    ]
  };

  return [...(domainSpecific[domain] ?? []), ...base].slice(0, 6);
}

function markdownTable(input: Record<string, string>) {
  return [
    "| Field | Value |",
    "| --- | --- |",
    `| Project | ${compact(input.projectName).replaceAll("|", "\\|")} |`,
    `| Audience | ${compact(input.audience).replaceAll("|", "\\|")} |`,
    `| Constraints | ${compact(input.constraints).replaceAll("|", "\\|").slice(0, 160)} |`
  ].join("\n");
}

export const localProvider: LlmProvider = {
  id: "local",
  label: "Local deterministic generator",
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
      "Confirm the project context and audience are accurate.",
      "Review assumptions that are not backed by supplied data.",
      "Assign an owner and deadline to the first three actions.",
      "Export the Markdown output and attach it to the project workspace.",
      "Re-run the tool after new data is available."
    ];

    const deliverable = [
      `## ${tool.title} for ${project}`,
      "",
      markdownTable(input),
      "",
      "### Operating Plan",
      recommendations.map((item, index) => `${index + 1}. ${item}`).join("\n"),
      "",
      "### Reusable Template",
      `Use this ${tool.domain} template when the next project has similar audience, constraints, or source data.`,
      "",
      "```md",
      `Project: ${project}`,
      `Goal: ${compact(input.goal)}`,
      `Audience: ${compact(input.audience)}`,
      "Decision needed:",
      "Evidence:",
      "Top actions:",
      "Risks:",
      "Owner / deadline:",
      "```"
    ].join("\n");

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
