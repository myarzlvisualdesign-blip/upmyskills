# UpMySkills

UpMySkills turns Claude and AI skill repositories into executable web tools. It is not a link directory: ingested skills are normalized into input forms, workflow steps, prompt templates, output schemas, reusable Markdown deliverables, source attribution, and saved generation history.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Prisma + SQLite for local development
- API route generation with a local LLM provider abstraction

## Core Routes

- `/` landing page
- `/dashboard` domain overview, popular tools, recent outputs
- `/tools` searchable/filterable tool library
- `/tools/[toolId]` executable tool runner
- `/domains/[domain]` domain collections
- `/history` saved generations
- `/sources` source repos, licenses, attribution
- `/settings` provider configuration UI

## Development

```bash
npm install
npm run ingest:repos
npm run dev
```

The ingestion command clones/fetches source repositories into `.repos`, parses markdown/json/yaml/txt files, extracts usable skills, writes `data/tools.generated.json`, pushes the Prisma schema, and seeds local SQLite.

## Verification

```bash
npm run typecheck
npm run build
```

## Cloudflare Pages Deployment

The local Next.js app uses Prisma + SQLite for development. Cloudflare Pages is deployed from `cloudflare-static`, a browser-only runner that loads `tools.json`, executes every generated workflow in the UI, supports copy/export, and saves history in localStorage.

```bash
npm run build:static
npm run pages:deploy
```

## Notes

- The default provider is `local`, so every generated tool can run without a paid API key.
- Source tools may reference external paid services such as Figma, DataForSEO, Firecrawl, ad platforms, or hosted model providers. Those requirements are inherited from the source skill and should be handled per tool workflow.
- The user-provided repo URLs `nexu-i/o/open-design` and `zubair-trabzada/geo-seo-claude-skills` are handled with fallback URLs to the valid repositories discovered during ingestion.
