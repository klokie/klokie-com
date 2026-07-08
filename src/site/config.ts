/**
 * Per-site config. Each site copy of the starter overrides these values.
 * Anything that should differ between Arbetarorkestern, Klokie, etc. lives here.
 */
import { jordsang } from "@klokie/theme";
import type { ThemePreset } from "@klokie/theme/presets/types";

export const siteConfig = {
  title: "Site Title",
  tagline: "Tagline goes here",
  description: "Site description for OG / RSS.",
  url: process.env.PUBLIC_SITE_URL ?? "http://localhost:4321",
  monogram: "AO",
  copyrightName: "Site Title",
  locale: "sv-SE",
  preset: jordsang as ThemePreset,
  nav: [
    { label: "Spelningar", href: "/spelningar" },
    { label: "Nyheter", href: "/nyheter" },
    { label: "Om", href: "/om" },
  ],
  social: {
    instagram: "https://instagram.com/example",
    facebook: "https://facebook.com/example",
  } as Record<string, string>,
  paths: {
    gigs: "/spelningar",
    news: "/nyheter",
  },
};

export type SiteConfig = typeof siteConfig;
