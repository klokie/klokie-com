/**
 * Content negotiation contract for src/worker.js.
 *
 * The test vectors in "picks a representation" are lifted verbatim from
 * acceptmarkdown.com/guides/accept-parsing — if this table stops passing, the
 * site is no longer acceptmarkdown-compliant.
 */
import { describe, expect, it } from "vitest";
import worker, {
  appendVary,
  asksForHtml,
  markdownPath,
  notFoundMarkdown,
  parseAccept,
  preferredType,
} from "../src/worker.js";

const HTML = "text/html";
const MD = "text/markdown";

/** Minimal stand-in for the Workers Assets binding. */
function assets(files) {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      // Workers Assets resolves a directory path to its index.html.
      const pathname = url.pathname.endsWith(".md") || url.pathname.match(/\.[a-z0-9]+$/i)
        ? url.pathname
        : `${url.pathname.replace(/\/+$/, "")}/index.html`;
      if (pathname in files) {
        const { body, type } = files[pathname];
        return new Response(request.method === "HEAD" ? null : body, {
          status: 200,
          headers: { "Content-Type": type },
        });
      }
      // Mirrors `not_found_handling: "404-page"`.
      const fallback = files["/404.html"];
      return new Response(request.method === "HEAD" ? null : (fallback?.body ?? "not found"), {
        status: 404,
        headers: { "Content-Type": fallback ? "text/html; charset=utf-8" : "text/plain" },
      });
    },
  };
}

const env = {
  ASSETS: assets({
    "/index.html": { body: "<html>home</html>", type: "text/html; charset=utf-8" },
    "/index.md": { body: "# Home\n", type: "text/markdown" },
    "/about/index.html": { body: "<html>about</html>", type: "text/html; charset=utf-8" },
    "/about/index.md": { body: "# About\n", type: "text/markdown" },
    // HTML-only page: exercises the "no twin" branch.
    "/legacy/index.html": { body: "<html>legacy</html>", type: "text/html; charset=utf-8" },
    "/404.html": { body: "<html>404 page</html>", type: "text/html; charset=utf-8" },
    "/og.png": { body: "png-bytes", type: "image/png" },
    "/llms.txt": { body: "# Daniel\n", type: "text/plain; charset=utf-8" },
  }),
};

const get = (path, headers = {}, init = {}) =>
  worker.fetch(new Request(`https://www.klokie.com${path}`, { headers, ...init }), env);

describe("parseAccept", () => {
  it("reads types, q-values and specificity in client order", () => {
    expect(parseAccept("text/markdown, text/html;q=0.8, */*;q=0.1")).toEqual([
      { type: "text/markdown", q: 1, specificity: 2 },
      { type: "text/html", q: 0.8, specificity: 2 },
      { type: "*/*", q: 0.1, specificity: 0 },
    ]);
  });

  it("defaults q to 1, clamps out-of-range values and lowercases types", () => {
    expect(parseAccept("TEXT/Markdown;q=5, text/html;q=-1")).toEqual([
      { type: "text/markdown", q: 1, specificity: 2 },
      { type: "text/html", q: 0, specificity: 2 },
    ]);
  });
});

describe("preferredType", () => {
  // acceptmarkdown.com/guides/accept-parsing § Test vectors
  it.each([
    ["text/markdown", MD],
    ["text/markdown, text/html;q=0.8", MD],
    ["text/html", HTML],
    ["text/markdown;q=0, text/html", HTML],
    [null, HTML],
    ["*/*", HTML],
    ["text/*", HTML],
    // Real Chrome header must not fall into the Markdown branch.
    ["text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8", HTML],
  ])("Accept: %s → %s", (accept, expected) => {
    expect(preferredType(accept)).toBe(expected);
  });

  it("returns null when everything we produce is rejected", () => {
    expect(preferredType("application/pdf")).toBeNull();
    expect(preferredType("text/markdown;q=0, text/html;q=0")).toBeNull();
  });

  it("lets a specific q=0 override a wildcard (RFC 9110 §12.5.1)", () => {
    expect(preferredType("text/html;q=0, */*")).toBe(MD);
  });

  it("honors a single-representation produce list", () => {
    expect(preferredType("text/markdown", [HTML])).toBeNull();
    expect(preferredType("text/markdown, */*;q=0.1", [HTML])).toBe(HTML);
  });
});

