# AI human testing plan (October 25, 2026)

**Owner decision, October 25: all of this happens after the October 31 beta.** That covers the AI human tester, the
full-app automated coverage (about 20 new robot tasks and tests), and the human testers doing the same goal cards
with answers emailed to the owner through a Google Form. Before October 31, only the release blockers in
[release/PDFIX_PRIORITY_TASKS.md](release/PDFIX_PRIORITY_TASKS.md) are worked on.

**Estimates given to the owner** (unmeasured until the first 4-goal run):
- **Time:** about 2 weeks elapsed.
- **Cost on Pro:** $0 extra, but 3–4 weeks.
- **One month of Max:** about $100 or $200, and about 2 weeks.
- **API:** roughly $300–600 for about 600 AI runs.

**Goal.** An AI that uses PDFix the way a person does. It gets only a plain-words goal ("sign this lease and save
it"), looks at the screen, decides what to click by itself, gets lost the way people get lost, and reports what was
confusing. It does not follow a script.

This is the missing half of "L2, the AI computer-use tester" in
[VERIFICATION-PLAN-2026-10-16.md](VERIFICATION-PLAN-2026-10-16.md). The scripted half (the robot) already exists and
stays.

**Requirements added October 26 (master plan):**
- AI testers use the **real desktop app** (the driver, or computer use on the spare PC), never just the code.
- They get outcomes, not buttons.
- They cover every major feature and combinations (the user-group chains in release/PDFIX_WORKFLOW_TEST_MATRIX.md section H).
- They record confusion, failures, extra steps, surprises and wrong outputs.
- **Independent testing with ordinary people who have never used PDFix** runs alongside, measuring task completion, errors and ease (section 7).
- **AI testing does not replace real human testing.**

## 1. Why the robot is not enough

| | The robot (`scripts/user-robot/`) | AI human tester (this plan) |
|---|---|---|
| Knows the way | Yes: every click is written down in advance | No: only the goal, like a new user |
| Finds | Broken saves, crashes, wrong output | **Confusing screens, hidden tools, dead ends, unclear messages, too many steps**, plus broken output |
| Can't find | Whether a person would ever find the button | Rare timing bugs (the robot's job) |
| Speed | Hundreds of tasks a night | About 10–20 goals a session |

Both are needed: the robot proves the tools work, and the AI tester shows whether people can use them.

## 2. How it works

**Driver (Claude builds it, about 3 h).** `scripts/ai-tester/step.mjs` keeps one hidden PDFix window open (through
`agent-run`, so it never takes over your mouse or screen). Each turn it:

1. takes a screenshot and a short list of what's visible: buttons, menus and fields by their **visible names only**
2. receives one action from the AI tester: click "name", type text, press a key, scroll, drag
3. performs it, waits for the screen to settle, and returns the new screenshot

**Rules the AI tester must follow** (from the four L2 rules of October 16):
- It may use only what a person sees: visible names, icons, tooltips, keyboard shortcuts.
- **No source code, no test hooks, no CSS selectors.**
- File pickers are the one exception, because Windows dialogs are outside the app: the tester says which test file
  it wants, and the driver supplies it.
- It thinks aloud before every action: "I'm looking for Sign… I'd expect it under Fill & Sign…".
- After **3 wrong tries** at one step it marks "stuck", writes where it looked, and is then allowed one hint.
- It never reads earlier session notes, so it stays a first-time user.

**Checking the result.** After each goal, the saved file is checked independently with the robot's `verify.mjs`
(page count, text, fields, comments, original unchanged). "It said Saved" does not count.

**Where it runs:**
- this PC, hidden (works now)
- the spare PC with real screen control (computer use) when it is back; that also covers Windows 10 and other
  graphics
- never on your real files: only test files from `tests/fixtures/` and generated ones

## 3. Personas

Each session runs as one persona, with its own instructions about patience and skill.

| Persona | Who | How they behave |
|---|---|---|
| **Dad** | Engineer, drawings every day, not a computer person | Large PDFs, measures and marks up. Reads little text, clicks what looks right, gives up after 2–3 tries. Never uses keyboard shortcuts |
| **Office friend** | Uses Word and Acrobat Reader at work | Expects Acrobat's places: Fill & Sign, Comment, Save a copy top right. Uses Ctrl+S, Ctrl+Z and right-click |
| **First-timer** | Has never used a PDF editor | Reads every label. Tries Home first. Gets nervous about "original" vs "copy" |
| **Keyboard-only** | Does not use a mouse | Tab, arrows, Enter, Esc only (an accessibility check) |
| **Hurried** | Five minutes before a meeting | Skips messages, double-clicks, closes things in the middle, switches tools with unsaved work |

## 4. Goal cards (first set, 20)

Written as a person would say them, with no tool names unless a person would know them.

