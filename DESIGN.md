# Design System — klokie.com

Source of truth for the klokie.com rewrite. At M2, copy this file to the
`klokie/klokie-com` repo root and add a CLAUDE.md rule: "read DESIGN.md before
any visual/UI decision." Base system: the existing **Klokie Design System**
(`~/src/claude-design-Klokie Design System/colors_and_type.css`) — this doc
adopts it and adds the portfolio-site extensions. Live preview:
`assets/20260708/design-preview-ledger.html` (approved 2026-07-08).

## Product Context

- **What this is:** Personal/professional site for Daniel "Klokie" Grossfeld —
  senior web architect, Stockholm.
- **Who it's for:** Consulting/recruiting contacts, collaborators.
- **Memorable thing (every decision serves this):** _the track record_ —
  26 years, 72 projects, six cities. "He's been shipping since 1998 and it's
  all right here."
- **Project type:** Content/portfolio site (Astro 5 + `@klokie/theme`, new
  `klokie` preset).

## Aesthetic Direction

- **Direction:** Engineer's studio — dark-first, geometric, editorial.
- **Decoration level:** Intentional — the 3px rainbow stripe (header top +
  footer) is the single signature ornament. No gradients elsewhere, no cards
  with shadows, no decorative blobs.
- **Mood:** Calm confidence. Dense but elegant; discography energy.
- **Consciously dropped:** the 2014 art-nouveau/hexagon concepts (fight
  Futura's geometry). A hexagon nod may live in the favicon/monogram only.

## Typography

- **Display/Hero + Body:** **Futura Std** (self-hosted woff2, weights 300–800,
  from the design-system repo's `fonts/`). Fallback chain:
  `'Futura Std', Jost, 'Century Gothic', 'Avenir Next', sans-serif`
  (Jost via Google/Bunny Fonts as the webfont fallback — it stood in for
  Futura in the approved preview).
- **Condensed:** Futura Std Condensed for tight/oversized headlines.
- **Metadata/mono:** **Fira Code** — years, locations, roles, eyebrows,
  category legend, filter bar. Tabular figures for years. This is a
  load-bearing choice: mono metadata is what makes the ledger read as a ledger.
- **Scale:** existing system scale (`--t-xs` 12 → `--t-5xl` 96); hero =
  `--t-4xl/5xl` at weight 300, tracking −0.02em, line-height ~1.02.

## Color

- **Approach:** Restrained base + a semantic rainbow.
- **Dark (default):** bg `#0a0a0f`, surface `#151520`, text `#f5f5f0`,
  muted `#b0afa8`, border `#2a2a38`.
- **Light mode (ships day one):** warm cream `#f5f3ed` bg, `#ffffff` surface,
  `#14141a` text — the system's existing `--*-light` tokens.
- **Primary accent:** orange `#fd5b17` (logo dot, links, active filter).
- **Category chips — rainbow topic palette:**

  | category                      | token           | dark      | light override |
  | ----------------------------- | --------------- | --------- | -------------- |
  | music                         | `--t-green`     | `#83ea30` | `#4c9a0a`      |
  | e-commerce                    | `--t-yellow`    | `#ffb600` | `#b98200`      |
  | streaming                     | `--t-blue`      | `#2a6ad1` | —              |
  | fashion-art                   | `--t-violet`    | `#9a79ad` | `#724f83`      |
  | cms & platforms               | `--t-indigo`    | `#4a63c8` | `#07329f`      |
  | publishing                    | `--t-red`       | `#b30603` | —              |
  | featured                      | `--t-orange`    | `#fd5b17` | —              |
  | health, sustainability, other | `--fg-dim` gray | —         | —              |

- **Rainbow stripe:** 7 equal hard-stop segments (red→violet), 3px, page top
  and footer top. The one place a "gradient" is allowed.

## Layout — the Ledger

`/work/` is a **chronological ledger, not a card grid** (only ~18 of 72 cases
have imagery; the dense list itself is the track-record artifact).

- **Year rail:** mono year markers in an 88px left column, grouped blocks
  newest→oldest (2024 → 1998), hairline `border-top` per year block.
- **Listed entries:** one line — category chip (8px square, radius 2) ·
  project name (weight 400) · location (mono, right-aligned; hidden on
  mobile). Dotted hairline separators.
- **Featured entries:** full-width editorial rows breaking the ledger rhythm —
  mono orange kicker (`FEATURED · <category>`), 1.7rem title, 2-line summary,
  mono meta line (role · location · years), 220px 4:3 image right (R2).
- **Container:** 880–960px max. **Mobile:** single column; year becomes an
  inline orange mono header; locations hide.

## Interaction — clickable tag filtering (core feature)

**Every metadata token on /work is a filter**: category chips + legend,
locations, roles, years, and `Featured` itself.

- Click a tag → ledger shows only matching entries; year blocks with no
  matches collapse; active tag renders as an orange pill in a filter bar under
  the hero with a live count ("STOCKHOLM · 14 PROJECTS") and `CLEAR ×`.
- Click the active tag again (or clear) → full ledger.
- **Shareable:** active filter syncs to the URL hash (`/work/#stockholm`);
  applied on load. Single active filter in v1 (keep it simple).
- Implementation: client-side vanilla JS over the fully-rendered static list
  (all 72 entries in DOM; `data-tags` attribute per entry). No framework, no
  pagination.
- Hover affordance: tags get accent color + dotted underline; chips get an
  accent outline.
- **Data:** `categories` + `role` frontmatter drive the tags (57/72 entries
  carry categories parsed from the live Notion DB; untagged entries still
  match year/location filters — tag them in frontmatter over time).

## Spacing

- **Base unit:** 4px (existing `--s-*` scale). **Density:** compact in the
  ledger (9px row padding), spacious in hero/about (64px+ sections).

## Motion

- **Approach:** minimal-intentional. Exactly one delighter: featured rows
  fade/rise 12px on scroll into view (IntersectionObserver, 500ms,
  `cubic-bezier(0.2, 0.8, 0.2, 1)`). `prefers-reduced-motion` disables it.
  Tag filtering is instant (no animation) — filters should feel like a query,
  not a performance.
- **Durations/easings:** existing system tokens (`--dur-fast` 120ms for
  hovers, `--ease-out`).

## Decisions Log

| Date       | Decision                                                       | Rationale                                                             |
| ---------- | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| 2026-07-08 | Adopt & extend existing Klokie Design System                   | System already distinctive (Futura/orange/rainbow); avoid reinvention |
| 2026-07-08 | Memorable thing = the track record                             | User choice; drives the ledger concept                                |
| 2026-07-08 | /work as chronological ledger, not card grid                   | Only ~18/72 cases have imagery; the list length IS the message        |
| 2026-07-08 | All metadata tags clickable → filter (user request)            | A ledger you can query; roles/locations/years/categories become nav   |
| 2026-07-08 | Rainbow topic palette → case category chips                    | Reuses existing brand asset semantically                              |
| 2026-07-08 | Drop art-nouveau/hexagon (2014 ideas)                          | Fights Futura geometry; favicon-only nod allowed                      |
| 2026-07-08 | Light mode day one                                             | Tokens already exist in the system                                    |
| 2026-07-08 | AI mockups skipped (OpenAI org unverified) → live HTML preview | Preview validated dark+light+filtering; approved by user              |
