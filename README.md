<!--
  Screenshots are captured from the running application by .github/workflows/screenshots.yml.
  Re-run that workflow after an interface change, download the artifact, and replace the files
  in docs/screenshots so the images can never show a UI that no longer exists.

  The social card comes from .github/workflows/og-card.yml; download its artifact and upload it
  under Settings -> General -> Social preview.
-->

<div align="center">

<img src="docs/logo.svg" width="76" height="76" alt="">

# Design.md Visual Explorer

**Bring local design sources together. Generate a DESIGN.md, explore its tokens, audit them, and export the result.**

Markdown, CSS, JSON, HTML, SVG, image palettes, and PDF text. No backend; imports stay in your browser.

[**Try it →**](https://alebgl77.github.io/design-md-viewer/)

[![CI](https://github.com/alebgl77/design-md-viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/alebgl77/design-md-viewer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-1f7a5c.svg)](LICENSE)

<picture>
  <source media="(prefers-color-scheme: light)" srcset="docs/screenshots/overview-light.png">
  <img src="docs/screenshots/overview-dark.png" alt="The Overview screen: a colour ribbon extracted from the document, token counts, and a radar scoring the system across contrast, palette clarity, type scale, grid rhythm and coverage.">
</picture>

</div>

---

## Every number here came out of a document

These are not mockups. Each screenshot is captured in CI from the running app, parsing a bundled
sample, which is why the figures in them are odd rather than round.

### It tells you what is wrong, and why

<img src="docs/screenshots/audit-dark.png" alt="The health audit: a score of 34 out of 100, graded D, with 19 issues listed. Each one names a colour, its measured contrast ratio against the document's own background, and a suggested fix.">

Contrast is measured against the background the _document_ declares, not a hardcoded one. That
sounds like a detail until you realise the alternative silently passes everything: an earlier
version scored each colour against the friendlier of two fixed backgrounds, so the audit could
never fail. `#0e3a2a` at 1.52:1 is a real finding about a real palette.

### Every value points back at its source line

<img src="docs/screenshots/source-dark.png" alt="The source inspector: the document outline with line numbers on the left, the raw markdown on the right.">

Provenance records the text behind each extracted value. A single Markdown import keeps its original
lines; other formats and batches point into the generated Markdown, with source names and import notes.
When extraction gets something wrong, you can inspect that text in one click.

### The palette, with the parts that fail marked as failing

<img src="docs/screenshots/colors-dark.png" alt="The colour view: swatches with hex, RGB, computed contrast ratio and an AA or Fail verdict, plus a colour-vision deficiency simulator.">

---

## See it work

Here is a real document. Nothing about it was written for this tool:

```markdown
## Colour

| Token   | Value   | Usage                  |
| ------- | ------- | ---------------------- |
| Primary | #2563eb | Primary actions, links |
| Surface | #f8fafc | Page background        |
| Danger  | #dc2626 | Destructive actions    |

## Type Scale

| Token   | Size | Weight | Line height |
| ------- | ---- | ------ | ----------- |
| Display | 48px | 700    | 1.1         |
| Body    | 16px | 400    | 1.5         |

## Spacing

- **xs**: 4px
- **md**: 16px

## Motion

- **fast**: 150ms ease-out
- **base**: 250ms cubic-bezier(0.4, 0, 0.2, 1)
```

Thirty-two lines in. This comes out:

| Token   | Value     | Contrast on the declared surface | Source        |
| ------- | --------- | -------------------------------- | ------------- |
| Primary | `#2563eb` | 5.16:1 - passes AA               | `orbit.md:9`  |
| Surface | `#f8fafc` | 17.06:1 - passes AA              | `orbit.md:10` |
| Danger  | `#dc2626` | 4.82:1 - passes AA               | `orbit.md:11` |

| Token   | Size | Weight | Line height | Source        |
| ------- | ---- | ------ | ----------- | ------------- |
| Display | 48px | 700    | 1.1         | `orbit.md:18` |
| Body    | 16px | 400    | 1.5         | `orbit.md:19` |

| Token | Duration | Easing                         | Source        |
| ----- | -------- | ------------------------------ | ------------- |
| fast  | 150ms    | `ease-out`                     | `orbit.md:30` |
| base  | 250ms    | `cubic-bezier(0.4, 0, 0.2, 1)` | `orbit.md:31` |

Categories detected: **Colors, Typography, Spacing, Motion** - and only those. The document declares no
shadows, no breakpoints and no components, so those views never appear. A colors-only file gets a
colors-only app.

Every row above carries the line number it came from. Click it and the Source view scrolls to that exact
line, highlighted. That is the point of the whole project: when the parser gets something wrong, you can
see _why_ in one click, instead of trusting it.

## Why

Design systems get written down long before they get coded - a `DESIGN.md`, a Notion export, a brand
guideline PDF pasted into a repo. That document is readable but not _inspectable_. You cannot see the
palette. You cannot check a contrast ratio. You cannot tell whether the spacing scale is actually a scale.
And you certainly cannot hand it to Tailwind.

This closes that gap without asking the document to change.

## Import files or paste content

Drop several local files together, choose them with the file picker, or paste content and select its
format. Imports use deterministic adapters, with no AI call or upload. The four samples and starter
scaffolder still work without a file.

| Source                           | What is inspected                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `.md`, `.markdown`, `.txt`       | Markdown and design notes; clear code in `.txt` can be detected as CSS, JSON, HTML, or SVG        |
| `.css`                           | Static design declarations and custom properties                                                  |
| `.json`                          | Flat/nested tokens, legacy `type`/`value`, and supported DTCG `$type`/`$value` tokens and aliases |
| `.html`, `.htm`, `.svg`          | Embedded/inline styles and static SVG paint; no page rendering or linked resources                |
| `.png`, `.jpg`, `.jpeg`, `.webp` | Quantized pixel palette only; static WebP, no OCR or font/layout inference                        |
| `.pdf`                           | Embedded selectable text from the first 25 pages; no OCR or visual analysis                       |

Each batch accepts **20 files and 20 MiB total**. Text files are limited to **2 MiB** each; images and
PDFs to **10 MiB** each. Images also have dimension limits. Invalid sources are reported; valid files in
the same batch can still load. Office documents, video, archives, and remote URL imports are unsupported.

The source summary keeps limitations and warnings visible. Conflicting declarations are retained in the
generated source with a warning; this is not automatic conflict resolution. Source links refer to that
generated document, not original CSS/JSON/PDF locations. Component previews illustrate extracted data
using the app's controls; they do not reproduce a source interface pixel for pixel.

<img src="docs/screenshots/import-batch.png" alt="A four-file CSS, JSON, SVG, and HTML import with every source named, extraction notes expanded, and the generated color palette below.">

The same flow works on narrow screens: [390 px light-theme capture](docs/screenshots/import-mobile.png).

Use **Export → Normalized DESIGN.md → Download File** to save the parsed system. This preserves supported
structured semantics, not original formatting or every source detail. Review the result before adopting it.
See [Importing sources](docs/IMPORTING.md) for examples, exact bounds, and adapter development, and the
[roadmap](docs/ROADMAP.md) for planned work.

## 100% client-side

The sources you import are processed in your browser and are not uploaded. Source files are held only
for the current import; the app does not persist them.

- No backend, no server, no database. The whole app is static files.
- No upload endpoint, no analytics, no telemetry, no cookies.
- The app fetches its own assets (including a bundled PDF worker) and webfonts. AI enrichment makes a
  separate request only if you explicitly opt in, as described below.

It runs perfectly well from an internal share or any static host.

## How the parser works

Deterministic extraction rules, with no model in the import or parsing loop. Image palettes depend on
the browser's decoded pixels; they are samples, not declared tokens.

```mermaid
flowchart LR
  INPUT["local files / pasted content"] --> ADAPT["bounded format adapters<br/>src/importers"]
  ADAPT --> MD["Markdown + source notes"]
  MD --> TOK["tokenizer<br/>markdownStructure.ts"]
  TOK --> IDX["structural index<br/>sections · tables · code blocks · list items<br/>each with its line range"]
  IDX --> EX["11 extractors<br/>colors · type · spacing · motion · …"]
  IDX --> RR["reference resolver<br/>dereferences var(--x)<br/>cycle-safe"]
  EX --> P["pipeline.ts"]
  RR --> P
  P --> DS["DesignSystem<br/>every token carries<br/>provenance + confidence"]
  DS --> V["14 views"]
  DS --> A["health audit"]
  DS --> E["8 export formats"]
```

**1. Tokenizer** makes a single pass over the raw text and produces a flat structural index. Every record
keeps its start line, end line and heading path. This is the only stage that touches raw text; everything
downstream works on the structure. Sanitization here is line-preserving, so a recorded line number is always
an index into the document you actually see.

**2. Extractors** - one module per category, eleven of them. Each reads the shared index and looks for its
own category wherever it can plausibly appear: a markdown table, a CSS or JSON code block, a bullet list, or
prose. Extractors never see each other's output, which keeps them independently testable and makes adding a
category an additive change.

**3. Reference resolver** collects every CSS custom property declared in the document's code blocks and
dereferences aliases recursively, with cycle detection, so a token defined as `var(--brand-500)` reports the
value it ultimately points at.

**4. Pipeline** runs the stages, decides which categories were actually detected, and assembles the
`DesignSystem` object.

### Provenance is a type-level requirement

Every token embeds this, and it is not optional:

```ts
interface Provenance {
  sectionTitle?: string;
  headingPath: string[];
  lineNumber?: number;
  lineEnd?: number;
  rawSourceSnippet: string;
}

type ExtractionConfidence = 'explicit' | 'inferred';
```

Because provenance is mandatory in the schema, an extractor _cannot_ emit a value it is unable to point at.
And `confidence` separates what the document stated from what the parser derived, so the two are never
silently blended.

## Features

- **Batch and paste imports** - local text, code, tokens, image palettes, and PDF text, with source
  summaries and explicit extraction limits.
- **Fourteen views** - Overview, Colors, Typography, Spacing, Radius, Shadows, Borders, Breakpoints,
  Components, Motion, Accessibility, Tokens, Health Audit, Source. Only detected categories appear.
- **Health audit** - a scored report (A+ to D) covering WCAG AA contrast failures, near-duplicate colors,
  off-grid spacing, odd-pixel font sizes, missing functional palettes, and components with incomplete
  interactive states. Every issue carries a recommendation and a weighted impact score.
- **Accessibility tooling** - contrast computed against the document's _declared_ background rather than a
  hardcoded one, with AA/AAA verdicts, plus color-vision simulation for protanopia, deuteranopia,
  tritanopia and achromatopsia.
- **Eight export formats** - W3C Token JSON, Tailwind v4 `@theme`, Tailwind v3 config, CSS custom
  properties, a TypeScript theme object, SCSS variables, an AI prompt / `.cursorrules` block, and a
  normalized `DESIGN.md`.
- **Instant search** across every token and section on `Cmd/Ctrl + K`, jumping straight to the source line.
- **Light and dark themes**, because you cannot honestly judge a light design system's colors on a dark
  chrome.
- **Four built-in samples** and a starter-template scaffolder, so you can try it without a file ready.

## Untrusted input is treated as untrusted

Source files may be hostile. Adapters inspect data without executing HTML, SVG, CSS, or PDF scripts,
fetching linked resources, or inserting source markup into the page.

- Script tags and `javascript:` URLs are stripped before parsing, newline-for-newline so line numbers stay
  honest.
- Values reaching a stylesheet are sanitized for CSS grammar; values reaching a JS or JSON literal are
  emitted through `JSON.stringify` rather than interpolated into a template. A token value cannot contribute
  syntax to an exported file.
- Prompt-injection text inside a document stays inert data. There is a test for exactly that.
- A Content Security Policy ships in the document itself, since GitHub Pages serves no headers this
  project controls. Scripts are pinned to first-party code plus one hashed inline bootstrap, and the
  PDF workers come from the app's own origin. The only external API origin allowed is Gemini; fonts
  use Google's stylesheet and font hosts.

The threat model and how to report an issue are in [SECURITY.md](SECURITY.md).

## Quickstart

Requires Node 22.13.0 or newer.

```bash
git clone https://github.com/alebgl77/design-md-viewer.git
cd design-md-viewer

npm install     # install dependencies
npm run dev     # dev server on http://localhost:5173
npm test        # Vitest suite
npm run lint   # ESLint
npm run format:check # Prettier check
npm run build   # type-check and emit static files to dist/
```

`npm run typecheck` runs `tsc --noEmit` alone; `npm run preview` serves the built `dist/`.

The build emits relative asset URLs, so `dist/` works from a domain root or any subdirectory.

To reproduce the screenshots and browser smoke checks, install Playwright with
`npm install --no-save --package-lock=false playwright@1.62.1`, then
`npx playwright install chromium`, as the [screenshot workflow](.github/workflows/screenshots.yml) does. Serve the build with
`npm run preview -- --port 4173`, then run `node scripts/capture-screenshots.mjs`. The script writes to
`shots/` by default; `BASE_URL`, `OUTPUT_DIR`, and optional `BROWSER_EXECUTABLE` override the target,
output directory, and headless Chromium executable. It covers file/paste imports, raster/PDF decoding,
warnings, source/search navigation, export, and mobile layouts as well as the original views.

## Tech stack

| Layer   | Choice                                          |
| ------- | ----------------------------------------------- |
| UI      | React 18 + TypeScript (strict)                  |
| Build   | Vite 6                                          |
| Styling | Tailwind CSS 3, driven by CSS custom properties |
| Tests   | Vitest                                          |
| Icons   | lucide-react                                    |

No router: view switching is plain React state, which keeps the bundle small and static hosting trivial.

## Optional AI enrichment

The parser is fully deterministic and the app is completely usable without any AI. Enrichment is an opt-in
extra that adds only the conceptual metadata a document rarely states outright: a tagline, a design
philosophy, a visual tone, principles, and short usage guidance per component.

- It requires **your own Google Gemini API key**.
- The key stays in your browser and travels in a request header, never in a URL. A key in a query
  string leaks into browser history and into every log between you and the API; a header does not.
  There is no server in this project that could receive it either way, because there is no server.
- The hosted build talks to exactly one origin. The Content Security Policy in `index.html` pins
  `connect-src` to the Gemini API, so a parsed document cannot be sent anywhere. Routing enrichment
  through your own proxy therefore means self-hosting and widening that one line deliberately.
- It is constrained to conceptual fields. It never invents hex codes or pixel measurements, and the response
  is validated against a Zod schema before anything reaches the UI.
- Without a key, the app runs at full functionality on deterministic parsing alone.

## License

MIT - see [LICENSE](LICENSE). Copyright (c) 2026 Alexandre Beguel.
