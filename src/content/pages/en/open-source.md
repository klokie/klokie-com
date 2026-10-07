---
title: "Open source"
slug: "open-source"
description: "Small open-source tools by Daniel “Klokie” Grossfeld — email-to-PDF conversion, Obsidian, personal finance sync, YouTube transcripts, and multi-machine git."
draft: false
---

# Open source

Tools I built to scratch my own itch, published in case they scratch yours too.
All MIT-licensed. Issues and pull requests welcome.

## [eml-to-pdf](https://github.com/klokie/eml-to-pdf)

Convert `.eml` email files to PDF for archiving and sharing. Handles HTML and plain-text bodies and filters some
privacy and security hazards on the way. Python, Linux and macOS.

## [New Tab by Default](https://github.com/klokie/obsidian-new-tab-by-default)

An [Obsidian](https://obsidian.md) plugin that opens links, files, and search
results in a new tab, the way a browser does. TypeScript.

## [seb-lunchmoney-sync](https://github.com/klokie/seb-lunchmoney-sync)

Sync European bank transactions into [Lunch Money](https://lunchmoney.app) via
[Enable Banking](https://enablebanking.com), a PSD2 account-information
provider. Built and tested against SEB in Sweden, but the bank is
configuration, not code. Useful when your bank has no native Lunch Money
connection, or its managed sync keeps breaking. Python.

## [repoman](https://github.com/klokie/repoman)

Manage hundreds of git repos across several machines: a manifest says which
repo lives where, one command shows what's dirty or unpushed everywhere, and
the state git doesn't carry — `.env` files, local overrides, asset folders — is
backed up with restic. Archive a project and restore it months later. Built
because cloud sync and `.git` directories don't mix. Go.

## [yt-summarize](https://github.com/klokie/yt-summarize)

A CLI that fetches a YouTube transcript (captions, or audio as a fallback) and
writes a structured summary as Markdown or JSON. Map-reduce chunking for long
videos and caching for fast re-runs. Python.

## [domain_checker](https://github.com/klokie/domain_checker)

Need to find an available domain to register? Give this script a list of words and it tries every pairing as a
`.com`, checks each with DNS and whois, and prints the ones that look
unregistered. A small Node CLI from 2016 that still does the job.

## [stitch-youtube-videos-by-quote](https://github.com/klokie/stitch-youtube-videos-by-quote)

A script that searches YouTube for a phrase, finds where it's said in each
video's transcript, and stitches those moments into one supercut with ffmpeg.
Python.

---

More on [GitHub](https://github.com/klokie), and the tools behind them on
[Uses](/uses/).
