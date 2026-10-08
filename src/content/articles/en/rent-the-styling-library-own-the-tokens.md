---
title: "Rent the styling library, own the tokens"
date: "2026-10-08"
topics: [programming]
description: "Keeping a web design system in sync with React Native looks like a library choice. It isn't. The library is a rental you will replace; the token layer is the part you keep."
draft: false
---

Someone asked me recently how they should keep a web design system in sync with
React Native. They had styled-components on the web, a React Native app
drifting away from it month by month, and a reasonable hope that some library
would close the gap.

I gave a decent answer — compare Tamagui, NativeWind, react-strict-dom, pick
one — and then spent the evening realizing it was the wrong shape. The library
comparison is the easy half, it's the half that dates fastest, and it isn't
where the drift comes from.

## The drift has exactly one cause

Web and native design systems diverge because the values get typed in two
places. Not because the styling APIs differ — that's friction, and friction is
survivable. They diverge because `#6d5efc` lives in a web theme file and also,
separately, in a React Native stylesheet, and one day somebody adjusts one of
them.

Every retyped value is a future inconsistency with a date on it. No styling
library fixes this, because every styling library is downstream of it. Pick the
best one in the world and install it on both platforms, and you'll still have
two copies of your spacing scale.

So the first move isn't choosing a library. It's making the values singular.

## Tokens are the part you keep

One module, no styling library imported, consumed by both platforms:

```ts
// tokens.ts — deliberately imports nothing
export const color = {
  bg: "#0b0b0c",
  fg: "#f4f4f5",
  accent: "#6d5efc",
} as const;

export const space = [0, 4, 8, 12, 16, 24, 32, 48] as const;

export const text = {
  body: { size: 16, line: 24 },
  title: { size: 28, line: 34 },
} as const;
```

That file is boring on purpose. It has no dependencies, so it can't be broken
by a library upgrade, and it can't become the reason you're stuck on a
styling library you've outgrown. The web turns it into CSS custom properties at
build time; native turns it into a theme object. Both derive, neither owns.

Two things about this bit me, and neither is obvious until you try it.

**Store numbers, not strings.** It's tempting to write `space: ["0", "4px",
"8px"]` because that's what CSS wants. React Native wants unitless numbers, so
the moment you bake units into the source of truth, one platform has to strip
them back off — and a `parseFloat` in a theme adapter is exactly the kind of
code that quietly handles `16px` and then meets `1rem`. Keep the canonical
value numeric and let each platform's adapter add units. The same applies to
font weights, which native wants as strings and CSS is happy to take either
way.

**Don't let components into the token layer yet.** `button-primary-bg` feels
like good tokenization and is actually a trap this early: it encodes a
component decision into the layer that's supposed to outlive your components.
Start with primitives (`color.accent`, `space[4]`), add a thin semantic layer
when you genuinely have two consumers that disagree, and let component tokens
arrive last, if ever.

What doesn't cross the boundary at all: shadows, where CSS `box-shadow` and
native elevation are different models rather than different syntax; and
anything percentage-based, where native's layout assumptions won't match.
Those belong in platform files, and pretending otherwise produces a token that
means two things.

## Then pick a renter

With tokens in place, the library choice gets much smaller — which is the
point. You're choosing an authoring experience, not a design system, and you
can change your mind later without touching a single value.

My read as of late 2026, for a project I'd start today:

**[Unistyles](https://www.unistyl.es/)** is where I'd default for anything
React Native-first. It's a superset of the StyleSheet API rather than a new
paradigm, so it reads like React Native, and it brings the three things vanilla
StyleSheet lacks — variants, themes, and dynamic values. The benchmarks are
good. The ceiling is that it's native-first by nature, so it's the right answer
when the web is the secondary target rather than an equal one.

**[Tamagui](https://tamagui.dev/)** is the most complete answer to the actual
question, with an optimizing compiler that flattens styled components into
plain views at build time, and the strongest web/native parity story available.
It's also a whole-system commitment with opinions about how you write UI, and
it concentrates a lot of your future in one project's roadmap. Worth it if
universal is the product requirement rather than a nice-to-have.

**[NativeWind](https://www.nativewind.dev/)** is the easiest to adopt if the
team already thinks in Tailwind, and the one I'd think hardest about otherwise.
Not because it's bad — it's good — but because adding it to a codebase with an
existing styling idiom means maintaining two, which adds a divergence instead
of closing one.

**[react-strict-dom](https://facebook.github.io/react-strict-dom/)** is the one
I'd watch rather than build on. StyleX underneath, used in production at Meta,
and both Meta and Expo treat its syntax as the intended path for new universal
apps — strategically it's where this whole problem is heading. But the API is
complete on web while React Native support is still in progress, and it's
shipping 0.0.x. For a universal app today, that's a bet; for a web app, it's
already real.

And **styled-components**, which is where many of these codebases actually
start: it entered [maintenance
mode](https://github.com/orgs/styled-components/discussions/5657) in March
2025, with the maintainer writing plainly that he wouldn't recommend adopting
it for new projects. It never picked up React 18's `useInsertionEffect`, the
hook added specifically to fix CSS-in-JS performance, and React 19 broke
streaming SSR. A fork and some recent work have given it a path forward in
modern React, so an existing codebase isn't in danger — but `styled-components/native`
is a migration bridge now, not a destination, and definitely not a greenfield
choice.

Notice that every one of those paragraphs could be wrong in eighteen months,
and the tokens file couldn't. That asymmetry is the whole argument.

## The sequencing rule

One thing I'd say before any of the above, because it's the mistake with the
highest cost and nobody warns you: **don't migrate styling during a platform
upgrade.**

If the React Native version is well behind, or the app has moved off managed
tooling into a bare workflow, that upgrade is already the expensive kind — the
one where you're bisecting native build failures and reading changelogs for
transitive dependencies. Running a styling migration underneath it means two
systems moving at once, and every bug could belong to either. You lose the
ability to say "this worked yesterday" about anything.

Tokens are safe to do in parallel, because they're just a module with no
dependencies. Nothing else is. Land the upgrade, then change how you write
styles.

I've maintained a shared component library that other engineers built on, and
the thing that caused pain was never the styling API. It was every place a
value had been copied, each one a small bet that nobody would ever change it.
The library you pick determines how pleasant your week is. The tokens determine
whether the design system is still true in two years.
