export type RepoSource = {
  id: string;
  name: string;
  url: string;
  cloneUrl: string;
  fallbackUrl?: string;
  domain: string;
  notes: string;
};

export const repoSources: RepoSource[] = [
  {
    id: "open-design",
    name: "Open Design",
    url: "https://github.com/nexu-i/o/open-design",
    cloneUrl: "https://github.com/nexu-i/o/open-design.git",
    fallbackUrl: "https://github.com/nexu-io/open-design.git",
    domain: "Branding & Design",
    notes: "Input URL appears malformed; ingestion falls back to nexu-io/open-design when needed."
  },
  {
    id: "awesome-claude-skills",
    name: "Awesome Claude Skills",
    url: "https://github.com/ComposioHQ/awesome-claude-skills",
    cloneUrl: "https://github.com/ComposioHQ/awesome-claude-skills.git",
    domain: "Engineering & AI Agent",
    notes: "Curated index source used for discovery and attribution."
  },
  {
    id: "claude-skills",
    name: "Claude Skills Mega Library",
    url: "https://github.com/alirezarezvani/claude-skills",
    cloneUrl: "https://github.com/alirezarezvani/claude-skills.git",
    domain: "Engineering & AI Agent",
    notes: "Large multi-domain skill repository."
  },
  {
    id: "garrytan",
    name: "Garry Tan",
    url: "https://github.com/garrytan",
    cloneUrl: "https://github.com/garrytan",
    domain: "C-Level Advisory",
    notes: "User profile source; ingestion creates inspired-by advisory wrappers from available public metadata."
  },
  {
    id: "ai-research-skills",
    name: "AI Research Skills",
    url: "https://github.com/Orchestra-Research/AI-Research-SKILLs",
    cloneUrl: "https://github.com/Orchestra-Research/AI-Research-SKILLs.git",
    domain: "AI Research",
    notes: "Research and engineering skill library."
  },
  {
    id: "marketing-skills",
    name: "Marketing Skills",
    url: "https://github.com/kostja94/marketing-skills",
    cloneUrl: "https://github.com/kostja94/marketing-skills.git",
    domain: "Marketing",
    notes: "Broad marketing and SEO skill repository."
  },
  {
    id: "marketingskills",
    name: "Marketing Skills by Corey Haines",
    url: "https://github.com/coreyhaines31/marketingskills",
    cloneUrl: "https://github.com/coreyhaines31/marketingskills.git",
    domain: "Marketing",
    notes: "CRO, copywriting, and growth skill repository."
  },
  {
    id: "claude-ads",
    name: "Claude Ads",
    url: "https://github.com/AgriciDaniel/claude-ads",
    cloneUrl: "https://github.com/AgriciDaniel/claude-ads.git",
    domain: "Marketing",
    notes: "Paid ads audit and optimization skills."
  },
  {
    id: "claude-seo",
    name: "Claude SEO",
    url: "https://github.com/AgriciDaniel/claude-seo",
    cloneUrl: "https://github.com/AgriciDaniel/claude-seo.git",
    domain: "SEO & GEO",
    notes: "SEO, GEO, AEO, technical SEO, and reporting skills."
  },
  {
    id: "geo-seo-claude",
    name: "GEO SEO Claude",
    url: "https://github.com/zubair-trabzada/geo-seo-claude-skills",
    cloneUrl: "https://github.com/zubair-trabzada/geo-seo-claude-skills.git",
    fallbackUrl: "https://github.com/zubair-trabzada/geo-seo-claude.git",
    domain: "SEO & GEO",
    notes: "Input URL appears renamed; ingestion falls back to zubair-trabzada/geo-seo-claude when needed."
  }
];
