---
title: "Werlabs"
date: "2024-08-15"
ongoing: true
location: "Stockholm"
categories: [health, medtech, ai]
role: "Senior Full-stack Engineer"
summary: "Two production services owned end to end at a regulated Swedish health-tech provider: the appointments and booking service behind its paid video consultations, and a TypeScript/Playwright PDF pipeline that replaced a fragile legacy JVM stack."
image: "https://media.klokie.com/cases/werlabs.png?v=2"
imageFit: "contain"
imageAlt: "Werlabs"
featured: true
draft: false
---

Werlabs is a registered Swedish healthcare provider built around prevention
rather than treatment: regular blood testing, medical interpretation by doctors,
and results presented over time in a digital journal. It works with accredited
labs including Synlab, Unilabs and Karolinska Universitetslaboratoriet, and its
medical team has analyzed millions of blood markers since 2013.

I joined as a consultant in 2024 and as an employee from February 2025, working
on the consumer platform in an environment where correctness is regulated and a
wrong result page is not a cosmetic bug.

## Two services, owned end to end

The first was **appointments and booking** — the service that underpins the
company's paid video consultations. It integrates a third-party scheduling
provider and handles entitlements, practitioner management, webhook consumers,
Kafka events, and the booking and cancellation flows around them. I took it from
design through to running it in production.

The second replaced something that kept breaking: a **PDF generation
microservice** in TypeScript and Playwright, standing in for a fragile legacy JVM
stack. Browser isolation, monitoring, and a path to autoscaling, because the
failure mode of the old system was the kind that surfaces at the worst moment and
nobody can explain afterward.

Around both: health-check coverage, structured logging, feature toggles, and
deterministic proportional rollout. The unglamorous half — but a release you can
turn off at 2% is a different kind of release.

## Longitudinal medical data, drawn properly

I built a graphing library on Airbnb's [Visx](https://airbnb.io/visx/) for
rendering medical results over time, used across both consumer and B2B surfaces.
Large result sets, interactive time series, and a component API that other
engineers build against.

The interesting constraint was not performance. It was that a person looking at
their own values over three years should be able to see the trend without being
alarmed by noise, and a doctor looking at the same chart should still see the
outliers. Those are different readings of one picture.

## Continuity through change

Over two years the team turned over several times, and I held the legacy platform
through it — identity and user profile, results, the practitioner app — including
handing a part of it to an external partner without dropping it.

I also introduced AI-assisted development to the team: editor tooling, shared
rules, reusable skills, and the review habits that make them safe to use. The
lesson was that adoption is not a tooling problem. People adopt what someone sits
down and shows them, on their own code.
