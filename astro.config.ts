import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

const SITE = process.env.PUBLIC_SITE_URL ?? "http://localhost:4321";

export default defineConfig({
  site: SITE,
  integrations: [mdx(), sitemap()],
  output: "static",
  build: {
    format: "directory",
  },
  trailingSlash: "ignore",
});
