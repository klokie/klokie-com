---
title: "Adding a USB hub fixed my audio dropouts"
date: "2026-08-20"
topics: [music, programming]
description: "The dropouts weren't Ableton, the buffer, or the 11-year-old interface. They were the USB controller in my dock."
draft: false
---

Guitar into Ableton through a Scarlett 2i4, audible dropouts every few seconds.
Buffer size didn't matter. Closing Chrome didn't matter.

`coreaudiod` had a confident answer: 555 overloads blamed on a background audio
daemon, 73 on Ableton. I disabled the daemon. Nothing changed. CoreAudio names the
clients _affected_ by a reset, not the thing that caused it — every attached client
gets flagged, so the loudest complainer is just the busiest one.

One layer down, the kernel was repeating this every nine seconds:

```
mismatched event TRB 0x0000000080538970
IOUSBHostPipe::abortGated: ... endpoint 0x82: aborting 64 requests
AppleUSBAudio: (Resetting engine due to error returned in Read Handler)
```

196 engine resets in 30 minutes. The Fresco Logic FL1100 controller in my CalDigit
dock was desyncing its event ring and dumping every pending isochronous transfer.
Each dump reset the audio engine. Each reset was a dropout.

Moving the interface behind a cheap USB 2.0 hub — still on the same dock — took it
to zero. A USB 2.0 hub has a Transaction Translator that schedules isochronous
traffic locally instead of handing that job upstream. I can't prove that's the
mechanism; I never tested the Mac's built-in port. But zero is zero.

The number worth keeping:

```bash
/usr/bin/log show --last 10m --predicate 'process == "kernel"' --style compact \
  | grep -c "Resetting engine due to error"
```

Earlier the same day I'd blamed a USB 2.0 hub for a set of flaky external drives.
Opposite transfer type, opposite fix.
