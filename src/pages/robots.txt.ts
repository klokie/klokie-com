import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const sitemapUrl = new URL("/sitemap-index.xml", context.site!).href;
  const llms = new URL("/llms.txt", context.site!).href;
  // Agents are welcome. `llms.txt` is not part of the robots.txt grammar, so it
  // goes in a comment — crawlers ignore it, humans and agents reading the file
  // don't. See /llms.txt for the site map and when-to-use guidance.
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${sitemapUrl}`,
    `# Agent site map (llms.txt): ${llms}`,
    "# Every page also answers Accept: text/markdown (see acceptmarkdown.com).",
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
