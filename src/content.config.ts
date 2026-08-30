import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// entries live in per-locale subfolders (en/, sv/); ids are "<lang>/<slug>"
//
// Astro's default glob generateId returns frontmatter `slug` verbatim when it is
// present, which collapses en/<slug> and sv/<slug> onto a single id — the locales
// then clobber each other in the store and splitId() reports the wrong language.
// Derive the id from the file path instead so the "<lang>/<slug>" contract above
// actually holds, and keep `slug` for what it is for: naming the route.
const localeId = ({ entry }: { entry: string }) => entry.replace(/\.[^./]+$/, "");
const cases = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/cases", generateId: localeId }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    ongoing: z.boolean().default(false),
    location: z.string().optional(),
    categories: z.array(z.string()).default([]),
    role: z.string().optional(),
    summary: z.string(),
    url: z.string().url().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageFit: z.enum(["cover", "contain"]).default("cover"),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    generated: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages", generateId: localeId }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles", generateId: localeId }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    topics: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const music = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/music", generateId: localeId }),
  schema: z.object({
    title: z.string(),
    start: z.number().optional(),
    end: z.number().optional(),
    role: z.string().optional(),
    genre: z.string().optional(),
    aka: z.string().optional(),
    summary: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    bandcampAlbums: z
      .array(z.object({ title: z.string(), id: z.string(), url: z.string().url() }))
      .default([]),
    soundcloudPlaylist: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { cases, pages, articles, music };
