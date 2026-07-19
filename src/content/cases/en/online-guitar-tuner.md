---
title: "Online Guitar Tuner"
date: "2026-07-19"
ongoing: true
location: "Stockholm"
categories: [music, ai, apps]
summary: "Free browser-based guitar tuner for absolute beginners — microphone in, live needle out, no app, no sign-up, audio never leaves the device."
url: "https://tuner.klokie.com"
featured: true
draft: false
---

A free online guitar tuner built for the absolute beginner: someone holding a
borrowed guitar who doesn't know which string is which, which peg to turn, or
which way. Open [tuner.klokie.com](https://tuner.klokie.com), tap start, allow
the microphone, and pluck — the tuner names the string, highlights the right
peg on a headstock diagram, and tells you whether the pitch needs to come up
or down.

Under the hood: real-time pitch detection with the McLeod Pitch Method
(the [pitchy](https://github.com/ianprime0509/pitchy) library) reading a plain
Web Audio `AnalyserNode` — no WebAssembly, no audio worklets, because a tuner
doesn't need them. All audio is processed locally in the browser and never
uploaded. Seven tunings at launch (standard, drop D, drop C, DADGAD, open G,
half step and whole step down), each a static Astro page built from one shared
data model.

The interesting constraints were product, not DSP: guidance never claims a
rotation direction (wrong advice can snap a string on exactly the user this is
for), auto string-detection refuses to guess beyond ±2 semitones, and the
whole beginner flow — including microphone-denied fallbacks — is covered by
end-to-end tests that feed synthesized guitar tones into a fake browser
microphone.

Read the build story:
[From a two-year-old todo to a live product in one day](/articles/guitar-tuner-idea-to-live-in-a-day/).
