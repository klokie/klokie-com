---
title: "EU Medication Access Layer"
date: "2026-04-17"
location: "Stockholm"
categories: [health]
role: "Co-founder / Full-stack"
summary: "Service helping people in Sweden access already-prescribed medication from licensed pharmacies across the EU when it's unavailable or too expensive locally."
url: "https://www.receptionen.eu"
image: "https://media.klokie.com/cases/eu-medication-access-layer.png?v=2"
imageAlt: "EU Medication Access Layer (receptionen.eu)"
featured: false
draft: false
---

A first-version website and waitlist for a service that helps people in Sweden
get hold of already-prescribed medication from licensed pharmacies elsewhere in
the EU — when it's unavailable, back-ordered, or simply too expensive at home.

Built on the standard stack: Next.js on Cloudflare Pages, a Turnstile-gated
waitlist writing to Supabase behind a service-role edge route (row-level
security verified so nothing leaks), PostHog with PHI masking, and a
path-preserving canonical-host setup. Health data, so the privacy bar is high
from day one.
