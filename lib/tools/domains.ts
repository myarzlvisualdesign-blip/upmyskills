import {
  BadgeDollarSign,
  BrainCircuit,
  Building2,
  Code2,
  Megaphone,
  Palette,
  SearchCheck
} from "lucide-react";

export const domains = [
  {
    slug: "branding-design",
    name: "Branding & Design",
    description: "Brand identity, design systems, landing page direction, audits, and creative workflows.",
    icon: Palette,
    accent: "bg-up-violet text-white"
  },
  {
    slug: "engineering-ai-agent",
    name: "Engineering & AI Agent",
    description: "Code review, architecture, DevOps, security, agent design, and AI engineering planning.",
    icon: Code2,
    accent: "bg-up-ink text-white"
  },
  {
    slug: "ai-research",
    name: "AI Research",
    description: "Literature survey, ideation, experiment plans, paper outlines, and LaTeX drafting.",
    icon: BrainCircuit,
    accent: "bg-up-green text-white"
  },
  {
    slug: "c-level-advisory",
    name: "C-Level Advisory",
    description: "CEO, CTO, CFO, CMO, CPO, board memo, and executive operating reviews.",
    icon: Building2,
    accent: "bg-up-rust text-white"
  },
  {
    slug: "marketing",
    name: "Marketing",
    description: "Campaigns, paid ads, CRO, email, social calendars, and landing page generation.",
    icon: Megaphone,
    accent: "bg-up-mint text-up-ink"
  },
  {
    slug: "seo-geo",
    name: "SEO & GEO",
    description: "Technical SEO, schema, backlinks, AI search citations, Ahrefs, and Semrush interpretation.",
    icon: SearchCheck,
    accent: "bg-up-green text-white"
  }
] as const;

export const domainNames = domains.map((domain) => domain.name);

export function domainToSlug(domain: string) {
  const match = domains.find((item) => item.name === domain);
  return match?.slug ?? domain.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export function slugToDomain(slug: string) {
  return domains.find((domain) => domain.slug === slug)?.name ?? null;
}

export function getDomainIcon(domain: string) {
  return domains.find((item) => item.name === domain)?.icon ?? BadgeDollarSign;
}
