---
title: "Squarespace won't export the pages you can see"
date: "2026-09-09"
topics: [programming]
description: "You can inventory a whole Squarespace site from the outside with ?format=json-pretty — until you hit a Fluid Engine page, which returns an empty stub. Measure before you promise a scripted migration."
draft: false
---

Before quoting a migration off Squarespace, I wanted to know how much content was
actually there. Not "how many pages does the nav show" — how many words, how many
images, how many of them are real.

You can get most of that without an account. Squarespace answers `?format=json-pretty`
on any URL and hands back the page's own data. Append it to a collection URL and you
get every item in the collection:

```bash
curl -s "https://example.com/events?format=json-pretty" > events.json
```

For an events collection that returns `upcoming` and `past` arrays, each item carrying
full body HTML, `startDate`/`endDate` as epoch milliseconds, `urlId`, tags, and
`assetUrl` for the cover image. Everything a migration needs. `?format=rss` and
`?format=ical` work too, which makes a decent cross-check on dates.

So I wrote the export script, ran it against the static pages, and got this:

```json
"mainContent": "<div class=\"sqs-layout\"></div>"
```

Empty. On every single page. Pages that render several screens of text in a browser.

## Fluid Engine doesn't serialize

Squarespace's newer page editor — Fluid Engine, the drag-on-a-grid one — doesn't put
its content where the older layout engine did. The JSON endpoint still responds `200`
with a well-formed document, still has a `mainContent` key, and that key is a stub.

The failure is quiet in the worst way. You don't get a `404` or an error field. You
get a valid-looking response with nothing in it, which is exactly what a page with no
content would also return. If your script logs "exported 8 pages" you will believe it.

The built-in Settings → Import/Export WordPress XML has the same gap, and it skips
Events entirely, so it isn't the fallback either.

**Check one page by hand before you build anything.** Fetch the JSON, look at the
actual bytes of `mainContent`, and compare against what the page renders. Length is
enough: 143 bytes is a stub.

In my case it didn't matter much. Stripped of markup, all eight pages together came to
under 11 000 characters — the longest was 913. Rewriting them by hand in Markdown was
faster than any scraper would have been, and produced better copy than a
faithful port of three-year-old placeholder text. But that was luck. A content-heavy
site would have turned a scripted afternoon into a manual week, discovered halfway
through.

## Two more things worth checking from the outside

**Empty event addresses still carry coordinates.** Eleven of the twelve events I pulled
had a blank address string and map coordinates of `40.7207559, -74.0007613`. That's
Squarespace's default drop pin, in Lower Manhattan. Every one of those events happened
in Sweden.

Nothing about the data says "unset". `mapLat` and `mapLng` are populated floats sitting
next to an empty `addressTitle`, and a naive importer will happily emit `Event` JSON-LD
placing a Stockholm meetup in New York. Treat an empty address as the signal, and drop
the coordinates when it's blank.

**Template stock photos hide in plain sight.** Squarespace image URLs are shaped
`https://images.squarespace-cdn.com/content/v1/<site-id>/...`, and that `<site-id>` is
the site the asset belongs to — not necessarily the site serving the page. Get the id
from the JSON (`website.id`), then bucket every image URL by it:

```bash
grep -oE 'images\.squarespace-cdn\.com/content/v1/[a-f0-9]+' page.html \
  | sort | uniq -c | sort -rn
```

Seven of the forty-three images on this site came from two _other_ site ids. Those are
the demo photographs that ship with the template — the ones with names like
`AroHa_02.jpg` and `20140301_Trade-151_0124-copy.jpg`. They had been sitting on the
live About page for three years.

That turned out to be the most useful number of the whole exercise. It isn't really a
technical finding; it's a measurement of how finished the site is, and it takes one
`grep`. Combined with an empty "Upcoming Events" block and a job posting whose start
date had passed, it reframed the question from _how do we move this_ to _is anyone
actually running it_ — which is a much better question to ask before writing a line of
migration code.

## The short version

Squarespace will tell you a lot about a site you don't have access to. Just don't
trust it to tell you when it's told you nothing.
