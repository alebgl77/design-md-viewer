# Repository routing ledger

## PRIORS

No empirical defaults yet. Use the model-routing rubric; model selection inherits the session alias.

## LOG

| date       | class                       | predicted                | executed                | outcome                                                                                                 | escalations       | playbook |
| ---------- | --------------------------- | ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------- | ----------------- | -------- |
| 2026-10-21 | inspect-source-imports      | T0                       | scout                   | pass: architecture and gaps mapped                                                                      | 0                 | none     |
| 2026-10-21 | inspect-export-roundtrip    | T0                       | scout                   | pass: field and parser roundtrip hazards mapped                                                         | 0                 | none     |
| 2026-10-21 | preserve-markdown-roundtrip | T2                       | heavy-executor          | pass: 66 focused tests; integrated 149 tests and production build                                       | 0                 | PB-1     |
| 2026-10-21 | add-local-source-imports    | T2                       | heavy-executor          | pass: 44 importer tests, full 149 tests and build; shared resolver guard tracked separately             | 1 security design | PB-2     |
| 2026-10-21 | wire-source-import-ui       | T1                       | executor                | pass: 13 focused tests, responsive batch/paste and source summaries                                     | 0                 | none     |
| 2026-10-21 | document-source-imports     | T1                       | executor                | pass: support guide, roadmap, security policy and local links verified                                  | 0                 | none     |
| 2026-10-21 | browser-import-smoke        | T1                       | executor                | pass: 16 browser scenarios and 14 screenshots on production; no browser errors or unexpected requests   | 0                 | none     |
| 2026-10-21 | review-source-boundaries    | T3                       | oracle                  | pass after corrections: linear scans, typed aliases, bounded PDF timeouts and Markdown roundtrip        | 0                 | none     |
| 2026-10-21 | bound-token-resolution      | T3 design / T2 execution | heavy-executor + oracle | pass: projected UTF-8/depth/operations bounds; 12 resolver tests; oracle APPROVE                        | 0                 | PB-3     |
| 2026-10-21 | inspect-screenshot-failure  | T0                       | scout                   | pass: identified npm edgesOut failure before browser installation on Ubuntu                             | 0                 | none     |
| 2026-10-21 | isolate-browser-ci          | T1                       | executor                | pass: isolated install, YAML/format checks and unchanged app graph; require Ubuntu capture before merge | 0                 | none     |

## PATTERNS

See [repository playbook](../.tierdecay/playbook.md). Patterns require future probes before empirical default tiers change.
