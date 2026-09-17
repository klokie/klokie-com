---
title: "Your smart plugs aren't broken, your mesh is"
date: "2026-09-17"
topics: [programming]
description: "The coffee machine didn't turn on again. The plug looked dead, the vendor looked guilty — but sequential ping tests were lying, and the wired control group gave it away."
draft: false
---

The coffee machine hadn't switched on in the morning for weeks. Same for the
projector. Two cheap Wi-Fi smart plugs, same vendor, same behavior: the schedule
fires, nothing happens, and by the time you're awake enough to care, the plug is
responding again.

The obvious suspect is the plug. Cheap hardware, a cloud integration in the
middle, a vendor app nobody loves. I nearly filed it under "buy better plugs."

That would have been wrong, and the way I found out is worth stealing.

## Sequential probes lie about intermittent faults

My first instinct was to ping the plugs one after another:

```bash
for ip in 192.168.1.122 192.168.1.202 192.168.1.157; do
  ping -c 15 "$ip"
done
```

The coffee plug showed **100% packet loss** and a closed TCP port. Dead device,
case closed.

Except a few minutes later the same plug showed **62% loss with the port open**,
and the projector — which had just measured a clean 0% — was now dropping half
its packets.

Each probe is a snapshot of a different moment. When the fault is intermittent RF,
sequential sampling doesn't compare three devices; it compares three points in
time and invites you to read the difference as a property of the hardware. I drew
two contradictory conclusions from the same command in the same half hour.

## Probe everything at once, with a wired control

The fix is to sample every target _simultaneously_, so they share identical
conditions, and to include devices you already trust:

```bash
probe(){ ping -c 100 -i 0.2 -W 1 "$1" 2>/dev/null | tail -2 > "/tmp/rf_$2.txt"; }

probe 192.168.1.122 coffee_plug &
probe 192.168.1.202 projector_plug &
probe 192.168.1.33  chromecast_WIFI &
probe 192.168.1.153 meshpoint_kitchen_WIFI &
probe 192.168.1.26  hue_bridge_WIRED &
probe 192.168.1.1   gateway_WIRED &
wait

grep -H "" /tmp/rf_*.txt
```

The control group is the important part. One wired device is worth more than ten
wireless ones, because it splits the outcome cleanly: if wired is clean and
wireless is not, the problem is RF and nothing else needs investigating.

Here's what came back, and it wasn't subtle:

| Target              | Link  | Loss     | avg / max RTT      |
| ------------------- | ----- | -------- | ------------------ |
| Gateway             | wired | **0%**   | **0.35 ms**        |
| Hue bridge          | wired | **0%**   | **0.36 ms**        |
| Chromecast          | Wi-Fi | 0%       | 140–250 ms / 1.5 s |
| Mesh point, bedroom | Wi-Fi | 16–40%   | 200–595 ms / 3.6 s |
| Mesh point, kitchen | Wi-Fi | **100%** | no reply           |
| Coffee plug         | Wi-Fi | **100%** | no reply           |
| Backyard plug       | Wi-Fi | 98–100%  | 407 ms             |
| Projector plug      | Wi-Fi | 0%       | 23–30 ms / 164 ms  |

Every wired device answered in about a third of a millisecond with zero loss.
Every wireless device was degraded — **including the mesh access points
themselves**.

A mesh node dropping 100% of packets is not a smart-plug problem. The kitchen node
is also the access point nearest the coffee machine, which is precisely the plug
that fails most.

## Ruling out the vendor properly

"It's the Wi-Fi" is a satisfying conclusion, which is exactly why it deserves
falsifying. Four independent checks, none of which required trusting the plugs:

- All three cloud integrations reported a healthy `loaded` state.
- The home automation error log was **completely empty** — zero lines. A failing
  cloud integration is not a quiet one.
- The failing devices sat on **different vendor cloud accounts**, yet failed
  together.
- One plug's **local** control port was open while the cloud still reported it
  offline, so the device's own stack was fine.

The clincher was timing. All three plugs were marked unavailable within six
minutes of each other: 06:40:57, 06:43:27, 06:46:29. Three devices on three
separate accounts do not fail in a six-minute window for three separate reasons.
Correlated failure means a shared dependency, and the only thing they shared was
the air.

## The uptime tell

Two numbers finished the story. The mesh router had been up **146 days**. The
bedroom node and the Chromecast had both rebooted in the last **1.5 days**.

Infrastructure that old, with clients that keep reconnecting underneath it, is a
mesh quietly falling apart rather than one that has failed. It still passes a
casual test — phones work, streaming works — because those retry aggressively and
tolerate a 1.5-second round trip. A smart plug waiting for one small command at
04:30 does not.

That's why the failure looked like a plug problem: the devices that suffer first
are the ones with the least to say.

## A bonus trap: the one-day default

While reconstructing when the plugs dropped, I queried the automation server's
history API for a 14-day window and got three records. Then a 7-day window that
returned one record, implying a device offline for a solid week.

Both were wrong. That API defaults `end_time` to **start + 1 day**. I hadn't
passed one, so every "long" query was silently a single day, and a plug that was
flapping constantly looked permanently dead.

```bash
# Silently returns ONE day
curl ".../api/history/period/$START?filter_entity_id=$E"

# Actually returns the range you asked for
curl ".../api/history/period/$START?end_time=$NOW&filter_entity_id=$E"
```

Any time-range API can have an implicit window. If a result looks suspiciously
sparse, check whether you actually asked for the range you think you did before
concluding anything about the data.

## What to do about it

In cost order, cheapest first:

1. **Power-cycle the mesh**, router first, then the nodes. Five months of uptime
   is the cheapest hypothesis to eliminate, and it's free.
2. **Re-add or relocate the worst node.** If one access point stays bad after a
   restart, its backhaul is the problem, not its radio.
3. **Wire the worst node.** Ethernet backhaul deletes the weakest link instead of
   negotiating with it. This is the durable fix.
4. **Check 2.4 GHz congestion.** Cheap plugs are 2.4 GHz-only, so they degrade
   first and worst — they're an early warning for the whole band.

One thing that is _not_ the fix: moving the plugs to local control to cut out the
vendor cloud. It's worth doing for latency and privacy, but it cannot rescue a
device dropping 100% of its packets. Fix the radio first.

## The takeaway

When several devices misbehave at once, the instinct is to look at what they have
in common as _products_ — same vendor, same app, same firmware. Look instead at
what they have in common as _infrastructure_.

And measure in parallel. A network that's fine one second and broken the next will
happily tell you a different story every time you ask, and you'll believe whichever
one you asked for last.
