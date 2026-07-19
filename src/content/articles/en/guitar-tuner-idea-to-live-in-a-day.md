---
title: "From a Two-Year-Old Todo to a Live Product in One Day"
date: "2026-07-20"
topics: [programming, ai, music]
description: "How an AI-assisted pipeline — hard product questions, adversarial design reviews, then code — took a guitar tuner from a 2024 Todoist note to tuner.klokie.com in a single day."
draft: false
---

In May 2024 I wrote a three-word Todoist note: "Wasm, Ads, Analytics" under
the task *Make online guitar tuner*. It sat there for two years. Last night I
said "let's build," and by the end of the session
[tuner.klokie.com](https://tuner.klokie.com) was live, tested, and working
well enough that tuning my own guitar with it genuinely surprised me.

The interesting part isn't that AI wrote the code fast. It's everything that
happened *before* the code, and how much of my original three-word plan
didn't survive it.

## The idea got interrogated before it got built

Instead of jumping to implementation, the session started with a YC-style
office hours: who actually needs this, what do they do today, what's the
smallest thing worth shipping? Under questioning, my honest answers reshaped
the product:

- **I'm not the user.** I tune with a clip-on or by ear. The real user is a
  beginner holding a borrowed guitar who won't install an app — and doesn't
  know which string is which.
- **"Guitar tuner online" is a brutal market.** Fender and GuitarTuna own the
  head term, and AI search summaries have eaten 15–25% of utility-page clicks
  since 2025. The winnable ground is long-tail tunings and shareable links,
  not the front page of Google.
- **Two of my three original words got cut.** WebAssembly turned out to be
  engineering vanity — a well-chosen algorithm on the plain Web Audio API is
  plenty. And ads at launch would have damaged the one edge a newcomer has
  over the incumbents: a page that respects you. (Analytics survived, in
  cookieless form.)

## Then the plan got attacked

Two different AI models reviewed the design adversarially before a line of
code existed — and a second model, seeing only a summary, challenged the
premises of the first. The best catches were things I'd never have found
until users hit them:

- **Peg arrows can break strings.** The original design showed "turn this peg
  clockwise" animations. But rotation direction depends on how the string is
  wound and which way you're facing the headstock — confident wrong advice,
  aimed at the person least equipped to doubt it. The shipped version
  highlights *which peg* belongs to the string and says whether the pitch
  needs to go up or down. Strictly less flashy, strictly safer.
- **My success metric was wrong.** "User tunes all six strings" counts a
  drop-D player retuning one string as a failure. The metric became
  per-string.
- **Adjacent guitar strings are five semitones apart** — so an auto-detector
  that guesses within ±6 semitones can confidently point at the wrong string.
  The shipped snap window is ±2, with a manual selector as the escape hatch.

## The code was the easy part

The build itself followed a boring, proven path: Astro static pages, the
McLeod Pitch Method via an open-source library, one shared data model so that
each new tuning is a data entry plus a page of copy. The part I'm happiest
about is the test rig: Chromium can be launched with a *fake microphone* fed
from a WAV file, so the entire beginner flow — tap start, grant mic, pluck a
low E, watch the needle settle, get the checkmark — runs headlessly in CI
with synthesized guitar tones. The classic failure mode of pitch detectors
(reading a low E an octave high when a phone mic swallows the fundamental)
has its own regression test.

A few hours after launch it grew from three tunings to seven — drop C,
DADGAD, open G, whole step down — at a marginal cost of roughly one data
entry and one page of copy each, because the review had forced that
architecture in advance.

## What I'd tell you to steal

Not the tuner (though please, [tune your guitar](https://tuner.klokie.com)).
The pipeline: make the AI argue with your idea before it builds your idea.
The building was one day. The two years of not-building were the expensive
part — and the hour of adversarial questioning is what kept the one day from
producing the wrong product.
