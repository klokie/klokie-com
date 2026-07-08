import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "@/site/config";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const news = (await getCollection("news", ({ data }) => data.published))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site!,
    items: news.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.description ?? "",
      link: `${siteConfig.paths.news}/${entry.id}`,
    })),
  });
}
