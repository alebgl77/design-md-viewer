# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (port 5173)
npm run build       # Type-check (tsc) then production build
npm run preview     # Preview the production build
npm test            # Run all tests once (vitest run)
npm run typecheck   # TypeScript without emitting files
npm run lint        # ESLint
npm run format:check # Prettier check
```

Run a single test file: `npx vitest run src/parsers/__tests__/pipeline.test.ts`

Format touched files with `npx prettier --write <paths>`. Keep lint warnings from increasing.

## What this app does

A client-side React app that imports local Markdown/text, CSS, JSON tokens, HTML/SVG styles, raster palettes, or PDF text, individually or in a batch, and also accepts pasted text. Adapters produce Markdown for the existing parser and browsable UI: tokens, contrast checks, illustrative component previews, audit, and source inspection. Export includes a normalized `DESIGN.md`. Everything runs in the browser with no backend. Imports never call AI; optional enrichment is user-initiated. App assets and webfonts also make network requests.

See [docs/IMPORTING.md](docs/IMPORTING.md) for exact support, bounds, examples, and adapter development; [docs/ROADMAP.md](docs/ROADMAP.md) distinguishes future capabilities.

## Architecture: the parsing pipeline

`src/importers/index.ts` is the ingestion boundary: `importSources` handles pasted/text inputs and `importFiles` asynchronously reads local files, lazy-loading image and PDF adapters. `limits.ts` bounds input, traversal, and output. Adapters return inert Markdown, a format label, warnings, and optional definitions for conflict reporting. They must never execute source code, create a source DOM, or fetch remote resources. A single Markdown file retains its original source; other imports generate source sections and provenance lines refer to that generated Markdown. Unsupported members of a mixed batch remain visible as import warnings.

The core then follows a deterministic markdown → structured-data pipeline. Read these files in order:

1. **`src/parsers/markdownStructure.ts`** - single-pass tokenizer that turns raw markdown into `ParsedMarkdownStructure`: headings (with a heading-path stack), code blocks, tables, and list items, each carrying line numbers and the heading path they occur under. All later extractors consume this structure instead of re-parsing raw text.
2. **`src/parsers/*Extractor.ts`** (colorExtractor, typographyExtractor, spacingExtractor, radiusExtractor, shadowExtractor, borderExtractor, breakpointExtractor, componentExtractor, motionExtractor, a11yExtractor, overviewExtractor) - each one independently scans the parsed structure (code blocks, tables, list items) for its category using heuristics/regex (e.g. CSS custom properties, markdown tables with color-ish headers, `**Name**: value` list items). Extractors are additive and order-independent; adding a new token category means adding a new extractor here rather than modifying existing ones.
3. **`src/parsers/referenceResolver.ts`** - separately collects all `--css-var: value;` declarations from code blocks and resolves `var(--x)` references (including chained/aliased references) into a flat `GenericToken[]` list, independent of the category extractors above.
4. **`src/parsers/pipeline.ts`** (`parseDesignDocument`) - orchestrates all extractors, builds `categoriesDetected` (drives which sidebar tabs/views appear - categories with zero items are omitted), computes a total token count, and assembles the final `DesignSystem` object.
5. **`src/schema/designSystem.ts`** - the `DesignSystem` type and all token types (`ColorToken`, `TypographyToken`, `SpacingToken`, etc.). This is the contract between parsers and UI; every token type carries a `provenance` (heading path + line numbers + raw snippet) and a `confidence` (`'explicit' | 'inferred'`) field, used throughout the UI for "jump to source" and to visually distinguish parsed-vs-AI-guessed values.

`src/normalizers/` holds pure value-transform logic used by extractors: `colorNormalizer.ts` (hex/rgb/hsl conversion, WCAG contrast ratio, palette-role classification), `unitNormalizer.ts` (px/rem conversion), and `healthAuditor.ts` (the design-system "linter" - checks contrast compliance, near-duplicate colors via RGB distance, 4px/8px grid-rhythm conformance, and component state completeness, producing a scored `DesignSystemHealthReport`).

## Security model for untrusted input

Input files are treated as untrusted/adversarial. `src/parsers/safety.ts` strips `<script>` tags and `javascript:` URLs from raw markdown before parsing (`sanitizeTextPreservingLines`, which substitutes newline-for-newline so every recorded line number stays an index into the original document the Source view renders), and validates extracted CSS-like values against unsafe patterns and length limits (`isSafeCssValue`) before they're ever rendered. Prompt-injection-style text inside a design.md (e.g. "ignore previous instructions") must be treated as inert content, never acted on - this is explicitly covered by a pipeline test. When adding new extraction logic, route any user-controlled value that will be rendered or interpolated through the existing safety helpers rather than adding ad hoc checks. The export generators in `src/utils/exportFormats.ts` are a second injection surface with its own helpers: token values reaching a stylesheet go through `sanitizeCssValue`, and anything reaching a JS/JSON literal is emitted via `JSON.stringify` rather than interpolated into a template.

## UI structure

`src/App.tsx` is the top-level state machine: `null` system → `DropZone` file/paste landing screen; loaded system → header + `ImportSummary` + `DynamicSidebar` + one lazy `features/<category>/*View.tsx`. Import summaries/warnings are separate from the parsed `DesignSystem` so enrichment cannot replace them. Clear both on unload. Views call `onNavigateToSource(lineNumber)` to inspect original or generated Markdown. SourceView's alternate section outline is not a full Markdown renderer. `SearchModal` provides Cmd/Ctrl+K search. `ExportModal` serializes parsed data through `src/utils/exportFormats.ts`; normalized Markdown preserves supported semantics, not lossless original source fidelity.

`src/ai/aiEnrichmentService.ts` is the one place that talks to a network API (Gemini, or a user-supplied custom endpoint) - it only adds conceptual/semantic metadata (tagline, philosophy, component descriptions) on top of the deterministic parse, is explicitly instructed not to invent hex/pixel values, validates the response with a zod schema, and fails soft back to the deterministic result on any error. It's opt-in via `AiSettingsModal` and never required for the app to function.

`src/samples/fixtures.ts` contains bundled sample design.md documents (used both by `DropZone`'s "try a sample" flow and by the parser tests) - when changing extractor behavior, check whether it breaks the assertions in `src/parsers/__tests__/pipeline.test.ts`, which run against these fixtures.

## Conventions

- Path aliases: none - imports are relative (`../schema/designSystem`, etc.).
- Styling is Tailwind driven by a semantic token layer. `src/index.css` declares every colour as
  space-separated RGB channels on `:root` (dark) and re-declares them under `:root[data-theme="light"]` plus
  a `prefers-color-scheme: light` block, and `tailwind.config.js` maps them with
  `rgb(var(--token) / <alpha-value>)`. Because the variables flip with the theme, **no `dark:` variants are
  used anywhere** - `bg-surface-base` is correct in both themes, and alpha utilities like `bg-accent/15`
  still work. The keys are `surface` (base/raised/overlay/inset), `line` (subtle/DEFAULT/strong), `content`
  (primary/secondary/muted), `accent` (DEFAULT/hover/contrast) and `status` (danger/warning/success), with a
  five-step radius scale (`sm` 6px through `xl` 20px, plus `full` for count pills only).
- **Never write an arbitrary hex utility** (`bg-[#0b0f0c]`) in UI chrome. The one exception is values that
  come from the _parsed user document_ - colour swatches, shadow and font previews - which are data and
  belong in inline `style={{ }}`, not in a token. `ComponentsView.tsx` also embeds hex inside the React
  source it _generates_ for the user to copy; that snippet must stay self-contained, so leave it alone.
- New token categories require: an entry in `DesignSystem`/schema, an extractor, a wire-up in `pipeline.ts`'s `categoriesDetected`/count logic, a `features/<category>/*View.tsx`, and a case in `App.tsx`'s category switch and `DynamicSidebar`.
- New input formats require a bounded adapter in `src/importers/`, dispatch and accepted-extension updates, tests for normal/malformed/hostile/oversized input, and support/limitation documentation. Do not broaden the shared parser merely to make an adapter's output work.
