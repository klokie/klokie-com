---
title: "Repoman: the life of a repo man is always intense"
date: "2026-09-02"
topics: [programming, devops]
description: "A small Go tool that tracks which git repos belong on which of your machines, keeps them in sync, and backs up the parts git doesn't carry."
draft: false
---

If you work across more than one machine, you know the shape of this problem.
A repo you need is on the other laptop. A clone you thought was current is
eleven commits behind. Something has uncommitted changes and you can't
remember which machine, or why. And the `.env` file that makes any of it
actually run isn't in git at all, because it never should have been.

[Repoman](https://github.com/klokie/repoman) is a single Go binary that keeps
track of all that. It's named after the 1984 film, and the joke stopped being
a joke around the time it started repossessing things I'd forgotten I owned.

## The manifest

One TOML file lists your repositories and which machines each belongs on:

```toml
[defaults]
root = "~/src"

[[repos]]
name = "acme-api"
remote = "git@github.com:you/acme-api.git"
hosts = ["desktop", "laptop"]
```

`repoman init` writes it for you by scanning `~/src`. Run it on your second
machine and it merges — repos already listed simply gain that host, nothing is
overwritten. The file lives in its own (private) git repo, so
`repoman sync-manifest` is how machines learn about each other.

## The daily commands

```bash
repoman status --problems   # what's dirty, unpushed, or missing — in parallel
repoman pull                # fast-forward everything; skips dirty trees
repoman clone               # clone whatever this machine is missing
```

Moving a repo onto another machine is three steps that read the way you'd
describe it out loud:

```bash
repoman assign acme-api     # I want this here
repoman sync-manifest       # tell the other machines
repoman clone               # bring it down
```

## The half git doesn't carry

Your remotes already protect your code, so Repoman doesn't back that up. What
it does back up is everything else a checkout needs and git deliberately
ignores: `.env` files, local overrides, certificates, and the project
directories full of PDFs and database dumps that were never repo material.

```bash
repoman backup      # restic snapshot of exactly that
repoman snapshots   # newest backup per machine; non-zero exit if any is stale
```

That last one matters more than it looks. A backup nobody checks is a backup
that has already failed, so `snapshots` is built to be run by a cron job and
shout when a machine goes quiet.

There's also `archive` and `restore` for shelving a finished project — it takes
a snapshot, removes the local clone, and marks it archived, then puts all of it
back months later. It refuses to delete anything the remote can't replace, and
verifies its own backup before removing a single file.

## Try it

```bash
go install github.com/klokie/repoman/cmd/repoman@latest
repoman init && repoman status
```

MIT licensed, works on macOS and Linux, no daemon and no service to sign up
for. Source and README: **[github.com/klokie/repoman](https://github.com/klokie/repoman)**.
