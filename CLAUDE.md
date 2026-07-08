# CLAUDE.md — klokie.com

Always read `DESIGN.md` before making any visual or UI decision. All font
choices, colors, spacing, layout, and aesthetic direction are defined there.
Do not deviate without explicit user approval. In QA mode, flag any code
that doesn't match DESIGN.md.

Content source of truth is the vault: `~/vault/work/klokie-com/PUBLIC/`
(synced into `src/content/`). `src/content/cases/en/*` with
`generated: true` frontmatter is produced by the vault's
`bin/migrate-cases.mjs` — edit the source, not the output.

Standards: `~/vault/resources/programming/klokie-web-stack.md` and
`web-project-standards.md` (canonical host www.klokie.com).
