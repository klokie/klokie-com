---
title: "Eke Country (website)"
date: "2026-07-31"
location: "Gotland"
categories: [music, events, cms]
role: "Design & build"
summary: "Bilingual site for Eke Country — the Gotland live-music venue formerly known as Suder Country — built so the owners publish everything themselves."
url: "https://www.ekecountry.se"
image: "https://media.klokie.com/cases/eke-country.png?v=1"
imageAlt: "Eke Country website"
featured: false
draft: false
---

Eke Country is a live-music venue and *festplats* on southern Gotland, active
for over thirty years as Suder Country before new owners reopened it in the
summer of 2026. The site announces what's on, tells the story of the place, and
collects the mailing list that announcements go out to.

Bilingual Astro on Cloudflare, Swedish first with English alongside, and a
custom typographic treatment drawn from the venue's own hand-painted sign.

The interesting constraint was authorship. My other sites publish from an
Obsidian vault I control, which is useless when the people with the news are
the venue owners rather than me. So content lives in the repo and is edited
through a git-backed CMS in their own language — every save is a commit, and
every commit deploys. Nobody has to ask a developer to post a gig.

The newsletter runs on confirmed double opt-in through the site's own endpoint,
so the list and its consent record belong to the venue and can move with them.
Thirty years of history under the old name is carried deliberately in the copy
and the structured data, so the people still searching for Suder Country find
the place that replaced it.
