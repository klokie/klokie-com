---
title: "Nobody Was Blocking My Pull Requests"
date: "2026-08-03"
topics: [programming, ai]
description: "I'd assumed GitHub required a review I couldn't give myself. It didn't — and automating the merges surfaced four gotchas worth knowing before you write a workflow."
draft: false
---

I keep my notes in a private git repo. When I use an AI coding agent from my
phone, it can't always reach my desktop, so it works on a cloud copy instead:
it pushes a branch and opens a pull request rather than committing straight to
`master`.

That's sensible behavior. The result, though, was a slowly growing pile of
branches — about ten days' worth — that turned into open pull requests from me,
to me, which I was convinced I couldn't merge. GitHub wouldn't let me approve my
own pull request, and I had quietly assumed that meant I couldn't merge it
either. So the pile grew.

It was four PRs deep before I actually checked that assumption.

## Self-approval is not self-merge

GitHub blocks you from **approving** your own pull request. It has never
blocked you from **merging** one. Those are different operations, and only the
first is restricted.

The thing that would tie them together is a branch protection rule requiring an
approving review. I didn't have one. I couldn't have had one: branch protection
and rulesets are a paid feature for private repositories, and the API says so
in the bluntest way available.

```
$ gh api repos/OWNER/REPO/branches/master/protection
{
  "message": "Upgrade to GitHub Pro or make this repository public to
              enable this feature.",
  "status": "403"
}
```

Nothing was enforcing review because nothing _could_ enforce review. The merge
button had been live the entire time. Four PRs merged in about ninety seconds
once I stopped believing otherwise.

The lesson generalizes past GitHub: I had inferred a rule from a related
restriction and never tested it. One API call would have saved the whole
detour. If you're routing around a constraint, it's worth confirming the
constraint exists.

## Automating the rest

Merging by hand isn't the fix, since the branches keep arriving. GitHub's own
auto-merge would be the obvious tool, but it's behind the same paywall — the
setting simply refuses to turn on. So: a scheduled workflow that does the
merging itself.

The design question that mattered was _when_. Merging a PR the moment it's
mergeable is tempting and wrong: a mobile session pushes several commits as it
works, and an eager workflow will merge the first one while I'm still typing,
splitting one session across three merges.

So the rule is quiescence. Merge a PR only once its newest commit has stopped
moving for fifteen minutes, which is a decent proxy for "the session is over."

```bash
last=$(gh pr view "$num" --json commits --jq '.commits[-1].committedDate')
age_min=$(( ( $(date -u +%s) - $(date -u -d "$last" +%s) ) / 60 ))

if [ "$age_min" -lt "$QUIET_MINUTES" ]; then
  echo "Active ${age_min}m — still working, skip."
  continue
fi
```

Conflicts get a label and a comment instead of a forced merge. And because
sessions don't always open a PR — sometimes a bare branch just appears — the
sweep opens one for any branch that lacks it, and deletes branches whose
commits are already in `master`.

## Four things that bit me

Writing the workflow was quick. Making it actually work took four rounds, each
one a thing I didn't know.

**A push made with `GITHUB_TOKEN` doesn't trigger other workflows.** This is
the one that would have quietly broken something real. My repo has a second
workflow that publishes web content on push. Auto-merged content changes would
have landed in `master` and never published — no error, no failure, just a site
that silently stopped updating. GitHub does this deliberately to stop workflows
triggering themselves in a loop. The escape hatch is that `workflow_dispatch`
_is_ something a token may fire, so the merge workflow now calls the publish
workflow explicitly when the merged files warrant it.

**GitHub Actions can't create pull requests by default.** Branch adoption failed
with `GitHub Actions is not permitted to create or approve pull requests`. It's
a repository setting (Settings → Actions → General), invisible from the
workflow file, and off by default. Note the wording carefully: the same toggle
that lets Actions _create_ PRs also lets it _approve_ them. On a repo with
required reviews, that's a control worth thinking about before you flip it. On a
personal notes repo with no reviews to bypass, it's fine.

**A line at column 0 terminates a YAML block scalar.** I embedded a multi-line
PR comment inside `run: |`, with the body starting at the left margin. That ends
the block, which makes the file invalid, which meant GitHub couldn't register
the workflow's triggers at all. The failure presented as "your manual trigger
doesn't exist" rather than "your YAML is broken." Build multi-line strings with
`printf`, or keep every line indented past the block.

**`gh pr list --json commits` can exceed GitHub's GraphQL node limit.** Asking
for the commits of fifty PRs in one query requested about 510,000 nodes against
a 500,000 cap. Every run failed. Fetching each PR's commits individually is more
requests and no drama.

## Test it for real

Every one of those four surfaced because I tested against actual pull requests
rather than reading the workflow and calling it done. The YAML break in
particular is invisible to inspection — the file _looks_ correct, and GitHub
reports it as a missing trigger somewhere else entirely.

So I pushed a real branch with no PR and watched the whole chain run: branch
adopted, PR opened, merged, branch deleted. Then a fresh PR, correctly skipped
with `Active 3m < 15m`, and merged on demand with the quiet window set to zero.

Worth saying plainly: this auto-merges unreviewed changes into `master`. That's
the right call for a personal notes vault where the alternative is a pile of
PRs I never look at. It would be the wrong call for a repo with collaborators, a
deploy pipeline, or anything where a bad merge costs more than a revert. The
mechanism is easy; knowing whether you want it is the actual decision.
