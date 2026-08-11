---
title: "Kindle's API Has a Reading-Progress Field. Mine Was Zero for Every Book."
date: "2026-08-11"
topics: [programming, ai]
description: "Building one reading list out of Audible, Kindle, Amazon wishlists, and order history. Each gives up its data differently, and the field that looks most useful is the one nothing writes to."
draft: false
---

Kindle Cloud Reader has an undocumented JSON endpoint that sits behind your
normal web session and hands you your whole library:

```
GET /kindle-library/search?query=&libraryType=BOOKS&sortType=recency&querySize=50
```

Real ASINs, cover URLs, authors, a pagination token, and this:

```json
{
  "asin": "B0XXXXXXXX",
  "title": "Some Book",
  "percentageRead": 0,
  "resourceType": "EBOOK",
  "originType": "PURCHASE"
}
```

`percentageRead`. Exactly the field I wanted. It came back **0 for all 41
items**, including books I've finished and books with my own highlights in
them.

I was building one reading list out of everything Amazon knows about what I
read, which turns out to be four systems that don't share much: Audible,
Kindle, wishlists, and order history. Here's what each one actually gives you.

## The progress field nothing writes to

Amazon only updates `percentageRead` from the browser reader. Read on a Kindle
device or the phone app and your position syncs through Whispersync, which
never writes back to this endpoint. So the request succeeds, the field is
present, and it stays at zero for anyone who reads on the hardware they bought
for reading.

The signal that does work is `read.amazon.com/notebook`, the notes and
highlights page. It lists only books carrying a highlight or a note, most
recently accessed first. That's weaker: a highlight proves I opened a book,
not that I finished it. But it's real, and it matched my memory far better
than zero did. Eight books showed up there, seven of them in the library I'd
just pulled. Those import as "reading" and I promote them by hand.

## Twenty of my 41 Kindle items were samples

Same response, second problem. Only 21 were books. The rest had
`resourceType: "EBOOK_SAMPLE"` — the free first chapters you get from tapping
"Send a sample," which sit in your library indefinitely looking like
purchases.

They're also `originType: "PURCHASE"`, because Amazon books a sample as a
zero-price order. The field you'd reach for to filter them is the field that
won't. Filter on `resourceType`.

## Wishlists: the list view looks complete and isn't

Amazon wishlists have no API and no export button. The list view loads ten
items at a time as you scroll, so the obvious move is:

```js
window.scrollTo(0, document.body.scrollHeight);
```

This runs, returns no error, and loads nothing. Amazon's loader hangs off an
observer that scripted scrolling doesn't satisfy. The page stayed at ten items
with a clean console, and nothing indicated I was looking at a third of a
24-item list.

Amazon still ships a print stylesheet, and that's the way through:

```
/hz/wishlist/printview/<LIST_ID>
```

One table, whole list, no pagination. It drops the product links, so no ASINs,
but titles, authors, bindings, and cover images survive — enough to match
against everything else. Worth checking for a print view before writing any
scroll loop against a long Amazon list.

## Amazon files translators under "authors"

Every Amazon surface renders a byline as one flat comma-separated string, and
"byline" means everyone credited on the product page. For an audiobook that's
the author plus the narrator plus the audio imprint:

```
by Some Author, Random House Audio (Audible Audiobook)
by Some Author, Adrian West - translator (Audible Audiobook)
```

Explicit roles and publisher names come out cleanly with a regex. What doesn't
come out is the plain two-name case, because these are the same shape:

```
by Nick Cave, Seán O'Hagan          → co-authors
by Larry McMurtry, Lee Horsley      → author + narrator
```

Nothing in the string distinguishes them. I flag those rows rather than guess,
because a wrong author silently breaks matching against every other source,
and a missing one doesn't.

Kindle has its own version. Its `authors` array packs entries as
`"Surname, First:"` and concatenates them, so two authors arrive as the single
string `"Oakley, Barbara:Sejnowski, Terrence J."`. The delimiter is the colon.
Split on commas first and two people become four.

Order history is the one source I couldn't automate at all. The one-click CSV
is gone, replaced by a privacy request that takes hours to days, and the
sign-in redirect carries `openid.pape.max_auth_age=600` — a forced fresh
password entry even on a warm session. I checked on two marketplaces and both
behaved identically. It's also per-marketplace, so buying from more than one
Amazon domain over the years means one request each.

## Where I stopped loosening the matcher

Four books existed under different titles or author spellings across sources.
A Swedish edition and its English translation. A backlog entry storing just
"Wolfram" against an import supplying "Stephen Wolfram". "Dr Becky Kennedy"
against "Becky Kennedy". Each one is fixable by relaxing the match: strip
honorifics, fall back to surnames, allow curated alternate titles.

Every relaxation also buys new false positives. Matching on the text before a
colon merges the two books I wanted merged, and it will just as happily merge
volume one of a series into volume two. So the index drops any key that
resolves to more than one record instead of picking a winner, and ambiguous
rows get flagged. Cleaning up a duplicate is an afternoon. Finding out a year
later that two volumes were silently collapsed into one note is not.

## What shipped

185 books in one place: 89 migrated from a 2009 wishlist that had been sitting
in Notion, 45 from the two Amazon wishlists, 22 from Audible, 20 from Kindle,
and 9 that existed in more than one source and got merged. Four statuses'
worth of state, and a `priority` field that no importer can fill for me.

Audible was the easy one, through
[`audible-cli`](https://github.com/mkb79/audible-cli), which authenticates as
one of your own devices and has an `--external-login` flag so the password
goes through a browser instead of your terminal. Its listening progress is
real and populated. Same company, same account, and the Kindle equivalent is
empty.

The thing I'd tell myself at the start is the same lesson the Spotify export
taught me a week earlier: make one throwaway call and read the actual response
before designing anything around a field. A schema will tell you
`percentageRead` exists. It won't tell you nothing writes to it, that half the
enum values aren't books, or that the list you're reading is a third of the
list.
