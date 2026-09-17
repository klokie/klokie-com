---
title: "Your Nest Cam cannot take a still photo"
date: "2026-09-09"
topics: [programming]
description: "Google's $5 Device Access fee looks like the price of getting your Nest camera into Home Assistant. For the battery generation it buys you event thumbnails, not snapshots — and if your home is on a Workspace account, it buys you nothing at all."
draft: false
---

I wanted one thing: a still image from my own outdoor camera, every so often, saved
somewhere I control. This is the least ambitious possible smart-home request. It took
an afternoon to establish that it is not possible with the camera I own, and the two
reasons it fails are both things you'd want to know before spending money.

## The tutorial you'll find is from 2020

Search for this and you land on posts about pulling raw video off a Nest camera without
a Nest Aware subscription. The best-known approach scrapes an OAuth token out of the
Google sign-in flow, exchanges it for a JWT at an internal Nest auth proxy, then joins
the WebSocket protocol the Nest web app used to stream to your browser, grabbing frames
and stitching them with ffmpeg.

It was a genuinely nice piece of reverse engineering. It is also completely dead. The
Nest web app and the standalone Nest app were retired in the migration to Google Home,
and every endpoint that chain depended on went with them. There is no patched version.
Don't start here.

## The supported route, and what it actually costs

The real path is Google's Smart Device Management API, which Home Assistant has an
official integration for. It gives you proper camera entities, so a snapshot becomes a
service call on a schedule — no scraping, no token games, and it survives Google's next
reshuffle.

The price is a one-time $5 registration in the Device Access Console, plus a Google
Cloud project, an OAuth consent screen, and a client ID. Call it 45 minutes. That $5 is
quoted everywhere as the toll for getting your cameras into Home Assistant, and it's
cheap enough that nobody looks past it.

Look past it.

## The generation split nobody puts in the headline

Nest cameras fall into two eras, and they behave completely differently:

| Generation                                                                          | Stream          | Still on demand                 |
| ----------------------------------------------------------------------------------- | --------------- | ------------------------------- |
| Nest Cam Indoor/Outdoor (pre-2021), Nest Cam IQ, Nest Hello                         | RTSP            | Yes — a live frame, any time    |
| Nest Cam (battery), Nest Cam wired 2nd gen, Nest Doorbell (battery / wired 2nd gen) | **WebRTC only** | **No. There is no live still.** |

Migrating a camera into the Google Home app converts it from RTSP to WebRTC, and
snapshot support is lost in the process. For the WebRTC generation the API doesn't
implement the "generate me an image" command at all. Those cameras expose a short clip
preview instead, tied to a motion or person event.

So the camera entity you get in Home Assistant shows the **last event thumbnail**. Ask
it for a snapshot on a timer and you get whatever stale frame that happens to be —
frequently just black, because nothing has moved since yesterday evening.

This is the part worth internalizing: the $5 is not refundable, and for half the
product line it does not buy the feature the tutorials are demonstrating.

### The two workarounds don't work either

Both obvious escape hatches are dead ends for exactly these cameras:

- **go2rtc** has a Nest source, but its own documentation notes it doesn't help for
  cameras that work exclusively through WebRTC — which is precisely the
  Google-Home-migrated ones.
- **Scrypted's Rebroadcast plugin** is the right shape: consume WebRTC, republish as
  RTSP, snapshot the RTSP. In practice it's reported broken for the Nest battery
  cameras — the stream plays fine in Scrypted's own UI while the rebroadcast RTSP
  doesn't come up.

And even if one of them worked: a battery camera is designed to sleep and wake on
events. Waking it every fifteen minutes to negotiate a WebRTC session is a great way to
flatten it in a few days.

## The second blocker, which is worth checking first

There's a line in the integration docs that's easy to skim past. The API is incompatible
with some Google account types, including **Google Workspace** and accounts in the
Advanced Protection Program.

My home is owned by an account on my own domain. A custom-domain Google account is
almost always Workspace, and one command settles it:

```
$ dig +short MX example.com
0 aspmx.l.google.com.
```

Google MX records on your own domain means Workspace, which means the Device Access
Console will not accept that account at signup. No fee, no workaround at that layer,
just a refusal.

There is a way around it now — Google expanded Google Home's Workspace support in April
2026 to include full home sharing, so you can invite a consumer gmail account into the
home as a member and run Device Access under that account instead. Whether the API
exposes devices to a non-owner _member_ rather than only the owner is undocumented, so
it's a $5 bet. You can at least de-risk the account-type half for free: the console
rejects ineligible accounts at signup, before payment.

I'd skip transferring the home's ownership outright. It's Google's own recommendation,
but the blast radius is every mesh point, every speaker, and every household routine —
far too much disruption for one camera.

## A smaller thing that cost me a scan

Before any of this, I'd tried to find the camera on the network. There was an
unidentified Google device sitting in my LAN inventory for a couple of weeks: answers
nothing, every one of ~1060 scanned ports closed, no mDNS advertisement.

That was the camera. I probed it again while the app simultaneously reported "Last
contact: Just Now" and still got nothing — no ARP entry, no ping response, no open
ports. This is normal and permanent: Nest cameras are pure outbound clients. They open
no local ports and don't announce themselves over mDNS.

**A LAN sweep will never identify a Nest camera.** Get the model from the app's device
information screen and stop scanning.

## What I'd tell someone starting this

Three checks, in this order, before you spend anything:

1. **What generation is the camera?** The app's device information screen tells you.
   RTSP-era gets live stills; WebRTC-era does not, and no amount of tooling fixes that.
2. **What kind of Google account owns the home?** `dig +short MX yourdomain` — if it's
   Workspace, the API is closed to you until you restructure the home's sharing.
3. **Is there mains power where the camera is going?** If yes, and you actually want
   periodic stills, a wired camera that speaks RTSP natively costs about the same as
   dinner, records locally, needs no cloud round-trip, no developer console, and no
   account juggling.

I ended up doing none of the above. The camera keeps doing motion alerts in the app,
which it's good at, and I stopped trying to make it be a webcam. That's a legitimate
outcome — the useful work was finding out, in an afternoon and for nothing, that the
alternative was an hour of setup and a non-refundable fee for a feature that doesn't
exist on my hardware.

One last note, because it wasted a few minutes of worry: the integration docs warn you
to remove existing Google credentials before setting it up, which reads alarmingly like
it will disturb your other Google integrations. It won't. That refers to Home
Assistant's own Application Credentials registry — stored OAuth client pairs — not
anything in your Google account. Cast uses local discovery with no OAuth at all, and
backup add-ons hold their own tokens outside that registry. Neither is affected.
