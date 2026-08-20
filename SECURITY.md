# Security Policy

## Reporting a vulnerability

Please report security issues privately, through
[GitHub Security Advisories](https://github.com/alebgl77/design-md-viewer/security/advisories/new),
rather than in a public issue.

Include what you did, what happened, and what you expected. A minimal `design.md` that reproduces
the behaviour is worth more than a description of it.

You will get an acknowledgement within a few days. This is a personal project, not a funded one, so
please be patient with the timeline. There is no bounty programme.

## Threat model

The central assumption is that **the input document is hostile**. A `design.md` is a file teams pass
around and that agents generate, so it is treated the way you would treat any untrusted upload.

Two properties follow from that, and they are the ones worth reporting against:

1. **A document cannot execute anything.** Not in the page that parses it, and not in a project that
   later consumes an exported file. Exports are generated so that a token value can only ever land in
   a data position, never in a syntactic one.
2. **A document cannot reach the network.** The deployment sends requests to exactly one origin, and
   only when you have supplied your own API key. Nothing in a parsed document can widen that.

Anything that breaks either property is a vulnerability, even if it looks cosmetic.

## What runs where

The application is static files. There is no backend, no database, no session, and no account. Your
document is read in the browser and never uploaded.

The one exception is the optional AI enrichment, which is off unless you supply a key. That key is
kept in your browser, sent in a request header rather than a URL, and transmitted only to the API
endpoint the build allows. No server in this project can receive it, because there is no server.

## Out of scope

- Anything requiring physical or already-privileged access to a user's machine or browser profile.
- Vulnerabilities in a fork's own deployment, if that fork has relaxed the shipped policy.
- Reports produced by an automated scanner with no demonstrated impact. Please show the behaviour.
- The advisory list for development dependencies. They do not ship to users; run `npm audit`
  yourself if you want the current picture.

## For forks

The Content Security Policy lives in `index.html` because GitHub Pages serves no headers this
project controls. If you host it elsewhere, prefer sending the same policy as a real response header,
and note that `frame-ancestors` only takes effect that way.

If you widen `connect-src` to route enrichment through your own proxy, understand what you are
choosing: the narrow value is what stops a hostile document from being sent anywhere.
