---
title: "Your microphone cleanup never runs on iOS"
date: "2026-09-07"
topics: [programming]
description: "iOS Safari fires no events when a tab is closed, so the pagehide handler releasing your getUserMedia stream is dead code. The mic stays lit until Safari is killed."
draft: false
---

I built [a browser guitar tuner](https://tuner.klokie.com). Open the page, allow
the microphone, tune. Then I noticed something on my phone: after using it, the
orange recording dot stayed on. Not while the tab was open — **after I closed
it**. Safari was still holding the microphone, and it kept holding it until I
force-quit the browser.

The cleanup code was right there and looked correct:

```js
window.addEventListener("pagehide", () => {
  stream.getTracks().forEach((t) => t.stop());
  void context.close();
});
```

That is the standard advice. `beforeunload` and `unload` are unreliable on
mobile, so you use `pagehide` instead. Every article on the topic says so.

## The problem is that it never runs

[WebKit bug 199854](https://bugs.webkit.org/show_bug.cgi?id=199854): **Safari on
iOS doesn't fire any events when the tab or app is closed.** Not `pagehide`, not
`beforeunload`, not `visibilitychange`. Nothing.

The reason is the freeze. When you background a tab on iOS, the page stops
executing. When you later swipe it away in the tab switcher, there is no running
JavaScript context left to notify — the page was suspended minutes ago and gets
discarded without ever waking up. Your teardown handler is registered against an
event that will not arrive.

So the shape of the bug is worse than "cleanup didn't happen at the right time."
The cleanup was **unreachable on the platform**. On desktop it worked fine, which
is exactly why it survived review: Chrome and Firefox do fire `pagehide` on tab
close, so the leak never persisted there and nobody noticed.

## `visibilitychange` is the last event you get

The one event iOS reliably delivers is `visibilitychange` when the page goes
hidden — the moment you switch apps or tabs. That fires _before_ the freeze. It
is your last chance to touch the microphone, so that is where the release has to
happen:

```js
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    releaseMic();
    return;
  }
  // came back — re-acquire
});
```

There is a constraint hiding in here that decides the whole design. My first
instinct was a grace period: don't kill the mic the instant someone glances at a
notification, wait a couple of seconds and release only if they haven't come
back. **That is impossible.** Once the page is hidden, iOS stops running timers
and microtasks. A `setTimeout` scheduled inside the handler will never fire, and
neither will anything after an `await`. Whatever you do has to be fully
synchronous, inside that one callback.

So there is no soft version of this. You release immediately, or you leak.

## Which means you need a resume path

Releasing on every backgrounding is aggressive for something people hold a guitar
in front of. Glance at a message, come back, mic's gone.

Re-acquiring on return mostly works — the permission is already granted, so
`getUserMedia` won't re-prompt. But the `AudioContext` is the catch: iOS wants a
user gesture to start one, and coming back to a tab isn't reliably a gesture. So
the honest approach is to try, and have a visible fallback when it doesn't take:

```js
if (wasLive && !mic) {
  void startMic({ auto: true }); // leaves a "Resume" button if it fails
}
```

Two details worth stealing:

- The automatic re-acquire skips the analytics event that the manual start
  fires. Otherwise every app-switch inflates your permission-grant funnel.
- A failed auto-resume must not dump the user into your no-microphone fallback
  UI. They didn't deny anything. Leave the resume button and let them tap it.

I also moved the panel swap into the `pagehide` path. It costs nothing, since the
page is already hidden, and it means a back-button restore from the bfcache comes
back to an honest "Resume" button instead of a live-looking tuner wired to a dead
stream.

## Test the thing you can actually test

I wanted a browser test asserting that every `MediaStreamTrack` ends up in
`readyState: "ended"` after the page goes hidden. To see the tracks from the test
side, I wrapped `navigator.mediaDevices.getUserMedia` in a Playwright init
script.

Don't. **Any JavaScript wrapper around `getUserMedia` makes Chromium's fake
capture device hang** — the promise never settles and the page sits there
forever. It took me longer than it should have to catch this, because I was
assuming my wrapper was the problem right up until I ran the _unmodified_
baseline test and watched it fail identically. The fake-media harness had been
broken for a while by a Chromium version bump, entirely separate from anything I
was doing.

The lesson generalizes past this specific bug: when a test fails while you're
debugging, check that it passed before you started. I burned two cycles
attributing a pre-existing breakage to my own change.

What worked instead was making the microphone module take injectable
dependencies:

```js
export async function openMic(windowSize, deps = defaultDeps()) {
  const stream = await deps.getUserMedia({ audio: {/* … */} });
  const context = new deps.AudioContextCtor();
  // …
}
```

Now the teardown sequence — every track stopped, the graph disconnected, the
context closed, and the whole thing idempotent because two teardown paths can now
race — is a plain unit test with fakes, no browser required. I verified it was a
real test by reverting the fix and watching it fail.

## The short version

If your web app touches the microphone or camera:

1. `pagehide` alone is not cleanup on iOS. It is dead code there.
2. Release the device on `visibilitychange` → hidden, synchronously.
3. Make your `stop()` idempotent, because now two paths can call it.
4. Give people a way back in, and don't let the resume path pollute your funnel
   or your error states.

The permission dialog asks once. The user assumes closing the tab ends it. On
iOS, that assumption is wrong unless you do this.
