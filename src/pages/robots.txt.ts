import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const sitemapUrl = new URL("/sitemap-index.xml", context.site!).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