describe("helpers", () => {
  it("maps a page path to its .md twin", () => {
    expect(markdownPath("/")).toBe("/index.md");
    expect(markdownPath("/about/")).toBe("/about/index.md");
    expect(markdownPath("/work/moma")).toBe("/work/moma/index.md");
  });

  it("appends Accept to an existing Vary without duplicating it", () => {
    const h = new Headers({ Vary: "Accept-Encoding" });
    appendVary(h);
    expect(h.get("vary")).toBe("Accept-Encoding, Accept");
    appendVary(h);
    expect(h.get("vary")).toBe("Accept-Encoding, Accept");
  });

  it("only reports asksForHtml for clients that name text/html", () => {
    expect(asksForHtml("text/html,application/xhtml+xml,*/*;q=0.8")).toBe(true);
    expect(asksForHtml("*/*")).toBe(false);
    expect(asksForHtml(null)).toBe(false);
    expect(asksForHtml("text/html;q=0")).toBe(false);
  });

  it("points a lost agent at the site map", () => {
    const body = notFoundMarkdown("/nope");
    expect(body).toContain("# 404");
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/sitemap-index.xml");
  });
});

describe("worker.fetch — canonical host", () => {
  it("301s a non-www host, preserving path and query", async () => {
    const res = await worker.fetch(
      new Request("https://klokie.com/work/?x=1"),
      env,
    );
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://www.klokie.com/work/?x=1");
  });
});

describe("worker.fetch — negotiation", () => {
  it("serves Markdown for Accept: text/markdown, with Vary: Accept", async () => {
    const res = await get("/about/", { Accept: "text/markdown" });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(res.headers.get("vary")).toContain("Accept");
    expect(await res.text()).toBe("# About\n");
  });

  it("serves Markdown for the root path", async () => {
    const res = await get("/", { Accept: "text/markdown, text/html;q=0.8" });
    expect(await res.text()).toBe("# Home\n");
  });

  it("serves HTML by default, with Vary: Accept and a Link to the twin", async () => {
    const res = await get("/about/", {
      Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("vary")).toContain("Accept");
    expect(res.headers.get("link")).toBe(
      '</about/index.md>; rel="alternate"; type="text/markdown"',
    );
  });

  it("omits the Link header when a page has no twin", async () => {
    const res = await get("/legacy/", { Accept: "text/html" });
    expect(res.status).toBe(200);
    expect(res.headers.get("link")).toBeNull();
  });

  it("406s when the client rejects every representation", async () => {
    const res = await get("/about/", { Accept: "application/pdf" });
    expect(res.status).toBe(406);
    expect(res.headers.get("vary")).toContain("Accept");
    expect(await res.text()).toContain("text/markdown");
  });

  it("406s when only Markdown is acceptable but the page is HTML-only", async () => {
    const res = await get("/legacy/", { Accept: "text/markdown" });
    expect(res.status).toBe(406);
  });

  it("serves .md twins fetched directly with the RFC 7763 media type", async () => {
    const res = await get("/about/index.md");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
  });

  it("passes other static assets through untouched", async () => {
    const res = await get("/og.png");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
  });
});

describe("worker.fetch — 404s", () => {
  it("returns 404 with a Markdown body for agents", async () => {
    const res = await get("/some-path-that-does-not-exist", { Accept: "*/*" });
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    const body = await res.text();
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/some-path-that-does-not-exist");
  });

  it("returns 404 with a Markdown body when Markdown was requested", async () => {
    const res = await get("/nope", { Accept: "text/markdown" });
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
  });

  it("keeps the designed HTML 404 page for browsers", async () => {
    const res = await get("/nope", {
      Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
    });
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("vary")).toContain("Accept");
    expect(await res.text()).toContain("404 page");
  });

  it("never answers a miss with 200", async () => {
    for (const accept of [null, "*/*", "text/html", "text/markdown"]) {
      const res = await get("/definitely/not/here", accept ? { Accept: accept } : {});
      expect(res.status).toBe(404);
    }
  });
});
