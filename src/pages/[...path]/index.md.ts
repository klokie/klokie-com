/**
 * Markdown twin of every HTML route: `/about/` → `/about/index.md`.
 *
 * These files are what `src/worker.js` serves when a client negotiates
 * `Accept: text/markdown` (acceptmarkdown.com), and what the
 * `Link: rel="alternate"` header on the HTML response points at.
 */
import type { APIRoute } from "astro";
import { markdownRoutes } from "@/lib/markdown-routes";

export async function getStaticPaths() {
  const routes = await markdownRoutes();
  return routes.map((route) => ({
    // "/" → undefined, "/about/" → "about"
    params: { path: route.path.replace(/^\/|\/$/g, "") || undefined },
    props: { markdown: route.markdown },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.markdown as string, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
