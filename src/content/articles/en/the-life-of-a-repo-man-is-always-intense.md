---
title: "Repoman: the life of a repo man is always intense"
date: "2026-09-02"
topics: [programming, devops]
description: "I built a tool to track which git repos live on which of my machines. It took two evenings. The inventory it handed back took rather longer to digest."
draft: false
---

I have around 200 git repositories spread across three machines: two Macs and
an always-on Linux box. For years the system for keeping track of them was my own
memory, which works until you're standing in front of the wrong laptop.

So I wrote [repoman](https://github.com/klokie/repoman) — a Go binary with a
TOML manifest saying which repos belong on which host, plus `clone`, `pull`,
`status`, and eventually a backup layer. Two evenings of work, most of it
unremarkable. The name was a joke about the 1984 Alex Cox film, right up until
the tool started behaving like the character — turning up at neglected
addresses to repossess things nobody had thought about in years.

The unremarkable tool then told me a series of things I did not want to hear.

## 22 repos had no remote at all

Not "the remote is stale" — no remote. Twenty-two working directories whose
entire existence was one folder on one disk. Some were throwaway experiments
that deserved deletion. Several were not: a scraper I'd written and used, a
small app with a vault note describing it as an active idea, a site whose
source existed nowhere else.

None of this was a surprise in the sense of being unpredictable. It was a
surprise in the sense that I had never once counted.

## Seven "repos" were broken clones

A cluster of directories shared an identical, unmistakable signature:

```
## No commits yet on main...origin/main [gone]
A  .agent/workflows/…
A  .agents/maintainers.md
…6,584 more
```

No commits, a remote-tracking ref pointing at an object that isn't there, and
the entire tree sitting in the index as newly added. These are clones that
never finished, or whose object store was damaged afterwards. `git status`
reports them as a working tree bursting with new work. They contain nothing of
the kind.

Verifying that took one command per repo — list the files, compare against
what the upstream actually has:

```bash
gh api "repos/OWNER/REPO/git/trees/HEAD?recursive=1" --jq '.tree[].path' | sort > /tmp/upstream
git ls-files -co --exclude-standard | sort > /tmp/local
comm -23 /tmp/local /tmp/upstream    # anything here is genuinely yours
```

For all seven, that came back empty or near-empty. Re-cloning was safe, and
about 600 MB came back.

## Two panics that weren't

Two repos looked like they held substantial uncommitted work — one showed 657
lines of changes against a remote whose newest commit was a year old. That is
exactly the shape of "you nearly lost this."

Both were already pushed. I had compared against `origin/main` and the repo's
work lived on a feature branch I hadn't fetched. In one case my `git fetch`
had silently failed and I was diffing against a stale ref from months earlier.

The lesson is duller than the panic: **compare against every remote branch, and
check that your fetch succeeded.** Of the 21 repos I audited this way, 7 had no
content unique to the machine at all.

## The machine I'd never inventoried was the one holding unpushed work

The Linux box ran a few jobs and I thought of it as infrastructure, not a
place where work happens. When I finally registered its home directory, its
clone of my notes vault was **two commits ahead of origin** — a day's writing
that existed on exactly one disk in my house.

It had been that way for a day. It could as easily have been a year.

## The backup layer immediately caught itself

The obvious follow-up was backing up the state git doesn't carry: `.env`
files, local config, certificates, the project asset directories that never
belonged in a repo. That found ~24 credential files across 17 repos — the kind
of thing that turns "clone and go" into an afternoon of reconstruction.

Then the archive command, which backs a project up before deleting the local
copy, tried to eat a directory. The film has a code — _"I shall not cause harm
to any vehicle nor the personal contents thereof"_ — and mine, it turned out,
did not have one yet. The snapshot listed it — as an _empty entry_.
An exclude pattern in my config was a bare word (`tmp`), and restic matches
bare words against **any** path component, including an ancestor directory
several levels up. Everything beneath was silently skipped. The backup output
looked completely normal.

I caught it because I ran the destructive command against a throwaway
repository first, and then checked the snapshot rather than trusting the exit
code. The command now refuses to delete anything it cannot first find in the
backup, with contents.

## The actual conclusion

None of these were exotic failures. Every one is the ordinary result of using
computers for a decade without ever taking stock — and every one was invisible
until something counted.

You do not need my tool. `git status` in a loop over your source directory
will find most of it in an afternoon. What matters is that "I know what's on my
machines" is a belief, and beliefs about hundreds of directories across several
computers are worth testing occasionally.

Mine was wrong in six different ways. The life of a repo man is always intense.
