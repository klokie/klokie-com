/**
 * /llms-full.txt — every English page of the site concatenated as Markdown,
 * for agents that would rather take one fetch than twenty.
 */
import type { APIRoute } from "astro";
import { markdownRoutes } from "@/lib/markdown-routes";
import { siteConfig } from "@/site/config";

export const GET: APIRoute = async () => {
  const routes = await markdownRoutes();
  const en = routes.filter((r) => r.lang === "en");
  const header = `<!-- klokie.com — full text, generated ${new Date().toISOString().slice(0, 10)}. Map: ${new URL("/llms.txt", siteConfig.url).href} -->\n\n`;
  const body = en
    .map((r) => `<!-- ${new URL(r.path, siteConfig.url).href} -->\n\n${r.markdown}`)
    .join("\n\n");

  return new Response(header + body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Vary: "Accept",
    },
  });
};
