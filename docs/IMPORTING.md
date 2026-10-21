# Importing design sources

Use the landing screen to choose or drop local files, or paste content. Importing uses deterministic
extraction rules in the browser. It does not call AI or upload sources. Optional AI enrichment is a
separate action after loading.

## Supported inputs

| Format                                   | Extraction                                                                                                                     | Limits of interpretation                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Markdown: `.md`, `.markdown`             | Existing design-document parser                                                                                                | A single Markdown source keeps its filename and original line positions                                         |
| Text: `.txt`                             | Design notes; clearly recognizable CSS, JSON, HTML, or SVG is routed to that adapter                                           | Unstructured prose yields only explicitly recognizable values                                                   |
| CSS: `.css`                              | Custom properties and supported static design declarations                                                                     | No cascade, layout, computed styles, external `@import`, or URL-dependent values                                |
| JSON: `.json`                            | Flat/nested maps, legacy `type`/`value`, supported DTCG `$type`/`$value`, aliases, dimensions, sRGB color, typography, shadows | Unsupported composite values are omitted with notes; not a complete implementation of every token specification |
| HTML: `.html`, `.htm`                    | Embedded `<style>` and inline style declarations                                                                               | No page rendering, scripts, text/content analysis, linked stylesheets, or resource fetching                     |
| SVG: `.svg`                              | Embedded/inline styles and static fill/stroke/stop/flood paint                                                                 | No geometry, text, filter/layout analysis, or external resource rendering                                       |
| Images: `.png`, `.jpg`, `.jpeg`, `.webp` | Up to 12 colors from a quantized, alpha-weighted pixel sample                                                                  | Static WebP only; no OCR, fonts, spacing, layout, semantic roles, or exact declared-token inference             |
| PDF: `.pdf`                              | Embedded selectable text in page order                                                                                         | First 25 pages only; no OCR, scanned-page analysis, visual layout, or font inference                            |

Office formats (`.docx`, `.pptx`, `.xlsx`), video, archives, and remote URL imports are unsupported.
Export those sources to a supported format first. A PDF export provides text only; screenshots provide
color samples only. Renaming an unsupported binary file does not convert it.

## Files, batches, and paste

1. Drop several files together or activate **Bring your sources together** to open the file picker.
2. Alternatively, choose a **Content format**, optionally name the source, and paste **Source content**.
   **Generate DESIGN.md** applies the selected extension; an existing supported text extension in the
   name is replaced. Empty paste is rejected. Choose Plain text for automatic detection of clear code.
3. Review the source summary, import notes, token categories, and audit. Files that fail within a mixed
   batch are reported rather than silently ignored. An entirely invalid batch stays on the landing page.
4. Inspect a token's source link, then use **Export → Normalized DESIGN.md → Download File** to save it.
5. **Import other sources** clears the loaded system and its notes. Source content is not stored by
   the app; refresh also clears it.

Import controls and examples are disabled while reading. Files retain batch order. Identical filenames
are retained as separate sections with a note. Conflicting custom-property/token definitions are also
retained and reported; the parser may use the last definition. Review conflicts rather than assuming a
merge policy has resolved them.

## Limits

Bounds are defined in [`src/importers/limits.ts`](../src/importers/limits.ts). MiB means 1,048,576 bytes.

| Resource                     | Bound and behavior                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Batch                        | At most 20 files and 20 MiB total; oversized batches are rejected                            |
| Text source, including paste | 2 MiB UTF-8; files must be valid UTF-8 and contain no binary NUL bytes                       |
| Image or PDF                 | 10 MiB per file                                                                              |
| Image dimensions             | At most 8,192 pixels per side and 16,777,216 pixels total; checked before decoding           |
| Image sampling               | Longest side reduced to at most 128 pixels; up to 12 quantized color buckets                 |
| PDF pages                    | First 25 pages; more pages produce a partial-extraction warning                              |
| PDF time                     | 30 seconds before terminating extraction                                                     |
| JSON traversal               | 32 nesting levels and 10,000 visited nodes; truncation is reported                           |
| CSS/markup extraction        | First 5,000 supported declarations; truncation is reported                                   |
| Per-source generated content | 2 MiB UTF-8 bytes; oversized output is rejected or reported as partial during PDF extraction |
| Combined generated document  | 24 MiB UTF-8; larger output is rejected                                                      |

Some inputs produce no recognized tokens while still loading their notes. The app reports empty PDF
text, unsupported values, and other extraction limits. Token counts are not a guarantee that the entire
source has been understood.

