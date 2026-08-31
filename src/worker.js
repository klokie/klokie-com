/**
 * klokie.com edge worker. Two jobs:
 *
 * 1. Canonical host — every non-www host (apex, workers.dev) 301s to
 *    www.klokie.com preserving path + query.
 *    See resources/programming/web-project-standards.md (canonical host).
 * 2. Markdown content negotiation per acceptmarkdown.com — the build emits an
 *    `index.md` twin next to every `index.html`; this worker picks the
 *    representation from `Accept` (RFC 9110 §12.5.1 q-values + specificity),
 *    always sets `Vary: Accept`, advertises the twin with
 *    `Link: rel="alternate"`, and returns `406` when the client rejects
 *    everything we can produce.
 *
 * Misses return a real 404 either way — Markdown when the client didn't ask
 * for HTML, so an agent gets a recoverable body instead of a page of chrome.
 */

const CANONICAL_HOST = "www.klokie.com";
const HTML = "text/html";
const MARKDOWN = "text/markdown";
const PRODUCES = [HTML, MARKDOWN];

// Files served straight from the bucket: no HTML/Markdown pair exists for them.
const STATIC_EXT =
  /\.(?:css|js|mjs|map|png|jpe?g|webp|gif|svg|avif|ico|woff2?|ttf|otf|eot|xml|txt|json|pdf|mp4|webm|mp3|wav|ogg|zip|md)$/i;

/**
 * Parse an Accept header into ordered `{ type, q, specificity }` entries.
 * Order is preserved: position breaks ties between equally specific entries.
 */
export function parseAccept(header) {
  return header
    .split(",")
    .map((raw) => {
      const parts = raw
        .trim()
        .split(";")
        .map((s) => s.trim());
      const type = parts[0].toLowerCase();
      if (!type) return null;
      let q = 1;
      for (const param of parts.slice(1)) {
        const [name, value] = param.split("=").map((s) => s.trim());
        if (name?.toLowerCase() === "q") {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
        }
      }
      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity };
    })
    .filter((e) => e !== null);
}

function matches(entry, candidate) {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) return candidate.startsWith(entry.type.slice(0, -1));
  return entry.type === candidate;
}

/**
 * Pick which of `produces` to serve, or null when the client rejected them all
 * (→ 406). A missing or unparseable Accept means "no constraint": serve the
 * default, which is the first entry of `produces`.
 */
export function preferredType(header, produces = PRODUCES) {
  if (!header) return produces[0] ?? null;
  const entries = parseAccept(header);
  if (entries.length === 0) return produces[0] ?? null;

  let bestType = null;
  let bestQ = -1;
  let bestPosition = Infinity;

  for (const candidate of produces) {
    // RFC 9110 §12.5.1: the most specific matching range wins regardless of q,
    // so `text/html;q=0, */*` still rejects HTML.
    let matched = null;
    let matchedPosition = Infinity;
    for (let idx = 0; idx < entries.length; idx++) {
      const e = entries[idx];
      if (!matches(e, candidate)) continue;
      if (
        matched === null ||
        e.specificity > matched.specificity ||
        (e.specificity === matched.specificity && idx < matchedPosition)
      ) {
        matched = e;
        matchedPosition = idx;
      }
    }
    if (matched === null || matched.q <= 0) continue;
    if (matched.q > bestQ || (matched.q === bestQ && matchedPosition < bestPosition)) {
      bestQ = matched.q;
      bestPosition = matchedPosition;
      bestType = candidate;
    }
  }

  return bestType;
}

/** True when the client explicitly named HTML (browsers always do; curl doesn't). */
export function asksForHtml(header) {
  if (!header) return false;
  return parseAccept(header).some((e) => e.type === HTML && e.q > 0);
}

export function appendVary(headers, value = "Accept") {
  const existing = headers.get("vary");
  if (!existing) {
    headers.set("Vary", value);
    return;
  }
  const tokens = existing.split(",").map((s) => s.trim().toLowerCase());
  if (!tokens.includes(value.toLowerCase())) headers.set("Vary", `${existing}, ${value}`);
}

/** `/` → `/index.md`, `/about/` → `/about/index.md`. */
export function markdownPath(pathname) {
  const clean = pathname.replace(/\/+$/, "");
  return clean === "" ? "/index.md" : `${clean}/index.md`;
}

