/**
 * Per-site config for klokie.com.
 */
import { klokie } from "@klokie/theme";
import type { ThemePreset } from "@klokie/theme/presets/types";

export const siteConfig = {
  title: "KLOKIE.",
  tagline: "",
  description:
    "Daniel “Klokie” Grossfeld — senior web architect and entrepreneur in Stockholm. Twenty-six years of shipped work: MoMA, Tiffany & Co., Rawkus, Scania, Werlabs.",
  url: process.env.PUBLIC_SITE_URL ?? "http://localhost:4321",
  monogram: "K",
  copyrightName: "Klokie",
  locale: "en-US",
  preset: klokie as ThemePreset,
  nav: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  social: {
    linkedin: "https://www.linkedin.com/in/klokie/",
    github: "https://github.com/klokie",
  } as Record<string, string>,
  // Person JSON-LD sameAs — superset of the footer links
  sameAs: [
    "https://www.linkedin.com/in/klokie/",
    "https://github.com/klokie",
    "https://soundcloud.com/klokie",
  ],
  paths: {
    work: "/work",
  },
};

export type SiteConfig = typeof siteConfig;
