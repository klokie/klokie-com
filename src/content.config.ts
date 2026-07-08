import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const gigs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/gigs" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    venue: z.string(),
    city: z.string().optional(),
    ticketUrl: z.string().url().optional(),
    status: z.enum(["upcoming", "past", "cancelled"]).default("upcoming"),
    published: z.boolean().default(true),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/news" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    cover: z.string().optional(),
    published: z.boolean().default(true),
    tags: z.array(z.string()).optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

export const collections = { gigs, news, pages };
