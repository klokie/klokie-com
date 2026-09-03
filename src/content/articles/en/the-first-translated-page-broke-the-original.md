---
title: "The first translated page broke the original"
date: "2026-09-03"
topics: [programming]
description: "Astro's default content id comes from frontmatter slug when you have one, so en/cv.md and sv/cv.md collide. The bug is invisible until a site's second locale arrives."
draft: false
---

I added a Swedish version of my CV page. The English one disappeared.

Not 404 — worse. `/cv/` returned 200, with `<html lang="en">`, an English page
title, and a Swedish body. The canonical URL for the English page was serving
the translation.

The Swedish URL was wrong in its own way: `/sv/cv/` rendered Swedish, but with
`<link rel="canonical" href="/cv/">` and no `hreflang` alternates. My site
canonicalizes untranslated pages back to the default locale, which is correct
behavior — for a page that hasn't been translated. This one had been.

Two symptoms, one cause, and it wasn't where I looked first.

## The wrong suspect

My i18n layer collapses a flat list of per-locale entries down to one entry per
slug:

```js
export function localizedEntries(entries, lang) {
  const byKey = new Map();
  const defaultSlugs = [];
  for (const e of entries) {
    const { lang: l, slug } = splitId(e.id);
    byKey.set(`${l}/${slug}`, e);
    if (l === defaultLocale) defaultSlugs.push(slug);
  }
  return defaultSlugs.map((slug) => ({
    slug,
    entry:
      byKey.get(`${lang}/${slug}`) ?? byKey.get(`${defaultLocale}/${slug}`),
  }));
}
```

An entry overwriting another in a `Map` explains both symptoms at once, so this
function looks guilty. It isn't. The keys are `en/cv` and `sv/cv` — distinct, no
collision. Unless `splitId` is being handed something other than what I assumed.

## The actual cause

Astro's glob loader generates a content id for every file. Here is the default,
from `astro/dist/content/loaders/glob.js`:

```js
function generateIdDefault({ entry, base, data }) {
  if (data.slug) {
    return data.slug;
  }
  const entryURL = new URL(encodeURI(entry), base);
  const { slug } = getContentEntryIdAndSlug({
    entry: entryURL,
    contentDir: base,
    collection: "",
  });
  return slug;
}
```

The first two lines are the bug, for my content. **If the frontmatter has a
`slug` field, that value becomes the id — the file path is never consulted.**

Every page in my `pages` collection carries `slug: "cv"`, `slug: "about"` and so
on, because I want the route named independently of the filename. So
`en/cv.md` and `sv/cv.md` both got the id `"cv"`. One silently overwrote the
other in the content store, both routes resolved to whichever survived, and
`splitId("cv")` — finding no locale prefix — reported the default locale. Hence
an English-labeled page with Swedish content, and a Swedish page that believed
it was an untranslated fallback.

The fix is to stop letting frontmatter decide identity:

```js
const localeId = ({ entry }) => entry.replace(/\.[^./]+$/, "");

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/pages",
    generateId: localeId,
  }),
  // ...
});
```

Ids come from the path again — `en/cv`, `sv/cv` — and `slug` goes back to doing
the one job I wanted from it: naming the route.

## The part worth remembering

My config file had this comment sitting above the collections, written months
earlier:

```js
// entries live in per-locale subfolders (en/, sv/); ids are "<lang>/<slug>"
```

That comment was false the entire time. Nothing enforced it, and nothing
contradicted it either, because every `sv/` directory in the project was empty.
Every `/sv/*` URL was an English fallback. The collision needed two files
sharing a slug across two locales, and until that afternoon the site had never
had a single translated page.

This is the shape of bug I now watch for: not a regression, but a latent
assumption that only fails when a system meets the second of something. The
second locale. The second currency. The second tenant. The code was wrong from
the day it was written and the tests passed anyway, because the input that
distinguishes right from wrong didn't exist yet.

Which is also the argument for building the second one early, while the blast
radius is one page on a personal site rather than a product launch in a market
you have never served.
