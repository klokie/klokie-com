/**
 * Markdown twins of every HTML route.
 *
 * The site is authored in Markdown (vault → `src/content/`), so the honest
 * agent-facing representation of a page is the source itself, not an
 * HTML→Markdown conversion. This module builds `{ path, markdown }` for every
 * route the site renders; `src/pages/[...path]/index.md.ts` writes them to
 * `dist/<route>/index.md`, and `src/worker.js` serves them when a client
 * negotiates `Accept: text/markdown` (see acceptmarkdown.com).
 *
 * Listing routes (home, /work/, /articles/, /music/) have no single source
 * document, so they get a synthesized index — same links, no chrome.
 */
import { getCollection } from "astro:content";
import { localizedEntries, localizeUrl, locales, type Locale } from "@/i18n";
import { t } from "@/i18n/ui";
import { siteConfig } from "@/site/config";

export interface MarkdownRoute {
  /** Site path of the HTML page, always with a trailing slash ("/", "/about/"). */
  path: string;
  title: string;
  description: string;
  lang: Locale;
  markdown: string;
}

/** Strip frontmatter and any leading H1 — the H1 is re-emitted from `title`. */
function stripLeadingHeading(body: string): string {
  return body.replace(/^\s*#\s+.*\r?\n+/, "").trim();
}

function documentFor(
  route: Omit<MarkdownRoute, "markdown">,
  body: string,
): MarkdownRoute {
  const url = new URL(route.path, siteConfig.url).href;
  const parts = [`# ${route.title}`];
  if (route.description) parts.push(`> ${route.description}`);
  const trimmed = body.trim();
  if (trimmed) parts.push(trimmed);
  parts.push(`---\n\nSource: ${url} · Site index: ${new URL("/llms.txt", siteConfig.url).href}`);
  return { ...route, markdown: `${parts.join("\n\n")}\n` };
}

function bullet(label: string, href: string, note?: string): string {
  const suffix = note ? ` — ${note}` : "";
  return `- [${label}](${new URL(href, siteConfig.url).href})${suffix}`;
}

export async function markdownRoutes(): Promise<MarkdownRoute[]> {
  const [pages, cases, articles, music] = await Promise.all([
    getCollection("pages", ({ data }) => !data.draft),
    getCollection("cases", ({ data }) => !data.draft),
    getCollection("articles", ({ data }) => !data.draft),
    getCollection("music", ({ data }) => !data.draft),
  ]);
  const featuredCases = cases.filter((c) => c.data.featured);

  const routes: MarkdownRoute[] = [];

  for (const lang of locales) {
    const tr = t(lang);
    const at = (p: string) => localizeUrl(p, lang);
    const withSlash = (p: string) => (p.endsWith("/") ? p : `${p}/`);

    const localCases = localizedEntries(cases, lang);
    const localArticles = localizedEntries(articles, lang).sort(
      (a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime(),
    );
    const localMusic = localizedEntries(music, lang);

    // home
    routes.push(
      documentFor(
        {
          path: withSlash(at("/")),
          title: siteConfig.title,
          description: tr("site.description"),
          lang,
        },
        [
          tr("home.lede"),
          `## ${tr("nav.work")}`,
          localCases
            .slice(0, 12)
            .map(({ slug, entry }) =>
              bullet(entry.data.title, `${at(`/work/${slug}`)}/`, entry.data.summary),
            )
            .join("\n"),
          `## ${tr("nav.articles")}`,
          localArticles
            .slice(0, 12)
            .map(({ slug, entry }) =>
              bullet(entry.data.title, `${at(`/articles/${slug}`)}/`, entry.data.description),
            )
            .join("\n"),
          `## ${tr("nav.about")}`,
          [
            bullet(tr("nav.about"), withSlash(at("/about"))),
            bullet("CV", withSlash(at("/cv"))),
            bullet(tr("nav.music"), withSlash(at("/music"))),
            bullet(tr("nav.contact"), withSlash(at("/contact"))),
          ].join("\n"),
        ].join("\n\n"),
      ),
    );

    // content pages (about, contact, cv, uses, privacy…)
    for (const { slug, entry } of localizedEntries(pages, lang)) {
      const routeSlug = entry.data.slug ?? slug;
      routes.push(
        documentFor(
          {
            path: withSlash(at(`/${routeSlug}`)),
            title: entry.data.title,
            description: entry.data.description ?? "",
            lang,
          },
          stripLeadingHeading(entry.body ?? ""),
        ),
      );
    }

    // /work/ index + one page per featured case (only featured cases route)
    routes.push(
      documentFor(
        {
          path: withSlash(at("/work")),
          title: tr("work.eyebrow"),
          description: tr("work.lede.tail"),
          lang,
        },
        localCases
          .map(({ slug, entry }) => {
            const d = entry.data;
            const years = [d.date?.getFullYear(), d.ongoing ? "present" : d.endDate?.getFullYear()]
              .filter(Boolean)
              .join("–");
            const meta = [d.role, d.location, years].filter(Boolean).join(" · ");
            // Only featured cases have a page of their own; the rest live on
            // this index, so don't send an agent to a URL that doesn't exist.
            const head = d.featured
              ? bullet(d.title, `${at(`/work/${slug}`)}/`, d.summary)
              : `- **${d.title}**${d.summary ? ` — ${d.summary}` : ""}`;
            return `${head}${meta ? `\n  ${meta}` : ""}`;
          })
          .join("\n"),
      ),
    );

    for (const { slug, entry } of localizedEntries(featuredCases, lang)) {
      const d = entry.data;
      const meta = [
        d.role && `Role: ${d.role}`,
        d.location && `Location: ${d.location}`,
        d.date && `Year: ${d.date.getFullYear()}`,
        d.categories.length > 0 && `Categories: ${d.categories.join(", ")}`,
        d.url && `Site: ${d.url}`,
      ].filter(Boolean) as string[];
      routes.push(
        documentFor(
          {
            path: withSlash(at(`/work/${slug}`)),
            title: d.title,
            description: d.summary,
            lang,
          },
          [meta.map((m) => `- ${m}`).join("\n"), stripLeadingHeading(entry.body ?? "")]
            .filter(Boolean)
            .join("\n\n"),
        ),
      );
    }

    // /articles/ index + one page per article
    routes.push(
      documentFor(
        {
          path: withSlash(at("/articles")),
          title: tr("articles.title"),
          description: tr("articles.metaDesc"),
          lang,
        },
        localArticles
          .map(({ slug, entry }) =>
            bullet(
              entry.data.title,
              `${at(`/articles/${slug}`)}/`,
              [entry.data.date.toISOString().slice(0, 10), entry.data.description]
                .filter(Boolean)
                .join(" — "),
            ),
          )
          .join("\n"),
      ),
    );

    for (const { slug, entry } of localArticles) {
      routes.push(
        documentFor(
          {
            path: withSlash(at(`/articles/${slug}`)),
            title: entry.data.title,
            description: entry.data.description ?? "",
            lang,
          },
          [
            `Published: ${entry.data.date.toISOString().slice(0, 10)}`,
            stripLeadingHeading(entry.body ?? ""),
          ]
            .filter(Boolean)
            .join("\n\n"),
        ),
      );
    }

    // /music/ — a single page listing every project
    routes.push(
      documentFor(
        {
          path: withSlash(at("/music")),
          title: tr("music.title"),
          description: tr("music.metaDesc"),
          lang,
        },
        localMusic
          .map(({ entry }) => {
            const d = entry.data;
            const years = [d.start, d.end ?? (d.start ? "present" : undefined)]
              .filter(Boolean)
              .join("–");
            const meta = [d.role, d.genre, years].filter(Boolean).join(" · ");
            const links = d.links.map((l) => `[${l.label}](${l.url})`).join(" · ");
            return [
              `### ${d.title}`,
              meta,
              d.summary,
              stripLeadingHeading(entry.body ?? ""),
              links,
            ]
              .filter(Boolean)
              .join("\n\n");
          })
          .join("\n\n"),
      ),
    );
  }

  return routes;
}
