# Repair, contained form filling and selection — October 9, 2026

Integrated source and compilation milestone. No runtime, PDF, UI, native-engine, hardware, performance or effective-security tests were run. Full adopted scope remains active.

| Addition | Integrated code | Remaining scope |
| --- | --- | --- |
| Form fill containment (S00/F18/F26) | Existing-field inspection and fill/visual placement writing use fixed contained routes, inert schemas, source/output preservation checks and retained token-only saves. Renderer form worker fallback removed. Reviewed declarative calculations, undo/recovery and artwork review retained; cancellation/departure await native cleanup. | Actual real-form/preservation/cancel/isolation acceptance; wider fonts, tab order, source logic and unsupported forms. |
| Supported repair-to-copy (A25/F42) | Bounded qpdf check/rebuild with strict output checks and independent canonical source/output content verification. Accessible for a retained native PDF even when normal viewing fails. Explicit review, sealed native save, originals retained. | No complete independent baseline means diagnostics only. Missing/truncated content restoration, unsupported structures, larger whole-source jobs and difficult-file/security/performance corpus remain. |
| Rectangle selection (F03) | One primary pointer with capture/cancel cleanup, page/geometry invalidation, bounded clipped regions, row/two-column/three-column/content order choices and exact copied-text preview. More efficient direction-aware row grouping. | Ambiguous rotated/mirrored rectangle geometry is refused; vertical writing and arbitrary layout reconstruction remain. All actual selection/layout behavior needs runtime acceptance. |

## Compilation

- 20 integration/source files passed Node syntax checks; delegated source checks also passed.
- npm run build exited 0; 292 modules compiled with fixed native helpers and contained document engine.
- Renderer: index-CShdbANS.js; CSS: index-C-UikTt7.css.
- Source snapshot SHA-256: 580003a2f83925a7426ba400cb6c551f6f20cb3b130dcb22358de962d2e20475.
- Fixed document engine SHA-256: 593e9b52a40c83496ade3bd1e44c4f985bc6c4ad44515bd6212e213899dc25b6, 3,415,304 bytes.
- Vite reports large existing renderer chunks; size/performance optimization and acceptance remain.
- No app launch/restart, installer build or test execution. No broad feature is newly marked fully accepted.

Module details: [form filling](FORM-FILL-CONTAINMENT-PROGRESS.md), [repair](PDF-REPAIR-PROGRESS.md). Earlier October 9 milestones remain included.