Alias resolution shares a budget across each token's dependency traversal: at most 32 nested levels,
128 resolution/reference operations, and 64 KiB of resolved UTF-8 text. These bounds also apply to raw
Markdown and references spanning several sources. Definitions exceeding a bound keep their original
value and remain unresolved; partially expanded values are not used or cached.

## Examples

Save these as the named files, or paste them with the corresponding format. They can also be imported
together; inspect the generated source sections to see which file supplied each declaration.

### `brand.md`

```markdown
# Example Brand

## Colors

| Name    | Value   | Usage           |
| ------- | ------- | --------------- |
| Brand   | #10b981 | Primary actions |
| Surface | #0b0f0c | Page background |

## Spacing

- **space-md**: 16px
```

### `theme.css`

```css
:root {
  --color-brand: #10b981;
  --color-action: var(--color-brand);
  --space-md: 16px;
  --radius-card: 24px;
  --font-size-body: 16px;
}
```

### `tokens.json`

```json
{
  "color": {
    "$type": "color",
    "brand": { "$value": "#10b981" },
    "action": { "$value": "{color.brand}" }
  },
  "space": {
    "md": { "$type": "dimension", "$value": { "value": 16, "unit": "px" } }
  }
}
```

The JSON adapter converts supported token paths and aliases to safe CSS declarations before parsing.
Repeated definitions across `theme.css` and `tokens.json` can produce conflict notes if their values differ.

### `palette.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80">
  <rect width="80" height="80" fill="#10b981" />
  <rect x="80" width="80" height="80" fill="#0b0f0c" />
</svg>
```

The SVG adapter reads these paint values as text. It does not render the rectangles or infer their size
as a spacing scale. Rasterizing the same SVG and importing the PNG instead gives sampled pixel colors.

## Provenance, previews, and migration

Existing single `.md`/`.markdown` imports, samples, category navigation, and exports remain available.
There is no required source schema or new front matter. A single Markdown document keeps its original
source view. Other formats and multi-file imports generate a Markdown document with source names,
format labels, and warnings. Provenance line numbers then refer to **that generated document**, not the
original file's line, PDF coordinates, or raster pixel locations.

SourceView shows escaped source text or a section outline; it does not render a live imported website.
Component previews illustrate supported extracted data using app-theme controls. They do not recreate
an interface pixel for pixel.

The normalized `DESIGN.md` export serializes supported parsed identity, colors, typography, spacing,
radii, shadows, borders, breakpoints, motion, generic tokens, components, and accessibility guidance.
Reimport is intended to preserve supported semantics. It does not preserve original formatting,
arbitrary JSON metadata, selector context, source maps, PDF layout, or every original source statement.
Inspect warnings and compare important values before migrating a canonical specification.

## Adapter architecture and adding a format

[`src/importers/index.ts`](../src/importers/index.ts) exposes two entry points:

```ts
importSources([{ name: 'theme.css', content: ':root { --color-brand: #10b981; }' }]);
await importFiles(files);
```

Both return `{ markdown, fileName, sources, warnings }`. Text adapters are synchronous; the image and
PDF adapters load only when needed. Each returns `AdaptedSource` from
[`types.ts`](../src/importers/types.ts): inert Markdown, format, warnings, optional token definitions,
and an original-Markdown flag where appropriate. Shared assembly handles source sections, duplicate
filenames, conflicts, and generated-size bounds. `parseDesignDocument` consumes the resulting Markdown.

To add a format:

1. Add an adapter under `src/importers/` that returns `AdaptedSource`, using the shared Markdown helpers.
   Bound traversal, decoding, and output; never execute or render source code or fetch external resources.
2. Register extension dispatch, size handling, accepted extensions, and the supported-format description
   in `index.ts`. Keep optional heavy decoders lazy-loaded and bundled locally.
3. Add normal, malformed, hostile, unsupported-value, and limit tests under `src/importers/__tests__/`.
   Test adapter output through `parseDesignDocument`, including aliases and generated provenance.
4. Update this guide, README, UI wording, and the security policy if the threat model changes. Keep
   partial extraction visible through warnings.
5. Run `npm test -- src/importers`, `npm run typecheck`, `npm run lint`, and `npm run build`; format
   touched files and check them with Prettier. Browser-check binary decoding, workers, and both themes.

Future capabilities are tracked separately in [ROADMAP.md](ROADMAP.md).
