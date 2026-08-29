---
title: "Why your Tailscale URL won't open in Chrome"
date: "2026-08-29"
topics: [programming]
description: "curl gets a 200, the browser refuses to connect. Two separate browser-level rules break MagicDNS names, and neither one shows up in a network trace."
draft: false
---

I put Home Assistant on my tailnet and spent an evening on what looked like a
networking problem and wasn't. Twice. Both times the tell was the same: `curl`
fetched the page happily from the exact machine whose browser said it couldn't
connect.

That combination is worth recognizing. If curl works and the browser doesn't,
stop looking at the network. Browsers enforce policies that curl has never heard
of, and two of them apply to every `*.ts.net` name.

## One: `ts.net` is HSTS-preloaded

I had the service answering on plain HTTP over the tailnet. From the same laptop:

```
$ curl -o /dev/null -w '%{http_code}\n' http://myhost.tailxxxx.ts.net/
200
```

Chrome, Firefox, and Safari all refused. Not a certificate warning — no page at
all.

`ts.net` sits on the HSTS preload list. That list is compiled into the browser
binary, so every hostname under it is HTTPS-only before a single packet is sent.
There's no "proceed anyway" link, no setting, and editing `/etc/hosts` doesn't
help because HSTS keys on the name, not the address. curl ignores preload
entirely, which is why it sailed through.

The practical consequence: **HTTPS on your tailnet isn't optional polish.** If
you're serving anything to a browser by its MagicDNS name, you need
`tailscale serve` in front of it. I'd been treating TLS as a nice-to-have to
get a padlock. It's the only thing that makes the name usable at all.

Worth knowing before you reach for the workaround: browsing to the raw
`100.x.y.z` address instead often won't save you either. Anything with a login
flow may reject it — Home Assistant refuses `100.64.0.0/10` as an OAuth client
id, so the page loads and then you can't sign in.

## Two: Chrome's Secure DNS can't see MagicDNS

With Serve running and a real Let's Encrypt certificate, Firefox worked
immediately. Chrome gave me:

```
ERR_NAME_NOT_RESOLVED
```

Which is a much better error than it looks, because it's a *resolution* failure,
not a connection or TLS one. Nothing was wrong with the service.

Chrome's **Use secure DNS** setting sends lookups over DNS-over-HTTPS straight to
a public resolver, bypassing the operating system's resolver completely. MagicDNS
names exist only in the OS resolver, served by Tailscale on `100.100.100.100`.
Cloudflare has never heard of your tailnet, so it answers NXDOMAIN, correctly.

Turn it off in `chrome://settings/security`, and the name resolves. If you'd
rather keep DoH for general browsing, a hosts entry works here — unlike the HSTS
case — because this genuinely is a name-resolution problem:

```
100.x.y.z  myhost.tailxxxx.ts.net
```

This one isn't specific to any app. With Secure DNS on, *no* `*.ts.net` name
resolves in Chrome.

## The general lesson

Both failures were invisible to every tool I reached for first. Pings, port
scans, and curl all reported a healthy service, because the service *was*
healthy. The rules being enforced live in the browser: one compiled into the
binary, one a settings toggle, neither logged anywhere useful.

So: when curl and the browser disagree, believe curl about the server and go
looking at browser policy. And read the error text closely —
`ERR_NAME_NOT_RESOLVED` and a silent refusal to connect look equally like "it's
broken," but they pointed at two completely different causes.
