---
title: "Privacy"
slug: "privacy"
description: "What klokie.com collects, what it doesn't, and how to reach me about it."
draft: false
---

# Privacy

This is a personal site. There are no accounts, no logins, no comment
threads, no newsletter, and nothing here is for sale. That keeps this page
short and, more importantly, honest.

## What this site collects

**Analytics.** Pages are instrumented with
[PostHog](https://posthog.com/) on its EU-hosted infrastructure
(`eu.i.posthog.com`), so analytics data stays in the European Union. It
records the ordinary things a web analytics tool records: which page was
viewed, the referring page, approximate location derived from the IP
address, and coarse device and browser information. I use it to see which
articles and case studies people actually read. I do not use it to build
advertising profiles, and I do not sell or share it with advertisers.

**Error monitoring.** Front-end errors are reported to
[Sentry](https://sentry.io/) so I can find out when something on the site
breaks. An error report contains the URL, the browser, and a JavaScript
stack trace.

**Server logs.** The site is served by [Cloudflare](https://www.cloudflare.com/)
Workers. Cloudflare processes requests and keeps its own short-lived edge
logs as part of delivering and protecting the site.

## What this site does not do

- No advertising, ad networks, or retargeting pixels.
- No selling, renting, or trading of any data about you.
- No accounts, so no passwords or profile data are stored.
- No third-party comment or chat widgets.
- No tracking of what you do on other people's websites.

## Embedded content

Some pages embed players from Bandcamp, SoundCloud, or YouTube, and some
pages link out to LinkedIn, GitHub, and similar services. When a page embeds
a third-party player, that third party can see the request and apply its own
privacy policy and cookies. If that matters to you, block third-party frames
in your browser — the rest of the page works fine without them.

## Email

If you [get in touch](/contact/), your message lands in my ordinary email
inbox. I keep correspondence for as long as it is useful and I don't add
anyone to a mailing list.

## Your choices and your rights

Under the GDPR you may ask what personal data I hold about you, ask for a
copy of it, or ask me to delete it. Analytics and error data are pseudonymous
and not linked to a name, so identifying your own records usually means
telling me roughly when and from where you visited. Ask anyway and I'll do
what I can.

You can opt out of analytics entirely by enabling your browser's tracking
protection or by sending a Global Privacy Control / Do Not Track signal —
and, of course, by using an ad or tracker blocker.

## Agents and automated clients

Crawling and reading this site with an automated client is fine and
explicitly allowed; see [`/llms.txt`](/llms.txt) for a map of the content and
`/robots.txt` for crawl rules. Every page is also available as Markdown via
`Accept: text/markdown`. Automated requests are logged the same way any other
request is.

## Changes and contact

If this policy changes, the updated version simply replaces this page — the
edit history lives in public in the site's Git repository. Questions,
corrections, or requests: [website@klokie.com](mailto:website@klokie.com).
