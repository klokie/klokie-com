---
title: "CV — Daniel Grossfeld"
slug: "cv"
description: "CV of Daniel “Klokie” Grossfeld — senior full-stack engineer and architect in Stockholm. TypeScript, Node, React, event-driven services, cloud."
draft: false
---

# Daniel "Klokie" Grossfeld

Senior full-stack engineer, architect and entrepreneur — Stockholm, Sweden.

27 years building for the web: complex data-driven products, e-commerce,
media distribution, and regulated healthtech. Founding partner of four
international companies, and a hands-on engineer throughout — I've led small,
fast teams in New York, London, Paris, Barcelona and Stockholm, and I still
write the code.

Lately, two things. **I build with AI agents rather than just calling them** —
MCP servers, always-on agent infrastructure, versioned skills and workflows — and
I introduced that way of working to an engineering team, where the lesson was
that it only holds once the shared rules and documentation exist. And **I build
the interfaces that make large, structured data legible**: a Visx graphing
library for longitudinal medical data, and before that a layout engine that
composed magazine pages automatically using computer vision.

Underneath both: TypeScript and Node, React and React Native, Python, event-driven
services on Kafka and Postgres — plus the surrounding craft of making a platform
survive its own history. I like owning a service end to end, and I like leaving a
team faster than I found it.

**Currently open to senior, lead and staff engineering roles** — remote-first
or genuinely flexible hybrid, southern Stockholm or fully remote.
[Get in touch](/contact/).

## Experience

### Werlabs — Full-Stack Developer

_Stockholm, 2024 → present (consultant, then employee from February 2025)_

Health-tech platform for consumer blood testing, in a regulated Swedish
environment.

- Built and owned two production services end to end: an appointments and
  booking service integrating a third-party scheduling provider — entitlements,
  practitioner management, webhooks, Kafka events, booking and cancellation —
  which underpins the company's paid video consultations; and a
  TypeScript/Playwright PDF-generation microservice that replaced a fragile
  legacy JVM stack, with service-to-service auth, browser isolation, monitoring
  and an autoscaling path.
- Shipped the infrastructure around them: webhook consumers, health-check
  coverage, structured logging, feature toggles and proportional rollout.
- Held continuity for the legacy platform through several departures —
  identity and user profile, results, the practitioner app — including a
  handover to an external partner.
- Introduced AI-assisted development to the team (editor tooling, shared
  rules, reusable skills) and onboarded a new developer through review and
  context transfer.
- Built a dynamic graphing library on Airbnb's Visx that renders longitudinal
  medical data over time, used across consumer and B2B surfaces — large result
  sets, interactive time-series, and a component API other engineers build on.

### Scania — Elain Advanced — Product Owner / Senior Back-end

_Stockholm, 2023–2024_ — data platform for a global truck manufacturer. **Python**
serverless ingest APIs, SQL migration and modelling across GCP and AWS, owning
both the backlog and the backend.

### TV4 / Telia / C More — Senior Full-stack Developer

_Stockholm, 2022–2023_ — streaming and media distribution at national scale,
across web and connected-TV clients. Editorial and content-delivery systems under
real traffic, including PIN-code authentication and cross-domain consent
handling.

### Sneakersnstuff — Senior Full-stack / Tech Lead

_Stockholm, 2020–2022_ — led a small team building the **React Native** app
(TypeScript, AWS, **Swift** for the native iOS layer) past **a million monthly
active users**, multilingual and multinational across markets, languages and
currencies. Migrated a large cross-platform codebase to TypeScript, integrated
payment and logistics APIs, owned App Store and Play releases, and embedded a
Unity game inside the app.

### Enliven — Co-founder & CTO

_Stockholm, 2017–2024_ — AI-based media platform for professional creatives and
premium personal brands. Raised 1 MSEK and built the whole stack myself —
Node.js on MongoDB and MySQL with Docker, a REST API, a React front end — and the
product itself: a design system that composed magazine-quality layouts
dynamically using **computer vision**, years before the current AI boom.

My partner and I personally signed over **250 journalists, photographers,
stylists and chefs** from top-tier publications, who published on the platform
from 2017 to 2022. When the consumer product stalled I productised the layout
engine as a standalone API.

### Odalisque Magazine — Co-founder & Technical Director

One of Sweden's leading fashion, arts and culture publications, in print and
on the web.

### S2A Interactive — Founder

Independent studio building modern web architecture for SMEs across European
and US media and fashion.

### Surface to Air — Co-founder & CTO

_New York / Paris, 2000–2008_ — design studio serving publishing, music, film
and fashion.

Earlier clients include MoMA, Tiffany & Co., Rawkus, Source, and New York
Magazine. The longer list is on [things I've worked on](/work/).

## Building with agents

Two years of building with AI agents rather than just calling them:

- **Always-on agent infrastructure** on a self-hosted Linux box — scheduled and
  event-driven jobs, messaging and mail gateways, and a migration between agent
  runtimes with the integrations kept intact.
- **MCP servers and tooling** for my own data and task systems, plus multi-host
  repo and state management across three machines —
  [repoman](https://github.com/klokie/repoman), written in **Go**.
- **Agent skills and workflows** as reusable, versioned units. This is what I
  then introduced to the team at Werlabs, and the lesson was that adoption only
  holds once the shared rules and documentation exist — that is what makes agent
  output something a team will accept in review.

## Research and side work

**Promobilia / KTH** — _2025 → present_ — assistive technology for deaf and
hard-of-hearing users: real-time environmental sound recognition delivering
haptic and visual feedback. **Unity** on iOS with an Apple Watch companion,
on-device inference (YAMNet embeddings plus a trained classifier head, exported
to **ONNX**), Core Haptics and a native WatchConnectivity plugin. Co-authored an
ASSETS 2026 submission.

**Kendra Foundation** — _London, 2009–2013_ — two EU FP7 research projects. EU
liaison for SARACEN, authoring proposals accepted by the European Commission;
and P2P-Next — peer-to-peer content delivery and adaptive streaming, 21 partners
— as a senior back-end engineer. Distributed machine learning on a
**Hadoop/Mahout** cluster with Python.

**This site** — Astro, TypeScript and Cloudflare Workers: fully bilingual, with
per-locale routing, translation fallback, canonical and hreflang policy,
locale-aware structured data, edge delivery and a content pipeline that publishes
from source on push. Where I try things before recommending them.

## Stack

**Core:** TypeScript, Node.js, React, **React Native**, **Python**, Astro,
Postgres, Kafka, REST and event-driven APIs, Playwright, Docker, CI/CD.

**Cloud and delivery:** AWS, GCP, Cloudflare Workers, CDN and edge delivery,
observability and structured logging, feature flagging and progressive rollout.

**AI and agents:** LLM agent runtimes, MCP server design, agent skills and
scheduling, retrieval over local corpora, computer vision, on-device inference
(ONNX), distributed ML.

**Mobile and realtime:** React Native, Swift, Unity (C#), Core Haptics.

**Also:** **Go**, Keycloak and OIDC, i18n routing and content pipelines, data
visualisation (Visx, D3).

## Education

**Boston University** — _cum laude_, 1993–1998
B.S. Computer Systems Engineering · B.A. Music Theory and Composition

## Languages

English (native), Swedish, Spanish, basic French.

---

Full history on [LinkedIn](https://www.linkedin.com/in/klokie/) ·
[things I've worked on](/work/) · [get in touch](/contact/)
