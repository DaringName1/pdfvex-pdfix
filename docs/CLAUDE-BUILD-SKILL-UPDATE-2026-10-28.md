# Claude: update the build-truth skill

Owner requested a reusable process after the October 27-28 version confusion. Codex created the shared [PDFix build-delivery skill](skills/pdfix-build-delivery/SKILL.md). Codex owns Setup delivery; Claude's existing `.claude/skills/pdfix-build-truth/SKILL.md` stays Claude's to update. No change to that file was made by Codex.

## Give Claude this instruction

Update your existing pdfix-build-truth skill, preserving the owner's rule that Codex owns Setup.exe and that installing or uninstalling needs an explicit request. Read docs/skills/pdfix-build-delivery/SKILL.md and the newest HANDOFF first. Add these distinctions:

1. **Build only means build only.** An owner-requested exact committed snapshot may be delivered as a preview even with known unfinished UI/testing. Do not delay it for unrelated repairs or broad tests. Do not call that preview final, fully tested or the newest completed UI. Compilation and package-integrity checks still apply.
2. **Identify before claiming.** Record the full selected commit, clean source archive, source-snapshot hash, actual executable hash and unique dated filename. Never replace the selected commit with arbitrary HEAD. Uncommitted UI is not included. Never overwrite an older installer.
3. **Show the actual requested screen.** A PDF in Build is different from an empty Word document, a screenshot or an old installed shortcut. Compare the same file/mode/tab/panel/window size. Use Codex's existing reference first; do not make the owner resend our own screenshot. Ask for the owner's screen only if their observed screen is missing.
4. **Separate the evidence.** Built, package-integrity checked, app-tested, screenshot-matched, installed and release-accepted are different claims. Report known failures in the receipt/handoff. Answer briefly; give the actual file link promptly.
5. **Separate permissions.** Building does not authorize installing, uninstalling or launching. Honor later stop/no-change instructions. Do not cycle installed versions to diagnose which one is right. Don't claim uninstall succeeded from notes alone; verify the actual installed files/shortcuts when that action is requested.
6. **Use the shared record.** Link the portable skill above, docs/UI-CURRENT-START-HERE.md and docs/HANDOFF.md. Do not change robot scheduling, seeds, counts or reporting as part of this skill update. No cloud or spare-PC run is requested here.

## Artifact actually delivered

- Installer: `releases/PDFix-Setup-2026-10-28-03752e4.exe`.
- Full source commit: `03752e4b543a8987981b672dfe3c28f90980874a`.
- SHA-256: `489d491ed2c920fda71219f2ba393eb82f163f5c49ca618eb5fd044069373051`.
- Receipt and compiler logs: [retained evidence](evidence/codex/installer-2026-10-28-03752e4/build-receipt.json).
- Built from a clean archive, packaged and hash checked. **Not installed or uninstalled by Codex.** This is not a claim of full UI acceptance.
- Full local suite completed: 253 passed, 1 failed, 2 skipped. Failure: `tests/desktop/forms.spec.js:13:1`, guided fields / typed signing / preserved editable copy. Owner requested the build without further tests or repairs.

## Reuse and limitations

The shared skill contains a deterministic exact-commit build helper. Its syntax and read-only planning/guard paths were checked; the new reusable helper itself has not performed another full build. The delivered installer used the successful equivalent archived-source pipeline; no duplicate installer was built merely to test the skill.

Codex's installed skill is at `C:/Users/andre/.codex/skills/pdfix-build-delivery`. The project copy is portable for other computers; installing it there is a separate setup step. No skill can promise that mistakes are impossible; these checks make version identity and scope explicit and reviewable.
