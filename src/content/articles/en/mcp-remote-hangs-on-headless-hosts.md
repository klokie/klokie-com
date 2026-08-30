---
title: "Your MCP server isn't broken, your headless box just can't open a browser"
date: "2026-08-30"
topics: [programming, ai]
description: "mcp-remote needs a browser to finish OAuth. On a headless host it doesn't error — it hangs forever with no output. Here's the signature and the fix."
draft: false
---

I went looking for a broken Todoist integration on my always-on Linux box and
found something more useful: the service was fine, the _transport_ was
impossible.

The setup was ordinary. A skill wrapped an MCP server the standard way:

```json
{
  "todoist": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://example.com/mcp"]
  }
}
```

That works on my laptops. On the headless machine, the command produced
nothing. Not an error, not a timeout, not a line on stderr. It just sat there
until I killed it.

## Why it hangs instead of failing

`mcp-remote` bridges a stdio MCP client to a remote HTTP server, and remote
servers generally authenticate with OAuth. So `mcp-remote` starts a little
callback listener on localhost, opens your browser at the provider's
authorization URL, and waits for the redirect to come back with a code.

On a headless host there is no browser to open. The listener comes up, the
handshake never starts, and nothing ever arrives on the callback. There's no
failure condition to report — from the process's point of view it is simply
still waiting. So it waits forever, and your tool call waits with it.

This is worse than a crash. A crash tells you where to look. A silent hang
sends you off debugging the _service_: is the API down, is the token expired,
is the account fine? All the wrong questions.

## The signature

`mcp-remote` caches its OAuth state in `~/.mcp-auth/mcp-remote-v1/`. A
successful auth leaves a tokens file. An abandoned one leaves only the PKCE
code verifier it generated before opening the browser.

So this is the tell:

```
$ ls ~/.mcp-auth/mcp-remote-v1/
abc123_client_info.json
abc123_code_verifier_00a3aee9-….txt
abc123_code_verifier_807c3b79-….txt
abc123_code_verifier_86bdf8c3-….txt
```

Verifiers with no matching `*_tokens.json`. One per attempt, accumulating like
tally marks — mine had six, spread over two days, each one a moment I'd tried
and given up. The stranded processes pile up too, because killing the client
doesn't always reap the bridge:

```
$ pgrep -af mcp-remote
```

I had one that had been running for two days.

Confirm the diagnosis in one line:

```
$ echo "[$DISPLAY]"
[]
```

No display, no browser, no OAuth. Clean up with:

```
$ pkill -f mcp-remote
$ rm ~/.mcp-auth/mcp-remote-v1/*_code_verifier_*.txt
```

## What to use instead

Don't try to make the browser flow work remotely. You _can_ forward the
callback port over SSH and paste the authorization URL into a browser
elsewhere, and it does work, but you're now maintaining a tunnel to keep a
token alive. Pick a transport that never needed a browser:

**Use the host application's own connector, if it has one.** My editor already
had a first-party integration with the same service, authenticated through its
own account rather than through `mcp-remote`. It worked on the headless box the
whole time I was failing to authenticate next to it. Worth checking before you
debug anything.

**Or use the REST API with a personal access token.** Nearly every service
behind an OAuth-flavored MCP server also issues long-lived personal tokens,
which is exactly what unattended hosts want:

```bash
set -a; . ~/.config/myservice.env; set +a
curl -s -H "Authorization: Bearer $MYSERVICE_TOKEN" \
  "https://api.example.com/v1/tasks" | jq .
```

In my case the token was _already on the machine_ — a scheduled job had been
using it for weeks, sitting in an env file two directories from where I was
fighting the OAuth flow.

## The general lesson

When an integration misbehaves on one machine and not another, check whether
the transport has requirements the machine can't meet, before you investigate
the service at the other end. Browser-based auth is the obvious one, but the
same shape covers anything assuming an interactive session: a keyring that
needs an unlocked desktop session, a credential helper that wants to prompt, a
TTY-only confirmation.

And when documenting a tool for a fleet with mixed hosts, write down which
transport belongs to which machine. "Works on my laptop" is a fine default
right up until it silently isn't.
