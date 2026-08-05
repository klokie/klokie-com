---
title: "Spotify's API Has No Play-Count Endpoint — Here's What You Get Instead"
date: "2026-08-05"
topics: [programming, ai]
description: "I wanted my followed artists ranked by how much I actually listen to them. Spotify's API can't tell you that — not to anyone, not even Spotify's own official apps — and the reason took three wrong turns to find."
draft: false
---

I wanted a simple export: every artist I follow on Spotify, saved as a note,
ranked by how much I actually listen to them. That last part turned out to be
the interesting problem.

## The list itself was already two dead ends

The Spotify connector I had wired into my AI assistant exposes a search tool
that can answer "what have I been listening to," but it's built as a
conversational widget — capped at 5 results, no pagination, and any prompt
containing the word "followed" returned a flat error. It's built to answer
one question at a time, not to export a library.

So: a self-hosted MCP server talking to the real Spotify Web API, with my own
developer app and OAuth token. Except that token had been scoped for playback
control and liked-songs reads months earlier, and Spotify's "get the artists
a user follows" endpoint needs its own scope
(`user-follow-read`) that nothing had ever requested. A quick code change and
one browser re-approval later, the list came back: 1,521 artists.

## The metadata that wasn't there

Every artist object from Spotify's API can carry genres, a popularity score,
and a follower count. Every one of mine came back empty — not just on the
followed-artists list, but on a plain, single-artist lookup by ID too.

```json
{ "name": "Keith Jarrett" }
```

That's the entire response for an artist whose Spotify page lists genres,
millions of monthly listeners, and a numeric popularity score. The catalog
data exists; my app just isn't allowed to see it. Spotify puts new developer
apps in what they call "unextended quota mode" by default, and my mistake was
assuming that meant a rate limit — fewer calls per second, maybe a lower
daily cap. It doesn't. It strips fields from the response, silently, with no
error and no indication in the docs which fields until you actually call the
endpoint and look.

If you're building anything against a personal-use Spotify app, make one
throwaway call to `GET /v1/artists/{id}` before you design a pipeline around
its fields. What comes back is not what the docs describe.

## "Sort by most popular" led to the real answer

With genre and popularity off the table, the natural fallback was: rank by
how much I've actually played each artist. Spotify doesn't have that either
— not through the API, not for third parties, not even for their own
first-party apps. Nobody outside Spotify's internal systems gets a raw
play-count number. It's why every "your top songs this year"-style tool that
isn't Spotify itself works from a scrobbling log (Last.fm and similar)
instead of the API — the number literally isn't exposed anywhere for anyone
to read.

The closest thing the API offers is **Top Artists**: a ranked list computed
by Spotify's own listening-affinity model, bucketed into three time windows —
roughly the last month, the last six months, or (with `long_term`) the last
several years, which is as close to "all time" as the API gets. It's a
computed rank, not a play count, and the fields on each artist are just as
stripped as everywhere else. But the _order_ of the list is real signal, and
that's what I actually needed.

The part that surprised me: most write-ups of this endpoint describe it as
returning your "top ~50" artists. Paginating it against my own library
returned **1,123** ranked artists before it ran out — well past what I'd
planned pagination limits around. Don't hard-code a low cap; loop until the
API's own `total` field says you're done.

## What shipped

A single numbered list: the artists that appear in both my followed list and
the long-term Top Artists ranking, in that ranking's order, followed by
whatever's left — artists I follow but apparently don't listen to enough to
register — appended alphabetically. Not the "sorted by popularity" I asked
for at the start, because that data doesn't exist. Closer to "sorted by how
much of my own attention this artist actually gets," which, for planning
what to listen to or cover next, turned out to be the more useful question
anyway.
