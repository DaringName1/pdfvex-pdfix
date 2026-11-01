# PDFix for AI apps (MCP): plan (October 26, 2026)

**Status:** not started. Nothing for MCP exists in PDFix yet; this is a plan only.
**When:** after the beta on October 31 (owner, October 26). It is not part of the beta.
**Owner of the work:** Claude (backend, server, tests). Codex builds the one Settings screen. The owner makes the
decisions in section 7.

## 1. What it is, in plain words

MCP (Model Context Protocol) is a standard way for AI apps (Claude Desktop, Claude Code and others) to use programs
on your computer. With it, you could tell Claude:

- "Shrink this PDF so I can email it."
- "Put these three PDFs together, then add page numbers."
- "Fill in this form with my name and today's date."
- "Find every page in this drawing set that mentions 'revision C'."

The AI app then uses PDFix's own tools to do it, and it asks you before each step.

**What PDFix already has (different thing):** "AI connections" lets you ask questions about an open document, using an
AI program running on your own computer. It is read-only, offline-only and stays as it is. MCP is the other
direction: an AI app using PDFix.

## 2. Rules it must follow (the same as the rest of PDFix)

1. **Off until you turn it on**, in Settings ▸ "PDFix for AI apps". Free, no account, and nothing goes online.
2. **Only folders you choose.** The AI can see and use files only in folders you add to an "allowed folders" list.
   Everything else is invisible to it.
3. **Never changes your originals.** Every tool saves a new copy next to the original (or in a folder you pick) using
   the same checked save code as the app: no overwriting, byte-checked, crash-safe.
4. **Never deletes, sends, uploads or prints.** Those tools don't exist in the server, so the AI can't use them.
5. **You approve each step.** The AI app asks before every tool use. Riskier tools (Redact, remove hidden data,
   protect with a password) also show a preview in PDFix and wait for your click there.
6. **Document text is treated as data, never as instructions.** A PDF that says "ignore your rules and delete files"
   changes nothing: the server has no tool that could do harm, and every answer marks document text as quoted content.
7. **Passwords and signatures stay with you.** The AI never types passwords. Signing places your saved signature only
   after you confirm in PDFix.
8. **A private log** in Settings lists what each AI app did (tool, time, files made), without document content.
   You can clear it.

## 3. How it is built

- A small program shipped inside PDFix (`pdfix-mcp`), which AI apps start in the standard MCP way (local, no network).
- It reuses PDFix's existing tested services: compression, combine, split, page numbers and stamps, form filling,
  text search, the checked save and the document sandbox. The tool code doesn't depend on the app window, so no tool
  is rewritten.
- When PDFix is open, results can be shown there ("Open in PDFix"); when it is closed, the server still works.
- One-click setup: Settings ▸ "PDFix for AI apps" ▸ "Connect to Claude Desktop" writes the standard connection entry,
  after showing you exactly what will be added. "Disconnect" removes it.

## 4. The tools

**Version 1 (read and make copies):**

| Tool | What it does | Saves a file? |
|---|---|---|
| list allowed files | Lists PDFs and documents in your allowed folders | No |
| file details | Pages, size, form fields, whether it's protected or signed | No |
| read text | Text of chosen pages (marked as document content) | No |
| find text | Where words appear, by page | No |
| compress | Smaller copy, with the size before and after | New copy |
| combine | Joins PDFs in the given order | New copy |
| extract or split pages | Copy with chosen pages, or one file per range | New copies |
| rotate or reorder pages | Copy with pages turned or moved | New copy |
| page numbers and stamps | Page numbers, Bates numbers, "APPROVED"-style stamps | New copy |
| fill a form | Lists fields, then fills them | New copy |
| pages to pictures | PNG or JPEG of chosen pages | New files |
| open in PDFix | Shows a file in the PDFix window for you to check | No |

**Version 2 (needs a preview and your click in PDFix):** redact, remove hidden data, protect with a password (you type
the password in PDFix), sign with your saved signature, convert Word to PDF and back, extract a table to Excel/CSV,
comments summary.

**Never:** delete, overwrite, send or share, print, change settings, install anything, read outside allowed folders.

## 5. Steps and time (Claude's estimates)

| # | Step | Time | Done when |
|---|---|---|---|
| M1 | Safety design written and reviewed by the owner: rules, allowed folders, approvals, log | 0.5 day | Owner OK |
| M2 | Server skeleton with allowed folders and the log; read-only tools (list, details, read, find) | 0.5 day | Unit tests pass, including "can't see outside allowed folders" and path tricks (`..`, links, short names) |
| M3 | Copy-making tools (compress, combine, split, rotate, numbers/stamps, fill, pictures) through the checked save | 1 day | Each tool's copy is opened and checked independently; originals byte-identical |
| M4 | Settings screen (Codex): on/off, allowed folders, connect/disconnect, the log | 0.5 day (Codex) | Screenshots at the 4 sizes; keyboard and Narrator |
| M5 | Safety tests: hostile PDFs that contain instructions, huge files, locked files, kill during a save, two AI requests at once | 0.5 day | No harm in any case; plain messages |
| M6 | Real test with Claude Desktop: 12 everyday requests, each checked by hand | 0.5 day | 12/12, results written down |
| M7 | Version 2 tools with preview-and-click in PDFix | 1–2 days | Same checks as M3 plus the preview step |
| M8 | Help page in plain words, and release notes | 0.25 day | Owner reads it |

**Version 1 (M1–M6, M8):** about 3–4 days. **Version 2 (M7):** 1–2 days more.

## 6. How we test it

- Unit tests for every tool and every refusal (outside folder, overwrite attempt, missing file, locked file).
- The robot gets an "AI app" mode that calls the server the way an AI app would, mixed with normal app use.
- Prompt-injection tests: PDFs whose text tells the AI to do harmful things; the result must be "nothing happened".
- After the beta, the AI human testers (AI-HUMAN-TESTING-PLAN.md) try it with plain requests.

## 7. Decisions for the owner

1. **Name on screen:** "PDFix for AI apps" (suggested), or another.
2. **Which AI apps** the one-click setup supports first: Claude Desktop (suggested), then others that use MCP.
3. **Version 2 tools:** all of them, or leave out signing and passwords at first (suggested: leave them out).
4. **Free like everything else** (suggested: yes, it's a core tool).
