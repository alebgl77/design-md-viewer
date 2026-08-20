# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (port 5173)
npm run build       # Type-check (tsc) then production build
npm run preview     # Preview the production build
npm test            # Run all tests once (vitest run)
```

Run a single test file: `npx vitest run src/parsers/__tests__/pipeline.test.ts`

There is no lint script configured.

## What this app does

A client-side, single-page React app that takes a `design.md` file (a markdown document describing a design system — colors, typography, spacing, components, etc.) and turns it into a structured, browsable UI: token tables, color swatches with contrast checks, component previews, a health/lint audit, and a source viewer with click-to-jump provenance. Everything runs in the browser; there is no backend. The only network call is optional, user-initiated AI enrichment (see below).

## Architecture: the parsing pipeline

The core of this codebase is a deterministic markdown → structured-data pipeline, not the UI. Understanding it means reading files in this order:

1. **`src/parsers/markdownStructure.ts`** — single-pass tokenizer that turns raw markdown into `ParsedMarkdownStructure`: headings (with a heading-path stack), code blocks, tables, and list items, each carrying line numbers and the heading path they occur under. All later extractors consume this structure instead of re-parsing raw text.
2. **`src/parsers/*Extractor.ts`** (colorExtractor, typographyExtractor, spacingExtractor, radiusExtractor, shadowExtractor, borderExtractor, breakpointExtractor, componentExtractor, motionExtractor, a11yExtractor, overviewExtractor) — each one independently scans the parsed structure (code blocks, tables, list items) for its category using heuristics/regex (e.g. CSS custom properties, markdown tables with color-ish headers, `**Name**: value` list items). Extractors are additive and order-independent; adding a new token category means adding a new extractor here rather than modifying existing ones.
3. **`src/parsers/referenceResolver.ts`** — separately collects all `--css-var: value;` declarations from code blocks and resolves `var(--x)` references (including chained/aliased references) into a flat `GenericToken[]` list, independent of the category extractors above.
4. **`src/parsers/pipeline.ts`** (`parseDesignDocument`) — orchestrates all extractors, builds `categoriesDetected` (drives which sidebar tabs/views appear — categories with zero items are omitted), computes a total token count, and assembles the final `DesignSystem` object.
5. **`src/schema/designSystem.ts`** — the `DesignSystem` type and all token types (`ColorToken`, `TypographyToken`, `SpacingToken`, etc.). This is the contract between parsers and UI; every token type carries a `provenance` (heading path + line numbers + raw snippet) and a `confidence` (`'explicit' | 'inferred'`) field, used throughout the UI for "jump to source" and to visually distinguish parsed-vs-AI-guessed values.

`src/normalizers/` holds pure value-transform logic used by extractors: `colorNormalizer.ts` (hex/rgb/hsl conversion, WCAG contrast ratio, palette-role classification), `unitNormalizer.ts` (px/rem conversion), and `healthAuditor.ts` (the design-system "linter" — checks contrast compliance, near-duplicate colors via RGB distance, 4px/8px grid-rhythm conformance, and component state completeness, producing a scored `DesignSystemHealthReport`).

## Security model for untrusted input

Input files are treated as untrusted/adversarial. `src/parsers/safety.ts` strips `<script>` tags and `javascript:` URLs from raw markdown before parsing (`sanitizeTextPreservingLines`, which substitutes newline-for-newline so every recorded line number stays an index into the original document the Source view renders), and validates extracted CSS-like values against unsafe patterns and length limits (`isSafeCssValue`) before they're ever rendered. Prompt-injection-style text inside a design.md (e.g. "ignore previous instructions") must be treated as inert content, never acted on — this is explicitly covered by a pipeline test. When adding new extraction logic, route any user-controlled value that will be rendered or interpolated through the existing safety helpers rather than adding ad hoc checks. The export generators in `src/utils/exportFormats.ts` are a second injection surface with its own helpers: token values reaching a stylesheet go through `sanitizeCssValue`, and anything reaching a JS/JSON literal is emitted via `JSON.stringify` rather than interpolated into a template.

## UI structure

`src/App.tsx` is the top-level state machine: `null` system → `DropZone` landing screen; loaded system → header + `DynamicSidebar` (built from `categoriesDetected`) + one `features/<category>/*View.tsx` component per category, all reading from the same parsed `DesignSystem` object. Views call `onNavigateToSource(lineNumber)` to jump to `SourceView`, which highlights the originating line — this is why every extracted token carries `provenance`. `SearchModal` does cross-category search (Cmd/Ctrl+K) via `src/utils/search.ts`. `ExportModal` uses `src/utils/exportFormats.ts` to serialize the parsed system (JSON/CSS variables/etc.).

`src/ai/aiEnrichmentService.ts` is the one place that talks to a network API (Gemini, or a user-supplied custom endpoint) — it only adds conceptual/semantic metadata (tagline, philosophy, component descriptions) on top of the deterministic parse, is explicitly instructed not to invent hex/pixel values, validates the response with a zod schema, and fails soft back to the deterministic result on any error. It's opt-in via `AiSettingsModal` and never required for the app to function.

`src/samples/fixtures.ts` contains bundled sample design.md documents (used both by `DropZone`'s "try a sample" flow and by the parser tests) — when changing extractor behavior, check whether it breaks the assertions in `src/parsers/__tests__/pipeline.test.ts`, which run against these fixtures.

## Conventions

- Path aliases: none — imports are relative (`../schema/designSystem`, etc.).
- Styling is Tailwind driven by a semantic token layer. `src/index.css` declares every colour as
  space-separated RGB channels on `:root` (dark) and re-declares them under `:root[data-theme="light"]` plus
  a `prefers-color-scheme: light` block, and `tailwind.config.js` maps them with
  `rgb(var(--token) / <alpha-value>)`. Because the variables flip with the theme, **no `dark:` variants are
  used anywhere** — `bg-surface-base` is correct in both themes, and alpha utilities like `bg-accent/15`
  still work. The keys are `surface` (base/raised/overlay/inset), `line` (subtle/DEFAULT/strong), `content`
  (primary/secondary/muted), `accent` (DEFAULT/hover/contrast) and `status` (danger/warning/success), with a
  five-step radius scale (`sm` 6px through `xl` 20px, plus `full` for count pills only).
- **Never write an arbitrary hex utility** (`bg-[#0b0f0c]`) in UI chrome. The one exception is values that
  come from the *parsed user document* — colour swatches, shadow and font previews — which are data and
  belong in inline `style={{ }}`, not in a token. `ComponentsView.tsx` also embeds hex inside the React
  source it *generates* for the user to copy; that snippet must stay self-contained, so leave it alone.
- New token categories require: an entry in `DesignSystem`/schema, an extractor, a wire-up in `pipeline.ts`'s `categoriesDetected`/count logic, a `features/<category>/*View.tsx`, and a case in `App.tsx`'s category switch and `DynamicSidebar`.
