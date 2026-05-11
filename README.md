# Upmyskills

Upmyskills is a static AI skills workspace built from the repositories referenced in the provided screenshots. It turns marketing, SEO/GEO, branding, engineering, AI research, and C-level advisory skill sources into a searchable tool library and stack builder.

The app includes a generated skill-level catalog with verified `SKILL.md` paths from the source repositories. The UI itself is static and has no application-side usage quota. Individual skill runtimes still depend on each upstream repository's instructions, dependencies, API keys, and external service limits.

## Sources

- `kostja94/marketing-skills`
- `coreyhaines31/marketingskills`
- `AgriciDaniel/claude-ads`
- `AgriciDaniel/claude-seo`
- `zubair-trabzada/geo-seo-claude`
- `rampstackco/claude-skills`
- `nexu-io/open-design`
- `ComposioHQ/awesome-claude-skills`
- `alirezarezvani/claude-skills`
- `VoltAgent/awesome-agent-skills`
- `Orchestra-Research/AI-Research-SKILLs`
- `garrytan` profile reference via the VoltAgent index

## Run locally

Open `public/index.html` in a browser, or run any static file server pointed at `public`.

## Rebuild skill catalog

The generated catalog is stored in `public/skill-catalog.js`.

```bash
npm run catalog
```

## Deploy

```bash
wrangler pages deploy public --project-name upmyskills
```
