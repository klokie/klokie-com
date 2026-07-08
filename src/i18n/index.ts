// Core i18n helpers. English (`en`) is the default locale and lives at the
// site root; Swedish is served under `/sv`. Content entries are stored
// per-locale (`<lang>/<slug>`) and fall back to English when a translation is
// missing. (Pattern from klokie/arbetarorkestern, locales swapped.)

export const locales = ["en", "sv"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const dateLocale: Record<Locale, string> = { en: "en-US", sv: "sv-SE" };

export const localeName: Record<Locale, string> = {
  en: "English",
  sv: "Svenska",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Prefix a root-relative path with the locale. The default locale is unprefixed. */
export function localizeUrl(path: string, lang: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === defaultLocale) return clean;
  return clean === "/" ? `/${lang}/` : `/${lang}${clean}`;
}

/** Split a content entry id like "en/moma" into { lang, slug }. */
export function splitId(id: string): { lang: Locale; slug: string } {
  const [maybeLang, ...rest] = id.split("/");
  if (isLocale(maybeLang) && rest.length > 0) {
    return { lang: maybeLang, slug: rest.join("/") };
  }
  return { lang: defaultLocale, slug: id };
}

/**
 * Collapse a flat list of per-locale entries (ids `<lang>/<slug>`) to one entry
 * per slug for the target locale, falling back to the default-locale entry.
 */
export function localizedEntries<T extends { id: string }>(
  entries: T[],
  lang: Locale,
): Array<{ slug: string; entry: T }> {
  const byKey = new Map<string, T>();
  const defaultSlugs: string[] = [];
  for (const e of entries) {
    const { lang: l, slug } = splitId(e.id);
    byKey.set(`${l}/${slug}`, e);
    if (l === defaultLocale) defaultSlugs.push(slug);
  }
  return defaultSlugs.map((slug) => ({
    slug,
    entry:
      byKey.get(`${lang}/${slug}`) ?? byKey.get(`${defaultLocale}/${slug}`)!,
  }));
}

/** Resolve a single slug for a locale, falling back to the default locale. */
export function pickEntry<T extends { id: string }>(
  entries: T[],
  slug: string,
  lang: Locale,
): T | undefined {
  const want = `${lang}/${slug}`;
  const fallback = `${defaultLocale}/${slug}`;
  let fb: T | undefined;
  for (const e of entries) {
    if (e.id === want) return e;
    if (e.id === fallback) fb = e;
  }
  return fb;
}

/** Strip a leading `/<locale>` segment, returning the default-locale path. */
export function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/([^/]+)(\/.*|)$/);
  if (match && isLocale(match[1])) {
    return match[2] || "/";
  }
  return pathname || "/";
}

/** Map the current pathname to its equivalent in every locale. */
export function localePaths(pathname: string): Record<Locale, string> {
  const base = stripLocale(pathname);
  const out = {} as Record<Locale, string>;
  for (const l of locales) out[l] = localizeUrl(base, l);
  return out;
}