| # | Goal | Persona | Must be true afterwards |
|---|---|---|---|
| G1 | "Open this PDF and find where it says 'oil'" | First-timer | The right page, highlighted |
| G2 | "Sign this lease with my name and save it" | Office friend | Signature on the right page; original unchanged |
| G3 | "Fill in this form and print it" | Dad | Fields filled; print preview shows them |
| G4 | "Put a note on page 2 saying 'check this dimension'" | Dad | Note saved and visible after reopening |
| G5 | "Measure the length of this wall" (calibrated drawing) | Dad | A distance within 1% |
| G6 | "Make this file small enough to email" | Office friend | Smaller copy; pages look the same |
| G7 | "Take out pages 3 and 4 and save them as a new file" | First-timer | New file has exactly those pages |
| G8 | "Put these two PDFs together" | Office friend | All pages, right order |
| G9 | "Black out the account number everywhere" | Office friend | Number gone from text and pixels |
| G10 | "This scan: make it so I can search it" | Dad | Text found by search |
| G11 | "Put a password on this" | First-timer | Opening asks for it |
| G12 | "Fix the typo 'recieve' in this PDF" | Office friend | Only that word changed |
| G13 | "Turn this PDF into something I can edit in Word" | First-timer | DOCX opens and contains the text |
| G14 | "Write a short letter and save it as PDF" | First-timer | PDF contains the letter |
| G15 | "I made a mistake, undo it" (after G4) | Hurried | Note gone |
| G16 | "Rotate the sideways page" | Dad | Only that page turned |
| G17 | "Close everything, then find the file I worked on yesterday" | First-timer | Found from Home / recent files |
| G18 | "Do G2, but close PDFix halfway and reopen it" | Hurried | Work comes back or is clearly kept |
| G19 | "Do G9 using only the keyboard" | Keyboard-only | Same as G9 |
| G20 | "Compare these two drawing revisions" | Dad | Changes shown |

Later sets grow from what testers and the dad actually do, in about the same proportions as real use.

## 5. What every session records

For each goal, `tmp/ai-tester/<date>/G<n>.json` plus screenshots:
- **Result:** done / done with a hint / stuck / wrong result / app error
- **Steps** taken versus the shortest known path (the robot's steps)
- **Wrong clicks** and dead ends, with what the tester expected to find there
- **Messages the tester didn't understand** (quoted)
- **Time** (machine time, not human time)
- **The tester's own rating:** "How easy was that?" 1–5, and one sentence why
- **Output check:** pass/fail from `verify.mjs`

**Summary per session:** a table of goals × personas, the top 5 confusions, and new bugs. Each confusion becomes a
UI finding for Codex with screenshots. Each wrong output becomes a bug, plus a robot task so it never comes back.

## 6. Pass bar for the beta

- Every goal reaches a correct result (verified file) for at least 4 of the 5 personas.
- No "stuck" on G1–G4, G6, G11 or G14 (the everyday jobs), for any persona.
- No wrong output at all (any wrong output is a P0 bug).
- Average ease rating 4 or higher on the everyday jobs.
- Each stuck point is fixed or written into the beta tester guide before release.

## 7. Calibration with real people

The AI can't feel frustration like a person, so check it against humans:
- **Dad and 1–2 friends** do 5 of the same goal cards (G2, G4, G5, G6, G10) on the private-beta package. Write down
  where they hesitated: a phone video of the screen, or notes. Then compare with the AI's stuck points.
- **If people get stuck where the AI didn't**, make the personas less patient. **If the AI gets stuck where people
  didn't**, note it as an AI blind spot.
- **Repeat** after each big UI change.

## 8. When it runs

| When | What |
|---|---|
| Once now, on the current UI | All 20 goals with Dad and First-timer: a baseline before Codex finishes |
| Each time Codex marks a page "finished" in HANDOFF | The goals that use that page, all personas |
| Release candidate | All 20 goals × 5 personas, plus the human calibration |
| After the beta | Monthly, and after any big UI change |

## 9. Cost and effort

| Part | Effort | Usage |
|---|---|---|
| Driver + goal cards + test files | Claude, about 3 h | Low |
| One goal | 10–30 actions, one screenshot each | About 1–3% of a weekly Pro limit per 10 goals (estimate; measured after the first session) |
| Full release-candidate run (100 goal × persona runs) | 1–2 days elapsed | High: spread over days, or use the spare PC |

**First slice** (to prove it finds real problems before scaling up): the driver, then G1, G2, G4 and G6 as Dad and
First-timer. Then report what it found.

## 10. Who does what

- **Claude:** the driver, the goal cards, running sessions, turning findings into bugs and robot tasks, and keeping
  this plan current.
- **Codex:** fixes the UI confusions on its pages; marks pages "finished" so the right goals rerun.
- **Owner:** the dad and friends sessions (section 7), and decides which confusions are worth fixing before the beta.
