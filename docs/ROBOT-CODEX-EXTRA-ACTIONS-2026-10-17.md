# Eight additional Codex robot actions

Ready for Claude to integrate. The original seven `actions` exports remain unchanged, so the existing 35-action random robot is unaffected. New actions are exported as `additionalActions` from `scripts/user-robot/actions-codex.mjs`; implementation is in `actions-codex-extra.mjs`.

Add the runner's absolute temporary `profile` path to `codexCtx`, then import/run both arrays. No app-private bridge/state or selector IDs are needed. Each action still has `name`, `weight`, `run(page,ctx)` and `verify(ctx)`. The sheet-set verifier reads the actual internal library from `ctx.profile`; it must never receive the user's real profile.

| Action | Independent saved-file check |
| --- | --- |
| Number and stamp every page | Reopens all three PDF pages separately and finds each unique page number and APPROVED stamp, plus retained original text. |
| Compress | Copy is smaller, opens, keeps its page count/text; original input hash unchanged. Generated input contains real redundant graphics commands, not appended padding. |
| Add outline entry | Saved linked outline contains the title and exact reference to page 2. |
| Change page box | Saved page 1 crop is x=10, y=20, width=380, height=560; pages 2–3 retain original bounds. |
| Add review reply | Saved parent/private field remains, reply links to it and has Accepted state; reopened app lists the reply. |
| Prepare printing and unchanged copy | All three prepared sheet images and reviewed Windows-dialog control appear; dialog is closed without printing. Separate saved reader copy matches every original byte. |
| Compare revisions and source copy | UI reports a nonzero artwork difference; independent reader finds the known added revision text. Both input hashes remain unchanged, and the saved reader copy matches original bytes. Comparison itself has no exported report feature; no such export is claimed. |
| Save/reopen sheet set | Reopens saved profile JSON and checks exact source fingerprint, three sheets and edited title; UI reloads that same named set. |

Visible names, roles and accessible labels are used for UI actions. Saved sheet-set rows now have a named group, so identically named Review and load buttons can be targeted to the correct visible set without CSS classes or internal IDs.

Checked through the run lock in a hidden built app: **8/8 pass**, no page errors, app closed. Receipt: `C:/Users/andre/AppData/Local/Temp/pdfix-codex-robot-m0yZvZ/report.json`. This is generated-file local built-app evidence; Claude's random-sequence integration and spare-PC run remain separate.

Reproduce with `PDFIX_ROBOT_EXTRA=1` and `node scripts/agent-run.mjs codex -- node scripts/check-reader-robot-actions.mjs`. The dedicated harness now supplies its temporary `ctx.profile`. No dependencies, shared robot source, uploads, spare-PC state, user drawings or final packages were changed.