/** Short, linky Markdown body so an agent that hit a dead URL can recover. */
export function notFoundMarkdown(pathname, origin = `https://${CANONICAL_HOST}`) {
  return `# 404 — Not found

\`${pathname}\` does not exist on klokie.com.

Where to look next:

- [Site map for agents](${origin}/llms.txt) — every page, with descriptions
- [Full text of the site](${origin}/llms-full.txt) — one file, no crawling
- [XML sitemap](${origin}/sitemap-index.xml) — every canonical URL
- [Home](${origin}/) · [Work](${origin}/work/) · [Articles](${origin}/articles/) · [About](${origin}/about/) · [Contact](${origin}/contact/)

Every page is also available as Markdown: send \`Accept: text/markdown\`, or
fetch the \`index.md\` sibling of any URL.
`;
}

function notAcceptable(reason) {
  const res = new Response(
    `Not Acceptable\n\n${reason}\n\nAvailable representations: text/html, text/markdown\n`,
    {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
  appendVary(res.headers);
  return res;
}

function markdownResponse(body, status, extraHeaders = {}) {
  const res = new Response(body, {
    status,
    headers: { "Content-Type": "text/markdown; charset=utf-8", ...extraHeaders },
  });
  appendVary(res.headers);
  return res;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname !== CANONICAL_HOST && !url.hostname.startsWith("localhost")) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    const accept = request.headers.get("accept");
    // Links in the Markdown 404 always point at the canonical host — except in
    // local dev, where they should stay on the dev server.
    const linkOrigin = url.hostname.startsWith("localhost")
      ? url.origin
      : `https://${CANONICAL_HOST}`;

    // A .md twin fetched directly: serve it, but pin the media type (RFC 7763)
    // rather than trusting the bucket's guess.
    if (url.pathname.endsWith(".md")) {
      const direct = await env.ASSETS.fetch(request);
      if (direct.status !== 200) return direct;
      const res = new Response(direct.body, direct);
      res.headers.set("Content-Type", "text/markdown; charset=utf-8");
      appendVary(res.headers);
      return res;
    }

    // Other static files: straight from the bucket.
    if (STATIC_EXT.test(url.pathname)) return env.ASSETS.fetch(request);

    const chosen = preferredType(accept);

    // The client rejected both representations (q=0 on each) → 406.
    if (chosen === null) {
      return notAcceptable(`Nothing in your Accept header (\`${accept}\`) can be served.`);
    }

    if (chosen === MARKDOWN) {
      const mdUrl = new URL(url);
      mdUrl.pathname = markdownPath(url.pathname);
      const mdRes = await env.ASSETS.fetch(new Request(mdUrl.toString(), request));
      if (mdRes.status === 200) {
        const res = new Response(mdRes.body, mdRes);
        res.headers.set("Content-Type", "text/markdown; charset=utf-8");
        appendVary(res.headers);
        return res;
      }
      // No twin. Fall through to HTML only if HTML is still acceptable;
      // otherwise it's a 404 (the page doesn't exist) or a 406 (it does, but
      // only as HTML, which this client refuses).
      if (!preferredType(accept, [HTML])) {
        const probe = await env.ASSETS.fetch(new Request(url.toString(), { method: "HEAD" }));
        if (probe.status === 404) {
          return markdownResponse(notFoundMarkdown(url.pathname, linkOrigin), 404);
        }
        return notAcceptable("This page has no Markdown representation and you rejected HTML.");
      }
    }

    const assetRes = await env.ASSETS.fetch(request);

    if (assetRes.status === 404) {
      // Agents (curl, `Accept: */*`, no Accept at all) get a body they can act
      // on; browsers, which always name text/html, keep the designed page.
      if (!asksForHtml(accept)) {
        return markdownResponse(notFoundMarkdown(url.pathname, linkOrigin), 404);
      }
      const res = new Response(assetRes.body, assetRes);
      appendVary(res.headers);
      return res;
    }

    const res = new Response(assetRes.body, assetRes);
    appendVary(res.headers);

    if (res.headers.get("content-type")?.includes(HTML)) {
      const mdPath = markdownPath(url.pathname);
      const twinUrl = new URL(url);
      twinUrl.pathname = mdPath;
      const head = await env.ASSETS.fetch(new Request(twinUrl.toString(), { method: "HEAD" }));
      if (head.status === 200) {
        const linkValue = `<${mdPath}>; rel="alternate"; type="text/markdown"`;
        const existing = res.headers.get("link");
        res.headers.set("Link", existing ? `${existing}, ${linkValue}` : linkValue);
      }
    }

    return res;
  },
};
