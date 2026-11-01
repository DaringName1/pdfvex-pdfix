# PDFix: the owner's idea and how they want the UI

**For any AI or person who starts working on PDFix.** Read this before touching the UI, so the owner never has to explain
it again. Written October 22, 2026, after a long design session with the owner. Everything that is not UI (the app's purpose, decisions, privacy, releases, testing) is in
[OWNER-PROJECT-GUIDE.md](OWNER-PROJECT-GUIDE.md). The detailed rules are in
[UI-RULES-2026-10-22.md](UI-RULES-2026-10-22.md) (if anything disagrees, that list wins). The approved final mockup is in
[mockups/final-2026-10-22/](mockups/final-2026-10-22/README.md).

## 1. The idea in one line

**PDFix should feel calm and obvious, so anyone, from the owner's dad to a professional, can open a PDF or document and
get the job done without hunting for tools or setting anything up.**

In the owner's words: "if the UI sucks the app sucks." In October 2026 the Build screens (editing a PDF) were the weakest
part, and fixing them is the main UI goal.

## 2. Who it is for

- First the owner's dad, who works with large construction drawings, then the owner's friends, then people who find it on
  GitHub (the repository stays private until release; the owner decides that later).
- Beginners must manage without help. Professionals must still find every tool.
- Windows desktop app, private and offline. No forced AI, accounts, ads or paywalls.

## 3. How the owner works with you

- The owner does not read code. Write short, plain answers: what you did, what was and was not tested, what you need
  from them. Tables and short lists help.
- The owner types fast with spelling mistakes. Read for the meaning. If two readings are possible and the choice matters,
  ask one short question with options instead of guessing.
- "Keep going" means carry on down the list without asking.
- The owner often adds to a request while you work. Fold it in; don't drop the earlier part.
- Don't ask again about something they already answered. Their answers are in the rules list and in
  [UI-DIRECTION-2026-10-21.md](UI-DIRECTION-2026-10-21.md) (owner answers).
- When they say something is final, it is final. Stick to the rules; if you think a rule is wrong, say so and ask. Never
  quietly change it.
- Names of tabs, groups and tools are not fixed. Use a clearer name whenever there is one.

## 4. How to do UI work for this owner

1. **Research first.** Before designing, look up how the apps the owner likes do it, then reread the rules. Skipping this
   made the owner unhappy ("why did you not do your research on each of the app I said I like").
2. **Borrow how they work, never copy their look.** The owner's apps:
   - **Acrobat**: the main inspiration. Every tool in one All tools list; Find, Save, Print and Share top right; a slim
     panel bar on the right edge.
   - **Word**: the toolbar look; named groups.
   - **Fusion**: each group of tools has its name with ▾ **under** the group, and that drop-down lists all its tools.
   - **Bluebeam**: options that change with the tool; Set as Default for each tool.
   - **Documents (Google Docs, Word)**: click anywhere and type; drag and drop things. From the **Google Docs toolbar**: small icon
     buttons for things used all the time, and its slim row for short screens. The main toolbar stays Word/Fusion style.
3. **Keep the PDFix look**: its colours (green #3d7868, light green #eaf3ec), its logo (`public/brand/`), calm and simple.
   The owner likes how PDFix looks; the job is how it works.
4. **Show whole screens at real size**, with the real number of buttons, one screen per tab. A picture that crams many
   tabs together gets rejected ("too much on it to say it's good"). Clickable mockups help.
5. **Check by eye** on screenshots before calling a UI change done.

## 5. What the owner likes

- The Word document editor screen as it is today: every tool kept, plain buttons, the options panel on the side.
- The View screen and the Home screen as they are.
- Simple, modern, uncluttered, with an options panel beside the page.
- **Three modes for a PDF, behind one mode button** (like Fusion's DESIGN ▾):
  - **Quick edit**: sign, fill, mark up. **PDFs open here.**
  - **View**: just look.
  - **Build**: change the PDF itself.
  - Word documents have View and Build.
- **Toolbar like the Word editor**: plain buttons with no boxes, thin lines between groups, the picked tool in light green.
- **Tool groups like Fusion**: each tab has a few groups (usually 3, at most 4) of icon buttons with a short name under each.
  The group's name with ▾ sits under the group, and its drop-down lists **every** tool in the group, the rarely used ones
  last under "Less used".
- **Every tool stays.** Nothing is removed from the app or from the Word editor.
- **Tools work the moment you pick them**: use the mouse on the page, Enter finishes, Esc stops. Tools stay on until Esc.
  Nobody should have to set a tool up first ("without sitting there for 10 min each tool").
- **The same side panel for every tool**: name and ×; one line on how to use it; HOW (the ways of working); SETTINGS (2–3);
  More settings folded away. At the bottom: Keep this tool on, **Save as my default**, Reset, and one action button only
  when the tool needs it.
- **Each person can change any tool's default** (Save as my default / Reset; a Tool defaults list in Settings).
- **Working on the page like a document**: type anywhere (click with a text tool, double-click otherwise; a single click never
  makes a stray text box), drag things to move them, drop pictures and files onto
  the page.

## 6. What the owner does not want

- Big buttons in the tab row or toolbar; boxes around every button or group.
- Drop-downs piled at the far right, away from their tools; many drop-downs in one tab; a cluttered tab.
- Removing tools, or making people add tools back themselves. (An earlier design had "Add a tool" and "Add to toolbar"
  buttons; the owner rejected them: "all tools need to be visible from the drop-down, not added".)
- Tools that need setting up before they work, or that switch off after every use (Acrobat does this and people hate it).
- Pop-up windows with a second copy of the document; chains of dialogs; separate full-screen editors.
- Floating toolbars over the page; a dashboard of colourful cards; deep nested menus; toolbars that move around.
- Copying another app's look; restyling PDFix away from its look.

## 7. Mistakes already made (don't repeat them)

| Mistake | What the owner wanted |
|---|---|
| Designed before looking at the apps the owner likes | Research Acrobat, Word, Fusion, Bluebeam first |
| Put all drop-downs together at the right end of the toolbar | Each group's drop-down sits under that group, like Fusion |
| Read "a way to add a tool for the 1%" as "people add tools themselves" | Rarely used tools are already in the drop-downs, last, for the 1% who need them |
| Boxes around buttons and groups | Plain buttons like the Word editor |
| One picture with all nine tabs stacked | One full screen per tab |
| Skipped Acrobat in the research | Acrobat is the main inspiration |
| Three separate mode buttons | One mode button with a short list |

## 8. Where everything is

| What | Where |
|---|---|
| Every UI rule (wins over other docs) | [UI-RULES-2026-10-22.md](UI-RULES-2026-10-22.md) |
| Which tool goes in which tab and group | [UI-LAYOUT-PLAN-2026-10-22.md](UI-LAYOUT-PLAN-2026-10-22.md) |
| The approved mockup: pictures and clickable pages | [mockups/final-2026-10-22/](mockups/final-2026-10-22/README.md) |
| The owner's October 21 UI direction and answers | [UI-DIRECTION-2026-10-21.md](UI-DIRECTION-2026-10-21.md) |
| The work items for the UI | [SHARED-PLAN.md](SHARED-PLAN.md), items 2.14–2.34 |
| Messages between the AIs | [HANDOFF.md](HANDOFF.md) |
| How the project and the two AIs work | [START-HERE.md](START-HERE.md), [AGENT-WORKFLOW.md](AGENT-WORKFLOW.md) |

The owner's online version of the mockup (https://claude.ai/artifact/9Up2cNtgo9GvpmNpNoJqjZ, "Final" page) only opens in the
owner's account; the folder above has the same screens for everyone else.

## 9. Before you call any UI work done

- [ ] It follows [UI-RULES-2026-10-22.md](UI-RULES-2026-10-22.md); nothing on the "not OK" list.
- [ ] Every tool is still reachable; none was removed or hidden behind setup.
- [ ] The tool works at once with its default: mouse, Enter, Esc.
- [ ] Its side panel has the standard layout, with Save as my default.
- [ ] The screen matches the approved mockup in look (PDFix colours and logo, no boxes, groups with ▾ under them).
- [ ] You looked at real screenshots of it, at a normal and a small laptop size.
- [ ] You told the owner in plain words what changed and what was tested.
