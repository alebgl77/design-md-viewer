# Security Policy

## Reporting a vulnerability

Please report security issues privately, through
[GitHub Security Advisories](https://github.com/alebgl77/design-md-viewer/security/advisories/new),
rather than in a public issue.

Include what you did, what happened, and what you expected. A minimal source file that reproduces
the behaviour is worth more than a description of it.

You will get an acknowledgement within a few days. This is a personal project, not a funded one, so
please be patient with the timeline. There is no bounty programme.

## Threat model

The central assumption is that **every input source is hostile**. This includes Markdown and pasted
text, CSS/JSON, HTML/SVG, raster images, and PDFs. File extensions alone do not establish trust.

Two properties follow from that, and they are the ones worth reporting against:

1. **A document cannot execute anything.** Not in the page that parses it, and not in a project that
   later consumes an exported file. Exports are generated so that a token value can only ever land in
   a data position, never in a syntactic one.
2. **Source content cannot trigger remote fetches.** Import adapters do not follow URLs, linked
   stylesheets, SVG resources, PDF actions, or embedded scripts. Loading the app's own assets and
   webfonts is separate from importing source content. Optional enrichment uses the allowed Gemini
   API origin only after the user opts in.

Anything that breaks either property is a vulnerability, even if it looks cosmetic.

## What runs where

The application is static files. There is no backend, no database, no session, and no account. Your
sources are read in the browser and are not uploaded or persisted by the import flow. Source summaries
and generated Markdown remain in transient application state until replaced or the page closes.

HTML/SVG is inspected as text, without inserting the source into a DOM or rendering it. Raster imports
validate supported signatures and dimensions before local decoding, then derive only a sampled palette.
PDF.js and its module worker are bundled as same-origin assets; PDF imports read embedded text without
rendering pages, OCR, external resource fetching, or enabling source scripts. The PDF worker is terminated
after completion/failure, with a 30-second extraction timeout.

Resource bounds include 20 files/20 MiB per batch, 2 MiB per text file, 10 MiB per image/PDF, image
dimensions, PDF page/text limits, bounded JSON traversal, and generated output limits. Partial extraction
and rejected members are reported. These checks reduce resource abuse; browser decoders and PDF.js
remain dependency attack surfaces. See [import limits](docs/IMPORTING.md#limits) for the exact values.

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

Keep `worker-src 'self'` for the bundled PDF worker and `connect-src 'self'` for first-party assets,
alongside the explicit Gemini API origin. Webfonts use the separately allowed Google stylesheet/font
origins. If you widen `connect-src` for an enrichment proxy, review the resulting exfiltration surface.
Remote-source import would need its own controlled service and threat model; it is not enabled here.
