---
title: "This site now speaks Markdown to agents"
date: "2026-08-31"
topics: [programming, ai]
description: "One URL, two representations: browsers get HTML, agents that ask for text/markdown get the prose without the DOM. Here's the whole implementation, and the two things that bit me."
draft: false
---

Try this:

```bash
curl -s -H "Accept: text/markdown" https://www.klokie.com/about/
```

You get the page as Markdown. Drop the header and you get the same URL as
HTML, the way a browser would. Same address, two representations — which is
just [content negotiation](https://www.rfc-editor.org/rfc/rfc9110), a part of
HTTP that has been sitting there unused since 1997 and suddenly has a job
again.

The job is AI agents. When something fetches a page to read it, HTML is mostly
overhead: nav, scripts, style tags, layout wrappers, a cookie banner. The
convention forming around this is
[acceptmarkdown.com](https://acceptmarkdown.com) — send `Accept: text/markdown`,
get Markdown back. It costs a fraction of the bytes and the reader spends its
attention on the prose instead of the `<div>`s.

## The whole thing is four rules

1. **Serve Markdown when it's asked for**, with
   `Content-Type: text/markdown; charset=utf-8`.
2. **Set `Vary: Accept`** on _every_ negotiated response, HTML included.
   Without it a CDN caches whichever variant arrived first and then serves it
   to everyone — a wall of Markdown to browsers, or `<div>` soup to agents.
3. **Return `406`** when the client genuinely can't be satisfied — and only
   then. This is where people get it wrong in the other direction.
4. **Honor q-values.** `Accept: text/markdown, text/html;q=0.8` means "Markdown
   please, HTML if you must."

That fourth one is why you can't implement this with
`accept.includes("text/markdown")`. Chrome sends
`text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8`.
A substring check happens to work; the moment you handle `q=0` — which
explicitly means _don't send me this_ — you need a real parser that sorts by
quality and breaks ties by specificity.

## My setup, which is boring on purpose

This site is written in Markdown in an Obsidian vault, built with Astro, and
served from Cloudflare Workers. So the "Markdown representation" of a page
isn't a conversion of anything — it's the source. The build emits an
`index.md` next to every `index.html`, and a small worker in front picks one:

```js
const chosen = preferredType(request.headers.get("accept"), [
  "text/html",
  "text/markdown",
]);
```

If it picks Markdown, the worker fetches the `.md` sibling instead. Either way
it appends `Vary: Accept`, and HTML responses also advertise the sibling with
`Link: </about/index.md>; rel="alternate"; type="text/markdown"` for clients
that look. On Cloudflare the one config that matters is `run_worker_first` —
without it, Workers Assets answers straight from the bucket and your
negotiation code never runs at all.

I also added a [`/llms.txt`](https://www.klokie.com/llms.txt): a map of the
site with a "when to use this" section that says plainly what this site can
answer and what it can't. If an agent is going to summarize me, it may as well
have my own description to work from.

## Two things that bit me

**A 404 is a conversation.** A dead URL returns 404 either way, but the body
is negotiated too: browsers get the designed page, and a client that never
asked for HTML gets a short Markdown body with links to `/llms.txt`, the
sitemap, and the main sections. An agent that hits a broken link shouldn't
have to guess where to go next — and a 404 page is the one place where
"default to HTML" protects nobody.

**`Accept: */*` is not a request for Markdown.** It means "anything's fine,"
so it gets the default: HTML. That's the spec, and it's also just correct —
`curl` sends `*/*` and nobody typing `curl` wants a surprise.

And one that had nothing to do with HTTP. My verification script kept
reporting a file as missing when it plainly wasn't:

```bash
printf '%s' "$body" | grep -q "# About"    # lies on large inputs
```

`grep -q` exits the moment it matches, which SIGPIPEs the `printf` still
writing 150 KB into the pipe, which `set -o pipefail` then reports as a failed
pipeline. The fix is to let `grep` read the whole stream:
`grep -F -- "$needle" >/dev/null`. I lost fifteen minutes to a test that was
failing because it had succeeded too quickly.

The full check suite runs against the live site after every deploy — 42 of
them, covering both directions of every q-value case, because "serves Markdown
correctly" and "accidentally serves Markdown to Chrome" look identical until
you test for the second one.
