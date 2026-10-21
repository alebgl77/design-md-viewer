# Repository playbook

## PATTERNS

### PB-1 · preserve-markdown-roundtrip

provenance: T2 2026-10 · hits: 0
WHEN: Extending normalized DESIGN.md serialization or parser-compatible generated inputs.
DO: Compare schema fields with real extractor grammars before choosing output tables/subsections.
DO: Preserve generic definitions and aliases, not only resolved values; keep category tables unambiguous.
DO: Escape cells and inline text; fence code examples above their longest marker run.
DO: Let explicit component subsections win over keyword guesses and traverse ancestry without prefix copies.
VERIFY: Parse → export → parse asserts values/categories, alias resolution, no fabricated breakpoints and hostile Markdown structure.

### PB-2 · add-local-source-imports

provenance: T2 2026-10 · hits: 0
WHEN: Adding a local source format or batch import adapter.
DO: Produce inert Markdown through the shared assembly contract; retain source names, limitations and rejected-file notes.
DO: Bound bytes before reads, traversal while extracting and output before parsing; use advancing scans for hostile markup/comments/detection.
DO: Validate raster signatures/dimensions before decoding; bundle binary readers and workers locally and load only on demand.
DO: Race binary reads against explicit timeout/error rejection; cap cleanup independently of library teardown promises.
VERIFY: Parse adapter output, test malformed/hostile/oversized and mixed batches, then actual browser decoders/workers against a production build.

### PB-3 · bound-token-resolution

provenance: T3 2026-10 · hits: 0
WHEN: Resolving references that may cross uploaded files or normalized token tables.
DO: Enforce depth, work and projected UTF-8 expansion budgets at the shared resolver, before replacements allocate expanded strings.
DO: Keep budgets per root, include cached substitutions and repeated references, and retain the original definition on exhaustion.
DO: Stage caches until the entire root succeeds; treat replacement dollar sequences as literal source data.
VERIFY: Alternating-file branching, deep/wide references, UTF-8 boundaries, cache isolation and existing exact cycle semantics; require critical review.

## QUARANTINE

None.
