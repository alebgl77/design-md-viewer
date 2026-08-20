<!--
  FOLLOW-UPS once the repository is live on GitHub:
  1. Add a CI status badge (the workflow must exist on GitHub first).
  2. Add a screenshot or short demo GIF of the explorer (no image file exists yet).
  3. Add the live demo link once GitHub Pages has published a deployment.
-->

# Design.md Visual Explorer

Drop a design-system markdown file into the browser and get a navigable, audited, exportable design system back.

## What it does

Design systems are usually written down long before they are coded: a `DESIGN.md`, a Notion export, a brand
guideline doc. That document is readable but not *inspectable* — you cannot see the palette, you cannot check
a contrast ratio, you cannot tell whether the spacing scale is actually a scale, and you certainly cannot feed
it to Tailwind.

This app closes that gap. It reads the markdown you already have, extracts every design token it can find,
and turns the document into fourteen browsable views, a health report, and eight ready-to-paste export
formats. Nothing about the source document has to change: no front matter, no special syntax, no schema to
adopt.

Every value it shows you is traceable back to the exact line of markdown it came from.

## 100% client-side

The file you load is parsed in your browser and never leaves it.

- No backend, no server, no database — the whole app is static files.
- No upload endpoint, no analytics, no telemetry, no cookies.
- The only network requests the app itself makes are the webfont stylesheet in `index.html` and, if you
  explicitly opt in, the AI enrichment call described below.

That also means it runs perfectly well from `file://`, from an internal share, or from any static host.

## Features

- **Fourteen views** — Overview, Colors, Typography, Spacing, Radius, Shadows, Borders, Breakpoints,
  Components, Motion, Accessibility, Tokens, Health Audit and Source. Views appear only for the categories
  actually detected in your document, so a colors-only file gets a colors-only app.
- **Provenance on every token** — each extracted value carries its heading path, its line number and the raw
  markdown snippet it came from. Click through to the Source view and the originating line is highlighted.
- **Confidence labels** — a token is marked `explicit` when the document literally stated it, `inferred`
  when the parser derived it. You always know what the document said and what the app guessed.
- **Health audit** — a scored report (A+ to D) covering WCAG AA contrast failures, near-duplicate colors,
  off-grid spacing tokens, odd-pixel font sizes, missing brand or functional palettes, and components with
  incomplete interactive states. Each issue comes with a recommendation and a weighted impact score.
- **Accessibility tooling** — contrast ratios computed against the document background with AA/AAA verdicts,
  plus color-vision simulation for protanopia, deuteranopia, tritanopia and achromatopsia.
- **Eight export formats** — W3C Token JSON, Tailwind v4 `@theme`, Tailwind v3 config, CSS custom
  properties, a TypeScript theme object, SCSS variables, an AI prompt / `.cursorrules` block, and a
  normalized `DESIGN.md`.
- **Instant search** across every token and section, on `Cmd/Ctrl + K`, with a jump straight to the source
  line of any hit.
- **Four built-in sample documents** and a starter-template scaffolder, so you can try the app — or bootstrap
  a new design doc — without having a file ready.
- **Defensive parsing** — input markdown is treated as untrusted: script tags and `javascript:` URLs are
  stripped, extracted CSS values are validated and length-capped, and any prompt-injection text in the
  document stays inert data.

## How the parser works

The interesting engineering is the pipeline, and it is deliberately deterministic — the same document always
produces the same design system object, with no model in the loop.

```
markdown  ->  tokenizer  ->  11 extractors  ->  reference resolver  ->  pipeline  ->  DesignSystem
```

**1. Tokenizer** — `src/parsers/markdownStructure.ts` makes a single pass over the raw text and produces a
flat structural index: sections, fenced code blocks, tables and list items. Every one of those records keeps
its start line, its end line, and the heading path it sits under. This is the only stage that touches raw
text; everything downstream works on the structure.

**2. Extractors** — one module per category under `src/parsers`, eleven in total: colors, typography,
spacing, radius, shadows, borders, breakpoints, components, motion, accessibility and overview. Each one
reads the shared structure and looks for its own category wherever it can plausibly appear — a markdown
table, a CSS or JSON code block, a bullet list, or prose. Extractors never see each other's output, which
keeps them independently testable and makes adding a new category an additive change.

**3. Reference resolver** — `src/parsers/referenceResolver.ts` collects every CSS custom property declared
in the document's code blocks and dereferences aliases recursively, with cycle detection, so a token defined
as `var(--brand-500)` reports the value it ultimately points at rather than the indirection.

**4. Pipeline** — `src/parsers/pipeline.ts` runs the stages, decides which categories were actually detected,
computes totals and a content hash, and assembles the `DesignSystem` object defined in
`src/schema/designSystem.ts` (typed, and mirrored by Zod schemas).

### Provenance and confidence

Both are part of the schema rather than bolted on afterwards. Every token embeds:

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

Because provenance is mandatory at the type level, an extractor cannot emit a value it can't point at. That
is what makes the app trustworthy on documents it has never seen: when the parser is wrong, the source line
is one click away, and inferred values are visually distinguishable from stated ones.

## Quickstart

Requires Node 20 or newer.

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/design-md-visual-explorer.git
cd design-md-visual-explorer

npm install     # install dependencies
npm run dev     # start the dev server on http://localhost:5173
npm test        # run the Vitest suite
npm run build   # type-check and emit the static bundle to dist/
```

`npm run typecheck` runs `tsc --noEmit` on its own, and `npm run preview` serves the built `dist/` locally.

The build emits relative asset URLs, so `dist/` can be served from a domain root or from any subdirectory
without further configuration.

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 18 + TypeScript (strict) |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 |
| Validation | Zod |
| Icons | lucide-react |
| Tests | Vitest |

No router: view switching is plain React state, which keeps the bundle small and static hosting trivial.

## Optional AI enrichment

The parser is fully deterministic and the app is completely usable without any AI. Enrichment is an opt-in
extra that adds conceptual metadata the markdown rarely states outright — a tagline, a design philosophy,
a visual tone, design principles, and short usage guidance per component.

- It requires **your own Google Gemini API key**, which you enter in the AI settings panel. A custom endpoint
  can be used instead if you prefer to proxy the call.
- The key is stored in your browser's `localStorage` and is sent only to the API endpoint you configured.
  There is no server in this project that could receive it.
- Enrichment is constrained to conceptual fields only: it never invents hex codes or pixel measurements, and
  the response is validated against a Zod schema before anything reaches the UI.
- Without a key, the app runs at full functionality on deterministic parsing alone.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Alexandre Beguel.
