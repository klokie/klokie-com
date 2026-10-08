import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { affiliates } from "@klokie/theme/affiliates";

const SITE = process.env.PUBLIC_SITE_URL ?? "http://localhost:4321";

export default defineConfig({
  site: SITE,
  integrations: [mdx(), sitemap(), affiliates()],
  output: "static",
  build: {
    format: "directory",
  },
  trailingSlash: "ignore",
});
