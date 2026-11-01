# PDFix beta: a guide for testers

**Draft, October 22, 2026.** Before the October 30 beta, update section 4 to match the new toolbar once it is built
(rules: [UI-RULES-2026-10-22.md](UI-RULES-2026-10-22.md)) and check every step on a real install. Give testers this guide
together with the install folder (model: `releases/PDFix-for-Dad-2026-10-22`). Written for people who are not technical:
keep it that way.

---

## 1. What PDFix is

PDFix is a free program for Windows for opening, marking up, signing and editing PDFs and Word documents. Everything
stays on your computer: nothing is uploaded, and there are no accounts or ads.

This is a **test version (beta)**. It can have mistakes. **Keep a copy of anything important** before you work on it.
PDFix never changes your original file unless you choose to save over it.

## 2. Install

1. Unzip the folder you were sent (right-click it, **Extract All**).
2. Open the folder and double-click **Install PDFix**.
3. If a blue box says **"Windows protected your PC"**, click **More info**, then **Run anyway**. This shows because PDFix
   is new and not signed yet.
4. Wait until the window says **Done**, then press any key.
5. Open PDFix from the **PDFix** icon on your desktop, or type PDFix in the Start menu.

An older PDFix already on the computer is fine; the new one installs next to it.

**To remove PDFix:** double-click **Uninstall PDFix** in the same folder. Your documents are kept.

## 3. Open a file

- On Home, click **Open a file**, or drag a file onto the PDFix window.
- PDFs open in **Quick edit**, where you can sign, fill in and mark up. The button at the top left shows the mode you are in:
  - **Quick edit**: sign, fill, highlight, add notes.
  - **View**: just look.
  - **Build**: change the PDF itself (text, pages, protect, measure, export).
- Word documents open in the document editor.

## 4. Things to try (about 20 minutes)

Do as many as you like. Each one: does it work the way you expected, without hunting for it?

1. Open a PDF. Highlight a few words. Add a note.
2. Sign a PDF: pick **Sign**, click where the signature goes.
3. Fill in a form, then **Save a copy** and open the copy again.
4. In **Build**, change a word on the page.
5. Move, rotate or delete a page (**Pages** tab).
6. Measure a distance on a drawing (**Measure** tab).
7. Protect a PDF with a password, then open it with the password.
8. Turn a PDF into a Word document (**Export** tab).
9. Write a short Word document, add a picture, save it, and open it again.
10. Close PDFix without saving, open it again: is your unsaved work offered back?

## 5. If something goes wrong

Please tell us, even if it seems small. Send to the person who gave you PDFix:

1. **What you were doing** ("I clicked Sign and then…").
2. **What you expected** and **what happened instead**.
3. **A picture of the screen**: press **Windows key + Shift + S** to take one, or take a photo with your phone.
4. If it was about one file and the file is not private, the file too. **Never send a private or client file.**

Things that are already known and being fixed:
- Some very large scanned drawings open as a **blank white page**.
- Windows warns that PDFix is not signed (step 2.3 above).

## 6. Privacy

- PDFix works offline. Your files never leave your computer unless you send them yourself.
- PDFix has no account, no ads and no tracking.
- Optional features that use the internet or an AI program only work if you turn them on yourself.

---

## For the team: before sending this guide

- [ ] Section 3 and 4 match the built app (mode button, tabs, tool names in [UI-LAYOUT-PLAN-2026-10-22.md](UI-LAYOUT-PLAN-2026-10-22.md)).
- [ ] Every step was done on a fresh install on the spare PC.
- [ ] The known-problems list is current ([KNOWN-ISSUES-2026-10-13.md](KNOWN-ISSUES-2026-10-13.md), SHARED-PLAN).
- [ ] The owner has decided how reports are sent (email, GitHub, or a form) and section 5 says so.
- [ ] The install folder's READ ME FIRST.txt says the same as section 2.
