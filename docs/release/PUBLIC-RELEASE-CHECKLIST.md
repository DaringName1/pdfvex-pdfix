# Public GitHub beta: release checklist (October 31, 2026, Windows only)

From the release audit ([../RELEASE-AUDIT-2026-10-23.md](../RELEASE-AUDIT-2026-10-23.md)) and the owner's decisions
of October 23. Tick an item only with evidence, written next to it.

## Before release day
- [ ] A1–A4 fixed by Codex and their tests rerun by Claude (no weakened assertions).
- [ ] B1 library updates (DOMPurify 3.4.17, Electron 44.9.3): unit tests, full app run and package build pass.
- [ ] B2 compatibility: PDFix outputs opened in Edge, Chrome, Adobe Acrobat Reader, Foxit PDF Reader and Word
      Online; content checked; results in `docs/release/COMPATIBILITY-RESULTS.md`.
- [ ] Small private test with the dad and other testers on the release-candidate package; their findings triaged.
- [ ] Name decision (LICENSE-REVIEW section 3).
- [ ] Licence finalized: LICENSE file, package.json, README, shipped in the package.
- [ ] Full local run, spare-PC robot run and install/uninstall on the release-candidate package; two cloud runs.
- [ ] Version set to `0.1.0-beta.1` in package.json; CHANGELOG and release notes final; known issues current.
- [ ] `node scripts/publish-github.mjs --check` passes (no private names anywhere).

## The public repository starts with fresh history
The existing private repository `DaringName1/pdfix` has the private sample's notes in every one of its 26 commits.
GitHub can keep old commits viewable even after history is rewritten, so **do not make that repository public.**
1. Owner creates a **new, empty** public repository (owner's account action), or approves Claude creating it with `gh`.
2. Claude builds a one-commit history from the checked upload copy (`publish-github.mjs --check` first) and pushes it.
3. Check in a fresh clone: `git log --all` has one commit; the private names list finds nothing; the drawing folder is absent.
4. The old private repository stays private (the owner may archive or delete it later).

## On release day
- [ ] Owner enables private vulnerability reporting (Settings → Code security), referenced by SECURITY.md.
- [ ] Tag `v0.1.0-beta.1`; GitHub Release with the zip, its SHA-256 and the release notes.
- [ ] Download the zip from the release page on the spare PC, check the SHA-256, install, open a PDF, uninstall.

## Backups
`C:\Users\andre\pdfix-backups\2026-10-23` holds full bundles of the local history and the GitHub copy and the private
sample, with SHA256SUMS.txt. Keep them off GitHub.
