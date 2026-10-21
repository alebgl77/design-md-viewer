# Roadmap

The current application imports local Markdown/text, CSS, supported JSON tokens, HTML/SVG styles,
image palettes, and PDF text into the existing parser. See [IMPORTING.md](IMPORTING.md) for implemented
behavior and limits. The work below is planned, not available today; order reflects priorities rather
than release commitments.

## 1. Explicit visual analysis

Add OCR for scanned PDFs and image text, followed by optional multimodal interpretation of layout,
typography, and components. Separate measured evidence from inferred descriptions and keep confidence
and provenance visible. Any remote model call must require explicit consent, show what will be sent,
and explain provider/key handling. Local import must remain usable without it.

## 2. Office adapters

Add bounded `.docx`, `.pptx`, and `.xlsx` readers behind the existing adapter boundary. Define which
document text, slide styling, spreadsheet values, and embedded resources are supported before enabling
each extension. Include archive expansion/decompression bounds and hostile-file tests. Until then,
users must export to a supported format; PDF and raster exports retain their current text/palette limits.

## 3. Isolated analysis and responsive progress

Move more parsing and format analysis into dedicated workers with cancellation, progress, and time/memory
bounds. The existing PDF.js worker only covers PDF processing; general import/parsing isolation is still
future work. Preserve deterministic outputs and avoid turning optional adapters into initial-load costs.

## 4. Source maps and conflict resolution

Map generated tokens back to original source lines, JSON paths, PDF pages, and sampled image regions.
Add a review step for conflicting definitions, aliases, duplicate names, and precedence. Current import
notes report conflicts while retaining declarations; they do not resolve them. Improve component-preview
fidelity only where the source provides sufficient evidence, without claiming exact interface replication.

## 5. Controlled remote imports

Remote URL ingestion needs a separate design for a controlled fetch service, CORS, SSRF protections,
redirect rules, authentication, size/time limits, resource loading, and storage/retention. Do not relax
the browser CSP or let source documents initiate arbitrary network access as a shortcut. Review that
service's threat model and consent flow before adding a URL input.
