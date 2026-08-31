/**
 * Contract on what `pnpm build` must put in dist/ for the agent-facing surface
 * to work: a Markdown twin next to every page, llms.txt with when-to-use
 * guidance, and the trust-anchor pages.
 *
 * Skipped (not failed) when dist/ hasn't been built yet, so `pnpm test` is
 * useful on a cold checkout; CI runs build first.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dist = fileURLToPath(new URL("../dist", import.meta.url));
const built = existsSync(join(dist, "index.html"));
const d = built ? describe : describe.skip;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = built ? walk(dist).map((f) => `/${relative(dist, f)}`) : [];
const read = (p) => readFileSync(join(dist, p), "utf8");

d("markdown twins", () => {
  it("emits an index.md beside every index.html (404.html excepted)", () => {
    const pages = files.filter((f) => f.endsWith("/index.html"));
    expect(pages.length).toBeGreaterThan(50);
    const missing = pages
      .map((f) => f.replace(/index\.html$/, "index.md"))
      .filter((f) => !files.includes(f));
    expect(missing).toEqual([]);
  });

  it("gives each twin a title, a summary and a source link", () => {
    for (const p of ["/index.md", "/about/index.md", "/privacy/index.md"]) {
      const body = read(p);
      expect(body.startsWith("# ")).toBe(true);
      expect(body).toMatch(/^> .+/m);
      expect(body).toContain("https://www.klokie.com");
    }
  });

  it("does not list .md twins in the sitemap", () => {
    expect(read("/sitemap-0.xml")).not.toContain("index.md");
  });
});

d("llms.txt", () => {
  const llms = () => read("/llms.txt");

  it("follows the llmstxt.org shape: one H1, then a blockquote summary", () => {
    const body = llms();
    expect(body.match(/^# /gm)).toHaveLength(1);
    expect(body.split("\n")[0].startsWith("# ")).toBe(true);
    expect(body).toMatch(/^> /m);
  });

  it("tells an agent when to use the site and how to call it", () => {
    const body = llms();
    expect(body).toContain("## When to use this site");
    expect(body).toContain("website@klokie.com");
    expect(body).toMatch(/Do not use it/);
    expect(body).toContain("Accept: text/markdown");
  });

  it("links the trust anchors and the sitemap", () => {
    const body = llms();
    for (const path of ["/about/", "/contact/", "/privacy/", "/cv/"]) {
      expect(body).toContain(`https://www.klokie.com${path}index.md`);
    }
    expect(body).toContain("/sitemap-index.xml");
  });

  it("has a full-text companion", () => {
    expect(read("/llms-full.txt")).toContain("# About");
  });
});

d("trust anchors", () => {
  it.each(["/about", "/contact", "/privacy"])(
    "%s has a real page with substantial content",
    (path) => {
      const html = read(`${path}/index.html`);
      const text = html
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<style[\s\S]*?<\/style>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      expect(text.length).toBeGreaterThan(500);
    },
  );

  it("links the privacy page from every page footer", () => {
    expect(read("/index.html")).toContain('href="/privacy"');
    expect(read("/sv/index.html")).toContain('href="/sv/privacy"');
  });
});

d("structured data", () => {
  const jsonLd = (path) => {
    const html = read(path);
    const match = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    expect(match).toBeTruthy();
    return JSON.parse(match[1].replace(/\\u003c/g, "<").replace(/\\u003e/g, ">"));
  };

  it.each(["/index.html", "/about/index.html", "/cv/index.html"])(
    "%s carries a complete Person node",
    (path) => {
      const data = jsonLd(path);
      expect(data["@context"]).toBe("https://schema.org");
      expect(data["@type"]).toBe("Person");
      expect(data.name).toBe("Daniel Grossfeld");
      expect(data.description.length).toBeGreaterThan(100);
      expect(data.url).toBe("https://www.klokie.com");
      expect(data.jobTitle).toBeTruthy();
      expect(data.sameAs.length).toBeGreaterThan(1);
    },
  );
});

d("robots.txt", () => {
  it("points at both the sitemap and llms.txt", () => {
    const body = read("/robots.txt");
    expect(body).toContain("Sitemap: https://www.klokie.com/sitemap-index.xml");
    expect(body).toContain("https://www.klokie.com/llms.txt");
  });
});
