# klokie-site-starter

Astro starter for vault-driven klokie sites. Each site is a copy of this repo,
points at a folder in the Obsidian vault for its `PUBLIC/` content, and deploys
to Cloudflare Pages.

## Stack

- Astro 5 (static output) + MDX + content collections (gigs, news, pages)
- `@klokie/theme` for design tokens, layout primitives, presets
- Cloudflare Pages for hosting
- Vault repo's GH Action syncs content into `src/content/` on push
- This repo's GH Action builds and deploys on push (or on `repository_dispatch`)

## Spinning up a new site

1. `gh repo create klokie/<name> --template klokie/klokie-site-starter --public`
2. Clone, edit `src/site/config.ts` (title, tagline, monogram, locale, nav, paths)
3. In `src/layouts/SiteLayout.astro` swap the preset import (`jordsang.css` → your preset's CSS) and update the `import { jordsang } from "@klokie/theme"` line in `src/site/config.ts`
4. Add the site to vault's `.publish-config.yml` so the sync action picks it up
5. Create the Cloudflare Pages project, set repo `vars`/`secrets`:
   - vars: `PUBLIC_SITE_URL`, `CLOUDFLARE_PROJECT_NAME`
   - secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
6. Add the custom domain in CF Pages → DNS CNAME

## Local dev

```bash
pnpm install
pnpm dev
```

For live editing of vault content, symlink:
```bash
rm -r src/content/gigs src/content/news src/content/pages
ln -s "<vault>/personal/<...>/PUBLIC/gigs"  src/content/gigs
ln -s "<vault>/personal/<...>/PUBLIC/news"  src/content/news
ln -s "<vault>/personal/<...>/PUBLIC/pages" src/content/pages
```

(In production, the vault's sync action does this copy via GH Actions.)

## Content shape

```
src/content/
├── gigs/       # frontmatter: title, date, venue, city?, ticketUrl?, status, published
├── news/       # frontmatter: title, date, description?, cover?, published, tags?
└── pages/      # frontmatter: title, description?, published   (slug = filename)
```

Co-locate images: `news/2026-04-29-jordsang/index.md` + `cover.jpg` in same folder.

Set `published: false` to stage a post in the repo without showing it.
