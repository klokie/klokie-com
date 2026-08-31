/**
 * Person JSON-LD for Daniel "Klokie" Grossfeld.
 *
 * One definition, reused by every page that is *about* the person — the home
 * page, /cv/ and /about/ — so the identity Google sees stays consistent across
 * them. Page-specific facts (mainEntityOfPage, employment, education) are
 * layered on by the caller via `extra`.
 */
import { siteConfig } from "@/site/config";

export const JOB_TITLE = "Senior Full-Stack Engineer & Architect";

/**
 * `description` is required for the identity to be machine-parsable — several
 * agent-readiness checkers treat a Person node without name + description as
 * incomplete. Keep it one sentence and factual.
 */
export const PERSON_DESCRIPTION =
  "Daniel “Klokie” Grossfeld is a senior web architect, full-stack engineer, and entrepreneur based in Stockholm, Sweden, with 25+ years building data-driven websites, e-commerce platforms, and media systems for clients including MoMA, Tiffany & Co., Rawkus Records, New York Magazine, Scania, Sneakersnstuff, TV4/Telia/C More, and Werlabs.";

export function personJsonLd(extra: Record<string, unknown> = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Daniel Grossfeld",
    alternateName: "Klokie",
    description: PERSON_DESCRIPTION,
    jobTitle: JOB_TITLE,
    url: siteConfig.url,
    email: "mailto:website@klokie.com",
    nationality: { "@type": "Country", name: "Sweden" },
    image: new URL("/media/klokie.jpg", siteConfig.url).href,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Stockholm",
      addressCountry: "SE",
    },
    sameAs: siteConfig.sameAs,
    ...extra,
  };
}

/** Facts that belong on the CV page specifically, not on every page. */
export const CV_DETAILS = {
  worksFor: { "@type": "Organization", name: "Werlabs" },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Boston University",
    sameAs: "https://www.bu.edu/",
  },
  knowsLanguage: ["en", "sv", "es"],
  knowsAbout: [
    "TypeScript",
    "Node.js",
    "React",
    "Astro",
    "Apache Kafka",
    "PostgreSQL",
    "Amazon Web Services",
    "Web architecture",
    "Event-driven architecture",
  ],
} as const;
