# What is saved in the PDFix project folder

Project root: `C:\Users\andre\My Drive\projects\pdf app`.

- `src/`: renderer, document editor, PDF viewer and workspaces.
- `desktop/`: Windows/Electron integration, native engine codecs/services, containment, safe file/output handling, recovery and local workflows.
- `scripts/`, `packaging/`, `vendor/`, `package.json`, `package-lock.json`: build/package tooling, bundled inputs and dependency definitions. `node_modules/` is the installed development dependency tree.
- `public/brand/`: adopted PDFix logo and desktop icon.
- `FINAL-IMPLEMENTATION-PLAN.md`: the adopted work order. Earlier/future requirements also remain in the root requirements/product/feature/roadmap/Acrobat/Bluebeam files.
- `docs/FINAL-REMAINING-WORK-2026-10-11.md` and `docs/FINAL-SCOPE-LEDGER-2026-10-11.json`: complete consolidated scope and source provenance, including unimplemented work and pending acceptance.
- `docs/intake/`: saved copies of the original pasted requests and original missing-feature list. Other dated `docs/` files record implementation boundaries, historical evidence and remaining checks.
- `docs/PDFIX-STATUS-INVENTORY-2026-10-04.json`: updated coding/check status with dated evidence. Historical checkpoints remain saved.
- `dist/`: latest compiled development output and native runtime manifests. `releases/`: older packaged releases; their presence does not mean they include newer coding work.
- `samples/`, `tests/`, `tmp/`, `test-results/`: available fixtures, checks and recorded outputs. Some generated fixture inputs/output copies also reside in operating-system temporary folders; receipts identify their narrow check scope.

The development files and saved requirements are here. The entire Codex chat history is managed by Codex rather than exported into this folder. Original user attachments/downloads can still exist elsewhere even when their request text/logo was copied here. Some large or private test PDFs remain in their original chosen locations. Windows desktop shortcuts and installed app files may also be outside this project.

The running desktop app normally stores local recent-file metadata, settings, drafts/versions, selected profiles and protected consent under `%APPDATA%\pdfix-document-workspace`, with temporary jobs under app-owned staging directories. This runtime user data is distinct from project source and is not automatically included in a project-folder backup. Diagnostic/test runs may use their own isolated profiles. Avoid sharing runtime profiles or personal PDF fixtures without reviewing their contents.

For continuing development, keep the complete project folder, especially code, plans, intake, lockfile, tooling and notices. For personal drafts/settings, separately preserve the applicable runtime profile. A backup of project source does not prove current release readiness or replace pending full UI, device, corpus and security checks.
