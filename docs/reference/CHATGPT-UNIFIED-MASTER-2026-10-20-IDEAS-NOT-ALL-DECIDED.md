<!-- Label added by Claude, October 22, 2026, at the owner's request. Everything below the label is the owner's file, unchanged. -->

> [!IMPORTANT]
> **Background ideas, NOT all decided.** This is the owner's October 20, 2026 summary of their ChatGPT conversations
> about PDFix, plus copies of 22 older project files (from "Full original document archive" on). The owner added it on
> October 22 as more information for anybody or any AI. **Some of it is only ideas.**
>
> **What wins when it disagrees with this file** (newer, and decided with the owner):
> - The UI: [OWNER-UI-VISION.md](../OWNER-UI-VISION.md) and [UI-RULES-2026-10-22.md](../UI-RULES-2026-10-22.md). For example the
>   older Drawing / Documents / Pages "rooms" here are replaced by the tabs and modes in those files.
> - The whole app, decisions, privacy and releases: [OWNER-PROJECT-GUIDE.md](../OWNER-PROJECT-GUIDE.md).
> - The current plan and dates: [SHARED-PLAN.md](../SHARED-PLAN.md) (beta October 30, full v1 around mid-November; the
>   "October 31" target here is older). Save keeps the previous version in Version history (owner, October 14).
> - Status of any feature: the code and current tests, never the old reports copied below.
>
> **Useful background found only here:** where PDFix came from (an Acrobat install that also installed McAfee), the
> free-software and pricing principles (all core tools free; charge only for outside services that really cost money; the
> business model is not decided), the four workspaces in more detail (including the Adobe Express-style design ideas for
> Documents & Publishing), distribution ideas (website, Microsoft Store, winget), and the later "Fix" family of apps
> (PhotoFix and others). Treat these as ideas to ask the owner about, not as work to start.
>
> **Private:** section 8 includes the owner's personal money goals. Fine in the private repository; remove or ask the
> owner before the repository or this file is ever made public.

# PDFix — Unified Master Project Record

> **Consolidated:** October 20, 2026  
> **Sources:** 22 project documents from the supplied Google Drive export, plus the PDFix decisions and history discussed in ChatGPT.  
> **Purpose:** One portable master reference for scope, development, architecture, quality, business philosophy and future plans.

> [!WARNING]
> **Evidence note:** The archived project documents below report many compiled or coded features, historical test runs, and planned acceptance checks. These are **not** a fresh audit of the live repository. Never label a feature complete or release-ready merely because it appears in the plan, compiled, or passed a narrower test.

---

## Table of Contents

### Part 1: Unified Decisions & Strategic Overview

- [0. How to use this master](#0-how-to-use-this-master)
- [1. Product identity and origin](#1-product-identity-and-origin)
- [2. Locked product and pricing principles (latest conversations)](#2-locked-product-and-pricing-principles-latest-conversations)
- [3. Workspaces and interface direction](#3-workspaces-and-interface-direction)
- [4. Complete feature families — navigational summary](#4-complete-feature-families--navigational-summary)
- [5. Concrete technology and trust architecture from source plans](#5-concrete-technology-and-trust-architecture-from-source-plans)
- [6. Quality assurance and agent-based computer-use testing](#6-quality-assurance-and-agent-based-computer-use-testing)
- [7. Development reports and priorities — dates matter](#7-development-reports-and-priorities--dates-matter)
- [8. Distribution, user adoption and longer-term business](#8-distribution-user-adoption-and-longer-term-business)
- [9. Independent Fix ecosystem — separate from first launch](#9-independent-fix-ecosystem--separate-from-first-launch)
- [10. Open decisions / conflict-resolution queue](#10-open-decisions--conflict-resolution-queue)
- [11. Original project documents included below](#11-original-project-documents-included-below)

### Part 2: Full Original Document Archive (Verbatim)

1. [`ACROBAT-COMPETITIVE-PLAN.md`](#acrobat-competitive-plan-md) — *Acrobat replacement targets*
2. [`ARCHITECTURE.md`](#architecture-md) — *PDFix architecture, boundaries & dependencies*
3. [`BLUEBEAM-COMPATIBILITY-PLAN.md`](#bluebeam-compatibility-plan-md) — *Bluebeam/Revu compatibility & drawing review*
4. [`DECISIONS.md`](#decisions-md) — *Decisions and assumptions*
5. [`FEATURE-TRACKER.md`](#feature-tracker-md) — *Scope, progress & useful additions*
6. [`FINAL-IMPLEMENTATION-PLAN.md`](#final-implementation-plan-md) — *Final consolidated implementation plan (Oct 11)*
7. [`FORMAT-SUPPORT.md`](#format-support-md) — *Format support and verification*
8. [`FREE-ACROBAT-ADDITIONS-PLAN.md`](#free-acrobat-additions-plan-md) — *Free Acrobat additions (F47–F66)*
9. [`MASTER-GAP-TRACKER.md`](#master-gap-tracker-md) — *Saved master-list coverage (S00, M01–M10)*
10. [`PARALLEL-WORKSTREAMS.md`](#parallel-workstreams-md) — *Parallel coding workstreams*
11. [`PDFIX-ALL-PLANNED-FEATURES.md`](#pdfix-all-planned-features-md) — *Complete planned feature catalog*
12. [`PDFIX-COMPLETE-STATUS-2026-10-04.md`](#pdfix-complete-status-2026-10-04-md) — *Complete feature, debugging & testing status*
13. [`PDFIX-FUTURE-FEATURES.md`](#pdfix-future-features-md) — *Full future feature list*
14. [`PDFix-Missing-Features-Master-List.md`](#pdfix-missing-features-master-list-md) — *Missing features master gap list*
15. [`PHASE-LOG.md`](#phase-log-md) — *Phase log and checkpoint history*
16. [`PRODUCT-PLAN.md`](#product-plan-md) — *Product plan, principles & user problems*
17. [`READING-WRITING-PRINT-PLAN.md`](#reading-writing-print-plan-md) — *Reading, writing & virtual printing additions*
18. [`README.md`](#readme-md) — *Project README, run instructions & status*
19. [`REQUIREMENTS.md`](#requirements-md) — *Expanded requirements (R01–R50)*
20. [`ROADMAP.md`](#roadmap-md) — *Ordered roadmap & format evaluation*
21. [`THIRD-PARTY-NOTICES.md`](#third-party-notices-md) — *Dependency review checkpoint*
22. [`WORKSPACE-CONTENTS.md`](#workspace-contents-md) — *What is saved in the PDFix project folder*

---

## 0. How to use this master

The **Unified decisions and overview** is the current high-level direction. The **Full original document archive** preserves the detailed 22-document Google Drive export verbatim, including original IDs, code paths, dates, implementation notes, constraints and acceptance gates. If a later user decision conflicts with an older dated plan, keep both facts but follow the later approved decision; never silently erase the older record. Confirm actual implementation from code and current tests.

### Status vocabulary

| Status Vocabulary | Meaning & Gate Requirements |
| :--- | :--- |
| **LOCKED DIRECTION** | Explicit user-approved philosophy or product direction. |
| **ADOPTED SCOPE** | Planned feature, not proof it has shipped. |
| **HISTORICAL IMPLEMENTATION REPORT** | Work recorded in repository planning documents, not freshly verified in this consolidation. |
| **RELEASE-VERIFIED** | Must be supported by fresh builds, runtime acceptance, security checks, real sample files and output inspection; do not assume this status without evidence. |
| **EXPLORATORY** | Suggestion or future strategy, not an accepted implementation requirement. |

---

## 1. Product identity and origin

- **Name:** PDFix. Earlier mockup name **Forma** is historical only. Preserve the original supplied PDFix logo artwork as master; app icon variants may be separate derivatives. **Naming/trademark clearance remains unresolved** prior to a broad commercial launch.
- **Origin:** Frustration with Adobe Acrobat's complexity and unwanted software/bundling experiences, specifically an Adobe install that also installed McAfee. The aim is to make a trustworthy, quick, easy local alternative with a much wider document workflow over time.
- **Primary promise:** Open a document, discover the correct tool quickly, accomplish the task, and get a correct independently reviewable output without forced account creation, advertising, upgrade nags or unsolicited cloud access.

---

## 2. Locked product and pricing principles (latest conversations)

1. **All core PDF tools remain free:** reading, editing, creating, converting, OCR, signing, forms, page management, security and other locally executed functions.
2. **Broader free-software principle:** extends to project-created software, modules, local workflows, updates, community contributions and direct cost-free integrations. Do not reintroduce older feature-unlock/subscription proposals as requirements.
3. **Charge only for optional external resources/services that actually cost money to supply:** with transparent costs and without coercive dependencies. The precise sustainable business revenue model is **not resolved**; donations, sponsorships, professional assistance and other non-paywall income were discussed, not locked into a forecast.
4. **Local-first and privacy-first:** files remain usable offline. AI is optional and provider-selectable, including local models, user's own API credentials and self-hosted providers.
5. **Original preservation:** no silent overwrite. Save reviewed outputs as explicit new copies, protect against filename/alias collisions, and validate outputs independently.
6. **Honest capability labels per file format:** open, preview, edit and convert are not interchangeable promises. No unsupported claim of perfect fidelity or Acrobat parity.
7. **Interop and user control:** allow external providers and competing software, explicit file permissions, clear exports/deletion and no lock-in.
8. **Clean, document-centered UI:** progressively reveal contextual tools, keep beginners comfortable, retain advanced capability for specialists. No forced AI.
9. **Trustworthiness:** combine source-level tests, independent output verification, real computer-use/UI workflow tests, human beta testing, threat assessment and clean-machine installs.
10. **Release focus:** functional everyday Windows PDFix comes first; extensive specialist features are adopted long-term scope, not a claim that v1 includes everything.

---

## 3. Workspaces and interface direction

**Latest approved structure:** one coherent PDFix application with four connected specialist workspaces sharing a common core rather than unrelated mini-apps. The core PDF reader/editor is the product foundation, not a separate mandatory fifth workspace.

| Workspace | Priority | Product Intent & Scope |
| :--- | :--- | :--- |
| **Documents & Publishing** | ⭐ Highest | Highest-priority workspace expansion: PDFs, Word/Google Docs-like writing, layouts, tables, templates, reports, printables, simple presentations, flyers/posters/brochures, typography, basic graphics and practical local Adobe Express-style design tools. |
| **Science & Data** | High | Structured data, CSV/spreadsheets, numerical work, formulas, charts, scientific graphing, reports and figures. |
| **Engineering** | High | Technical drawings, sheets, calibrated distance/area/count/angle tools, revisions, layers, comments, overlays, takeoffs and drawings-focused workflows; full CAD authoring is not an immediate commitment. |
| **Research** | High | Document collections, evidence and citations, page-bound notes, annotations, research reports, bibliographies and optional cited AI assistance. |

**Interface principles:** familiar File/Home/Insert/Layout/Review document toolbar where useful; uncluttered canvas, strong viewing mode, collapsible/resizable sidebars, searchable tools, contextual property panels, keyboard navigation and accessibility, simple defaults and progressively available specialist controls. Actual user tests may motivate revisions.

> [!NOTE]
> **Adobe Express insight (October 20):** bring **locally runnable lightweight design/publishing functions** into Documents & Publishing rather than making a fifth Express clone. Reuse common design primitives across the workspaces. Hosted publishing, online collaborative services and generative hosted AI require separate consent/cost evaluation. Do not assume a complete video editor or full Adobe suite belongs inside PDFix.

---

## 4. Complete feature families — navigational summary

The 22 source plans below retain the exhaustive R, M, F, A, B, G and D identifiers and their exact specifications. This list organizes them without double-counting overlapping targets:

1. **Viewing and navigation:** PDF.js pages, zoom, page modes, smooth large-document scroll, thumbnails, outlines/destinations, bookmarks, links, printed sheet labels, search, selection, reader positions, layers, file details, accessibility and read-aloud.
2. **Editing and page organization:** original PDF text/font/object edits where technically supported, notes and markups, undo/redo/recovery, merge/split/reorder/replace/crop/rotate/resize/compare, stamps, headers/footers, page numbers/Bates, watermarks, geometry and metadata.
3. **Creation and conversion:** blank/office/image/scan/web/content to PDF, DOCX/RTF/TXT/Markdown, spreadsheets/data, TIFF/HEIC/HEIF and Apple imports when adapters support them, reverse export, rendering fidelity and print-to-PDF.
4. **OCR, scans and text:** bundled local OCR, reviewed searchable layers, scan cleanup, language expansion, handwriting research, text extraction and translation.
5. **Forms and signatures:** AcroForms, field validation/calculations, FDF/XFDF, visual signatures, certificate signing/trust, long-term evidence, routed requests and later XFA/form logic/2D barcode fields under reviewed containment.
6. **Security and standards:** protection/removal for authorized users, image-redaction with forensic validation, malware-resistant file opening, no document-origin scripting, signature integrity, PDF/A, PDF/X, PDF/E, PDF/UA/preflight, output review and explicit unsupported states.
7. **Engineering/Bluebeam:** existing markup inspection and preservation, replies/states, drawing markups, sheets/revisions, toolsets, overlays, scale measurements/takeoffs, quantities, reports and carefully evaluated Bluebeam-specific interchange.
8. **Review and workflows:** collaborative/shared review (later managed service), versions, approvals, batch jobs, saved sequences, watched/scoped folders, right-click/Edge/Office handoffs, audit-friendly exports and job recovery.
9. **Specialized later scope:** portfolios, attached media, geospatial and 3D PDF, policy-managed enterprise services, prepress color separations, certified standards, browser review/mobile reflow and additional platforms.
10. **Integrations:** user-chosen providers, local and hosted AI, cloud/file services, Win11, Office and browsers, scoped file grants and transparent permissions.

---

## 5. Concrete technology and trust architecture from source plans

**Architecture as documented:** Electron Windows shell, Vite + vanilla JavaScript renderer; PDF.js, pdf-lib, qpdf, Tiptap/ProseMirror, mammoth, docx, DOMPurify, Tesseract.js; Node and Playwright tests, along with reviewed native helper/broker paths and Windows AppContainer/Job Object isolation for selected operations. Specific versions, dependencies, bounds and binaries are in `ARCHITECTURE.md` in the archive; they were historically documented, not independently checked against the live checkout here.

**Important boundaries:** sandboxed/context-isolated renderer; narrow validated IPC; no arbitrary paths or executable commands exposed to documents/agents; bounded file/size/time/memory operations; secure native broker for subprocesses when applicable; exact source-fingerprint binding; cancellation; preview/reopen/verification of output; exclusive creation of a new saved copy; private local recovery; no document-triggered network access. Worker processes alone are not a general-purpose OS security sandbox.

> [!CAUTION]
> **Licensing caveat:** consider compatibility and redistribution of all components, binaries and model data; avoid casually introducing AGPL/commercial libraries without a separate decision, and prepare full dependency notices/SBOM.

---

## 6. Quality assurance and agent-based computer-use testing

The desired verification system has four complementary layers:

1. **Static/unit/integration tests:** for algorithms, source handling, APIs, workers, imports, UI states and permission boundaries.
2. **AI computer-use and automated GUI testing:** that operates the running app like a person across tools, workflows, menus, system dialogs, errors and state changes.
3. **Independent output verification:** that reopens source and exported artifacts, compares semantics/geometry/raster/data, detects altered originals and checks interoperability in external viewers where relevant.
4. **Human acceptance/beta testing:** including printing, accessibility, pen/stylus, unexpected workflows, clean Windows machines and real-world file corpora.

All tool pairs and longer permutations grow combinatorially; use risk-based interaction coverage, state-machine tests, property-based/fuzz tests, common user journeys and representative randomized sequences instead of falsely claiming exhaustive combinations.

> [!IMPORTANT]
> **Release gate:** don't claim zero defects or full parity from a successful compile, generated UI screenshot, simple PDF reopen or unit-test count. File corruption, failed redaction/security, originals overwritten, severe data loss, malware paths and unsafe persistence are **blockers**. Record known limitations honestly.

---

## 7. Development reports and priorities — dates matter

The archive contains substantial September–October 2026 coding checkpoints; compiled modules and individual subsets are **not full feature acceptance**. Prior chat recaps also mentioned historical 293 passing tests, later 414/414 automated checks and 432/436 robot sessions; these figures have not been revalidated in this combined document.

The October 11 source implementation order was:

> **Workspaces / clear UI → PDF viewing → PDF editing → document creation / toolbar → Bluebeam comments / review → remaining adopted scope → digital-pen handwriting → complete UI / function testing and release acceptance**

The later October 15–20 chats reinforce prioritizing Documents & Publishing and functional end-to-end QA. A historical October 31 Windows v1 goal should be treated as a target, not guaranteed readiness.

**Status discipline:** maintain four separate fields for each capability: `adopted/planned`, `implemented in code`, `test evidence`, and `release accepted`. Refer to the detailed F/R/M/B/A master ledger and current repository tests before checking anything off.

---

## 8. Distribution, user adoption and longer-term business

**Release sequencing:** GitHub source and signed/verified release assets as applicable; official site, Windows installer, later Microsoft Store and package managers such as winget/Chocolatey/Scoop; private beta then public beta and stable Windows v1; later evaluate macOS/Linux/browser/mobile separately. Distribution fees, certificate requirements and store policies require verification before commitment.

**Competitive target:** provide a viable alternative to Adobe Acrobat, Foxit, Nitro, PDF-XChange, PDFelement and PDFgear, while selectively matching document-review workflows used by Bluebeam. Competitors' current capabilities and legal claims require current independent checks before marketing comparisons.

**Product advantage:** not merely a long feature list; complete trustworthy workflows:

> **open/create → edit/review/compare → convert/approve/sign → export/reopen/archive**

…with less complexity, local control and reasonable external compatibility.

**Long-term aspirations from chats (NOT forecasts):** approximately $420,000 initial personal funding goal ($300,000 over five years at $60,000/year plus $120,000 flight training), eventual business performance around $10 million/year, and substantial competitive pressure on Adobe (the user mentioned a hoped-for $1 billion revenue impact). Optional future rental property was contingent on approximately $100,000 annual sustained business profit for 1–2 years; not an immediate PDFix task. An even earlier small fundraising idea was approximately $400 toward AI development subscriptions. These ambitions require a reconciled funding/profit model given the strict free-software philosophy.

---

## 9. Independent Fix ecosystem — separate from first launch

PhotoFix was discussed as the most concrete sister app, potentially alongside later AnimationFix, VideoFix or other separate applications. Each should install and work separately and optionally interoperate through shared components or connections. PDFix is the initial priority; the wider ecosystem is a ten-year possibility, not core PDFix v1 scope. Respect external providers and existing user subscriptions.

---

## 10. Open decisions / conflict-resolution queue

- [ ] Verify public use of the **PDFix** name/trademark and public-domain availability of any required assets.
- [ ] Finalize open-source **license**, dependency obligations, contributor governance and release signing.
- [ ] Create an evidence-based v1 shipping scope separated from the entire adopted long-term catalog.
- [ ] Verify actual repository status, performance, security containment, codec licenses and complete real-file fidelity rather than trusting historical coded/compiled status.
- [ ] Define which formats are read/preview/edit/round-trip supported and publish real limitations.
- [ ] Define service-consent/privacy/cost boundaries and an economically credible business model **without paywalling software**.
- [ ] Keep the unified four-workspace direction current; older source documents may reference earlier Drawing/Document/Pages rooms or different staging.
- [ ] Specialist ambitions (XFA, high-assurance signatures, managed policies, advanced prepress, 3D/GIS/media, browser sharing) are long-term **adopted** targets subject to separate threat, standards, licensing and service acceptance.

---

## 11. Original project documents included below

All 22 documents are reproduced in their original source order and text to prevent loss of technical detail. Their historical titles and references are preserved, including relative links whose targets may not be embedded in this single export.

| # | Document | Scope & Focus |
| :---: | :--- | :--- |
| 1 | [`ACROBAT-COMPETITIVE-PLAN.md`](#acrobat-competitive-plan-md) | Acrobat replacement targets |
| 2 | [`ARCHITECTURE.md`](#architecture-md) | PDFix architecture, boundaries & dependencies |
| 3 | [`BLUEBEAM-COMPATIBILITY-PLAN.md`](#bluebeam-compatibility-plan-md) | Bluebeam/Revu compatibility & drawing review |
| 4 | [`DECISIONS.md`](#decisions-md) | Decisions and assumptions |
| 5 | [`FEATURE-TRACKER.md`](#feature-tracker-md) | Scope, progress & useful additions |
| 6 | [`FINAL-IMPLEMENTATION-PLAN.md`](#final-implementation-plan-md) | Final consolidated implementation plan (Oct 11) |
| 7 | [`FORMAT-SUPPORT.md`](#format-support-md) | Format support and verification |
| 8 | [`FREE-ACROBAT-ADDITIONS-PLAN.md`](#free-acrobat-additions-plan-md) | Free Acrobat additions (F47–F66) |
| 9 | [`MASTER-GAP-TRACKER.md`](#master-gap-tracker-md) | Saved master-list coverage (S00, M01–M10) |
| 10 | [`PARALLEL-WORKSTREAMS.md`](#parallel-workstreams-md) | Parallel coding workstreams |
| 11 | [`PDFIX-ALL-PLANNED-FEATURES.md`](#pdfix-all-planned-features-md) | Complete planned feature catalog |
| 12 | [`PDFIX-COMPLETE-STATUS-2026-10-04.md`](#pdfix-complete-status-2026-10-04-md) | Complete feature, debugging & testing status |
| 13 | [`PDFIX-FUTURE-FEATURES.md`](#pdfix-future-features-md) | Full future feature list |
| 14 | [`PDFix-Missing-Features-Master-List.md`](#pdfix-missing-features-master-list-md) | Missing features master gap list |
| 15 | [`PHASE-LOG.md`](#phase-log-md) | Phase log and checkpoint history |
| 16 | [`PRODUCT-PLAN.md`](#product-plan-md) | Product plan, principles & user problems |
| 17 | [`READING-WRITING-PRINT-PLAN.md`](#reading-writing-print-plan-md) | Reading, writing & virtual printing additions |
| 18 | [`README.md`](#readme-md) | Project README, run instructions & status |
| 19 | [`REQUIREMENTS.md`](#requirements-md) | Expanded requirements (R01–R50) |
| 20 | [`ROADMAP.md`](#roadmap-md) | Ordered roadmap & format evaluation |
| 21 | [`THIRD-PARTY-NOTICES.md`](#third-party-notices-md) | Dependency review checkpoint |
| 22 | [`WORKSPACE-CONTENTS.md`](#workspace-contents-md) | What is saved in the PDFix project folder |

---

# Full original document archive (verbatim)

> [!NOTE]
> All 22 documents below preserve the detailed Google Drive export verbatim, including original IDs, code paths, dates, implementation notes, constraints and acceptance gates. Generated: 2026-10-20 22:03.


---

<a id="acrobat-competitive-plan-md"></a>
## 📄 `ACROBAT-COMPETITIVE-PLAN.md`

---

### PDFix — Acrobat replacement targets


Adopted October 7, 2026, at the user's request. Goal: make PDFix a dependable, easier alternative for everyday documents and professional drawing review, then expand to specialist workflows. Replacement readiness requires working file compatibility, useful editing, reliable comments, responsive navigation and trustworthy saved outputs.

This plan captures all ten categories from the supplied comparison. The original text is preserved in [the intake record](docs/ACROBAT-COMPARISON-USER-INPUT-2026-10-07.txt). It is user-provided planning input, not a verified description of current Adobe products, licensing, standards support or legal outcomes. Verify such claims against current primary documentation when choosing an engine or publishing a comparison.

**Status:** all A01–A25 targets remain adopted work. The [October 8 coding checkpoint](docs/INTEGRATED-FEATURES-CODING-2026-10-08.md) records A01/A11/A17 subsets; the [October 9 checkpoint](docs/INTEGRATED-FEATURES-CODING-2026-10-09.md) adds integrated, compiled subsets of A01, A02, A11, A19 and desktop readable-text work toward A24. Their broader requirements and runtime acceptance remain open; the unchecked targets below are not completion claims. Existing related code has the narrower status in the current feature inventory. A IDs identify work packages and overlap R/M/B/F targets; their counts must not be added as independent features. F01–F42 keep their existing IDs.

#### Order and delivery gates

1. **Core replacement priorities:** finish large-file reliability, usable selection, editing/conversion fidelity, drawing comments and preservation, recovery, printing and containment. Prioritize A01, A11–A12 and A25 alongside the existing reader, editor, Bluebeam and F42 work. A large file opening once is insufficient evidence of smooth navigation or safe output.
2. **Professional document expansion:** certificate signing/trust and durable evidence (A02–A04), preflight/color/standards (A05–A10), broader forms (A13–A16), portfolios (A17) and browser review (A22). Select engines/providers and define supported subsets before product capability claims.
3. **Specialist and platform expansion:** contained active-form compatibility (A14), 3D/GIS/media (A18–A20), managed rights (A21), additional platforms and phone reflow (A23–A24). These need separate decoder, service, licensing, privacy, security and real-file acceptance.

This is the expanded full plan, not a promise that every specialist integration ships in the first beta. Each target gets its own implementation and acceptance record. No paid service, public sharing or distribution is activated by adopting this plan. Coding continues under the user's current source-first workflow; runtime/debugging work is scheduled separately.

#### 1. Certificate signatures and signature services

- [ ] **A01 — Certificate validation and trust.** Expand F19/M01.04 to cryptographic integrity, signer identity, certificate chain, timestamp and revocation results. Evaluate authorized AATL/EUTL or other appropriate trust sources, update provenance and offline behavior. Show valid/invalid/unverifiable separately from trusted/untrusted/unknown; never infer validity from a visible mark.
- [ ] **A02 — Certificate signing and certification.** Add user-selected certificate signing, hardware-token/SmartCard and Windows certificate-store integration where supported. Review certification permissions, multiple signatures, incremental updates and edit-invalidation warnings. Private keys remain with the authorized key provider; verify outputs independently. This moves certified signing into later adopted scope beyond the original first-release exclusion.
- [ ] **A03 — Durable signature evidence.** Evaluate timestamp authorities and supported long-term validation profiles, certificate/revocation evidence retention and verification after expiry or offline use. Define exactly what evidence is retained and what cannot be established. Legal eligibility depends on the chosen workflow and jurisdiction and must be reviewed before related product claims.
- [ ] **A04 — Routed signature requests and audit history.** Expand F39 to templates, ordered/parallel recipients, recipient tracking, reminders, supported identity challenges such as email/SMS OTP, bulk requests and cancellation. Specify tamper-evident event records, document identity and downloadable evidence. Identify the provider, costs, authentication, consent, retention and data destination before integration. Visual signing, local certificate signing and remote requests remain separate workflows. Payment pipelines are not added by this intake.

#### 2. Commercial printing, prepress and color

- [ ] **A05 — Preflight inspection and reviewed fixes.** Evaluate a contained commercial-grade engine for syntax, fonts, image resolution, transparency, page boxes, output intent and printer-specific rules. Provide versioned profiles, item/page locations, detailed reports, suggested fixes and source/output review. Report unsupported checks and preserve originals. (F29, F40; M10.01.)
- [ ] **A06 — Color-profile conversion.** Review ICC profiles, device-independent color, RGB/CMYK/spot-color handling and explicit output intents. Preview changes, disclose color loss, preserve supported objects and validate conversions against a print corpus. Engine/profile licensing and distribution are prerequisites. (F40; expands M10.02's first-release boundary.)
- [ ] **A07 — Separations, overprint and trapping.** Add supported CMYK and spot-color plate previews, overprint simulation, ink coverage and reviewed dot-gain/trapping controls or profiles. State monitor/proof limitations and prove output with representative commercial-print files and physical printing. Advanced print-production work is later adopted scope.
- [ ] **A08 — PDF/X validation and output.** Expand F40 to evaluated PDF/X editions, including the supplied X-1a, X-3, X-4 and X-6 targets. Offer only editions actually supported by the reviewed engine/validator. Report standard/version, passed and failed rules, repair choices and output verification; appearance or extension is insufficient proof.

#### 3. Archival and engineering standards

- [ ] **A09 — PDF/A conversion and validation.** Expand F40/M10.01 to selected PDF/A profiles, including the supplied A-1b, A-2b and A-3u targets. Review font embedding, ICC/output intents, metadata, attachments, transparency and unsupported content; explain changes and validate each saved output independently. Arbitrary input conversion is not guaranteed.
- [ ] **A10 — PDF/E feasibility and support.** Evaluate engineering-document standard editions and their decoder/validator requirements. Define supported engineering content, conversion limits, reports and real-file evidence before advertising compliance. This records the PDF/E heading in the intake even though its detailed comparison primarily describes PDF/A.

#### 4. Full accessibility remediation

- [ ] **A11 — Tag-tree and reading-order workspace.** Expand F30/M08.01–02 to direct tag-tree editing, logical reading-order review, headings, lists, links, artifacts, alt text, form labels and table header/cell associations. Support bulk artifact operations, keyboard access, undo/recovery, source-page navigation and semantic output review. OCR text is separate from document accessibility.
- [ ] **A12 — Accessibility audits and evidence.** Expand F29–F30 to detailed PDF/UA, relevant WCAG and Section 508 requirement mappings, rule versions, evidence locations and repair guidance. Distinguish automated findings from required manual checks. Validate with assistive technology and representative users before claiming accessible output; a checker pass alone is insufficient.

#### 5. Advanced forms and active content compatibility

- [ ] **A13 — XFA compatibility.** Evaluate static and dynamic XFA layouts, reflow, data binding, field appearances, input/export and print fidelity with government and other representative forms. Detect unsupported content and explain usable alternatives. Select a licensed, contained engine and verify limits; current AcroForm support is not XFA support. (F18; later expansion of M04.)
- [ ] **A14 — Isolated form-logic compatibility.** Inventory form calculations, validation, formatting and button actions. Prefer narrowly supported declarative calculations; evaluate a dedicated contained compatibility runtime only for required features. Document-origin code must have no ambient file, process or network access, with resource bounds and effective isolation proof. General PDF script/macro execution remains disabled in current and first-release readers. Later compatibility is explicitly gated on a separate reviewed design and does not relax S00 or R08.
- [ ] **A15 — 2D barcode form fields.** Evaluate supported symbologies, live encoding of selected field values, field creation/filling, capacity/error handling and print/scan round trips. Show what data is encoded and review decoder/encoder licensing. This moves barcode fields into later adopted scope.
- [ ] **A16 — Reviewed form submissions.** Expand F38/M04.03 to explicit endpoint submissions and authenticated approved database/service connectors. Show the exact destination and payload, request consent, protect credentials, record success/failure and support offline export. Document actions cannot silently contact a server or database. (F38; R03/R27.)

#### 6. Portfolios and document containers

- [ ] **A17 — PDF portfolio navigation and creation.** Add an inert inventory, searchable grid/list navigation, supported previews, extraction and creation/reordering of selected contents. Preserve names/metadata where supported and report unsupported layouts. Apply attachment size/count/decompression limits, traversal protection and contained decoders. Embedded Office, CAD or media content needs its own supported capability; never auto-run extracted files. Interactive 3D portfolio presentation is a separate renderer evaluation within this target. (M10.02; S00/R08.)

#### 7. 3D, geospatial and embedded media

- [ ] **A18 — Interactive 3D PDF.** Evaluate U3D/PRC decoding, rotation, assembly visibility, cross-sections and calibrated geometry measurements with explicit units. Review licensing, GPU/resource budgets and containment. Embedded model viewing and measuring do not imply CAD authoring. (M10.02; separate from M03.12.)
- [ ] **A19 — Geospatial PDF.** Inspect coordinate reference systems, georegistration, latitude/longitude and map measurements. Show unit/projection/precision and calibration limits, support layers where meaningful and verify against known reference maps. Local PDF measurements do not establish accurate GIS coordinates. (M10.02.)
- [ ] **A20 — Embedded multimedia.** Evaluate user-initiated audio/video playback with inert inventory, codec support, licensing, bounded decode and cancellation. No automatic playback, remote retrieval or script/plugin execution. Rich-media actions require separately reviewed supported behavior. (M10.02; S00.)

#### 8. Managed enterprise document access

- [ ] **A21 — Policy-managed access.** Evaluate an authenticated managed-document service with centrally administered access, expiry, revocation, print permissions, audit history and explicit offline policy. Report that revocation controls supported clients and cannot recall screenshots or unrestricted copies. Show service destination, identity and retention. Adobe/AEM policy-file interoperability requires supported API/licensing evaluation; never bypass another system's DRM. Password encryption is a separate existing feature. (M10.02; service/security evaluation.)

#### 9. Browser, desktop and mobile reach

- [ ] **A22 — Browser shared reviews.** Expand F36 to authenticated or explicitly permissioned link review with no desktop install, drawing/page locations, comment threads, sync/conflict handling, invitations, expiry/revocation and exports. Review browser support for Mac, Chromebook, phones and PCs; show upload destination and permissions before sharing. Keep anonymous/public links deliberate, scoped and revocable. (F36; R22/R27; B01–B05.)
- [ ] **A23 — Additional platform clients.** Add feasibility and delivery plans for Mac and iOS/Android reading/review clients, plus a Chromebook/browser path. Preserve source/comment identity, permissions, sync/recovery and format boundaries; retain Windows-first development priority. Phone/tablet gestures, accessibility, offline support, secure storage and distribution need their own acceptance.
- [ ] **A24 — Phone-friendly reading and reflow.** Add evaluated text reflow, responsive layout, adjustable type, navigation and accessible reading for mobile documents. Preserve page/source references and flag uncertain order, tables, columns and drawings. Let users return to exact page artwork; do not silently turn reflowed content into an edited original. OCR/reflow fidelity needs a real-file corpus.

#### 10. Wild and damaged PDFs

- [ ] **A25 — Robust opening, repair and honest failure.** Make F42's corpus explicit for legacy/PostScript-derived, malformed, truncated, mixed-generator, unusual-font/image, encrypted, giant and adversarial PDFs. Add bounded cancellable diagnostics, useful error causes and reviewed repair-to-copy where supported. Measure opening/navigation/selection/memory responsiveness across hardware profiles and verify repairs preserve supported content. Never silently call a partially rendered document complete or raise limits without resource evidence. (R06–R09/R29; F04/F29/F42; S00.)

#### Acceptance and scope reconciliation

Every A target needs a selected engine/service where applicable, a declared supported subset, implementation evidence, original-preservation and cancellation/resource behavior, and current runtime/corpus/security/output acceptance before being labeled done. Compliance and signature claims require reviewed independent evidence. This intake adds no implementation, benchmarks, test passes or release-date promises.

Previously excluded specialist capabilities are now **adopted later targets** where A02/A04/A06–A07/A13–A15/A17–A21/A23–A24 cover them. Their historical initial-release exclusions remain visible to explain staging, rather than being interpreted as permanent rejection. Unrestricted agents, DRM bypass, arbitrary uncontained macros, payment pipelines, a complete office suite and unrelated presentation/marketing generation remain outside this addition.

Canonical scope links: [product plan](PRODUCT-PLAN.md), [complete planned catalog](PDFIX-ALL-PLANNED-FEATURES.md), [future list](PDFIX-FUTURE-FEATURES.md), [requirements](REQUIREMENTS.md), [roadmap](ROADMAP.md) and [current status](PDFIX-COMPLETE-STATUS-2026-10-04.md).


#### 📅 October 9 preflight, audit and form calculation update

[Integrated coding and compilation record](docs/PREFLIGHT-FORMS-CODING-2026-10-09.md) adds practical print profiles, structural accessibility findings, source-bound JSON evidence exports and reviewed user-authored form calculations. 288 modules compiled. These are partial implementations toward A05/A12/A14 and overlapping F18/F29/F30/F40. Broader specialist engines, standards mappings, source-logic compatibility and runtime acceptance remain open. The full adopted scope is unchanged.


#### 📅 October 9 repair, forms and selection coding update

[Integrated coding and compilation record](docs/REPAIR-FORMS-SELECTION-CODING-2026-10-09.md) adds contained existing form filling/visual placements with native sealed saving, bounded supported qpdf repair-to-copy and rectangle-selection pointer/page lifetime plus row/column preview controls. 292 modules compiled; current runtime acceptance remains pending. Repair requires a complete independently inspected baseline and preserves supported content; broader damaged-file recovery and complex selection layouts remain open. No broad feature is newly accepted, and the full adopted scope remains unchanged.


#### 📅 October 9 form order, FDF and editable workflows

[Integrated coding and compilation record](docs/FORMS-FDF-WORKFLOWS-CODING-2026-10-09.md) adds reviewed supported-page form keyboard order, native FDF comment import/export, editable native page-reorder/Bates sequences and broker-envelope alignment with existing bounded source/request contracts. 301 modules compiled. Broader form/appearance/interchange coverage, combine/OCR/print workflow steps, durable recovery and current runtime/security/performance acceptance remain. No broad row is newly accepted; the full adopted scope is unchanged.


#### 📅 October 9 native combination, TIFF and workflow library

[Integrated coding and compilation record](docs/COMBINE-TIFF-WORKFLOWS-CODING-2026-10-09.md) adds standalone native full-source PDF combination with supported comments/forms/bookmarks/destinations, supported classic multipage TIFF decoding and reviewed page import, and named reorder/Bates definitions with exact-source editable draft recovery. 306 modules compiled. Partial/duplicate PDF selection, wider graph and TIFF modes, combine/OCR/print runner stages, durable in-flight resume and runtime/security/fidelity acceptance remain open. Restoring settings never restores output approval. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 9 Bates, combined workflows, TIFF fax and tag semantics

[Integrated coding and compilation record](docs/BATES-COMBINE-TIFF-TAGS-CODING-2026-10-09.md) adds continuous multi-file Bates numbering with reviewed saves/identifier reports, native combine → editable reorder/Bates continuations, real CCITT fax TIFF decoding and reviewed existing table/list/printable-form tag semantics. 308 modules compiled. Persistent queues/global identifier registries, other workflow stages, broader PDF/TIFF/tree compatibility and runtime/security/fidelity/standards acceptance remain. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 9 user additions — free printing and reading/writing tools

Adopt F43–F46 / R42–R45: virtual PDF printer, local read aloud, expanded word count and spell-checking. R46 requires PDFix to stay free, with no required paid APIs/subscriptions, feature unlocks or purchase/upgrade links. These features use free local components; Whisper is not a speech-synthesis engine. The existing basic editor word counter is only a starting point. See [detailed scope and dependencies](READING-WRITING-PRINT-PLAN.md). No new code, tests, installs or paid integrations are claimed. Prior adopted scope remains, with provider/engine choices subject to the free-app requirement.


#### 📅 October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.

#### 📅 October 11 — additional free local replacement tools

The user adopted 20 further targets, F47–F66 / R47, and prioritized Workspaces, PDF viewing and PDF editing. [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md) preserves the complete ordered list, including form automation, Windows/Office/Edge handoffs, synchronized and explicitly granted folders, EML/clipboard creation, offline translation, bookmark/naming automation, mail merge/signature handoff, fingerprint checks and print geometry/stroke tools. R48 defines scoped folder access. These overlap existing A/R/M/F targets and are not 20 additional independent completions.

R46 applies to every choice: PDFix remains free without paid unlocks or payment links. Existing third-party accounts/software remain external prerequisites where applicable; no paid service is silently introduced. Full Acrobat replacement remains an adopted objective, not a verified current parity claim. No code or test result is added by this intake.



#### 📅 October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.



---


---

<a id="architecture-md"></a>
## 📄 `ARCHITECTURE.md`

---

### PDFix architecture


#### Choice

Electron + a small vanilla JavaScript renderer built with Vite. The workspace was empty: no structure or existing work to replace. Electron enables native Windows dialogs, printing and future DPAPI-backed credentials without a Rust/.NET toolchain. Its larger distribution and Chromium patch cadence are accepted costs. A Tauri shell remains possible behind the same document bridge; switching now offers little benefit given the installed Node toolchain.

#### Processes and files

- `desktop/main.cjs`: window lifecycle, custom `pdfix://app` protocol, validated IPC, native dialogs and local workspace metadata.
- `desktop/recovery-store.cjs`: serialized, atomic fingerprint-bound drafts and bounded version history; preview/restore checkpoints; validated cleanup boundaries.
- `src/version-history.js`, `privacy-controls.js`: revision preview/restore and separate recent/recovery cleanup.
- `src/layout-controls.js`: sidebar/focus preferences and native fullscreen bridge; non-sensitive boolean view state only.
- `desktop/preload.cjs`: narrow contextBridge; no generic execute/read/write IPC exposed.
- `desktop/compression-engine.cjs`, `compression-worker.cjs`, `compression-inspect.cjs`: fixed bundled qpdf process, worker preflight/preservation checks, cancellation and owned temporary-job cleanup.
- `src/compression-workspace.js`: measured output sizes, actual PDF preview, source/output quality comparison and reviewed protected saving.
- `desktop/file-store.cjs`: opaque handles for opened files, bounded reads, stale-file errors, safe exclusive new-copy writes and serialized transactional recent/favorite/reading persistence. A failed metadata write keeps prior state and the currently opened source handle usable; metadata parsing/writing is bounded to 8 MiB. Source fingerprints are computed once per granted snapshot.
- `src/app.js`, `src/style.css`: accessible interface and capability-driven routing.
- `src/pdf-reader.js`: PDF.js worker, rendering/text extraction, bounded canvases, thumbnails, search and printing preparation.
- `src/pdf-operations.js`, `pdf-job.worker.js`, `pdf-jobs.js`: bounded, cancellable page transforms in a Web Worker, added after Phase 2 passed.
- `src/page-workspace.js`: ordered page plan, output preview and independent PDF.js verification before exclusive saving.
- `src/document-editor.js`: Tiptap/ProseMirror page editor, source textarea for code/data, formatting, local recovery, explicit export.
- `src/document.worker.js`, `document-codec.js`: bounded DOCX archive preflight/import and generated DOCX export with 60-second worker lifetime. Sanitization/schema filtering occurs before imported/pasted HTML enters the DOM.
- `src/pdf-selection.js`: geometry-based row order for bounded rectangle selection and readable text.
- `src/ocr-workspace.js`, `ocr-session.js`, `ocr.worker.js`, `ocr-output.js`: scan-page detection, bounded PDF.js rasterization, bundled Tesseract English recognition, line/position review, fresh searchable-copy generation and independent PDF.js text verification. Recognition runs in a disposable worker tree; cancellation terminates the controller and parser jobs. Corrections affect the invisible searchable layer, not visible source pixels. OCR review has an independent scroll frame around the complete scan image and keeps correction fields alongside it at native minimum sizes. Highlight coordinates remain relative to the full image, not the scroll viewport. Transformed output readers have no source handle and cannot overwrite the original reading-position metadata.
- `src/reader-navigation.js`: bounded nested PDF outline/page labels, personal saved pages and source-fingerprint-bound reading position metadata. External outline destinations stay inert; labels use textContent.
- `src/polish.css`: compact shared spacing and bounded app/sidebar/document scrolling; screen metrics from `scripts/audit-ui.mjs`.
- `src/formats.js`: single source of capability labels; docs mirror tested state.
- `tests/`: Node safety tests and Electron end-to-end tests on actual generated files.

#### Data flow and boundaries

Compression receives only an immutable opened FileStore PDF snapshot, a validated token and whitelisted mode/quality. One job verifies fixed qpdf executable/DLL hashes, checks the source in a resource-limited Node worker, writes exclusive fixed-name input/marker files in an app-owned random directory, and launches qpdf hidden with no shell and fixed arguments. Diagnostics are bounded to 64 KiB, output size is monitored at 100 MiB and each native/verification stage times out at two minutes. Inherited qpdf/OpenSSL override variables are removed. No renderer-controlled executable/path or PDF script is executed. Hard native heap containment and stronger filesystem-race/adversarial corpus remain release gates.

The compression worker refuses encryption, catalog certification/permissions, certificate-signature fields/signatures in indirect or nested direct objects, XFA, invalid image bounds and oversized/deep structures. Its canonical reachable-reference graph hashes dictionaries, byte strings, supported decoded streams and unchanged unsupported-filter bytes, including root/Info objects; references are normalized independently of object numbers. Lossless requires matching image payloads, non-image content and geometry. JPEG permits image payload/filter changes while checking remaining structures. Conservative mismatches refuse output. Normal rewriting drops orphaned historical objects; it is not sanitization or standards validation. Keeping obsolete orphaned object streams exposed a parser collision on a compact fixture; normal unreachable-object removal fixes independent reopening without dropping reachable structures.

The renderer independently reopens all compressed pages and checks boxes/rotation/operators before enabling review/save. Comparison borrows source/output documents without owning their readers. Actual savings and larger/no-saving results are explicit; changing settings invalidates output and review. Native close is held during compression and Save selection/writing; cancel/close terminates active native/verification work. Global drop cannot replace an open modal session. A renderer crash cancels compression. Only known job files are unlinked, then the empty directory is removed; failures are explicit. Next-launch cleanup accepts only correctly marked job directories with known filenames, skips symlinks/unknown content and never recursively deletes. Settings/preview recovery, broad file corpus and complete binary SBOM/notice/installer review remain incomplete.

OS picker/drop -> main process validates path/size/type -> opaque handle + bytes -> sandboxed renderer -> PDF.js Web Worker. The renderer receives no directory traversal API. Reopen uses a stored opaque recent id. Output bytes -> native Save dialog -> main rejects all known original paths and existing files -> exclusive creation -> close -> report success. Cancel leaves no output. Failed writes remove partial new files. Symlink/hardlink destinations must not defeat original protection; exclusive create prevents overwriting an existing alias. Workspace metadata includes paths/names plus optional physical reading positions, source fingerprints and user-entered page-bookmark labels locally. It does not retain PDF content or passwords/keys. Clear recent metadata also clears reading positions/personal bookmarks. Reading state is limited to 500 physical pages/100 bookmark labels of 80 characters; changed source bytes reset it. This data is distinct from editor recovery content described below.

Recovery drafts do contain edited document content, stored locally in userData as atomic `draft-<path-hash>.json` files; they are fingerprint-bound to the opened source bytes and capped at 2 MB. They are not encrypted. Version files retain up to 20 revisions and 8 MiB per source history, with a 64 MiB aggregate limit per drafts/history category. Restore checkpoints current state before committing the selected version. History writes and cleanup are serialized; cleanup matches only application-owned file patterns and leaves originals/exports/unrelated files untouched. New documents have a separate draft. Exports are native-dialog approved new files, and clear their recovery draft after successful saving. Draft saves do not modify originals. Main-process close protection asks the renderer to commit pending work and refuses departure on draft failure; emergency edited-copy export remains available. A renderer crash can lose edits made since the last committed draft, but committed drafts/history survive restart. A single-instance lock per userData profile avoids competing writers. Fullscreen uses validated boolean IPC and native state events; native dialogs retain Escape behavior. DOCX import caps 10 MB compressed/30 MB expanded, 2,000 ZIP entries and a 60-second worker; no macros, encrypted ZIP entries, external file access or embedded style maps. Images are omitted, imported HTML is DOMPurify allowlisted, and the editor schema retains only supported basic structures. This is a simplified import, not a Word layout engine.

Untrusted text uses textContent. HTML/SVG, macros, embedded JS, attachment launch and external document resources are unsupported. PDF.js evaluation is disabled; only bundled CMaps/fonts/wasm are allowed. Disable navigation, popups and permissions; enforce context isolation, sandbox, CSP and IPC sender verification. Renderer network is restricted to the app origin. Main accepts only user-granted inputs. Compression now uses a bounded Node verification worker and a fixed bundled native subprocess with timeout/cancel contracts; native hard memory containment remains a gate. A worker/subprocess is a responsiveness boundary, not an additional OS sandbox.

#### Dependencies and licensing

Registry/repository checked 2026-09-29; installed versions are locked in package-lock.json.

| Library | Purpose | License | Maintenance/review |
| --- | --- | --- | --- |
| Electron 44.5.0 | Windows shell/Chromium | MIT, bundled third-party notices | Current stable registry version; patch promptly |
| PDF.js/pdfjs-dist 6.3.289 | PDF rendering/text/permissions | Apache-2.0 | Active Mozilla releases; bundled worker/assets |
| Vite | Renderer build/dev | MIT | Current registry version, exact lock |
| Playwright | Electron integration tests | Apache-2.0 | Test-only |
| pdf-lib 1.17.1 | Page manipulation/export, compression and clean-image redaction verification | MIT | Older release cadence; bounded PDF parser workers, no standalone encryption or vector-preserving redaction claims; reassess before release |
| qpdf 12.4.2, Windows x64 | Lossless stream/object rewrite and optional JPEG image optimization | Apache-2.0 plus bundled library/runtime notices | Official ZIP/binary checksum pins; fixed hidden subprocess; native memory containment, exact binary SBOM/notices and clean-machine checks remain release gates |
| Tiptap core/StarterKit 3.31.3 | ProseMirror-based text editor | MIT | Current locked open-source release; no paid extensions |
| mammoth 1.13.0 | Simplified DOCX import | BSD-2-Clause | Never trust emitted HTML without sanitizing; external access disabled |
| docx 9.8.1 | New DOCX generation | MIT | Tested basic formatting/list export and independent reimport |
| DOMPurify 3.4.16 | Import/paste sanitization | Apache-2.0 or MPL-2.0 | Use Apache-2.0 option; restrictive tag/attribute allowlist |
| Tesseract.js/core 7.0.0 | Offline English OCR | Apache-2.0 | Locked worker/WASM assets bundled; native scan and mixed-page tests; full quality corpus pending |
| @tesseract.js-data/eng 1.0.0 | Bundled English `4.0.0_best_int` model | Package declares MIT; retain upstream Tesseract model notices | No runtime download/cache; full attribution/SBOM release review remains |
| LibreOffice | Candidate office conversion | MPL-2.0 with component notices | Separate optional subprocess; installer/codec/legal review required |

Do not silently introduce PyMuPDF/MuPDF or Ghostscript: their AGPL/commercial terms require an explicit distribution decision. Prefer permissive engines where practical. Full transitive/binary notices and SBOM remain a Phase 7 gate.

#### Future contracts

Document adapters report `{ open, preview, edit, convert, limits }` with tested operation ids. Jobs accept file handles, operation parameters, AbortSignal, progress and produce bytes + warnings + verification evidence. A copy is not saved until reviewed.

Model adapters perform model discovery/chat; agent adapters perform capability discovery/run/stop separately. Network/credentials stay in main. Consent is bound to connection, request and selected file ids, not a global checkbox. Never give an agent workspace paths or application write tools by default. Agents may have upstream access/tools of their own: disclose this boundary and require approval before context submission. Save/export requires an independent user gesture, never model output. Prompt injection inside documents is treated as source content.

#### Sources

- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron release schedule](https://releases.electronjs.org/schedule)
- [PDF.js releases](https://github.com/mozilla/pdf.js/releases) and [license](https://github.com/mozilla/pdf.js/blob/master/LICENSE)
- [pdf-lib license](https://github.com/Hopding/pdf-lib/blob/master/LICENSE.md)
- [Tesseract.js](https://github.com/naptha/tesseract.js)
- [Hermes programmatic integration](https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration)
- [Tiptap StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit)
- [Mammoth fidelity and security](https://github.com/mwilliamson/mammoth.js)
- [DOCX generation API](https://docx.js.org/api/classes/Packer.html)

#### PDF comparison boundary

`PdfComparison` borrows already-open reader documents without destroying them, and owns/destroys only its separately opened PDF.js tasks. It has no writer or reading-metadata capability. Source/output comparison uses immutable organizer mappings; arbitrary versions pair physical page numbers by default with explicit manual alignment. Native password prompts remain usable while opening is pending; copy-restricted documents render artwork without text extraction. Closing/canceling stops owned renders and preserves the main reader.

Visible canvases use display pixel ratio capped at 2 and 16M pixels each. Difference rasters share the same PDF-point scale on a white canvas, bounded to 512×768 with a 24/255 color-channel tolerance. Pink marks changed review pixels; this preview is not cryptographic equivalence or a redaction verifier. Page dimensions/orientation differences are reported independently. Extracted text is bounded to 100,000 characters/8,000 tokens per page, with a 250,000-cell LCS budget and explicitly labeled block fallback. Literal strings enter the DOM only through textContent. Scans, absent selectable text and unavailable/restricted extraction retain uncertainty labels.

Opening is bounded to 500 pages/PDF and a two-minute timeout. Whole-document checking handles up to 100 output page pairs, yields between pairs and reports partial canceled results; ordinary comparison still supports the reading page limit. Existing file intake bounds remain. Metadata, attachment, link, permission and interactive form equivalence are outside this comparison. Larger text/screen-reader and broad real-document alignment/performance review remain release gates.

#### PDF markup boundary

The sandboxed PDF job worker writes standard Highlight, Underline, Text, FreeText and Ink annotation dictionaries with explicit appearance streams. Geometry is converted through the PDF.js viewport to original PDF coordinates, including intersected crop/media boxes and page rotation. Source bytes are immutable. Supported managed PDFix annotations carry bounded records and matching identity/type/contents/coordinates; foreign, locked or altered annotations remain foreign. The editable baseline removes owned annotations only after checking for reply/shared references. Owned unreferenced appearances are removed with them; this is annotation editing, not secure redaction. Catalog structures and regular unsigned AcroForms remain in the document; signed/certified, encrypted and XFA writing is refused. Preserved document scripts remain inert in PDFix; saving does not sanitize foreign scripts for other viewers.

Preview reopens output with independent PDF.js and verifies annotation subtype, text and rectangle before enabling the exclusive-copy writer. Flattening paints supported appearance streams as page artwork; note annotations remain editable to retain comment text. Text boxes use embedded standard Helvetica and reject unsupported characters or text that will not fit. The renderer overlay is an editing aid; the actual reopened PDF is the authoritative visual preview. Native tests compare normal/flattened rasters with the documented 24/255 tolerance at unchanged canvas dimensions.

Markup recovery uses a separate path-derived identity namespace from rich/source document editing and the same source fingerprint and bounded atomic storage. Failed saves keep departure blocked; a successful verified rescue export clears the draft and stale write failure. Pending autosaves are settled before output saving. Original-editor recovery is unaffected. The main close handler chooses the active markup guard; keyboard shortcuts are restricted to the focused markup reader so preview printing runs once.

Limits: 100 MiB input/output, 500 pages/marks, 50 selected regions per highlight, 1,000 points per stroke/20,000 aggregate ink points, 2,000 characters per note/text box, 2 MiB serialized recovery, bounded worker time and cancellation. Broader third-party annotation editing, threaded review/import/export formats and accessibility/performance corpus remain unfinished. Annotation semantics and appearances were checked against [ISO 32000-1:2008 hosted by pdf-lib](https://pdf-lib.js.org/assets/with_large_page_count.pdf) and the locked pdf-lib/PDF.js implementation.

#### Fill and sign boundary

The sandboxed PDF worker inspects ordinary AcroForms and writes only changed supported values. Text, checkbox, radio, dropdown and list fields retain native editable form structures; read-only/calculated/password/file-selector/rich-text fields and unsupported widgets remain unchanged. Choice appearances use display labels while `/V` retains the corresponding export values and multi-choice `/I` indices are sorted numerically. Existing signatures/certification, encryption and XFA are refused before calling pdf-lib's form accessor. Existing foreign structures are retained, including scripts that remain inert in PDFix; this operation is not a sanitizer for other viewers.

User-confirmed typed, drawn and image placements become fixed page artwork within source crop/media bounds, compensating for page rotation. Unconfirmed composer content is recovery-only. Current-page selectable label candidates are explicitly uncertain; no guessed values or dates are inserted. The independently opened PDF.js output checks actual widget values (including full multi-choice annotation values) and readable placed text before review/save is enabled. Visual review remains required for appearance, drawing and imported-image fidelity; output is saved exclusively to a new filename. Standard Western fonts bound edited appearances and typed placements. Custom source tab order, reviewed calculations and a broader form corpus remain gates.

Form recovery has its own path-derived identity plus immutable source fingerprint. Serialized drafts contain values, confirmed placements and optional valid unplaced composer assets, bounded to 2 MiB. Failed recovery blocks departure but permits a verified rescue copy; successful export clears the draft and prior failed-write state. Saved visual signatures use a separate serialized atomic queue and fixed `signatures.json`, with at most 10 entries/8 MiB, explicit save/delete only and corruption-preserving failures. Clearing recovery or recents retains this library. Both stores are unencrypted and the UI explains this.

Signature image picking exposes selected bytes only, without granting a reusable path or adding recents. Header dimensions are checked before decoding; input is limited to 4 MiB, 4M decoded pixels and 4,096 pixels per side. Normalized PNG is bounded to 1 MiB decoded bytes, 1.4M encoded characters and 1,200×600 output dimensions. Drawings allow 50 strokes/5,000 total points; form output supports 500 fields/2,000 widgets/50 placements within existing 100 MiB/500-page limits.

#### Hidden test execution

Isolated `PDFIX_TEST_DATA` profiles now use hidden offscreen Electron windows, CPU rendering and a 60 Hz frame rate. They never show/focus on launch or second-instance events; normal user launches keep native window behavior. Tests assert window invisibility. Simply hiding an ordinary window caused one-frame-per-second input processing and a signature test timeout; offscreen rendering removed that limitation. Native fullscreen is deliberately skipped in hidden runs and retains its earlier visible-run evidence. A visible check requires an explicitly requested `PDFIX_TEST_VISIBLE=1` run. Offscreen screenshots verify renderer layouts, not native title-bar or physical printer behavior. Reference: [Electron offscreen rendering](https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering/).

#### Image preview and PDF creation boundary

The sandboxed PDF job worker checks PNG/JPEG/WebP/BMP headers before decoding, with 32 MiB/16M-pixel/8,192-per-side bounds and bounded chunk/marker scans. Animated PNG/WebP are refused. BMP intake supports a bounded uncompressed 24/32-bit subset; unsupported compression/DIB variants offer a PNG alternative. `createImageBitmap` applies camera orientation and browser-default color conversion. An OffscreenCanvas normalizes decoded artwork to PNG, preserving decoded pixel dimensions/alpha and omitting original photo metadata/color profiles. Normalized PNG is limited to 64 MiB; workers terminate on cancellation or the existing two-minute timeout. Exact profile fidelity and a broad codec/performance corpus are not claimed.

The new PDF contains one embedded full-resolution image and one page. A4/Letter or image-sized (96 dpi plus margins) layout uses fit-within geometry, explicit clockwise rotation, no crop/stretch and chosen margins. Output is bounded to 100 MiB. The worker reopens the page and verifies dimensions and embedded-image geometry. A separate PDF.js reader independently verifies page count/dimensions and the full-size image operator, then renders the actual output. Source/output artwork remains visible for explicit user review before native saving. Print preparation uses the existing bounded reader and OS handoff; this is not physical-printer or tagged/archival-compliance evidence.

The narrow `export-image-pdf` preload call requires an already-open image source and bounded PDF bytes. The native chooser only requests a PDF destination; FileStore keeps exclusive new-copy/alias/collision rules. Image page settings have a separate source-fingerprinted recipe namespace, validated in renderer and native recovery storage. Originals/pixels are not stored in recipes or rewritten. Failed recovery blocks navigation/new-file grants, while retry/canceled save/verified rescue remain available. In-flight export holds settings and source output stable. App navigation, file pick/drop/reopen and main-window close now choose the active document or image guard. Multi-image inputs, recoverable input lists, crop/adjustment and reverse conversions remain separate unfinished gates.

API references: [createImageBitmap orientation/color options](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap), [pdf-lib PDF document embedding](https://pdf-lib.js.org/docs/api/classes/pdfdocument), [PDF page drawing](https://pdf-lib.js.org/docs/api/classes/pdfpage). Locked PDF.js operator code and native raster tests verify the adapter's current behavior.

#### Page geometry

`page-geometry.js` validates intersected media/crop boxes and maps displayed top/right/bottom/left millimeter margins through quarter-turn rotations. The source page preview disables annotations and eval/XFA; it renders locally at bounded display resolution and exposes the same crop through dragging and numeric fields. Bulk application validates a cloned plan before committing. Whole-plan undo/redo retains 30 in-memory snapshots; retained source grants remain available across undo, bounded to ten sources/100 MiB. Crop-only output updates crop/trim/bleed/art boxes. Paper fitting embeds the cropped vector page into a new centered page, applies clockwise rotation and preserves its transparency group. PDF embedding and page-box APIs are documented in [pdf-lib PDFDocument](https://pdf-lib.js.org/docs/api/classes/pdfdocument) and [PDFPage](https://pdf-lib.js.org/docs/api/classes/pdfpage). Hidden content is retained: geometry changes do not sanitize/redact.

The worker reopens every output page and checks expected rotation/dimensions; an independent PDF.js reader checks all output viewport dimensions before copy saving is enabled. Geometry refuses invalid/empty/non-finite boxes, nonstandard user units, non-quarter rotations, invalid crop margins and paper settings; existing form/signature/encrypted input refusal remains. Canvas tests cover actual rotated quadrant colors and selectable text; broader unusual artwork/layer/font/print checks and recoverable recipes remain gates. Saving uses existing exclusive-copy native IPC and prevents dialog dismissal while the save is in flight.

#### Range selection and split output

`page-ranges.js` parses bounded physical output positions, preserves entered range order and rejects duplicate/invalid pages. Every-N splitting covers the whole current plan; explicit semicolon groups reject cross-group overlap and list omitted pages. `splitPdf` first creates the arranged/cropped/resized page copy once, then copies its pages into separately reopened PDFs. The worker transfers part buffers without an extra message copy, enforcing 500 included pages/files and 100 MiB aggregate output. The renderer independently reopens all parts, checks each page count/dimensions and loads artwork operators with local bundled resources, disabled eval/XFA and a bounded verification timeout. The chosen actual part can be previewed and compared using its original source-page mapping; outputs remain unsaved until explicit review/copy saving.

`save-split` permits only a live PDF source, bounded parts and a legal folder component. The native picker authorizes a parent directory; `split-writer.cjs` resolves it, exclusively creates the requested new folder and writes numbered PDF files with `wx+`. Bounded reads of the same descriptor verify saved-byte hashes before success. Existing directories/files/aliases are refused. Failure unlinks only paths created by this operation and removes the now-empty folder; incomplete cleanup is reported explicitly. No recursive deletion is used. Native close is held throughout picking/writing, and the split dialog is inert during export. Source bytes/recents are unchanged. Page recipes and unsaved split buffers are not crash recovery; stronger directory-race/adversarial, size/bookmark rules and large-real-file corpus checks remain release gates.

#### Clean-image redaction

`redaction-model.js` validates bounded regions in source PDF coordinates and maps crop/rotation/UserUnit geometry into outward-rounded black masks with a one-pixel margin. The renderer renders the visible source appearance onto white RGB at 144/180/216 dpi, removes selected pixels before encoding, hashes the sanitized frame and transfers only sanitized RGB sequentially to `redaction-writer.worker.js`. The worker creates a fresh PDF with only page tree, one Flate RGB image and exact image-drawing content per page; no original object is copied.

`redaction-output.js` inspects protected/signature/XFA sources and strictly verifies the output object whitelist, geometry, black-mask pixels, canonical decoded/recompressed streams and whole serialized bytes. These checks reject orphan objects, metadata/attachments, hidden operators, trailing compressed data and appended/historical payloads. `redaction-service.cjs` independently runs the verifier against an immutable native source in a bounded Node worker and retains its own source/token-bound output bytes. PDF.js independently checks every page for text/annotations/extra structures and exact pixel hashes against the sanitized source. Cancellation interrupts pending verification awaits as well as workers/render tasks, so destroying a preview cannot strand the busy state.

`save-redacted-copy` receives only a source ID and verified token. It holds native close throughout choosing/writing, uses exclusive creation and hashes bounded reads from the same descriptor before returning success. Verification failure removes only its new file; removal failure reports the retained unverified path. Region recovery has a separate source fingerprint and stores only validated settings/coordinates, never search phrases or page pixels. Recovery failure blocks close but allows export of the verified rescue copy. The original is unchanged and still private.

Limits: 100 pages/500 regions/100 MiB input/output, 100M total rendered pixels, 16M/page and 8,192/side; 90 MiB combined compressed image payload; native decoded streams 64 MiB, bounded 100k objects/depth 64/500k visits and two-minute worker stages. Worker heaps have limits; this is not an OS sandbox. Broad real-file/color/font/optional-content/forensic testing, hard containment and vector-preserving redaction remain release gates.

#### Password protection and authorized removal

`password-engine.cjs` reuses pinned engine checks and the bounded native verification worker, with its own job directory, ownership marker and known-file cleanup. Fixed qpdf `@-` reads whitelisted arguments through private stdin; secret strings are absent from the OS command line, job markers and password files. The generic JSON job-file option does not read stdin in this bundled version; a diagnostic named-pipe experiment also could not feed that file API, so neither is used. Engine stdout/stderr are bounded and raw diagnostics are not logged or returned. Encryption query JSON stays native; recovered legacy user-password data is discarded and never returned to the renderer.

Native processing first checks source encryption and the supplied password role. Any already-encrypted source requires owner-password matching before changing/removing protection. A decrypted temporary source passes the existing protected/signature/XFA/image/structure guards. Protection uses AES-256 revision 6 with distinct nonempty opening/owner passwords and explicit print/copy/edit permissions; algorithm and both roles are independently queried after writing. Output decryption enables a reference-independent reachable graph/stream/image/geometry comparison using pdf-lib. The password path alone normalizes the exact required ADBE /1.7 extension-level-8 declaration in in-memory inspection; additional extension keys or other content differences remain failures. General compression retains its full unchanged graph contract.

The sandboxed password workspace independently opens the original and actual output, checks permissions and every page’s text/geometry/white-background RGBA hashes. Text is streamed with 50k-run/2 MiB character page bounds; raster comparison caps 100M aggregate/16M per-page pixels and 8,192 per side. Tasks, text readers and render jobs cancel through interruptible waits. Password fields clear after build/close, settings changes discard output/review and source/output comparison is available. No password/settings draft is persisted. Parsed encryption keys necessarily stay in reader/native process memory while the documents are open; secure memory erasure is not claimed.

Native results cache their own immutable bytes and SHA-256 bound to the live source and token. Save receives only that identity, holds native close during picker/write and uses exclusive creation plus bounded same-descriptor disk hashing. Canceled/failed work discards cached output and removes only known job files. Temporary files can contain unprotected content; startup cleans only correctly marked known jobs and skips symlinks/unknown content. These workers/subprocesses are not an OS sandbox; hard containment, wider cryptographic compatibility/normalization/corpus and binary/distribution review remain release gates. PDF permission flags are viewer policy, as described in the [qpdf encryption documentation](https://qpdf.readthedocs.io/en/stable/encryption.html).

After removal and successful saving, **Open saved unprotected copy** uses only source/token identity. Native code retains the authorized saved path and calls FileStore.open with the expected verified SHA-256. Changed bytes fail before metadata or session handles change; the renderer cannot supply an arbitrary path. Successful opening transitions directly to the normal reader/edit-copy tools.

#### Security Sandbox and October parallel feature additions

`desktop/native/SandboxLauncher.cs` is a Windows x64 broker built by `scripts/build-native-sandbox.mjs` during the production build. Compression/password jobs stage only pinned qpdf binaries and app-owned PDFs, validate the broker/runtime hashes, and launch through AppContainer + Job Object with no unrestricted fallback. The suspended child is checked for its exact package SID, zero capabilities and configured job membership. The policy limits processes to one, memory to 512 MiB, wall time to 115 seconds and CPU time to 120 seconds; explicit pipes carry arguments/passwords. Concurrent pipe forwarding and parent-death monitoring keep blocked stdin from delaying the watchdog. Temporary files have size/name watchdogs and known-file cleanup, not a hard disk quota. Per-job profiles and ordinary AppContainer system/shared resources remain security-review limits. Node verification/Office/security-inspection workers still have application privileges. See docs/SECURITY-SANDBOX.md for the full policy and unfinished gates.

Electron now enables its sandbox globally. App-origin checks use parsed exact hosts without credentials; the protocol confines canonical paths, blocks native assets, adds CSP/referrer/permission headers and denies downloads/device permissions. A Settings status panel shows package readiness and the explicit runtime-review gap. No OS isolation claim follows from compilation alone.

PDF security reports inspect bounded immutable snapshots in a 30-second/192 MiB worker, with compressed-object allocation guards (16 MiB per stream/64 MiB aggregate), structural traversal caps and limited attachment metadata. They inventory active structures without executing actions or extracting payloads. Encrypted/unreadable structures are incomplete; certificate validity always remains unable to verify. Security reports can be saved as separate text. Link review lists bounded current-page destinations and independently rechecks original direct URI actions against native source hash/page/annotation references. External destinations require a native Cancel-default confirmation, permit HTTP/HTTPS only, and recheck source/cancellation before browser handoff. Scripts, attachment/Launch/remote-file/chained actions cannot use that opener.

Paper presets use shared desktop/paper-sizes.json for geometry and native recovery IDs (Letter/Legal, ANSI A–E, ARCH A–E, ISO A0–A4). Drawing measurement uses PDF.js coordinate conversions, explicit confirmed calibration and temporary 128-point distance/perimeter/simple-polygon tools. Optional-layer visibility is a temporary page-view configuration, never removal/redaction, printing or saved-file mutation. Annotation summaries export readable existing source annotation information from at most 100 pages/10k annotations/2 MiB, with cancellation and copy permission checks. Form-data exports freeze reviewed current supported values as JSON/CSV and retain recovery, with unsupported/password/signature assets excluded.

Markdown and CSV source previews run in a local renderer worker with a ten-second deadline. Markdown renders a deliberately bounded basic subset using DOM text nodes (no HTML/resource execution, remote image fetching or active links), with block/table limits and visible simplification. CSV handles quoted/multiline fields with chosen comma/semicolon/tab delimiters, 100k cells/20k rows/500 columns and 100k characters per cell; paged tables display literal values and full-cell inspection. Editing/recovery/export continue to use the source textarea. Rich editor content and export fidelity are unchanged by previews. All these new additions require deferred runtime/corpus/accessibility/security verification.

Added trustworthy PDF file details with exact source hash, literal bounded metadata, current physical/printed page, dimensions/orientation/UserUnit, saved/view rotation distinction, copying/printing facts, current-page text uncertainty, optional bounded all-page size check and chosen JSON export. Encryption uses known PDF.js facts or remains unknown. Added password-field withholding before getText(), empty read-only UI placeholders, sensitive-value filtering for exports/history/recovery and cleanup of the selected recovered form draft; originals retain their password field content and this is not document sanitation. Runtime verification remains deferred.



---


---

<a id="bluebeam-compatibility-plan-md"></a>
## 📄 `BLUEBEAM-COMPATIBILITY-PLAN.md`

---

### Bluebeam/Revu compatibility and drawing review


Saved 2026-10-03 as requirement R39. The user confirmed the priority is **review drawings and comments**, because their dad uses Bluebeam frequently. These are planned additions; PDFix does not yet claim Bluebeam-specific compatibility.

#### Priority 1: see and review existing comments

- [ ] **B01 — Open Revu-produced PDFs and show existing markup artwork.** Start with normal PDF annotation objects and saved appearances. Retain original files. Show unsupported annotation types or missing appearances clearly instead of silently dropping them. Cover rotated/cropped large sheets and printed sheet labels.
- [ ] **B02 — Drawing-wide Comments / Markups panel.** Show page/sheet, subject, comment text, author, creation/modification dates, type and color where present. Search and filter by text, author, sheet, type and status; sort and retain stable selection. Selecting a row jumps to and highlights its exact drawing location. The panel can collapse and resize without losing the current sheet or selected row.
- [ ] **B03 — Replies, review states and locks.** Reconstruct supported parent/reply relationships, including multi-level threads, and display original review-state values/history without inventing missing data. Distinguish missing parents, duplicate IDs and unsupported proprietary states. Display lock/read-only flags. Subsequent supported reply/status editing must preserve provenance and require an actual output review.
- [ ] **B04 — Preserve other people's markups when making a copy.** Every writer must disclose whether it retains comments, appearances, replies, author/date, flags, identifiers, layers and unknown extension dictionaries. Retain unknown data when a verified preservation route supports it; otherwise refuse the write or disclose an explicit reviewed conversion. No automatic flattening or rewriting of foreign comments. A displayed comment is not evidence that an export preserves it.
- [ ] **B05 — Review reports and comment exchange.** Export a reviewed CSV and readable report with page references, stable markup IDs, parent IDs, comments, dates, authors and available states; show omitted/unsupported data. Keep spreadsheet formulas inert. Evaluate standard FDF/XFDF interoperability and a separate adapter for Bluebeam BAX/XML only after format, licensing and sample-file evaluation. Round-trip import remains gated on preservation checks.

Bluebeam's own Markups List documents row-to-drawing navigation, comments/replies, author/date, status, filtering and report/export options. These inform the review priorities above: [Markups List manual](https://support.bluebeam.com/user-manual/menus/window/markups-list.html).

#### Priority 2: useful drawing-review tools

- [ ] **B06 — Revision clouds, arrows and callouts.** Add these beside existing notes/highlights; support consistent review colors, clear subjects and reusable locally stored styles. Preview the exact PDF markups and preserve unrelated foreign markups before saving a copy.
- [ ] **B07 — Compare revised drawings.** Extend current comparison with aligned transparent/color overlays, synchronized zoom/pan and clear old/new sheet labels. Support manual alignment when drawings shift. Proposed changes need human review; a pixel difference does not prove a design change.
- [ ] **B08 — Sheet sets and controlled revision replacement.** Group related PDFs/sheets, use printed sheet numbers/titles when available, and provide fast navigation. Propose old/new matches by sheet label or explicit user mapping. Preview missing/duplicate matches and decide where old-version comments belong before replacing sheets; never silently transfer a comment to the wrong revision.
- [ ] **B09 — Review navigation for large drawings.** Zoom to a selected markup, return to the previous view, keep a selected thread visible during zoom/pan, and show sheet/revision context in fullscreen and focus mode. Stable text/region selection on unusual layouts stays an existing core requirement.
- [ ] **B10 — Reusable review stamps and tools.** Save approved local styles/templates, such as reviewed, revise and approved, with local-library deletion controls. Distinguish visual review stamps from certificate signatures. Evaluate Bluebeam BTX tool-set import separately; do not assume a proprietary tool set is a PDF.

These are PDFix engineering requirements, building on the saved drawing, comparison and reusable-assets backlog. Bluebeam documents sheet overlay and revision replacement workflows: [Overlay Pages](https://support.bluebeam.com/it/user-manual/menus/document/overlay-pages.html), [Batch Slip Sheet](https://support.bluebeam.com/nl/online-help/revu20/Content/RevuHelp/Menus/Batch/Slip-Sheet/Batch-Slip-Sheet--T.htm).

#### Priority 3: extended data and takeoffs

- [ ] **B11 — Custom markup columns and quantities.** Inspect PDF-embedded custom data and retain its original meaning/type where understood; show unknown values as unsupported rather than coercing them. Evaluate material, discipline, assigned reviewer and other available custom columns. Do not fabricate data that lives only in a Bluebeam profile. Editing/export must verify retained values and distinguish raw source quantities from PDFix calculations.
- [ ] **B12 — Measurements and quantity takeoffs.** Extend current temporary calibrated distance/perimeter/area tools with reviewed persistent measurement markups, counts, grouped totals, unit conversion, sheet-specific scale and exportable quantities. Require calibration and disclose precision. Large-sheet printing, layers and measurement remain linked to existing M03 requirements.

Bluebeam explains that custom column definitions can be stored in the PDF or in a separate profile, which changes what travels with a file: [Custom column storage](https://support.bluebeam.com/revu/how-to/custom-columns-best-practices.html). Its takeoff guide describes calibration, measurement and reusable measurement tools: [Getting started with takeoffs](https://www.bluebeam.com/resources/construction-takeoffs-guide-2026/getting-started-with-takeoffs/).

#### Compatibility boundaries

Flattened markups become page content and may no longer contain editable comment objects. Show their visible artwork, but never promise to recover missing authors, replies or statuses. Bluebeam has an optional recovery mechanism; PDFix support for that mechanism needs separate investigation. [Flatten Markups](https://support.bluebeam.com/user-manual/menus/document/flatten-markups.html).

Bluebeam Studio Sessions/Projects, live collaboration, account access and cloud synchronization are separate future integrations. Opening a local PDF does not connect to Studio or fetch session-only comments. Any integration needs a supported API, reviewed authentication/permissions and explicit transfer controls. No Bluebeam account or subscription requirement is implied for opening a supported local PDF.

#### Implementation and later acceptance

Build B01–B05 before expanding takeoff tooling. Current PDFix page notes and annotation summaries are a starting point; their existence does not establish complete thread/status handling or Bluebeam preservation.

Later offscreen verification should use authorized Revu-created fixtures with ordinary comments, replies, review states, locks, custom columns, clouds/callouts, measurements, layers, rotations/crops, unusual fonts, non-English text and flattened markups. Compare source artwork/data with PDFix and reopen supported edited copies in Revu; verify stable identity, thread relationships, exact sheet locations and unknown-data preservation. Include corrupted/missing-parent, encrypted, signed and unsupported files, cancellation/resource limits and keyboard/fullscreen/collapsed-panel use. These are deferred acceptance requirements, not tests run in this coding pass.

Traceability: R39; M03.03–07/M03.10–11; M04.05–07; M07.05; M08.06. The original supplied master list remains preserved verbatim.

Source inspection is saved separately in [docs/BLUEBEAM-SOURCE-GAPS.md](docs/BLUEBEAM-SOURCE-GAPS.md). It confirms that current flat notes/summaries do not yet implement the requested complete review workflow.


#### 📅 First coding increment — 2026-10-03

Saved and compiled: native read-only comment metadata/reply/state inventory; searchable filtered/paginated comments panel with 10 named local filters; source-bound TXT/CSV report review; jump/zoom to markup and return to previous view; exact embedded sheet labels; line/arrow/cloud/callout tools. These implement standard-PDF subsets of B01–03/B05–06/B09. Imported annotations remain read-only and private data is not decoded. No Revu fixtures/round trips or runtime tests were performed. See FEATURE-TRACKER.md and PHASE-LOG.md for bounds and remaining gates. B01–B12 stay unchecked as complete acceptance targets.


#### 📅 Preserving review-edit increment — 2026-10-03

Supported imported plain comments and additive replies/standard review-history entries now have a source-bound preserving copy writer, independent-reader checks and every-changed-page review before save. Existing provenance/appearances/private fields remain; locked/rich/grouped/PDFix-managed/FreeText comment edits and protected sources are refused. Additive replies can use eligible FreeText parents. Reusable local styles (20) and direct/searchable workspace access are saved. These are B03/B04/B06/B10 subsets, with runtime/Revu acceptance still pending; no blanket interoperability or sanitation claim. Overlay/color/portable recipe source slices are in progress.


2026-10-03 integrated follow-on: preserving supported plain-comment/reply copies, explicit source-bound portable JSON drafts, standard /C and /IC metadata/reporting, reusable local drawing styles and aligned transparent/cyan-magenta comparison overlays are now saved and compiled (202 modules). Exact bounds and remaining gates are in FEATURE-TRACKER.md/PHASE-LOG.md. Recipes preserve unsaved staged/composer text after explicit save and exact-source restore, with reviewed replacement/Undo. They do not restore output seals or automatically save a PDF. Runtime/Revu round-trip verification and full B01–B12 acceptance remain open. Earlier in-progress/blanket read-only entries record older checkpoints.


2026-10-03 integrated 208-module checkpoint: named related-sheet sets, ordered navigation/user labels and explicit original/new revision-reference review; separate calibrated length/area/count ledger with grouped totals, source-bound reviewed JSON/CSV export/import; reviewed JSON comment metadata; native universal registered-renderer close handshake. Exact limits/status are saved in FEATURE-TRACKER.md/PHASE-LOG.md. B05/B08/B12 and M03.04/M03.10/M03.11 subsets advanced. Physical PDF revision replacement/comment transfer, full embedded measurement annotations and runtime/Revu/release acceptance remain open; these features do not complete the full targets.


#### 📅 Persistent takeoff copies and reusable decoration templates — 2026-10-04

This later checkpoint supersedes earlier statements that takeoffs are separate-ledger-only. The drawing takeoff ledger now opens a frozen PDF-copy workspace. A source-bound native writer adds one Line (distance), PolyLine (open perimeter), Polygon (closed perimeter/area), or Ink (count) annotation per entry. Explicit vector appearances include numeric quantity labels in the chosen display unit. Unicode comments/author and canonical PDFixData retain original points, physical-page identity, source fingerprint, calibration and recomputed quantities. Maximum 200 entries / 10,000 aggregate points, 2 MiB request, 100 MiB PDF and 500 pages. Source crop/media intersection and UserUnit are checked natively. Physical pages are authoritative; sheet labels remain supplied descriptions independently reviewed against the source. Counts carry no length calibration.

The native construction manifest allows only cloned/appended selected page Annots arrays and normalization of raw-stream Length to unchanged encoded payload size. All original objects, existing annotations, unknown/private fields and encoded stream payloads are retained. After serialization, native reopening compares every declared object, geometry/trailer references, exact annotation order, appearance bytes and canonical metadata. The immutable native receipt is fenced to source SHA/token/generation before an exclusive chosen-file Save Copy. Source-bound ledger math is generated from the same pure UI source during compilation. The worker has a two-minute deadline, 256 MiB old-generation heap, 16 MiB single / 64 MiB aggregate compressed-object decoding budgets; this worker is not an OS sandbox. Signed, certified, encrypted, XFA and unsupported sources are refused. No standard Measure dictionary or proprietary Bluebeam measurement editing is promised.

The UI also checks output/ledger/metadata hashes and exact annotation types, coordinates, text/author and appearances with an independent PDF reader. Every changed original/output drawing page must be visibly reviewed before saving (2 MP per preview). Ledger mutation and measurement controls are held while this copy workspace is open. Cancellation/discard retains the source and full separate ledger. Leaving protects unsaved JSON ledger data; saving a PDF does not mark that separate portable recipe as saved. Exported PDF annotations include unencrypted author, names and complete point/calibration metadata. Recovering this embedded metadata into an editable ledger is a remaining feature; existing JSON import remains source-bound.

Decoration templates now save up to 20 named styles / 64 KiB locally: standard font, inset, page numbers, headers, footers, watermarks and Draft/Approved/Reviewed text stamps. Apply requires explicit confirmation and invalidates a previous PDF preview; current physical-page selection and range stay selected. Templates exclude source IDs, page selection, generated PDFs and receipts. Named save, apply, delete/clear and bounded raw-text export are explicit. Corrupt storage fails closed; concurrent library changes are checked before writes. Text/styles are unencrypted local-profile data, separately disclosed in Settings & privacy, with deletion in Page numbers and stamps. Text stamps do not certify approval or create certificate signatures.

Source and build milestone only. Runtime, native-worker, broker, app, print and Revu acceptance tests remain deferred at the user's request. These additions advance B10/B12 drawing workflows without completing the full Bluebeam or master requirements. Earlier subagent source for templates/preview UI was retained; root completed the missing native writer and integration after those agents hit the account limit. Full interoperability, broader editing/format fidelity, release packaging and security/accessibility acceptance remain open.


#### 📅 Recover and revise embedded PDFix takeoffs — 2026-10-04

Saved native read-only recovery, independent-reader comparison and actual drawing-page review for canonical PDFix takeoff metadata. The reader's Takeoff quantities panel now has Recover takeoffs from this PDF and a native-processing cancel control. Recovery is explicit, never automatic. Native inspection requires a unique indirect annotation on its declared physical page; exact canonical metadata/author/NM, recomputed quantity, source geometry/UserUnit, Line/Polygon/PolyLine coordinates or count marker strokes and bounded normal appearance are checked. Unsupported versions/malformed recognized takeoffs fail closed; other/unreadable PDFix metadata is reported as untouched. Maximum 10,000 source annotations, 200 recovered entries, 2 MiB aggregate metadata / 4 MiB complete receipt, two-minute worker deadline and existing bounded worker heap/decode budgets. Protected/signed/XFA and unsupported sources remain refused. This worker is not an OS sandbox.

Each adopted entry receives a new identity bound to the currently opened PDF SHA, retaining original source SHA, annotation structural reference, author and metadata hash as provenance. Optional origin fields are strictly validated and travel with JSON/PDF metadata. Independent PDF-reader checks compare actual source annotation identity/type, bounds, author/text and path/count coordinates; actual crop/UserUnit and shortened labels must match this current source. Every recovered drawing page must be viewed (one reusable 2 MP canvas), then the user explicitly replaces the current in-memory ledger. Source bindings/hash are rechecked after asynchronous steps; cancellation retains the previous ledger. Undo restores it. Recovery is dirty until JSON is saved. Embedded metadata/calibration is untrusted file data and is not authenticated engineering information.

Edit entry now supports reviewed name/group changes and known reference length/unit changes for each calibrated quantity. Saved measurement/reference positions stay fixed. Quantities are recomputed, fully schema-validated and source-fenced before adoption; preview invalidity disables Apply, edits are dirty and Undo is available. Counts carry no length calibration. Editing a ledger alone does not change PDF bytes.

The takeoff PDF-copy dialog now offers an explicit unchecked-by-default option to update supported recovered annotations. Native selection is fenced by source SHA, unique structural reference, original NM/author/metadata hash, unchanged physical-page/path/reference geometry and known annotation fields. Locked/read-only, shared, threaded/replied-to, popup/group/rich/private-extended or independently changed targets are refused. Only declared original page references are removed, replacement appearances/metadata are appended, and all unrelated annotation entries stay in order. Native reopening verifies exact retained objects, arrays, geometry/trailer and new annotation results; the independent reader verifies declared removals and unrelated identity retention before every changed-page actual before/after review. Saving remains an immutable source/token-bound exclusive new copy. Original dictionaries/appearances remain in the retained object graph, including replaced takeoffs; this is neither redaction nor permanent deletion. Leave the update option unchecked to append additional visible annotations.

This supersedes the earlier recovery-pending and always-append-only checkpoint descriptions. Revu/proprietary takeoff interchange, new point/reference placement for an existing recovered entry, deleting embedded annotations and broad compatibility/security/release acceptance remain future work. Full master requirements remain open. No app, native worker, broker or runtime tests were launched; tests remain deferred as requested.


#### 📅 Reviewed XFDF export — 2026-10-04

B05 now has a saved standard-geometry XFDF export subset for inspected filtered comments, exact XML, omitted-annotation/field reporting and separate native JSON receipt saving. This supersedes export-planned statements for that subset only. B05 stays open for import, appearance/private data, BAX/BTX/FDF and actual Revu acceptance. [Current implementation](docs/DRAWING-XFDF-EXPORT.md).


#### 📅 Three major-gap agents integrated — 2026-10-04

User requested renewed subagents on the largest gaps. All three new agents completed concrete source slices; root integrated and compiled them. Earlier account-limit failures did not recur for these agents.

- Document fidelity: editable tables with ProseMirror cell selection, bounded rectangular spans, row/column/merge/split/header/fill controls and Undo; supported DOCX import and structured DOCX/PDF export; native recovery validation; TXT/RTF explicit tabular flattening. Original column widths/borders, images/nested tables and page-perfect Word preservation remain open. Details: [DOCUMENT-FIDELITY-PROGRESS.md](docs/DOCUMENT-FIDELITY-PROGRESS.md).
- Original PDF editing: bounded embedded Type1/TrueType one-byte and horizontal Type0 Identity-H two-byte ToUnicode maps, per-string multipart TJ edits retaining numeric spacing, reuse of observed source glyphs, preserved stream dictionaries and reopened source-font graph/encoded-program hash proof. Multicharacter/ligature entries omit affected runs while retaining other usable map entries. New glyph embedding, shaping/reflow, Type3/custom/vertical/nested/marked-content editing and complete unrelated-object preservation acceptance remain open. Details: [PDF-EDITING-FIDELITY-PROGRESS.md](docs/PDF-EDITING-FIDELITY-PROGRESS.md).
- Security Sandbox: fixed document-engine AppContainer/Job Object source with exact token/capability checks, one-process/512 MiB/115-second bounds, read-only staged source/request/runtime and three precreated writable output slots. Codec bundle supports nine fixed operations. Root packages the existing standalone Windows x64 Node runtime/license with SHA pins and bundled dependency attribution; XFDF export adopts the contained path exclusively, with no worker fallback. Cancellation observes broker close, source/output validators remain, cleanup failure/unsafe termination permanently closes the service. Broker close observation is subscribed immediately at launch to cover early failures across async boundaries. Other Office/review/takeoff/redaction routes still need adoption. Details: [SECURITY-SANDBOX-PROGRESS.md](docs/SECURITY-SANDBOX-PROGRESS.md).

Root also completed reviewed 11-type XFDF geometry/plain-comment export with exact XML, filtered source identity/fingerprint checks, per-annotation omissions, reviewed exclusive sealed saves and separately saved JSON receipt. Native runtime/security status is shown in Settings. Existing comment TXT/CSV/JSON snapshots remain separate. The XLSX sharedStrings undeclared-variable failure is fixed with an 8 MiB aggregate bound; current format/workspace/AI/privacy text reflects saved capabilities.

Final compilation passed: 224 Vite modules; index-BFhcaNJF.js / index-kVg5VJNm.css; pdf-job.worker-KFHKMFMu.js / document.worker-BXg1i3K9.js. Broker C# and fixed engine bundle compile; targeted JS/CJS syntax checks passed. Build output includes pinned node.exe, engine.cjs, broker manifests and runtime/dependency licenses. No app, broker, document engine, native worker, network/print or runtime tests were launched. Verifier code and compilation are not evidence of executed fidelity/OS isolation/Revu acceptance. User-requested runtime testing remains deferred; full master requirements and S00 remain open. Original master-list source is unchanged.


#### 📅 October 9 form order, FDF and editable workflows

[Integrated coding and compilation record](docs/FORMS-FDF-WORKFLOWS-CODING-2026-10-09.md) adds reviewed supported-page form keyboard order, native FDF comment import/export, editable native page-reorder/Bates sequences and broker-envelope alignment with existing bounded source/request contracts. 301 modules compiled. Broader form/appearance/interchange coverage, combine/OCR/print workflow steps, durable recovery and current runtime/security/performance acceptance remain. No broad row is newly accepted; the full adopted scope is unchanged.


#### 📅 October 9 native combination, TIFF and workflow library

[Integrated coding and compilation record](docs/COMBINE-TIFF-WORKFLOWS-CODING-2026-10-09.md) adds standalone native full-source PDF combination with supported comments/forms/bookmarks/destinations, supported classic multipage TIFF decoding and reviewed page import, and named reorder/Bates definitions with exact-source editable draft recovery. 306 modules compiled. Partial/duplicate PDF selection, wider graph and TIFF modes, combine/OCR/print runner stages, durable in-flight resume and runtime/security/fidelity acceptance remain open. Restoring settings never restores output approval. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 9 Bates, combined workflows, TIFF fax and tag semantics

[Integrated coding and compilation record](docs/BATES-COMBINE-TIFF-TAGS-CODING-2026-10-09.md) adds continuous multi-file Bates numbering with reviewed saves/identifier reports, native combine → editable reorder/Bates continuations, real CCITT fax TIFF decoding and reviewed existing table/list/printable-form tag semantics. 308 modules compiled. Persistent queues/global identifier registries, other workflow stages, broader PDF/TIFF/tree compatibility and runtime/security/fidelity/standards acceptance remain. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.



---


---

<a id="decisions-md"></a>
## 📄 `DECISIONS.md`

---

### Decisions and assumptions


- 2026-09-30: User prioritized fullscreen and a collapsible sidebar while asking about progress. Add native fullscreen/F11/Escape, a named icon navigation rail, reversible focus mode and independent PDF panes now. Persist only layout booleans; keep controls available at the minimum window size and preserve edits during view changes. The roughly 35% product completion estimate is a judgment of the broader scope, not a measured delivery schedule.
- Version history is bounded to 20 revisions/8 MiB per history, drafts to 2 MiB, with 64 MiB aggregate limits per category. Failed draft writes block departure but permit rescue export. Main owns the close guard; browser unload behavior alone did not protect a failed save in native testing. A per-profile single-instance lock prevents competing stores.

- 2026-09-30: The user supplied a broad gap checklist and requested adding it to the plan while continuing implementation. `REQUIREMENTS.md` traces all 38 entries to staged acceptance targets, without treating the checklist as a verified code review. Strengthen bounded editor version history/privacy controls first as work-protection infrastructure within the already authorized editor slice. Preserve the ordered PDF/format/AI/release gates.
- Keep exclusive new-copy writes. The checklist's possible “replace” choice does not authorize overwriting originals or unrelated existing files now; clear naming/folder alternatives ship first. Any future replacement must be explicit and recoverable.
- Preserve the supplied logo as the master. App-icon/light/dark/monochrome assets will be separate derivatives during packaging, rather than replacing the current artwork.

- User supplied the final name **PDFix** and `PDFix logo.png.png`; use that exact artwork in the app. Forma remains only the historical mockup name. No alteration of the supplied logo.
- User prioritized broad permitted-file editing and Word/Google Docs inspired workspaces. Pull the basic editor forward; present direct editing where supported and an explicitly simplified editable copy for selectable PDF text. No promise of perfect editing for every format; no password/DRM bypass. Scans still require OCR and difficult formats still require dependable adapters.
- Merge redundant All files/Recent navigation into Files; retain Favorites and add Workspaces. Home keeps a short recently-opened section.
- Awkward PDF content streams can produce unreliable drag selection. Offer local rectangle selection ordered by visual rows, plus readable text. Complex columns and PDF-to-document reading order still need review; do not silently claim semantic reconstruction.

- 2026-09-29: Empty workspace and no applicable AGENTS.md found in project/ancestors. Start a small project, preserving the supplied mockup separately.
- Use the pasted text as the request; attached HTML is a visual reference, not executable product requirements. Its example recents, Hermes connection and AI answers are fictitious and will not ship as state.
- Windows-first Electron shell; Node is installed, .NET and Rust are not. Native file capabilities remain behind a narrow bridge.
- Phase gates follow the requested order. A full roadmap does not imply the whole product is complete in this first checkpoint.
- No provider credential discovery, reading private model configs, paid API calls, publishing or signing in this task.
- Start with 100 MiB file and 500-page reading limits, 16 million pixels per canvas. These are protective starter limits, to be tuned with performance tests.
- Recent-file search means filename/path search over explicitly opened files. Content search starts with one PDF; selected-file search is later.
- Metadata stays in Electron userData; tests use a separate workspace directory. Forgetting history removes metadata, never source files.
- PDF reader password submission unlocks only the in-memory reader. Editing encrypted PDFs remains disabled until a supported password-aware writer is reviewed.
- Printing prepares a rendered page image per source page; text/font/vector fidelity is bounded by raster resolution and documented. Print dialog/device output requires a manual hardware review before release.
- pdf-lib is a candidate for page copy operations, not a general PDF fidelity/encryption/redaction engine. Its older stable release is a maintenance risk; re-evaluate at release.
- Tesseract assets must be bundled for offline operation. First-run internet downloads are unacceptable for the final OCR privacy claim.
- 2026-09-30: Ship a narrowly scoped English OCR development workflow (20 pages, bounded canvases and worker lifetime) with reviewed line corrections. Keep scan artwork unchanged and add an invisible searchable text layer to a fresh PDF catalog. Independently reopen and verify every corrected line before saving. Preserve existing selectable/blank pages, refuse forms/encryption and clearly disclose stripped annotations/catalog data. Searchable PDF font supports Western text; arbitrary Unicode remains available in the document editor, not silently substituted into PDFs. Broad handwriting/language/quality support remains unverified.
- Safe redaction must rebuild sanitized output, never merely place black rectangles over source content. Ship only after recovery checks pass.
- Hermes has a documented API; local gateway address alone says nothing about upstream provider locality or its independent tool permissions. No claimed connection before a real test.
- “Harness” identifies no unambiguous product/interface in the request; preserve a generic agent contract and defer named support.

- 2026-09-30: User requested a full spacing/rough-edge hunt, useful feature suggestions and progress reconciliation against a later core inventory. Remove duplicated editor headers and a decorative ruler that did not represent real measurements; compact shared spacing and bound the shell to the viewport. Keep document artwork and editor page margins. A visual audit measures both normal and minimum windows.
- Add bounded embedded outline navigation/page labels, fit-page/view-only rotation and fingerprint-bound personal bookmarks/last-read state. They are reading metadata within the recent list, not PDF edits or exported PDF bookmarks. Clear recents removes this metadata; changed bytes reset it. Outline external actions stay inert pending the safe-link gate.
- Keep search closed until Find/Ctrl F is requested, so an empty panel does not consume page space. Area-selection results use a floating panel and do not resize the page during selection. Observe height changes only in fit-page mode; redundant delayed renders can disrupt selection.
- The later core inventory maps to REQUIREMENTS R32–R36 and FEATURE-TRACKER.md; specialist/enterprise examples remain later/excluded. Product progress is about 40% under explicit rough phase weights, not a measured release schedule. Planning coverage and implementation progress are separate.

- Metadata failure injection exposed premature source-handle invalidation while opening a new file. Commit recent-state updates before replacing handles, serialize mutations and restore prior state on failure; temporary files clean up on write/rename failure. Rescue export of the current document remains available. Workspace metadata is bounded to 8 MiB and source hashing is cached per immutable granted snapshot.
- Give transformed output previews no source id, so reviewing reordered/extracted or OCR copies cannot update the original's reading position/bookmarks. Output saving continues to use the workspace's separately held original capability.
- OCR scan review uses an independent scroll frame around the full image; do not crop the document to reduce dialog whitespace. Keep correction fields alongside the scan at supported native sizes and scroll the highlighted region into the frame when focusing a correction. Version history has bounded side-by-side list/preview panels rather than a large empty stacked area.

- PDF comparison stays read-only and local. Organizer outputs retain a mapping to original source pages, allowing combined/reordered/duplicated pages to be reviewed accurately. Arbitrary versions use explicit physical/manual alignment until a tested automatic matcher exists. OCR-only differences must not imply visible artwork changes. Low-resolution difference previews are bounded and clearly separated from metadata/form/signature validation; source documents borrowed from the reader remain usable after close/cancel.



---


---

<a id="feature-tracker-md"></a>
## 📄 `FEATURE-TRACKER.md`

---

### PDFix scope, progress and useful additions


**October 7 scope change:** R41/A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) add the entire supplied Acrobat comparison to the full plan. Existing estimates below are historical and have not been recalculated for this expanded scope. New targets are planned work, with no new implementation/acceptance claimed.

**Current whole-scope status (October 4):** [complete feature/debug/testing inventory](PDFIX-COMPLETE-STATUS-2026-10-04.md) and [full future list](PDFIX-FUTURE-FEATURES.md). These distinguish older executed tests from newer untested code and unfinished acceptance; older entries below are historical checkpoints. New R40 requires PDF-only fullscreen.


Updated 2026-10-02. Evidence comes from the code, real-file fixtures, native Electron tests and screen captures. This is the full first-release scope, not a list of everything currently implemented. Detailed acceptance criteria are in REQUIREMENTS.md. Phase evidence and the newest test result are in PHASE-LOG.md.

Latest coding additions: page-plan/content/image/document controls, RTF/XLSX/PPTX adapters, Security Sandbox native broker, PDF structural security/destination review, engineering paper presets, calibrated measurements, temporary optional layers, annotation summaries, supported form-data export and Markdown/CSV source previews. The complete October master list is preserved verbatim and mapped in MASTER-GAP-TRACKER.md (R37–R38). These increments are coded; runtime/corpus/security verification remains pending. Current coding estimates and unexecuted acceptance remain separate; the newest checkpoint is appended below.

#### Progress estimate

Current feature-coding estimate after the October parallel additions: **about 65% coded / about 35% feature work remaining**, with roughly ±5 percentage points of uncertainty. This is engineering judgment based on implemented code and the remaining master-list scope, not a measured workload, time estimate or release-readiness score. The historical 54% weighted baseline below has not been revalidated by runtime testing. New code is not counted as verified delivery.

Newest parallel coding pass adds selective structural cleanup, image deskew/OCR review exports, native AI provider connections, Windows request intake, and reviewed range/paper/scaling/N-up/booklet print preparation. Basic text/checkbox field creation, continuous/facing-page rendering, reviewed embedded-file .bin export and exact saved-source AI line selection are now integrated. Assignments and exact remaining scope are saved in PARALLEL-WORKSTREAMS.md. These are implementation increments; they do not close full master-list or security-release gates.

Largest remaining feature groups: broader document/PDF fidelity and Bluebeam interoperability; complete sanitation/vector-preserving redaction and remaining sandbox routes; scanner/OCR/table extraction and additional formats/conversions; batch/workflow support; Windows sharing/installer/update and accessibility/release polish. Runtime/corpus/security/accessibility/clean-machine verification remains separately unfinished.

Planning coverage is complete for the original request, the 38-entry gap checklist, the window/layout additions and the later core-feature inventory. The historical tested-subset baseline was approximately **54%**, using the rough weighted estimate below; this baseline has not been revalidated after coding-only additions. This is engineering judgment, not measured effort remaining or a release date. A feature counts as delivered only within its documented tested limits; green infrastructure checks do not complete an unfinished feature.

| Area | Weight | Estimated implementation | Contribution | Important remaining work |
| --- | --- | --- | --- | --- |
| Foundation | 10% | 100% | 10% | Continue regressions as file adapters expand |
| Reader and navigation | 15% | 80% | 12% | Continuous/two-page views, safe links/attachments, print preview/settings, large-file/accessibility corpus |
| PDF fixes | 25% | 68% | 17% | Broader annotation review, form tab order/font/calculation support, broader compression corpus/resource hardening, vector-preserving redaction and broader removal/corpus verification, broader password/permission/Unicode corpus, split/geometry recovery and corpus expansion, OCR quality expansion |
| Documents/images | 20% | 55% | 11% | Multi-image PDFs, image crop/adjustment, dependable text/document/PDF conversion, RTF/Office/codec adapters and fidelity review |
| AI connections | 15% | 0% | 0% | Provider/agent setup, secure secrets, consent, scope, citations, integration tests |
| Windows/compatibility/polish | 10% | 30% | 3% | Installer, opt-in integration, larger text/screen-reader review, sharing, legacy/Apple evaluation |
| Release review | 5% | 10% | 0.5% | Security/license/SBOM review, performance and clean-machine checks, signing/distribution if requested |
| Total | 100% | Approximate | 53.5% (rounded to 54%) | Full product remains in development |

Original baseline phases 1 and 2 passed their initial gates. The expanded reader/release requirements are additional unfinished work; they do not retroactively make the baseline tests broader than they were. The user-directed editor and polish slices are pulled forward dependencies, not completion of phases 3–7.

#### Feature coverage and exact remaining gates

| User need | Current state/evidence | Completion gate still required |
| --- | --- | --- |
| PDFix name and supplied logo | Exact supplied master retained; source/master hashes match | Separate inspected small/dark/monochrome packaging assets |
| Open/drop/reopen, Files/Favorites/search | Native file-store and foundation tests | Multi-file selected workspace/search and newer format fixtures |
| Original safety and useful errors | Exclusive new-copy writes; alias/existing/stale/oversized tests | Every new writer repeats source/output preservation checks |
| Familiar Word/Docs-like Workspaces | Actual rich editor, DOCX/TXT/source adapters; editor tests | Broader import fidelity; full document layout is not promised |
| Editing permitted downloaded documents | Direct basic editing of supported types, selectable/OCR PDF text copies with warnings | Add supported PDF objects/text edits and further adapters; permission does not guarantee universal format fidelity |
| Reliable PDF selection/readable text | Word rectangles, awkward-column fixtures; readable page text | Tables, footnotes, captions, rotated-text corpus and semantic uncertainty review |
| Render/search/page navigation/zoom | Real PDF.js pages, worker assets, local text search, page references | Next/previous occurrence navigation, selected-file search and performance corpus |
| Fullscreen/sidebar/focus mode | Native view controls and layout tests | Larger-text/assistive-technology/manual Windows review |
| Compact, polished screens | Repeated editor rows removed; viewport bounds and measured screen audit | Continue audit with each new workflow; subjective perfection is not a test result |
| Outline, page labels, personal saved pages | Bounded outline rendering, source-bound reading metadata, navigation tests | Arbitrary internal link positions and label-based jump; external links stay inert |
| Fit page/width and view rotation | Reader controls; original-copy byte comparisons | Continuous/two-page layouts and presentation workflow |
| Print | Bounded all-page raster preparation and OS handoff tests | Ranges/paper/orientation/scaling preview and physical printer review |
| Merge/insert/reorder/rotate/delete/extract/split | Page organizer real output/reopen tests; crop boundary, millimeter margins, paper fitting and undo/redo; insert by adding/reordering pages; ordered range/odd/even extraction, every-N/custom-group splitting with independent per-file reopening and exclusive-folder saving | Size/bookmark split rules, operation recovery, broader geometry/split corpus and stronger structural preservation |
| Highlight/underline/notes/comments/drawing/text boxes | Persistent PDFix annotations, undo/redo, source-bound recovery, preview/reopen checks, preserve/flatten/copy and reader visibility/print choices | Broader third-party annotation editing, reply threads/comment exchange, visual/performance/accessibility corpus; Western text-box font limitation |
| Forms and basic saved visual signature | Supported AcroForm text/check/radio/choice values, required/blank guidance, confirmed typed/drawn/image placements, explicit saved-signature library, preview/reopen and independent recovery | Custom PDF tab order, broader fonts/calculations and real-form/accessibility corpus; certified/signed/encrypted/XFA writing refused; no arbitrary form JS |
| Guided signature/date/initial locations | Selectable label suggestions on the current page, manual placement for scans, explicit content/date/location confirmation | Broader uncertain label/OCR detection and placement corpus; unconfirmed composer content is recovered but never inserted |
| OCR with correction and searchable output | Bundled printed-English engine, real scan/mixed-page and pixel/text checks | Skew/low-resolution/cropped/rotated/handwriting/language corpus, cleanup and language choices |
| Compression with quality/size preview | Lossless stream/object compression and optional supported non-JPEG image optimization; actual size/larger-result disclosure, independent page reopening, original/output artwork review and protected copy saving | Larger real-file/filter/image/form corpus, native process hard memory limits, clean-machine/installer and full dependency notice review; no downsampling, existing-JPEG recompression, sanitization or PDF/A claim |
| Permanent redaction/hidden-info cleanup | Clean-image reconstruction removes selected pixels before encoding; fresh image-only PDF strips original text/fields/links/metadata/attachments; native object/stream verification, independent whole-page pixel checks and disk hash verification; region-only recovery | Vector-preserving text/image/object redaction, larger varied-file/font/color/optional-content corpus, independent forensic probes and hard resource containment; current mode flattens all pages |
| Password protection/removal | Local AES-256 opening/owner passwords, print/copy/edit permissions, supplied-owner authorization for removal/change, independent text/pixel checks, review and immutable disk-verified new-copy saving and direct hash-bound reopening; Unicode/image/multi-page fixtures pass | Larger modern/legacy/password-normalization/extension/real-file corpus and hard native resource containment; signed/certified/XFA writing refused; other tools still need an authorized unprotected copy |
| Create PDFs from supported text/documents/images | Coded multi-image PDF collection with page order/duplicate/remove, individual setup/crop/tone, Undo/Redo, exact-source recovery and complete output preview; runtime verification pending | Coded document PDF export with font/page setup, automatic page breaks, output review and disk verification awaiting runtime evidence; manual page breaks and broader corpus |
| Common conversions | DOCX/TXT exports, reviewed/selectable PDF text import and still-image → PDF with layout review | Coded document/source-text PDF export awaiting runtime evidence; Coded RTF import/export and document view zoom awaiting runtime evidence; Office, coded PDF-to-PNG/JPEG page export awaiting runtime evidence, coded edited-image PNG/JPEG export awaiting runtime evidence and broader preservation choices |
| Add/edit PDF text/images and metadata | Coded PDF content workspace: supported original standard-font text replacement and page-image replacement, direct text/image additions, placement/resize/font controls, undo/redo, preview/comparison/new-copy saving and source-bound recovery; runtime verification pending | Broader original-font/content-stream support, nested Form image editing and broader image compatibility, persisted editing of saved additions, broader metadata/XMP editing and fidelity corpus |
| Image coverage | Pixel-bounded PNG/JPEG/static WebP/supported BMP previews; camera orientation, transparent image → PDF, source-bound page-settings recovery | Coded crop/brightness/contrast and multi-image output awaiting runtime verification; broader BMP/PNG/color-profile corpus; TIFF/HEIC/Live Photo codecs |
| Office, legacy and Apple files | Basic simplified DOCX only | Coded simplified RTF import/export awaiting runtime evidence; Coded XLSX raw-value editing/export awaiting runtime evidence; Coded PPTX simplified preview/text editing/export awaiting runtime evidence; legacy/Apple decoder review; honest unavailable labels until corpus passes |
| Compare two versions and PDF outputs | Local side-by-side artwork, bounded literal text changes, visual change map, linked/independent pages/scrolling; source/output page-plan alignment; comparison tests | Automatic alignment for arbitrary inserted/reordered pages, higher-resolution difference controls and broader real-document corpus; non-PDF conversion review |
| Batch processing | Planned | Per-file queue/progress/cancel/results, output location/naming/collision behavior; queue only working operations |
| Recovery/versions/undo | Editor history/crash recovery; separate markup, form and image-settings recovery; unplaced signature composer recovery; failed-save guard and rescue-copy tests | Recoverable other operation outputs and broader editor/history corpus |
| Sharing/cloud links | Planned | Windows share handoff; chosen cloud service/account and explicit upload/share consent |
| AI across selected files | Planned | Separate provider/agent connections, secure secrets, per-request endpoint/file consent, page/line citations, injection/read-only controls |
| PDF/A, PDF/X and tagged-document checks | Evaluation/later scope | Reviewed validators and actual compliance evidence; appearance or OCR is not a standards claim |
| Accessibility and Windows integration | Keyboard/focus/local processing and lifecycle boundaries implemented | Scalable UI text, screen reader review, installer/uninstaller, Open With/opt-in associations/default-reader flow |
| Release quality | Locked dependencies, notices and actual-file safety tests | Full adversarial/security/license/SBOM/performance review and clean-machine installation |

#### Useful lower-complexity additions

Fit page, temporary view rotation, document outline, named saved pages and resuming the last-read page are implemented in this polish slice. Next useful smaller additions, ordered around existing adapters:

1. **A searchable shortcut-help panel:** coded with current-document actions, disabled explanations, keyboard labels and F1/Ctrl+Shift+P; runtime/accessibility verification pending.
2. **Next/previous search matches:** coded with occurrence counts, F3/Shift F3, range highlighting and cancellation; runtime verification pending.
3. **Broader page selection:** ordered ranges and odd/even presets are implemented with undo and safe-copy output. Add saveable presets and recoverable page recipes.
4. **Multi-image PDF layout:** ordered collection, individual page setup and exact-source recovery are coded. Runtime verification and broader compatibility remain pending.
5. **Broader page geometry review:** crop boundary, reset, paper fitting, undo/redo and copy saving are implemented. Expand varied real-page/transparency/font fixtures and recoverable page recipes. Cropping hides content and never securely redacts it.
6. **Reading appearance options:** verified larger UI text and a comfortable/compact density choice, checked across dialogs and minimum window sizes.

These are smaller relative to the next group; they still require relevant output, safety or visual verification. Recommendations are based on this codebase's current adapters, not a promise that each takes a fixed amount of time.

#### Useful larger additions

1. **Broader guided forms and basic signing:** core supported fields, blank/required guidance, confirmed placements and saved visual signatures are implemented. Add custom PDF tab order, broader appearance fonts, reviewed calculation support and a real-form corpus.
2. **Broader markup review:** core persistent PDFix markup is implemented. Add third-party annotation editing, threaded comments and comment exchange only after preservation tests.
3. **Broader comparison:** the core side-by-side PDF view is implemented. Add automatic matching for inserted/reordered pages, high-resolution sensitivity controls and source/output review for other formats.
4. **Broader compression:** the core measured lossless/JPEG preview is implemented. Add broader real-file/filter/color coverage, native memory containment and clean-machine distribution verification.
5. **Vector-preserving redaction:** the clean-image removal mode is implemented and verified. Add reliable text/image/object removal while retaining unmarked vector content, with broader recovery/forensic probes.
6. **Selected-file AI:** configurable providers/agents, Windows-backed credentials, explicit transfer consent, cited answers and read-only proposed edits.

#### Later and excluded first-release items from the supplied inventory

Later candidates: cloud/shared reviews, online forms and response collection, external signature requests/tracking/templates, accessibility repair, archival/print standards validation, page numbering/headers/footers/watermarks/Bates workflows if users need them. They must not appear as functioning tools now.

Excluded from the first release: bulk signature/payment workflows, PDF portfolios, barcode fields, advanced print-shop color/trapping, geospatial/3D measurement, embedded multimedia playback, and presentation/marketing generation. The inventory does not authorize silently expanding PDFix into a full enterprise suite. Basic fill-and-sign, certificate validation and external signature-request services remain distinct capabilities.

#### Next implementation order

Core reader/polish, PDF comparison and PDFix markup slices are implemented within their documented limits. Continue the remaining phase-3 broader annotation/form review, broader compression verification, safe-redaction and password-writing gates, plus broader geometry/splitting review and operation recovery. Broaden comparison alignment and non-PDF conversion review alongside the format adapters. Broaden OCR quality alongside those operations. Apply small reader/page usability additions when they support those flows. Continue staged documents/images, AI, Windows/compatibility and release work. Keep every incomplete gate visible; do not mark the full goal achieved while any required feature or verification remains missing.

#### October master-list coding status

| Master target | Code added | Remaining acceptance evidence |
| --- | --- | --- |
| S00 Security Sandbox | Native qpdf AppContainer/Job Object broker and renderer restrictions/status | Hidden Windows containment/cleanup/cancellation/clean-machine/security review; other native Node decoders still need stronger isolation |
| M01.06 Safe links/attachments | Current-page link list, internal page/label resolution and source-bound native-confirmed direct HTTP/HTTPS URI opener | Attachment chosen-save support, indirect/direct/unusual link corpus, OS handoff/cancellation review |
| M01.07 Security report | Bounded structural inventory, incomplete/encrypted findings and report text export | Malformed/encrypted/hidden structures corpus; no certificate validator or malware verdict |
| M03.01 Paper sizes | Shared Letter/Legal, ANSI A–E, ARCH A–E, ISO A0–A4 geometry/recovery presets | Dimensions/orientation/crop/round-trip corpus and actual printing |
| M03.04 Measurement | Confirmed scale, distance/open length/closed perimeter/simple polygon area, keyboard placement | Calibration/rotation/UserUnit/polygon/keyboard corpus; temporary results only |
| M03.06 PDF layers | Actual optional group visibility/defaults/cancel in current page view | OCG/radio/OCMD/visibility expression corpus; changes do not affect output or printing |
| M04.03 Form data | Reviewed supported current-value JSON/CSV export, omissions and formula-safe CSV | Field/value/encoding/privacy/recovery/export interruption corpus |
| M04.07 Annotation export | Current/all/range source annotation text summary with author/date/page/reply references | Third-party annotation/reply/encoding/permission/interruption corpus |
| M06.01 Format previews | Basic Markdown and quoted CSV table preview while preserving source editing | Real files/UTF-8/selection/complex syntax/limits/accessibility corpus |

All other master-list targets and full first-release/release gates remain tracked, not completed by this coding round.

M08.04 trustworthy file details are also coded (geometry/UserUnit, metadata, source hash, exact permission/encryption fact boundaries, chosen JSON report). Runtime/security/corpus acceptance remains open. Password field values are withheld from schema/UI/export/recovery; original PDF data remains.


#### 📅 Fast parallel coding — 2026-10-03

Named organizer workflows now save exact arrangements, source fingerprints and split settings. Loading requires fresh native selection of every exact original, validates before replacing the current plan and requires a new output preview. No automatic export. 20 workflows/128 KB each; atomic local storage, duplicate names refused, explicit deletion. Workflows contain unencrypted source descriptors and are managed separately from generic recovery.

Actual-size tiled printing is integrated with chosen paper/margins, 0–25 mm overlap, fixed row/column pitches, partial edge crops and at most 100 output sides. Full-size source images are clipped in both actual previews and print HTML; alignment/trim marks and sheet/row/column labels sit outside artwork. Tiling requests one-sided/100% output and excludes N-up/booklet. Existing per-source and aggregate raster budgets remain; lower DPI changes sharpness, not physical scale. Physical printer, driver scaling and alignment remain unverified.

Possible blank-scan review is integrated with the organizer. An explicit range of at most 50 original pages is sampled; text, all annotations, hidden crops and optional layers are retained/refused. Every proposal starts unchecked and requires an actual full-page review. Returning a selection removes nothing. A separate organizer button removes all matching output occurrences only after source-fingerprint checking; at least one output page remains, Undo/recovery are retained and a new output preview is required. Brightness statistics never prove blankness. Source/sample SHA-256, page labels and geometry accompany the reviewed selection. Shared PDF.js waits and owned render operations are cancellable/bounded; original shared document is retained.

Interface readability controls are saved: standard/125%/150% text and stronger contrast, with wrapping/scrolling controls and persistent local preference. PDF artwork/text layers and document fonts are not CSS-zoomed. Broad keyboard/screen-reader/large-text/contrast verification remains a release gate. Field-builder recovery has a separate counted privacy section and explicitly confirmed native cleanup of only known local recipes/temp files; original/exported documents, workflows, signatures and AI connections remain.

Three subagents are coding the next slices: editable PDF bookmarks; page numbers/headers/footers/watermarks/stamps; radio and choice field creation. These unfinished slices do not count as delivered. Runtime testing, app launches, online requests and broker execution remain deferred. The complete master list and product/release scope remain active.


#### 📅 Bluebeam/Revu scope saved — 2026-10-03

**Planned / acceptance open:** R39 and B01–B12 are saved in [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md) and MASTER-GAP-TRACKER.md. User priority is drawing/comment review. Existing annotation visibility, page notes and summaries are starting points; full Revu comment threads/states/custom data, preservation, exchange and drawing-review coverage are not complete. No Bluebeam runtime/round-trip testing was performed.


#### 📅 Integrated coding checkpoint — 2026-10-03

Reader View options now opens editable document outlines and page numbers/stamps workspaces. Native source-bound inspect/build/cancel/discard/output APIs and exclusive chosen-copy saves are wired through preload; close/render-loss/quit dispose both services. Bookmark editing supports plain labels and physical page targets, branch operations and bounded full original inventory; unsupported destinations/protected sources are refused. Replacement requires inventory consent and native/independent PDF outline verification plus actual output review. Old outline objects may remain; this is not sanitation.

Page decorations support chosen pages, page numbers, headers/footers, text watermarks and DRAFT/APPROVED/REVIEWED stamp artwork, with Western-font/ASCII restrictions, per-page resource cloning, unchanged source-object/geometry verification and every selected page rendered before review/save enables. Artwork can cover original content and needs review. Signed/encrypted/certified/XFA sources are refused.

Radio groups, dropdowns and single-select lists extend v1 field-builder recipes without IPC changes. Separate radio widgets share one field name; at least two unique exported buttons are required, and defaults are unselected. Choice labels/export values are explicit, with an empty-value dropdown placeholder and unselected list. Native and independent PDF.js output checks cover geometry/defaults/flags/options/tooltips. Radio/choice recovery remains local and unencrypted, and separate recipe privacy controls apply.

Compilation: Vite completed with 187 modules (index-D_cSo899.js / index-dkOErLTz.css); targeted integration/privacy/accessibility source syntax checks passed. This includes readability controls and separate form-recovery privacy controls. No app, worker, broker, printer or online runtime test was launched. Preservation/security/real-file/accessibility acceptance remains open. Bluebeam/Revu requirements were saved separately; these additions do not establish Bluebeam interoperability.


#### 📅 Drawing review and markup coding — 2026-10-03

Three subagents completed native review inventory, the comments panel/saved filters and drawing tools. Root connected main/preload/reader/action finder/departure handling and added markup-location and exact embedded sheet-label navigation.

Existing-source comments: a read-only native PDF inventory now reports literal subtype, identity, plain comment, author, subject, dates, reply/group references, state/model, flags/locks, appearance/popup availability and unknown field names. Raw object references determine relationships; NM names never guess parents. Shared annotation instances have distinct keys, and ambiguous/orphan/outside-selection/cyclic parents remain explicit. Popup rows are omitted while owning comments report popup availability. Rich/private values are not decoded; no actions/HTML/resources execute. Signed sources are inventory-only, with certificate validity unable to verify. Encrypted sources need an authorized decrypted copy. Limits: 100 MB, 500 physical pages, 10,000 source annotations including popups, 8 MB review data, 16,384 characters per comment, 4,096 per metadata field, bounded graph/object/stream parsing and two-minute worker deadline. Native workers have resource limits, not an OS sandbox. Cancellation waits for worker termination; renderer loss restarts the service after that termination.

Review comments: a collapsible/resizable bottom panel inspects all/current/explicit-range pages, checks source SHA-256 against the actual opened snapshot, searches/filter/sorts literal fields, paginates 100 rows and displays bounded reply/group branches and source warnings. Selected keys survive filtering/sorting. Ten explicitly saved local named filter sets have bounded storage and explicit deletion; filter text can be sensitive and is retained locally. TXT/CSV export previews the exact filtered source snapshot and requires a review checkbox plus native filename selection. Formula-looking CSV cells are inert. It is a report, not an annotation-exchange file or proof of third-party preservation. Imported comments remain read-only. Saved/current source data excludes unsaved PDFix markup drafts.

Drawing navigation: clicking a comment navigates to its physical page and temporarily outlines its PDF rectangle, with rotation/crop-aware viewport mapping and an optional zoom to bounds. Return to previous view restores page, mode, zoom/fit, view rotation and scroll position. The highlight changes no saved artwork. Exact embedded page-label search supports repeated labels with physical-page disambiguation and at most 50 visible matches; label titles are never inferred from drawing artwork. Source labels are kept separately from shortened display labels, bounded to 4,096 characters each/1 MB overall.

Drawing tools: line, arrow, scalloped revision cloud and text callout are added to existing markup tools, with red review color, editable callout text/size, Undo/recovery and actual PDF output preview. Native/model recovery limits agree on 500 marks and 20,000 generated drawing points. Generated annotation identity, native geometry/appearance ownership and reopened appearance bytes are checked; independent PDF.js checks match annotation IDs and line endpoints/endings. PDF.js does not expose every cloud/callout field, so those fields use native reopen checks plus actual preview. Callout text uses the existing Western font restrictions; foreign comments stay non-editable. Existing flattening and protected-source restrictions remain. These checks are code paths, not runtime results.

Verification performed: 17 changed integration/module files passed syntax checks; Vite built 194 modules successfully (index-F2AfmZe0.js, index--uBMjJ9a.css, pdf-job.worker-Bj1F3Tq7.js). No app, native worker, sandbox broker, runtime test, online request or printer was launched. Real-file/Revu round-trip fidelity, complete foreign annotation preservation, proprietary custom data, editing imported threads/statuses, FDF/BAX/BTX interchange, Studio and broad accessibility/security validation remain open. This advances R39/B01–03/B05–06/B09 and M03.05/M04.07/M07.05 subsets without completing the full master list.


#### 📅 Preserving review copies and workspace access — 2026-10-03

Supported imported plain comments can now be staged for editing, and new replies or explicit standard review-history entries can be added to unique indirect source annotations. Existing author, creation date, subject, IDs, flags, original appearances and unknown/private fields are retained; comment edits change only Contents and modification date. A new reply has its own author/timestamps, exact IRT parent and visible vector note appearance. Current parent workflow state is never inferred or overwritten. Signed/certified/encrypted/XFA sources are refused. Rich-text, grouped, PDFix-owned and FreeText comment edits are refused; additive replies to supported FreeText parents are allowed. Source read-only flags block both operations; locked geometry/contents blocks comment edits without blocking an otherwise supported additive reply.

A native immutable source-bound output service reinspects the exact source receipt, preserves original objects and encoded stream payloads, appends replies to cloned page annotation arrays, and independently reopens the rebuilt copy. Native object, array, geometry, comment, parent, appearance and output-inventory checks must match before output bytes become saveable. Independent PDF.js checks and actual before/after previews of every changed physical page are implemented in the UI. Source files stay unchanged, and the chosen-copy writer saves only the native sealed output. These verification paths have not been executed in this coding pass. This is preserving editing, not hidden-information removal: original metadata/actions/attachments/private data remain. Limits: 100 staged changes, 1 MB combined literal text, 100 MB source/output, 500 pages, bounded graph/stream parsing and two-minute native processing. Replies require UserUnit 1, right-angle page rotation and a crop-contained 16-point note rectangle. Existing visible appearance text may differ from an edited plain comment body.

The comments panel owns the editing workspace and protects staged/unstaged text on close or file departure. Undo/Redo, cancellation, explicit discard/keep, every-changed-page preview and reviewed new-copy save are connected. Drafts currently remain in memory; a separate portable recipe slice is in progress and is not counted as delivered here. Renderer loss waits for native worker termination before replacing the source-bound service. Node worker bounds are not an OS sandbox.

Workspaces now has search and category filters, separate New document/Open a document entries, direct drawing-comment, markup, decoration, outline and form-creation cards, and native PDF/image/document file filters. Read a PDF and Compare drawing revisions use PDF-specific intake; comparison is also in the action finder. Reusable markup styles save up to 20 local named styles and optional default comments, apply only to the next successfully placed mark, and never copy geometry. Explicit delete/clear and bounded corrupt-library export are included. These unencrypted local libraries remain separate from general recovery.

Source saved; combined compilation is pending the current overlay/color/portable-draft slices. Runtime tests, app launches, native worker/broker execution, online requests and printer checks remain deferred. Full Bluebeam/Revu fixture and round-trip acceptance, proprietary formats/data, sheet sets/takeoffs, broad editing and the complete product/release goals remain open.


#### 📅 Integrated overlay, color and portable review drafts — 2026-10-03

Drawing comparison now includes transparent and cyan/magenta overlays, reused from the actual rendered page canvases. Manual translation ±2,000 physical points, scale 25–400%, clockwise rotation ±180°, opacity 10–90% and reset apply only to the current physical page pair. Expanded union bounds retain transformed artwork; original/compared names, physical numbers and bounded embedded labels remain explicit. Existing linked zoom/scrolling are retained. Overlay and each tint scratch raster are capped at 1,600 pixels on the longest edge / 2,560,000 pixels; display expansion caps at 12,000 CSS pixels. Labels are bounded to 200 characters and a ten-second cancellable wait. Changing physical pairs resets alignment. Text/difference/whole-document checks retain their existing physical/page-plan pairs and ignore overlay adjustments. This read-only visual alignment neither transfers comments nor proves design changes.

Review metadata now includes literal standard /C and /IC colors: transparent/DeviceGray/DeviceRGB/DeviceCMYK, raw finite 0–1 component arrays, and absent/malformed/unavailable notices. Selected-comment details and TXT/CSV report exports include this metadata. Screen swatches are explicitly approximate; appearance/private colors are not decoded. Optional descriptors preserve older inventory compatibility, canonical receipts include new native fields, and source color declarations remain checked when building edited copies. CSV uses a named 39-column mapping to keep metadata and scope aligned.

Portable review drafts can be explicitly saved/loaded as UTF-8 JSON. They contain exact source SHA-256, inventory receipt, inspected page sequence, supported staged changes and optional current unstaged composer; no source PDF objects or output/save receipts. Limits: 2 MiB file, 1 MiB canonical recipe, 100 changes, 16,384 characters per comment and 200 per author. Native chosen-file reading is bounded, checks file length/change timestamps and fatal UTF-8, keeps the active source untouched and rechecks source identity. Renderer validation checks known schema fields, exact source/inventory/pages/references/eligibility and shows the normalized recipe before explicit confirmed replacement. Undo restores both staged and unstaged text. Loading never automatically builds/saves a PDF. Recipe saving does not mark the PDF copy saved, and departure protection remains. Comment/author text in exported recipes is unencrypted; no automatic review-draft crash recovery is claimed. Standard review-history entries can have empty comment text when a required author and nonempty supported state are supplied; parent state remains unchanged.

Workspaces has a direct Compare drawing revisions entry and comparison action-finder command. PDF, image, document, XLSX workbook and PPTX presentation workspaces have purpose-specific native file filters. Settings discloses exported review recipe storage separately from local recovery and named libraries. All source slices from the three agents are integrated; prior in-progress/read-only statements are historical and superseded for these supported operations.

Compilation completed successfully with 202 Vite modules: index-BHehx5iH.js, index-DZyzn4is.css and pdf-job.worker-Bj1F3Tq7.js. Targeted source syntax checks passed. The restricted first build attempt encountered child-process EPERM; the authorized compile-only retry succeeded. No app, native worker, sandbox broker, runtime test, online request or printer was launched. Verification code paths are implemented, not runtime/Revu acceptance results. B02/B03/B04/B06/B07/B10 subsets advanced; all full compatibility, preservation, release and master-list acceptance targets remain open.


#### 📅 Sheet-set and takeoff integration in progress — 2026-10-03

Reviewed comment export now supports a bounded JSON metadata snapshot alongside TXT/CSV. JSON includes exact source and inventory hashes, inspected physical pages, current matching annotation rows, standard colors, structural parent references, scope and warnings. This is displayed metadata only: no appearance resources/private dictionaries or import/third-party annotation interchange is promised. Filtered parents can be absent. The existing 8 MiB export bound, exact preview, review checkbox and exclusive native chosen-file save apply.

The native sheet-set library is saved in desktop/sheet-sets.cjs: 20 named sets, 500 ordered sheet references, 10 original snapshots / 100 MB aggregate, 128 KB per item and bounded local library. Stored records contain original path/name/size/fingerprint descriptors, declared page counts, user sheet titles/revisions and order, without source bytes or active IDs. Declared counts are metadata; the UI must verify actual PDF counts/references before adoption. Local persistence is atomic, duplicate names are refused, corrupt/external-changed storage fails closed without replacement, and load requires a fresh native picker for every exact original. Source SHA/size and unchanged session/saved-item identities are verified before adding handles. Remembered paths are never auto-read. This groups references only and neither merges PDF bytes nor transfers comments between revisions.

Root saved sheet-set APIs, purpose-specific source selection, direct Workspaces/action-finder/reader access and named-library privacy disclosure. Takeoff JSON intake is bounded to 2 MiB, checks same-handle file length/time and fatal UTF-8, and preserves the active source. Source-changing routes protect sheet sets and takeoff entries before opening a new file. Reader disposal/application close also await takeoff departure. The two UI slices are still coding; source integration alone is not a delivered runnable UI claim. Runtime tests remain deferred.


#### 📅 Integrated sheet sets, revision references and takeoff ledger — 2026-10-03

Sheet-set UI and the native library are now integrated. Start from an opened PDF, explicitly add related source PDFs, arrange up to 500 sheet references, change user-entered titles/revision labels, move/remove/add pages and navigate Previous/Next sheet. Lists paginate 100 rows. The selected source has one owned drawing reader with original comments; same-source navigation reuses it, while source changes protect unfinished comment/takeoff drafts before disposal. Title/revision typing commits immediately without replacing the focused input; Undo captures each focused edit. Actual source SHA/page counts and bounded embedded labels are inspected before adoption. Source count remains 10/100 MB aggregate; each PDF supports up to 500 pages. Labels are limited to 200 characters / 100,000 UTF-8 bytes per source. User labels are distinguished from actual embedded labels and physical page references.

Named sets save/restore order and labels. Save keeps a bounded unencrypted original descriptor library, with explicit removal independent of general recovery. Maximum 20 sets / 128 KiB per saved item / about 2.6 MiB library. Native restores select every exact original with fresh chosen-file permission; source size/SHA/session/saved-item fences precede handle commit. UI checks actual declared counts/references and previews the proposed arrangement before explicit confirmed replacement. Revision replacement separately previews both actual original/new drawing pages (2 MP each, sequential owned parsers), requires explicit confirmation and changes only one set reference. Undo retains the old source/reference. Existing comments remain with their original PDFs. No PDF bytes are merged or physically replaced, and no comments are transferred. Physical PDF revision replacement, preservation-aware comment mapping and automatic sheet matching remain future gates.

The new takeoff ledger retains explicitly named/grouped finished distances, perimeters, areas and count points. Length/area entries keep their own confirmed page reference scale; counts do not claim calibration. Canonical PDF coordinates, source SHA, physical page, crop bounds/UserUnit, label and computed mm/mm²/count quantities are source-bound. Group totals never mix dimensions; display/export units convert without changing canonical values. Area boundaries reject repeated/retraced/self-intersecting edges; count points reject duplicates. Saved entries have remove/Undo and jump-to-page with point overlays. Limits: 200 entries, 1,000 measurement points each, 10,000 aggregate including scale references, 10 Undo snapshots / 4 MiB. Floating-point and four-decimal display precision do not establish engineering accuracy; reference placement and a uniform scale need human checking.

Reviewed JSON preserves the complete separate ledger; inert CSV contains entry quantities and grouped totals, without all points/calibration references. JSON loading validates strict schema, exact source SHA/page count, actual source crop/UserUnit, bounded labels and quantities recomputed from points/reference scales before explicit replacement; Undo restores previous entries. JSON files/exports are capped at 2 MiB, per-source steps at 30 seconds and imported geometry checks at two minutes. Labels are truncated at 200 characters or blank when unavailable, with physical-page references retained and disclosed. No automatic local/cloud persistence or PDF measurement-annotation embedding is claimed. Copy-restricted sources disable retention/load/export. File/doc/bytes/ID bindings and SHA are rechecked across source waits/picker/review. CSV does not mark the full ledger saved. Busy or unsaved ledger departure requires keeping the reader open or explicitly discarding quantities; readers/application close and source-changing routes await this guard.

Reviewed source-comment metadata now also exports JSON within the existing 8 MiB bound. It contains source/inventory SHA, inspected pages, matching displayed annotation rows/colors/parent references, warnings and scope. Filtered parents can be absent, and appearances/private data are not embedded. This is a data snapshot, not FDF/XFDF/BAX interchange or an import route.

Native app close now always requests renderer departure when its close handler is registered, because the shared boolean editor-guard can be cleared by another workspace. Finish-close is the sole ordinary close authorization after UI departure, and native file operations still block it. An unavailable/crashed/unregistered renderer can close without waiting for a missing handler. This source fix addresses unfinished in-memory work being skipped; runtime close/cancellation behavior remains unverified.

All three subagent slices and root integration are saved. Eight root integration source syntax checks passed, plus changed main/preload readiness checks and the agents' targeted module checks. Vite compiled 208 modules successfully: index-Bk7KS8cS.js, index-C8IQF8EQ.css, pdf-job.worker-Bj1F3Tq7.js. No app, native worker, sandbox broker, runtime test, online request or printer was launched. This advances B05/B08/B12 and M03.04/M03.10/M03.11 subsets. Revu interoperability, embedded persistent measurement markups, physical revision replacement/annotation mapping, broader formats/editing and all release/master-list acceptance remain open. Prior in-progress checkpoint statements are historical.


#### 📅 Persistent takeoff copies and reusable decoration templates — 2026-10-04

This later checkpoint supersedes earlier statements that takeoffs are separate-ledger-only. The drawing takeoff ledger now opens a frozen PDF-copy workspace. A source-bound native writer adds one Line (distance), PolyLine (open perimeter), Polygon (closed perimeter/area), or Ink (count) annotation per entry. Explicit vector appearances include numeric quantity labels in the chosen display unit. Unicode comments/author and canonical PDFixData retain original points, physical-page identity, source fingerprint, calibration and recomputed quantities. Maximum 200 entries / 10,000 aggregate points, 2 MiB request, 100 MiB PDF and 500 pages. Source crop/media intersection and UserUnit are checked natively. Physical pages are authoritative; sheet labels remain supplied descriptions independently reviewed against the source. Counts carry no length calibration.

The native construction manifest allows only cloned/appended selected page Annots arrays and normalization of raw-stream Length to unchanged encoded payload size. All original objects, existing annotations, unknown/private fields and encoded stream payloads are retained. After serialization, native reopening compares every declared object, geometry/trailer references, exact annotation order, appearance bytes and canonical metadata. The immutable native receipt is fenced to source SHA/token/generation before an exclusive chosen-file Save Copy. Source-bound ledger math is generated from the same pure UI source during compilation. The worker has a two-minute deadline, 256 MiB old-generation heap, 16 MiB single / 64 MiB aggregate compressed-object decoding budgets; this worker is not an OS sandbox. Signed, certified, encrypted, XFA and unsupported sources are refused. No standard Measure dictionary or proprietary Bluebeam measurement editing is promised.

The UI also checks output/ledger/metadata hashes and exact annotation types, coordinates, text/author and appearances with an independent PDF reader. Every changed original/output drawing page must be visibly reviewed before saving (2 MP per preview). Ledger mutation and measurement controls are held while this copy workspace is open. Cancellation/discard retains the source and full separate ledger. Leaving protects unsaved JSON ledger data; saving a PDF does not mark that separate portable recipe as saved. Exported PDF annotations include unencrypted author, names and complete point/calibration metadata. Recovering this embedded metadata into an editable ledger is a remaining feature; existing JSON import remains source-bound.

Decoration templates now save up to 20 named styles / 64 KiB locally: standard font, inset, page numbers, headers, footers, watermarks and Draft/Approved/Reviewed text stamps. Apply requires explicit confirmation and invalidates a previous PDF preview; current physical-page selection and range stay selected. Templates exclude source IDs, page selection, generated PDFs and receipts. Named save, apply, delete/clear and bounded raw-text export are explicit. Corrupt storage fails closed; concurrent library changes are checked before writes. Text/styles are unencrypted local-profile data, separately disclosed in Settings & privacy, with deletion in Page numbers and stamps. Text stamps do not certify approval or create certificate signatures.

Source and build milestone only. Runtime, native-worker, broker, app, print and Revu acceptance tests remain deferred at the user's request. These additions advance B10/B12 drawing workflows without completing the full Bluebeam or master requirements. Earlier subagent source for templates/preview UI was retained; root completed the missing native writer and integration after those agents hit the account limit. Full interoperability, broader editing/format fidelity, release packaging and security/accessibility acceptance remain open.

Final compilation for this checkpoint succeeded: 214 Vite modules, index-tK5KmaBF.js / index-DXArFu-x.css. Targeted source syntax checks passed. No runtime tests or app/native-worker/broker launches were performed.


#### 📅 Recover and revise embedded PDFix takeoffs — 2026-10-04

Saved native read-only recovery, independent-reader comparison and actual drawing-page review for canonical PDFix takeoff metadata. The reader's Takeoff quantities panel now has Recover takeoffs from this PDF and a native-processing cancel control. Recovery is explicit, never automatic. Native inspection requires a unique indirect annotation on its declared physical page; exact canonical metadata/author/NM, recomputed quantity, source geometry/UserUnit, Line/Polygon/PolyLine coordinates or count marker strokes and bounded normal appearance are checked. Unsupported versions/malformed recognized takeoffs fail closed; other/unreadable PDFix metadata is reported as untouched. Maximum 10,000 source annotations, 200 recovered entries, 2 MiB aggregate metadata / 4 MiB complete receipt, two-minute worker deadline and existing bounded worker heap/decode budgets. Protected/signed/XFA and unsupported sources remain refused. This worker is not an OS sandbox.

Each adopted entry receives a new identity bound to the currently opened PDF SHA, retaining original source SHA, annotation structural reference, author and metadata hash as provenance. Optional origin fields are strictly validated and travel with JSON/PDF metadata. Independent PDF-reader checks compare actual source annotation identity/type, bounds, author/text and path/count coordinates; actual crop/UserUnit and shortened labels must match this current source. Every recovered drawing page must be viewed (one reusable 2 MP canvas), then the user explicitly replaces the current in-memory ledger. Source bindings/hash are rechecked after asynchronous steps; cancellation retains the previous ledger. Undo restores it. Recovery is dirty until JSON is saved. Embedded metadata/calibration is untrusted file data and is not authenticated engineering information.

Edit entry now supports reviewed name/group changes and known reference length/unit changes for each calibrated quantity. Saved measurement/reference positions stay fixed. Quantities are recomputed, fully schema-validated and source-fenced before adoption; preview invalidity disables Apply, edits are dirty and Undo is available. Counts carry no length calibration. Editing a ledger alone does not change PDF bytes.

The takeoff PDF-copy dialog now offers an explicit unchecked-by-default option to update supported recovered annotations. Native selection is fenced by source SHA, unique structural reference, original NM/author/metadata hash, unchanged physical-page/path/reference geometry and known annotation fields. Locked/read-only, shared, threaded/replied-to, popup/group/rich/private-extended or independently changed targets are refused. Only declared original page references are removed, replacement appearances/metadata are appended, and all unrelated annotation entries stay in order. Native reopening verifies exact retained objects, arrays, geometry/trailer and new annotation results; the independent reader verifies declared removals and unrelated identity retention before every changed-page actual before/after review. Saving remains an immutable source/token-bound exclusive new copy. Original dictionaries/appearances remain in the retained object graph, including replaced takeoffs; this is neither redaction nor permanent deletion. Leave the update option unchecked to append additional visible annotations.

This supersedes the earlier recovery-pending and always-append-only checkpoint descriptions. Revu/proprietary takeoff interchange, new point/reference placement for an existing recovered entry, deleting embedded annotations and broad compatibility/security/release acceptance remain future work. Full master requirements remain open. No app, native worker, broker or runtime tests were launched; tests remain deferred as requested.

Final compile-only checkpoint: 216 Vite modules; index-BUZLXf5C.js / index-DXf3ZeNo.css. Targeted syntax checks passed. App/native-worker/broker/runtime testing remains deferred, so this is a saved implementation milestone, not runtime/Revu acceptance evidence.


#### 📅 Reviewed XFDF export — 2026-10-04

Workspaces → Review drawing comments now includes Review XFDF export. A frozen filtered inventory builds an actual supported geometry/plain-comment XFDF subset, exact XML and complete omission receipt, reviewed new-file save and native JSON receipt save. Unsupported direct/shared/geometry/types/private appearances are reported. This advances B05/M04.06/M04.07 without full interchange acceptance. [Bounds and remaining gates](docs/DRAWING-XFDF-EXPORT.md); no runtime testing.


##### XLSX shared-string correction and workspace text — 2026-10-04

Removed a misplaced numeric/boolean validation expression from the sharedStrings loop that referenced undeclared variables and prevented ordinary shared-string workbooks from opening. Cell numeric/boolean validation remains, and decoded shared strings now have an explicit 8 MiB aggregate bound. Source syntax check passed; runtime/corpus verification remains deferred. Home now links to implemented AI connection management without claiming no connection is configured, Settings discloses XFDF/receipt exports, and workspace breadcrumb/close/history symbols use correct Unicode.


#### 📅 Three major-gap agents integrated — 2026-10-04

User requested renewed subagents on the largest gaps. All three new agents completed concrete source slices; root integrated and compiled them. Earlier account-limit failures did not recur for these agents.

- Document fidelity: editable tables with ProseMirror cell selection, bounded rectangular spans, row/column/merge/split/header/fill controls and Undo; supported DOCX import and structured DOCX/PDF export; native recovery validation; TXT/RTF explicit tabular flattening. Original column widths/borders, images/nested tables and page-perfect Word preservation remain open. Details: [DOCUMENT-FIDELITY-PROGRESS.md](docs/DOCUMENT-FIDELITY-PROGRESS.md).
- Original PDF editing: bounded embedded Type1/TrueType one-byte and horizontal Type0 Identity-H two-byte ToUnicode maps, per-string multipart TJ edits retaining numeric spacing, reuse of observed source glyphs, preserved stream dictionaries and reopened source-font graph/encoded-program hash proof. Multicharacter/ligature entries omit affected runs while retaining other usable map entries. New glyph embedding, shaping/reflow, Type3/custom/vertical/nested/marked-content editing and complete unrelated-object preservation acceptance remain open. Details: [PDF-EDITING-FIDELITY-PROGRESS.md](docs/PDF-EDITING-FIDELITY-PROGRESS.md).
- Security Sandbox: fixed document-engine AppContainer/Job Object source with exact token/capability checks, one-process/512 MiB/115-second bounds, read-only staged source/request/runtime and three precreated writable output slots. Codec bundle supports nine fixed operations. Root packages the existing standalone Windows x64 Node runtime/license with SHA pins and bundled dependency attribution; XFDF export adopts the contained path exclusively, with no worker fallback. Cancellation observes broker close, source/output validators remain, cleanup failure/unsafe termination permanently closes the service. Broker close observation is subscribed immediately at launch to cover early failures across async boundaries. Other Office/review/takeoff/redaction routes still need adoption. Details: [SECURITY-SANDBOX-PROGRESS.md](docs/SECURITY-SANDBOX-PROGRESS.md).

Root also completed reviewed 11-type XFDF geometry/plain-comment export with exact XML, filtered source identity/fingerprint checks, per-annotation omissions, reviewed exclusive sealed saves and separately saved JSON receipt. Native runtime/security status is shown in Settings. Existing comment TXT/CSV/JSON snapshots remain separate. The XLSX sharedStrings undeclared-variable failure is fixed with an 8 MiB aggregate bound; current format/workspace/AI/privacy text reflects saved capabilities.

Final compilation passed: 224 Vite modules; index-BFhcaNJF.js / index-kVg5VJNm.css; pdf-job.worker-KFHKMFMu.js / document.worker-BXg1i3K9.js. Broker C# and fixed engine bundle compile; targeted JS/CJS syntax checks passed. Build output includes pinned node.exe, engine.cjs, broker manifests and runtime/dependency licenses. No app, broker, document engine, native worker, network/print or runtime tests were launched. Verifier code and compilation are not evidence of executed fidelity/OS isolation/Revu acceptance. User-requested runtime testing remains deferred; full master requirements and S00 remain open. Original master-list source is unchanged.


#### 📅 Integrated images, table grids, nested editing, containment and search — 2026-10-04

Three user-requested agents delivered inline document images, editable/preserved table column proportions, nested original PDF text/image changes with shared Form isolation, and contained-only Office/comment/takeoff/grid processing. Root integrated native source/lifecycle guards, local search across selected files, import cancellation and current capability/status text. The combined build passed: 231 modules, index-CRv3V24I.js / index-Cc33oWd9.css; Windows broker and fixed engine packaging compiled. Exact support, bounds, artifact identities and pending work: [coding checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md).

Source/compile milestone only; no app/native job/runtime tests were launched. Full master, S00, Word/PDF fidelity and Revu/release acceptance remain open. The original master-list file is unchanged. Current 65% coding / 35% remaining estimate is rough engineering judgment (about ±5 points), separate from runtime delivery and beta readiness.


#### 📅 Integrated headers, batch and XFDF import — 2026-10-04

Authored document header/footer exports, reviewed selected-PDF batch compression, supported XFDF import, contained structural security/cleanup and native API/lifecycle/privacy integration are saved. Combined compilation passed with 237 Vite modules and refreshed engine/broker pins. Runtime tests remain deferred; private-beta, full master-list, Security Sandbox and Revu interoperability acceptance remain open. [Exact implementation and compilation evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [batch limits](docs/BATCH-COMPRESSION-PROGRESS.md); [XFDF import limits](docs/PDF-XFDF-IMPORT-PROGRESS.md).


#### 📅 Band import, preserving page order and contained redaction — 2026-10-04

Plain DOCX/RTF header/footer import, exact original-page permutation retaining drawing comments/links/forms/bookmarks, and fixed contained redaction verification are integrated. Combined compilation passed with 240 modules and current engine/broker/source pins. Windows development packaging and per-user install/uninstall sources are saved; no installation or runtime testing occurred. [Current coding evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [Windows package bounds and remaining gates](docs/WINDOWS-PACKAGING-PROGRESS.md). Full master targets and beta/release/security/Revu acceptance remain open.


#### 📅 Table extraction, scoped health report and selection geometry — 2026-10-04

Reviewed PDF-word/local-English-OCR table extraction with corrected-cell CSV save is integrated. A scoped health report adds visible geometry, permitted text, internal-link/URL-syntax, structure-presence and form-label observations with cancellation and JSON export. Rotated/non-unit text selection uses the source viewport's rotation and UserUnit across all three text-layer views. Source/compile evidence only; broader extraction/font/image/accessibility/fidelity/security/Revu and runtime acceptance remain open. [Latest checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md); [table extraction](docs/TABLE-EXTRACTION-PROGRESS.md); [health scope](docs/PDF-HEALTH-REPORT-PROGRESS.md); [selection fix](docs/PDF-SELECTION-GEOMETRY-PROGRESS.md). Original master-list source and full acceptance checkboxes remain unchanged.


##### October 7 major-gap coding checkpoint

Seven feature families are now implemented and compiled: zoom-region/view history, portable table corrections, bookmark splitting, contained rich-document processing, reviewed drawing-page matching, cross-source page drag staging and single-PDF Bates numbering. [Exact scope and remaining acceptance](docs/MAJOR-GAP-CODING-2026-10-07.md). Current runtime/corpus/Windows acceptance and broader scope remain open; original acceptance checkboxes are unchanged.

##### October 7 biggest-gap continuation

[docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md) records literal XLSX table export, reviewed PDF copy/rename/supported TXT queues, and contained bookmark, decoration/Bates, attachment and URI inspection routes. Source/compilation evidence only; current runtime acceptance and remaining full-plan work are not marked complete.

#### 📅 October 7 editing fidelity and feature catalog

The complete adopted planned scope is saved in [PDFIX-ALL-PLANNED-FEATURES.md](PDFIX-ALL-PLANNED-FEATURES.md), including every original requirement, master/Bluebeam row and F01–F42 future item. It is a plan, not a completion claim.

The latest source changes and compilation evidence are recorded in [Editing fidelity coding checkpoint](docs/EDITING-FIDELITY-CODING-2026-10-07.md): supported formatted document bands and DOCX import, original mapped-glyph proofs, manual table merge/split correction, contained form creation and initial-inspection cancellation. [Document PDF output containment](docs/DOCUMENT-OUTPUT-CONTAINMENT-PROGRESS.md) records the new generated-output check route. Runtime, corpus, effective security and release acceptance remain deferred/open. No broad master row is newly marked fully accepted.

#### 📅 October 7 large PDF reading

[Large PDF opening](docs/LARGE-PDF-OPENING-PROGRESS.md) records the newly coded file-backed range route, memory/disk admission, visible slow-file/progress notices, source/cleanup guards and separate reading/whole-file tool capabilities. It supersedes the blanket 100 MiB opening limit for eligible PDFs. The current viewer budget is 1 GiB and 500 pages; per-operation editing/export limits remain. No actual-file performance, runtime or security acceptance is claimed.

#### 📅 October 7 source queue and computer capacity follow-up

[Source range queue repair](docs/PDF-RANGE-QUEUE-PROGRESS.md) replaces the failing 64-request metadata cap with a source-derived queue budget and nearby-read coalescing. [Reading capacity](docs/READING-CAPACITY-PROGRESS.md) adds local memory/processor/graphics estimates in Settings, shared memory admission and smaller preview/read workloads for lower-resource computers. Ten source syntax checks and compilation (266 modules) passed. Current app restart, the actual large drawing, runtime behavior and performance acceptance remain pending. Reading still has 1 GiB/500-page limits, 64 MiB individual range assembly and 100 MiB whole-file tool limits; no lag-free guarantee or broad feature completion is claimed.

#### 📅 Acrobat replacement scope intake — October 7, 2026

R41 adopts the entire supplied comparison: [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) defines all ten categories and A01–A25 work packages, overlaps, priorities, dependencies and acceptance boundaries. The original comparison is preserved in [the intake record](docs/ACROBAT-COMPARISON-USER-INPUT-2026-10-07.txt). The product plan, roadmap, complete planned catalog, future list and status inventory include the new scope. Existing related implementations keep their narrower recorded status; no code, test, acceptance, benchmark or release claim is added. Older completion percentages have not been recalculated for this expanded plan. Covered specialist features become later adopted targets; current containment, consent and no-DRM-bypass rules remain.


#### 📅 October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.

#### 📅 October 11 user intake — F47–F66 / R47–R48

All 20 additions are saved as **planned; expanded target not newly implemented or tested**. Existing overlapping code keeps its narrower status. The canonical per-item list and requirements are in [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md); machine-readable intake is in docs/PDFIX-STATUS-INVENTORY-2026-10-04.json under adoptedFeatureAdditions.

Current coding order: Workspaces, PDF viewing and PDF editing first. Track new local form suggestions/autofill, shell/Office/Edge integration, synchronized-folder compatibility, EML/clipboard creation, local translation/bookmarks, scoped folder search/watch/naming, CSV form merge/signature preparation/fingerprints and production marks/page boxes/thin lines against F47–F66. Keep coded, runtime-tested and release-ready states separate.



#### 📅 October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.



---


---

<a id="final-implementation-plan-md"></a>
## 📄 `FINAL-IMPLEMENTATION-PLAN.md`

---

### PDFix final consolidated implementation plan — October 11, 2026


This is the single work-order document for the complete adopted scope. It reorganizes earlier plans; it does not remove their requirements. Later user instructions govern conflicts with historical plans: PDFix is the adopted name/logo; all features stay free under R46; R48 authorizes explicitly granted folders; A01–A25 adopt the specialist expansion; and R49 authorizes the requested hidden UI/function pass. Existing specifications, dependencies, preservation rules and acceptance gates remain represented within that authorized scope. Do not count overlapping R/M/B/F/A/G/D IDs as separate completed features, or interpret an older "initial-release exclusion" as deleting later adopted A01–A25 work.

#### Delivery order

| Order | Workstream | Remaining implementation |
| --- | --- | --- |
| 1 | Workspaces and clear UI | Finish clean Drawing, Document and Pages rooms, intuitive navigation/return, task discovery, collapsible/resizable panels, contrast, keyboard/focus/accessibility and responsive layouts. Avoid persistent banners and crowded headers. |
| 2 | PDF viewing | Complete smooth bounded large-file reading, selection, search, outlines/destinations/layers, readable text, page modes, zoom/pan/history, fullscreen, page labels and comment navigation across supported sources. Actual SW3 opening/scrolling has targeted evidence; its full-tool gaps remain. |
| 3 | PDF editing | Expand permitted original text/font/image/object edits and preservation, shapes/annotations, form values, metadata, page geometry, undo/recovery and original/output review. Unsupported complex layouts cannot be claimed editable merely by adding text over them. |
| 4 | PDF creation and document editor | Word/Google Docs/DocHub-inspired compact tool categories, clear writing/formatting/insert/layout/review/file paths, tables/images/header/footer/page setup, PDF/DOCX/RTF export, images/scans/clipboard/email to PDF and safe new-copy saving. Keep actual commands integrated. |
| 5 | Bluebeam drawing review | Open/search/jump to existing comments; add notes/replies, edit eligible comments, report locked/unsupported data, preserve foreign appearances/threads/states/identities. Complete revision replacement/comment carry-forward, custom data, reusable tools, takeoffs and exchange. Revu interoperation needs actual authorized fixtures. |
| 6 | Remaining full adopted feature scope | Finish every remaining security, conversion, OCR/scanner/camera, batch/workflow, form, accessibility, printing/prepress, certificate, free local integration, Windows, browser/mobile and specialist item in the scope ledger. Preserve every future and Acrobat addition; external prerequisites do not erase scope. |
| 7 | Digital-pen drawing on PDFs | Complete F67/R50 below as the final feature family in the requested order, with saved editable PDF ink, pen-focused interaction and original preservation. |
| 8 | Full UI/function debugging and release checks | Exercise every implemented command and route, fix confirmed defects, verify outputs independently, and record unimplemented/unsupported/dependency-blocked paths explicitly. Finish applicable security, corpus, recovery, accessibility, performance and installation gates before broad working/release-ready claims. |

#### Core document toolbar — R49

Use familiar organization rather than copying another product's brand or implying feature parity. File, Home, Insert, Layout and Review categories expose existing commands. Keep frequent text formatting, Undo/Redo and PDF export discoverable; use contextual and overflow controls instead of many persistent rows. Preserve selection while applying styles, operation-specific editing holds, native Save dialogs, draft recovery and supported source/code modes. Table/image/page setup/headers/footers/spelling/read-aloud/statistics remain integrated.

October 11 implementation: a compact tabbed toolbar is coded, with persistent basic formatting and PDF/DOCX export, keyboard tab navigation and source-mode handling. Current build/UI evidence is recorded separately after execution; coding alone is not a complete Word/Docs editor or full-layout fidelity.

#### Bluebeam comments — R39/B01–B12 and R49

- Open drawings and display saved markups plus a searchable source-comment panel. Show literal author/subject/text/dates/state, missing parent/group warnings and selected-page location without inferring proprietary meanings.
- New comment opens the actual note tool on the selected comment's physical page or the current drawing page. Add annotations only after a deliberate placement and text entry; preview and save an inspected new PDF copy.
- Edit eligible existing plain comment text and add replies/review history. Keep locked/read-only/grouped/rich/unsupported bodies intact and show visible reasons. New PDFix markups use their owning editor; imported fields are not relabeled as PDFix-owned.
- Retain unknown objects, appearance streams, private data, replies, grouping and identities unless a reviewed operation explicitly changes supported content. Preserve originals and disclose flattening/loss.
- Broaden FreeText and other foreign geometry/appearance edits only with a preserving codec; remove current size limitations through bounded contained routes instead of uncontained fallback.
- Complete physical sheet replacement and reviewed comment carry-forward, Bluebeam custom columns/quantities, BAX/BTX/private adapters and free supported Studio evaluation. Local PDF review is not a Studio connection.
- Validate real Revu round trips before claiming Bluebeam compatibility. The user's earlier converted drawing sample has unknown origin/annotation coverage and is not sufficient proof.

#### Digital pen and handwriting — F67/R50

The user clarified the Microsoft Store reference as writing/drawing directly on PDFs with a digital pen and saving the marks. Exact store-app identity is no longer required for this functional scope.

Required: user-selected pen/highlighter/color/thickness/opacity, responsive stylus strokes, supported pressure handling and explicit fallback on unsupported hardware, palm rejection while a pen is active, predictable pen/touch/mouse navigation modes, stroke selection/move/delete and reviewed erasing, Undo/Redo, shapes/ruler where supported, zoom/pan and rotated/cropped coordinates, multi-page drawing and recoverable local drafts. Save editable PDF Ink/standard annotation appearances to a reviewed new copy, reopen to continue editing, and offer explicit flattening separately. Existing PDFix basic Ink/line/arrow/cloud/callout code is groundwork, not completion of the pen workstream. No handwriting-recognition or exact stylus guarantee is inferred from saved ink.

#### Complete scope, without omissions

Retain **R01–R50, S00, all 71 original M-rows, B01–B12, F01–F67, A01–A25**, and the older **G01–G16/D01–D22** checklists embedded in requirements/product plans. Retain privacy, recovery, integrity, permissions, sandbox, branding/free-app and release invariants alongside user-facing tools.

The machine-readable [scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) contains each stable ID and all authoritative source references, plus original requirement statements and source hashes. The human-readable [remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) lists every current inventory row's coded scope and remaining work, all F47–F67 additions and A01–A25 specialist requirements. Do not discard a target because it appears in several sources or has a compiled partial implementation.

Authoritative earlier scope stays in REQUIREMENTS.md, PRODUCT-PLAN.md, ROADMAP.md, PDFIX-ALL-PLANNED-FEATURES.md, PDFIX-FUTURE-FEATURES.md, PDFix-Missing-Features-Master-List.md, MASTER-GAP-TRACKER.md, BLUEBEAM-COMPATIBILITY-PLAN.md, ACROBAT-COMPETITIVE-PLAN.md, FREE-ACROBAT-ADDITIONS-PLAN.md and READING-WRITING-PRINT-PLAN.md. Architecture, format support, decisions, feature/phase records, original intake records and linked preservation/security/performance/printing documents supply implementation boundaries and evidence. Historical checklists are not current acceptance proof.

#### How completion is recorded

| Status | Meaning and current record |
| --- | --- |
| 100% of required acceptance complete | No broad feature area is certified at this level. This also does not promise software can never crash or encounter an unsupported file. |
| Coded, broader checks pending | Existing implemented subsets retain their exact scope; compiled code does not establish full output, hardware, security or file compatibility. |
| Tested for declared cases | Current document-toolbar/export, standard-comment edit/add, main-screen/layout and viewer-mode cases have scoped evidence. Actual SW3 scrolling passed hidden. The native fullscreen UI run exposed its temporary window, so that aggregate hidden-only result did not pass. See the dated integration checkpoint and inventory. |
| Still needs coding or acceptance | Every remaining part of existing tools, all adopted future/specialist additions, device/service prerequisites and release gates stay in the complete remaining-work register. |

[Current integration evidence](docs/UI-INTEGRATION-AND-FINAL-SCOPE-2026-10-11.md) records the exact build and results. The register preserves earlier evidence alongside remaining work instead of treating any whole feature as finished because one case passed.

#### UI and function check requirements

Build a command-to-check matrix covering every currently integrated action and each applicable input/output path. Status is one of unstarted, partial coded, compiled, current runtime pass for a declared case, failed, prerequisite blocked, or full required acceptance passed. A disabled button/placeholder/disconnected module does not count as implementation. Unknown evidence is pending, not passed.

Check Home/Files/Workspaces/settings/help, all rooms and editors, every toolbar/tab/menu/dialog, source/format boundaries, selected-file/folder grants, empty/error/loading/canceled/recovered states, keyboard/focus/tab order, screen-reader labels, contrast, 100/125/150% text, minimum/normal/large windows, fullscreen/restore, touch/stylus and high-DPI/multiple monitors. Inspect page area, clipping/overflow, visible disabled reasons and concise status. Capture representative screenshots and fix confirmed defects.

For each writer: confirm unchanged originals, exact reviewed output, new-copy/exclusive saving, independent reopen, retention/omission rules, source-change protection, cancel/recovery/disk-full/permission-denied handling. For drawing/pen/comment tools: confirm coordinates, rotation/crop/UserUnit, selection, saved appearances/threads and quantities. For native routes: effective containment/no network/job grants/process and resource limits, termination and cleanup. For large files: sustained scroll/jumps/zoom/search, bounded caches/render work and measured total RAM/responsiveness.

External hardware/services/platforms require their actual device/account/clean-machine checks. Never label these passed from a local screenshot or compiler. A targeted UI sweep is useful current evidence, but does not establish that every adopted feature exists or every operation works on all files.

#### Execution rules

Keep planning concise after this consolidation. Implement biggest gaps in separate modules; use coordinated subagents for substantial independent coding, then one integration/build. Keep useful updates tied to completed work. Latest user request authorizes UI/function debugging; keep automation windows hidden as previously requested and preserve the live desktop session's work. Tests should cover actual behavior, not only mirror code. Fix confirmed defects, maintain all records, and do not mark the complete goal achieved while any adopted implementation or required gate is missing.




---


---

<a id="format-support-md"></a>
## 📄 `FORMAT-SUPPORT.md`

---

### Format support and verification


The table preserves Windows synthetic-fixture verification from 2026-10-01. Newer coded capabilities and their pending runtime gates are documented in the dated sections below. “Open” means bytes accepted by PDFix, not an external app launch. Preview/Edit/Convert are separately scoped. Editing and importing always save a new copy. An unchanged copy is not a conversion. This matrix does not promise perfect editing for every format or permission-bearing file.

| Format | Open | Preview | Edit | Convert | Limits/next gate |
| --- | --- | --- | --- | --- | --- |
| PDF | Yes | Page/readable text, thumbnails/outline/page labels, saved reading position/bookmarks, normal/rectangle selection, search, fit-width/page, view rotation, side-by-side PDF comparison, print preparation | Page arrangement/crop/paper resizing, persistent PDFix markup, supported AcroForms and confirmed visual placements, clean-image redaction/hidden-information cleanup, selectable/reviewed OCR text copy | Text/OCR → editable document; reviewed scan → searchable PDF | English upright printed OCR, 20 pages/16M pixels per page; actual scan and mixed selectable/blank/scan fixtures verified. Saved searchable text and unchanged scan pixels verified after reopening. No in-place text rewrite; extraction loses layout/images/tables, reading order needs review. Searchable copy strips annotations/links/catalog metadata; Western font limits. Copy restrictions respected. Page/OCR writers refuse forms/signatures/encrypted editing. Markup retains regular unsigned AcroForms, existing foreign annotations and catalog structures; signed/certified/encrypted/XFA writing refused. PDFix markups can be edited/removed after reopening; visual flattening retains editable notes. Text boxes use a Western font; notes support Unicode. Fill/sign retains ordinary editable fields and structures; text/check/radio/dropdown/list values are independently reopened. Confirmed typed/drawn/imported signatures are visual artwork; reuse is explicit. Read-only/calculated/password/rich-text/file-selector fields remain unchanged; form scripts do not run. Western appearance fonts, custom tab order/calculations and broad real-form corpus remain gates. Reading 500 pages/100 MiB; broad OCR quality corpus pending |
| DOCX | Yes | Simplified imported document | Text, headings, lists, emphasis; coded editable tables and spans | DOCX/TXT/PDF copies | Earlier basic import/export fixtures exist; newer table preservation is source/compile only, runtime deferred. Supported table spans/text retain DOCX structure with equal columns; complex layout, images, nested tables, headers and revisions are simplified/omitted. 10 MB compressed/30 MB expanded; unsafe/unsupported archives refused |
| TXT | Yes | Page editor | Text and basic formatting | DOCX/TXT | UTF-8, 2 MB; TXT loses rich formatting; explicit copy output |
| Markdown | Yes | Source editor | Source text | New Markdown copy | Real source fixture/save tested; no rendered Markdown or semantic rich-text conversion |
| JSON | Yes | Source editor | Source text | New JSON copy | Real source fixture/save tested; no schema validation; syntax may become invalid through user edits |
| XML/YAML/CSV | Implemented shared text adapter; individual fixtures pending | Source editor | Source text | Same-format new copy | UTF-8, 2 MB; no entity execution, schema validation or spreadsheet UI |
| PNG/JPEG/static WebP | Yes | Actual artwork, camera orientation, rotated view/source-output review | PDF page rotation/paper/orientation/margin settings | One image → one PDF page | 32 MiB input, 16M decoded pixels, 8,192 pixels per side; normalized PNG artwork, original photo metadata/color profiles omitted; animation refused; no pixel editing/OCR/standard compliance claim |
| BMP | Yes, supported uncompressed 24/32-bit headers | Actual artwork | PDF page settings | One image → one PDF page | Native 24-bit fixture verified; broader 32-bit/top-down/color/profile corpus pending. Compressed/indexed/other DIB variants refused with PNG alternative |
| TIFF | No | No | No | No | Decoder/multipage evaluation Phase 4 |
| HEIC/HEIF | Adopted user priority (October 8) | Planned | Planned | HEIC/HEIF → PDF / Image | Apple iOS photo intake (iPhone/iPad .heic/.heif) adopted for direct conversion to PDF; local WIC/libheif decoder evaluation. |
| RTF | Yes | Simplified import | Imported copy | RTF / DOCX / TXT / PDF | Coded local RTF 1 adapter; Unicode and Windows-1252, basic text styles/alignment/manual breaks. Fonts mapped to three families; tables/lists flattened; pictures/objects/headers/footers omitted. 10 MB input / 2 MB editor content / 64 group depth / 500k tokens / 20k elements / 256 fonts/colors. Other code pages/alternate Unicode groups refused. Export keeps editor formatting/page setup and visible list labels, not omitted original content. Runtime round-trip/fidelity evaluation pending |
| XLSX | Coded | Raw stored-value grid | Text/number/boolean cells | XLSX copy / one sheet CSV | Worksheet tabs, address navigation/search, Undo/Redo and source-bound recovery. Protected/formula/special/covered merged cells remain read-only. Cached formulas are not recalculated; dates/numbers are raw rather than Excel formatted. Untouched package parts retained and edited values independently read back before native hash-verified copy saving. External relationships/signatures/reserved workbooks disable editing. Macros/embedded objects/chart sheets unsupported. 10 MB ZIP / 30 MB expanded / 50 sheets / 100k stored cells / 5k changed cells; XML 200k nodes / 64 depth; worker 45-second deadline. Runtime/corpus/preservation evaluation pending |
| PPTX | Coded | Simplified slide preview | Supported individual text runs | PPTX copy / text TXT-DOCX-PDF | Slide navigation, search, shape/text and bounded PNG/JPEG artwork, Undo/Redo and source-bound recovery. Original run formatting and untouched package parts retained in PPTX copies; fields/unsupported-object text remain read-only. Signed/modification-protected decks disable editing. Exact fonts/wrapping/master art/theme inheritance/effects/crop/charts/tables/notes/animation are not rendered faithfully. External links/media retained in copies and never activated here. Text exports include hidden slides and omit artwork/layout/notes; reviewed PDF is a text outline. 10 MB ZIP / 30 MB expanded / 100 slides / 3k shapes / 20k runs / 2 MB text / 3k edits; images 32 assets / 8 MB / 24M pixels total. Runtime/corpus/preservation evaluation pending |
| DOC/XLS/PPT | No | No | No | No | Phase 6 legacy engine corpus |
| Pages/Numbers/Keynote | No | No | No | No | Phase 6; possible embedded preview, no promised editing |
| SVG/HTML/executables/archives | No | No | No | No | Active content not displayed |

Editor reliability: bounded local version preview/restore, committed crash recovery, failed-autosave departure protection and independent recovery/recent cleanup are implemented. Layout controls provide native fullscreen, sidebar/focus mode and collapsible reader panes. These do not extend format fidelity or decoding claims.

Compression: lossless stream/object rewrite or supported non-JPEG image JPEG optimization at quality 40–95. Actual bytes/larger outcomes, independent all-page reopen and original/output artwork comparison are available before exclusive copy saving. A reference-independent reachable-object graph checks catalog structures, Info metadata, text/content streams, form values/appearances, links/outlines and attachments; JPEG mode permits image-stream payload/filter changes while retaining page/image dimensions and non-image content. Existing JPEG and inline image data are retained; no resampling. Synthetic text/form/link/outline/metadata/attachment and RGB-image fixtures are verified. Rewriting may remove unreachable objects and historical revisions; this is not secure removal. Signed/certified/encrypted/XFA documents are refused. Up to 500 pages/100,000 objects, 100 MiB source/output/expanded verification content, 64 MiB expanded individual streams, 16M pixels/8,192 per image side. Native engine timeout/diagnostic/output monitoring is present, but hard native memory containment and larger varied-file/filter/alpha/color/corpus review remain gates.

Reading view rotation changes display only and does not alter copies/print orientation. Reading positions and personal bookmarks are local source-bound workspace metadata, not inserted PDF outline entries. Compact layouts are audited at 1380×920 and 800×620 native window sizes.

PDF comparison: linked/independent page navigation and scrolling, literal text additions/removals, page-count/order review and a pink artwork-change map. Organizer outputs align to their original source/page plan; arbitrary versions use physical page numbers or manual alignment. OCR-only text changes are distinguished from visible scan changes. Copy restrictions disable extraction. Whole-document checks are bounded to 100 output page pairs; individual review supports 500 pages. Low-resolution visual comparison is not proof of file equivalence and does not assess metadata/attachments/links/form behavior. Broader automatic alignment and non-PDF fidelity comparisons remain pending.

Fill/sign bounds: 500 fields, 2,000 widgets per document, 50 confirmed placements, 2 MiB recovery; up to 10 saved visual signatures/8 MiB library. Signature imports are separately selected (not added to recents), limited to 4 MiB input/4M decoded pixels/4,096 pixels per side, and normalized to bounded PNG. PNG drawing/import and typed/scan placements have native fixtures; broader JPEG/WebP/general-image fixtures remain pending. Existing signatures/certification, encryption and XFA are refused before form mutation. Saved visual signatures and recovery contain unencrypted personal data.

Image PDF output retains full decoded image resolution and transparency without stretching/cropping. A4, Letter and image-sized (96 dpi plus chosen margins) pages support clockwise rotation, automatic/portrait/landscape paper orientation and 0–50 mm margins. Original and reopened output stay visible for explicit review; saving requires the review checkbox. Source-bound recovery contains page settings rather than source pixels, and a failed write blocks navigation/file picking until retry or a verified rescue copy. One image per PDF is current scope; multi-image layouts, crop/adjustment, reverse exports, additional codecs and exact profile/print-color preservation remain gates.

Page crop/resize operates on the intersected source media/crop bounds, including offset boxes and quarter-turn rotation. Visual-edge margins must leave at least one PDF point in each dimension. Paper fitting supports A4/Letter or custom 10–2,000 mm dimensions with 0–50 mm margins; proportions are preserved. Crop-only changes page boxes; resizing embeds vector/selectable artwork into new page geometry and retains transparency-group semantics. Cropped-out content remains recoverable and is not redacted. Standard page limits remain 100 MiB combined input/output, 10 sources and 500 output pages; nonstandard PDF user units are refused. Organizer undo/redo retains up to 30 in-memory plans, not crash recovery. Broader unusual-artwork/font/layer/print corpus remains pending.

Automatic split supports every N current output pages or explicit non-overlapping groups separated by semicolons. Reordered/cropped/resized pages carry through; omitted output positions are disclosed. Range selection supports ordered ascending ranges and odd/even presets. Up to 500 files/500 included pages/100 MiB combined output are bounded and independently reopened before review/save. Native saving creates a new directory and exclusive numbered PDF files, verifies disk bytes through bounded reads, refuses existing destinations and cleans up only files created by that operation. A cleanup failure reports the remaining directory. Saving guards native window close; canceled picking retains verified previews. Automatic size/bookmark rules, operation crash recovery and broad real-file/large-split performance remain gates.

Redaction: currently a reviewed all-page clean-image reconstruction, not vector-preserving editing. Marked pixels are replaced before encoding. Fresh pages contain only RGB images and image-drawing streams; original text, annotations, fields, links, metadata, attachments and layers are absent. Native strict canonical structure/stream checks reject extra objects, trailing compressed bytes and appended payloads. Independent PDF.js reopening checks every page, absence of extractable text/annotations/metadata and exact sanitized pixel hashes. Native saving uses immutable verified bytes and same-descriptor disk hashing. Tested offset crops/all four quarter rotations, fractional A4 geometry, nondefault user units and translucent artwork; broader font/color/optional-content/real-file and forensic corpus remains required. 100 pages, 500 regions, 144/180/216 dpi, 100M total/16M per-page pixels, 8,192 side, 100 MiB input/output. Encrypted/signed/certified/XFA sources are refused. Visible unmarked field/annotation artwork stays in the image. Text-run matching is a proposal, not complete sensitive-data detection; flattened text/forms cannot be edited as original PDF objects.

Password copies: local AES-256 revision-6 opening/owner protection, chosen print/copy/edit permissions and owner-authorized removal/change are implemented. New passwords use a distinct 8+ character opening/owner pair, 127 UTF-8 byte cap and standard Unicode without control/compatibility variants; Japanese password fixtures independently reopen in PDF.js. Native verification checks owner/user roles, AES parameters/permission flags and reachable document structures after decryption, allowing only the exact AES revision-6 ADBE /1.7 extension-level-8 declaration. PDF.js independently matches every page’s text/geometry/RGBA pixels against the source. Ordinary forms/annotations/metadata/attachments remain; no signature invalidation or XFA writing is permitted. Save binds immutable native output to source/token and disk-verifies exclusive copies. Restricted copying/printing stays disabled in the preview/reader. Other writers continue refusing encrypted sources; use an owner-authorized unprotected copy. Larger standard/legacy/Unicode-normalization/extension/public-key corpus and hard native memory containment remain gates. Permissions depend on the recipient viewer.

#### October coded feature additions — verification pending

- Markdown: basic local rendered/source/split view; headings, basic emphasis, lists/tasks, quotes, fenced code and a bounded pipe-table subset. HTML is literal; links/images are inert. Complex Markdown nesting/extensions are simplified. Source export stays source text.
- CSV: chosen comma/semicolon/tab quoted-field preview, first-row-heading choice, 50-row/30-column pagination and complete-cell inspection. Source remains editable; displayed formulas are literal. 2 MiB input, 100k cells/20k rows/500 columns, 100k characters per field; no schema/calculation engine.
- PDF: structural security inventory and reviewed native HTTP/HTTPS link opening, engineering sheet geometry, temporary calibrated distance/perimeter/area and optional layers, existing annotation summaries and supported form-data JSON/CSV. Layer changes do not alter print/export/source visibility. Signature certificate validity is always unable to verify in the report.
- Native engine: qpdf compression/password processing now requires the Windows AppContainer/Job Object broker. Worker-thread parsing outside qpdf remains outside that OS boundary.

Compilation/syntax evidence is separate from runtime, corpus, preservation, physical printer and security-release evidence.


#### 📅 Parallel feature coding — 2026-10-02

Selective structural PDF cleanup now supports chosen metadata, embedded-file references, comments/links, complete forms and scripts/actions. It freshly writes the reachable graph, prunes disconnected history/orphans, independently reinspects output, shows actual rebuilt pages and saves native verified bytes under a new name. Repeated page artwork/text remains. Encrypted/signature-bearing/permission-constrained/XFA/malformed/unsupported shared structures are refused. Hidden-layer cleanup and vector redaction remain pending. Worker heap/time bounds are not OS sandboxing.

Image deskew is explicit ±15 degrees and expands white corners; guides stay in preview. Existing image recovery/undo/export paths carry the angle. OCR confidence is an estimate; uncertain-line cycling and reviewed TXT/line-inventory CSV exports are available. CSV is not reconstructed table data. No scanner/camera integration, extra OCR languages or HEIC/TIFF decoder is claimed.

Printing now offers bounded physical ranges (100 selected pages), named paper/orientation/margins, Fit or actual size (clipping refused), copies/color/duplex requests and reviewed actual raster side previews. 2-up, 4-up and left-bound booklet reorder/pad the chosen source pages; imposition is Fit-only. Booklet requests landscape short-edge duplex; Windows driver flipping and physical output remain unverified. Raster limits: 16M pixels/page, 80M total, conservative 100 MiB encoded-character budget, 120-second preparation; 72/150/216/300 dpi choices. Unsaved marks/forms and temporary layer changes are not included.

AI connections support OpenAI-compatible Chat Completions providers, HTTPS endpoints or explicit numeric HTTP loopback, native encrypted keys, model discovery, frozen question/pasted-excerpt review plus native confirmation, bounded cancellation, excerpt citation IDs and content-free history. No renderer network connection or PDFix file/tool execution is granted. A custom endpoint can forward text or execute server-side tools. Hermes is discovery-only. Native file-context selection, additional runtime adapters and server containment remain pending. Corrupt connection storage fails the AI controls closed while preserving the rest of the app.

Windows launch/Open-with arguments are queued as explicit document-open requests with editor departure review. Per-user association metadata avoids default takeover; no registry/installer/update execution occurred. Runtime tests, app launches, online requests and broker execution remain deferred by user instruction. See PARALLEL-WORKSTREAMS.md for assignments and remaining scope.


Further integrated slices: new empty single-line PDF text fields and unchecked checkboxes (100 new, 500 total) with unique names, Unicode tooltips, required/read-only flags, bounded PDF-point rectangles, overlap refusal, source-bound local recovery/undo and actual reopened native verified-copy output. Western text appearance fonts; no radio/choice/calculation/tagging or guaranteed cross-viewer tab order. Recovery recipes contain unencrypted labels/names/rectangles separately from general recovery; Delete saved recipe removes this recipe. Encrypted/signed/certified/XFA/protected sources are refused.

Reader continuous/facing modes display real PDF.js page artwork and text with lazy nearby-page rendering (four live pages, 16M pixels/page and 32M live pixels, 500 physical placeholders). First page is a cover in facing view, followed by 2/3 spreads. Scroll/go/keyboard physical-page tracking and fit/zoom/rotation/layer choices are supported; rectangle selection, measurements and active-match highlighting return to single-page view. Interactive annotation controls are not added.

Embedded-file export displays full literal declared names/types/sizes, actual decoded byte counts and SHA-256; explicit selection independently decodes again and binds native bytes to source/inventory/selection tokens. Saving uses a chosen new .bin filename, exclusive same-descriptor hashing and no automatic opening. Raw/plain Flate only: 100 descriptions, 10 MB/file, 25 MB cumulative decoding work. Unavailable entries stay visible; external/exotic/multimedia/encrypted containers are refused; signatures remain unable to verify. Bounded Node worker parsing is not an OS sandbox.

AI saved-source context now explicitly lists already opened UTF-8 text/Markdown/data snapshots under 2 MB/20,000 lines. A chosen 1–200-line excerpt is displayed literally, capped at 60,000 characters and source-fingerprint-bound in the frozen transfer review. Unsaved edits are excluded. PDF/Office excerpt adapters remain pending; pasted excerpts are supported. No native-context data is sent until transfer approval.


#### 📅 Fast parallel coding — 2026-10-03

Named organizer workflows now save exact arrangements, source fingerprints and split settings. Loading requires fresh native selection of every exact original, validates before replacing the current plan and requires a new output preview. No automatic export. 20 workflows/128 KB each; atomic local storage, duplicate names refused, explicit deletion. Workflows contain unencrypted source descriptors and are managed separately from generic recovery.

Actual-size tiled printing is integrated with chosen paper/margins, 0–25 mm overlap, fixed row/column pitches, partial edge crops and at most 100 output sides. Full-size source images are clipped in both actual previews and print HTML; alignment/trim marks and sheet/row/column labels sit outside artwork. Tiling requests one-sided/100% output and excludes N-up/booklet. Existing per-source and aggregate raster budgets remain; lower DPI changes sharpness, not physical scale. Physical printer, driver scaling and alignment remain unverified.

Possible blank-scan review is integrated with the organizer. An explicit range of at most 50 original pages is sampled; text, all annotations, hidden crops and optional layers are retained/refused. Every proposal starts unchecked and requires an actual full-page review. Returning a selection removes nothing. A separate organizer button removes all matching output occurrences only after source-fingerprint checking; at least one output page remains, Undo/recovery are retained and a new output preview is required. Brightness statistics never prove blankness. Source/sample SHA-256, page labels and geometry accompany the reviewed selection. Shared PDF.js waits and owned render operations are cancellable/bounded; original shared document is retained.

Interface readability controls are saved: standard/125%/150% text and stronger contrast, with wrapping/scrolling controls and persistent local preference. PDF artwork/text layers and document fonts are not CSS-zoomed. Broad keyboard/screen-reader/large-text/contrast verification remains a release gate. Field-builder recovery has a separate counted privacy section and explicitly confirmed native cleanup of only known local recipes/temp files; original/exported documents, workflows, signatures and AI connections remain.

Three subagents are coding the next slices: editable PDF bookmarks; page numbers/headers/footers/watermarks/stamps; radio and choice field creation. These unfinished slices do not count as delivered. Runtime testing, app launches, online requests and broker execution remain deferred. The complete master list and product/release scope remain active.


#### 📅 Integrated coding checkpoint — 2026-10-03

Reader View options now opens editable document outlines and page numbers/stamps workspaces. Native source-bound inspect/build/cancel/discard/output APIs and exclusive chosen-copy saves are wired through preload; close/render-loss/quit dispose both services. Bookmark editing supports plain labels and physical page targets, branch operations and bounded full original inventory; unsupported destinations/protected sources are refused. Replacement requires inventory consent and native/independent PDF outline verification plus actual output review. Old outline objects may remain; this is not sanitation.

Page decorations support chosen pages, page numbers, headers/footers, text watermarks and DRAFT/APPROVED/REVIEWED stamp artwork, with Western-font/ASCII restrictions, per-page resource cloning, unchanged source-object/geometry verification and every selected page rendered before review/save enables. Artwork can cover original content and needs review. Signed/encrypted/certified/XFA sources are refused.

Radio groups, dropdowns and single-select lists extend v1 field-builder recipes without IPC changes. Separate radio widgets share one field name; at least two unique exported buttons are required, and defaults are unselected. Choice labels/export values are explicit, with an empty-value dropdown placeholder and unselected list. Native and independent PDF.js output checks cover geometry/defaults/flags/options/tooltips. Radio/choice recovery remains local and unencrypted, and separate recipe privacy controls apply.

Compilation: Vite completed with 187 modules (index-D_cSo899.js / index-dkOErLTz.css); targeted integration/privacy/accessibility source syntax checks passed. This includes readability controls and separate form-recovery privacy controls. No app, worker, broker, printer or online runtime test was launched. Preservation/security/real-file/accessibility acceptance remains open. Bluebeam/Revu requirements were saved separately; these additions do not establish Bluebeam interoperability.


#### 📅 Drawing review and markup coding — 2026-10-03

Three subagents completed native review inventory, the comments panel/saved filters and drawing tools. Root connected main/preload/reader/action finder/departure handling and added markup-location and exact embedded sheet-label navigation.

Existing-source comments: a read-only native PDF inventory now reports literal subtype, identity, plain comment, author, subject, dates, reply/group references, state/model, flags/locks, appearance/popup availability and unknown field names. Raw object references determine relationships; NM names never guess parents. Shared annotation instances have distinct keys, and ambiguous/orphan/outside-selection/cyclic parents remain explicit. Popup rows are omitted while owning comments report popup availability. Rich/private values are not decoded; no actions/HTML/resources execute. Signed sources are inventory-only, with certificate validity unable to verify. Encrypted sources need an authorized decrypted copy. Limits: 100 MB, 500 physical pages, 10,000 source annotations including popups, 8 MB review data, 16,384 characters per comment, 4,096 per metadata field, bounded graph/object/stream parsing and two-minute worker deadline. Native workers have resource limits, not an OS sandbox. Cancellation waits for worker termination; renderer loss restarts the service after that termination.

Review comments: a collapsible/resizable bottom panel inspects all/current/explicit-range pages, checks source SHA-256 against the actual opened snapshot, searches/filter/sorts literal fields, paginates 100 rows and displays bounded reply/group branches and source warnings. Selected keys survive filtering/sorting. Ten explicitly saved local named filter sets have bounded storage and explicit deletion; filter text can be sensitive and is retained locally. TXT/CSV export previews the exact filtered source snapshot and requires a review checkbox plus native filename selection. Formula-looking CSV cells are inert. It is a report, not an annotation-exchange file or proof of third-party preservation. Imported comments remain read-only. Saved/current source data excludes unsaved PDFix markup drafts.

Drawing navigation: clicking a comment navigates to its physical page and temporarily outlines its PDF rectangle, with rotation/crop-aware viewport mapping and an optional zoom to bounds. Return to previous view restores page, mode, zoom/fit, view rotation and scroll position. The highlight changes no saved artwork. Exact embedded page-label search supports repeated labels with physical-page disambiguation and at most 50 visible matches; label titles are never inferred from drawing artwork. Source labels are kept separately from shortened display labels, bounded to 4,096 characters each/1 MB overall.

Drawing tools: line, arrow, scalloped revision cloud and text callout are added to existing markup tools, with red review color, editable callout text/size, Undo/recovery and actual PDF output preview. Native/model recovery limits agree on 500 marks and 20,000 generated drawing points. Generated annotation identity, native geometry/appearance ownership and reopened appearance bytes are checked; independent PDF.js checks match annotation IDs and line endpoints/endings. PDF.js does not expose every cloud/callout field, so those fields use native reopen checks plus actual preview. Callout text uses the existing Western font restrictions; foreign comments stay non-editable. Existing flattening and protected-source restrictions remain. These checks are code paths, not runtime results.

Verification performed: 17 changed integration/module files passed syntax checks; Vite built 194 modules successfully (index-F2AfmZe0.js, index--uBMjJ9a.css, pdf-job.worker-Bj1F3Tq7.js). No app, native worker, sandbox broker, runtime test, online request or printer was launched. Real-file/Revu round-trip fidelity, complete foreign annotation preservation, proprietary custom data, editing imported threads/statuses, FDF/BAX/BTX interchange, Studio and broad accessibility/security validation remain open. This advances R39/B01–03/B05–06/B09 and M03.05/M04.07/M07.05 subsets without completing the full master list.


#### 📅 Preserving review copies and workspace access — 2026-10-03

Supported imported plain comments can now be staged for editing, and new replies or explicit standard review-history entries can be added to unique indirect source annotations. Existing author, creation date, subject, IDs, flags, original appearances and unknown/private fields are retained; comment edits change only Contents and modification date. A new reply has its own author/timestamps, exact IRT parent and visible vector note appearance. Current parent workflow state is never inferred or overwritten. Signed/certified/encrypted/XFA sources are refused. Rich-text, grouped, PDFix-owned and FreeText comment edits are refused; additive replies to supported FreeText parents are allowed. Source read-only flags block both operations; locked geometry/contents blocks comment edits without blocking an otherwise supported additive reply.

A native immutable source-bound output service reinspects the exact source receipt, preserves original objects and encoded stream payloads, appends replies to cloned page annotation arrays, and independently reopens the rebuilt copy. Native object, array, geometry, comment, parent, appearance and output-inventory checks must match before output bytes become saveable. Independent PDF.js checks and actual before/after previews of every changed physical page are implemented in the UI. Source files stay unchanged, and the chosen-copy writer saves only the native sealed output. These verification paths have not been executed in this coding pass. This is preserving editing, not hidden-information removal: original metadata/actions/attachments/private data remain. Limits: 100 staged changes, 1 MB combined literal text, 100 MB source/output, 500 pages, bounded graph/stream parsing and two-minute native processing. Replies require UserUnit 1, right-angle page rotation and a crop-contained 16-point note rectangle. Existing visible appearance text may differ from an edited plain comment body.

The comments panel owns the editing workspace and protects staged/unstaged text on close or file departure. Undo/Redo, cancellation, explicit discard/keep, every-changed-page preview and reviewed new-copy save are connected. Drafts currently remain in memory; a separate portable recipe slice is in progress and is not counted as delivered here. Renderer loss waits for native worker termination before replacing the source-bound service. Node worker bounds are not an OS sandbox.

Workspaces now has search and category filters, separate New document/Open a document entries, direct drawing-comment, markup, decoration, outline and form-creation cards, and native PDF/image/document file filters. Read a PDF and Compare drawing revisions use PDF-specific intake; comparison is also in the action finder. Reusable markup styles save up to 20 local named styles and optional default comments, apply only to the next successfully placed mark, and never copy geometry. Explicit delete/clear and bounded corrupt-library export are included. These unencrypted local libraries remain separate from general recovery.

Source saved; combined compilation is pending the current overlay/color/portable-draft slices. Runtime tests, app launches, native worker/broker execution, online requests and printer checks remain deferred. Full Bluebeam/Revu fixture and round-trip acceptance, proprietary formats/data, sheet sets/takeoffs, broad editing and the complete product/release goals remain open.


#### 📅 Integrated overlay, color and portable review drafts — 2026-10-03

Drawing comparison now includes transparent and cyan/magenta overlays, reused from the actual rendered page canvases. Manual translation ±2,000 physical points, scale 25–400%, clockwise rotation ±180°, opacity 10–90% and reset apply only to the current physical page pair. Expanded union bounds retain transformed artwork; original/compared names, physical numbers and bounded embedded labels remain explicit. Existing linked zoom/scrolling are retained. Overlay and each tint scratch raster are capped at 1,600 pixels on the longest edge / 2,560,000 pixels; display expansion caps at 12,000 CSS pixels. Labels are bounded to 200 characters and a ten-second cancellable wait. Changing physical pairs resets alignment. Text/difference/whole-document checks retain their existing physical/page-plan pairs and ignore overlay adjustments. This read-only visual alignment neither transfers comments nor proves design changes.

Review metadata now includes literal standard /C and /IC colors: transparent/DeviceGray/DeviceRGB/DeviceCMYK, raw finite 0–1 component arrays, and absent/malformed/unavailable notices. Selected-comment details and TXT/CSV report exports include this metadata. Screen swatches are explicitly approximate; appearance/private colors are not decoded. Optional descriptors preserve older inventory compatibility, canonical receipts include new native fields, and source color declarations remain checked when building edited copies. CSV uses a named 39-column mapping to keep metadata and scope aligned.

Portable review drafts can be explicitly saved/loaded as UTF-8 JSON. They contain exact source SHA-256, inventory receipt, inspected page sequence, supported staged changes and optional current unstaged composer; no source PDF objects or output/save receipts. Limits: 2 MiB file, 1 MiB canonical recipe, 100 changes, 16,384 characters per comment and 200 per author. Native chosen-file reading is bounded, checks file length/change timestamps and fatal UTF-8, keeps the active source untouched and rechecks source identity. Renderer validation checks known schema fields, exact source/inventory/pages/references/eligibility and shows the normalized recipe before explicit confirmed replacement. Undo restores both staged and unstaged text. Loading never automatically builds/saves a PDF. Recipe saving does not mark the PDF copy saved, and departure protection remains. Comment/author text in exported recipes is unencrypted; no automatic review-draft crash recovery is claimed. Standard review-history entries can have empty comment text when a required author and nonempty supported state are supplied; parent state remains unchanged.

Workspaces has a direct Compare drawing revisions entry and comparison action-finder command. PDF, image, document, XLSX workbook and PPTX presentation workspaces have purpose-specific native file filters. Settings discloses exported review recipe storage separately from local recovery and named libraries. All source slices from the three agents are integrated; prior in-progress/read-only statements are historical and superseded for these supported operations.

Compilation completed successfully with 202 Vite modules: index-BHehx5iH.js, index-DZyzn4is.css and pdf-job.worker-Bj1F3Tq7.js. Targeted source syntax checks passed. The restricted first build attempt encountered child-process EPERM; the authorized compile-only retry succeeded. No app, native worker, sandbox broker, runtime test, online request or printer was launched. Verification code paths are implemented, not runtime/Revu acceptance results. B02/B03/B04/B06/B07/B10 subsets advanced; all full compatibility, preservation, release and master-list acceptance targets remain open.


#### 📅 Integrated sheet sets, revision references and takeoff ledger — 2026-10-03

Sheet-set UI and the native library are now integrated. Start from an opened PDF, explicitly add related source PDFs, arrange up to 500 sheet references, change user-entered titles/revision labels, move/remove/add pages and navigate Previous/Next sheet. Lists paginate 100 rows. The selected source has one owned drawing reader with original comments; same-source navigation reuses it, while source changes protect unfinished comment/takeoff drafts before disposal. Title/revision typing commits immediately without replacing the focused input; Undo captures each focused edit. Actual source SHA/page counts and bounded embedded labels are inspected before adoption. Source count remains 10/100 MB aggregate; each PDF supports up to 500 pages. Labels are limited to 200 characters / 100,000 UTF-8 bytes per source. User labels are distinguished from actual embedded labels and physical page references.

Named sets save/restore order and labels. Save keeps a bounded unencrypted original descriptor library, with explicit removal independent of general recovery. Maximum 20 sets / 128 KiB per saved item / about 2.6 MiB library. Native restores select every exact original with fresh chosen-file permission; source size/SHA/session/saved-item fences precede handle commit. UI checks actual declared counts/references and previews the proposed arrangement before explicit confirmed replacement. Revision replacement separately previews both actual original/new drawing pages (2 MP each, sequential owned parsers), requires explicit confirmation and changes only one set reference. Undo retains the old source/reference. Existing comments remain with their original PDFs. No PDF bytes are merged or physically replaced, and no comments are transferred. Physical PDF revision replacement, preservation-aware comment mapping and automatic sheet matching remain future gates.

The new takeoff ledger retains explicitly named/grouped finished distances, perimeters, areas and count points. Length/area entries keep their own confirmed page reference scale; counts do not claim calibration. Canonical PDF coordinates, source SHA, physical page, crop bounds/UserUnit, label and computed mm/mm²/count quantities are source-bound. Group totals never mix dimensions; display/export units convert without changing canonical values. Area boundaries reject repeated/retraced/self-intersecting edges; count points reject duplicates. Saved entries have remove/Undo and jump-to-page with point overlays. Limits: 200 entries, 1,000 measurement points each, 10,000 aggregate including scale references, 10 Undo snapshots / 4 MiB. Floating-point and four-decimal display precision do not establish engineering accuracy; reference placement and a uniform scale need human checking.

Reviewed JSON preserves the complete separate ledger; inert CSV contains entry quantities and grouped totals, without all points/calibration references. JSON loading validates strict schema, exact source SHA/page count, actual source crop/UserUnit, bounded labels and quantities recomputed from points/reference scales before explicit replacement; Undo restores previous entries. JSON files/exports are capped at 2 MiB, per-source steps at 30 seconds and imported geometry checks at two minutes. Labels are truncated at 200 characters or blank when unavailable, with physical-page references retained and disclosed. No automatic local/cloud persistence or PDF measurement-annotation embedding is claimed. Copy-restricted sources disable retention/load/export. File/doc/bytes/ID bindings and SHA are rechecked across source waits/picker/review. CSV does not mark the full ledger saved. Busy or unsaved ledger departure requires keeping the reader open or explicitly discarding quantities; readers/application close and source-changing routes await this guard.

Reviewed source-comment metadata now also exports JSON within the existing 8 MiB bound. It contains source/inventory SHA, inspected pages, matching displayed annotation rows/colors/parent references, warnings and scope. Filtered parents can be absent, and appearances/private data are not embedded. This is a data snapshot, not FDF/XFDF/BAX interchange or an import route.

Native app close now always requests renderer departure when its close handler is registered, because the shared boolean editor-guard can be cleared by another workspace. Finish-close is the sole ordinary close authorization after UI departure, and native file operations still block it. An unavailable/crashed/unregistered renderer can close without waiting for a missing handler. This source fix addresses unfinished in-memory work being skipped; runtime close/cancellation behavior remains unverified.

All three subagent slices and root integration are saved. Eight root integration source syntax checks passed, plus changed main/preload readiness checks and the agents' targeted module checks. Vite compiled 208 modules successfully: index-Bk7KS8cS.js, index-C8IQF8EQ.css, pdf-job.worker-Bj1F3Tq7.js. No app, native worker, sandbox broker, runtime test, online request or printer was launched. This advances B05/B08/B12 and M03.04/M03.10/M03.11 subsets. Revu interoperability, embedded persistent measurement markups, physical revision replacement/annotation mapping, broader formats/editing and all release/master-list acceptance remain open. Prior in-progress checkpoint statements are historical.


#### 📅 Persistent takeoff copies and reusable decoration templates — 2026-10-04

This later checkpoint supersedes earlier statements that takeoffs are separate-ledger-only. The drawing takeoff ledger now opens a frozen PDF-copy workspace. A source-bound native writer adds one Line (distance), PolyLine (open perimeter), Polygon (closed perimeter/area), or Ink (count) annotation per entry. Explicit vector appearances include numeric quantity labels in the chosen display unit. Unicode comments/author and canonical PDFixData retain original points, physical-page identity, source fingerprint, calibration and recomputed quantities. Maximum 200 entries / 10,000 aggregate points, 2 MiB request, 100 MiB PDF and 500 pages. Source crop/media intersection and UserUnit are checked natively. Physical pages are authoritative; sheet labels remain supplied descriptions independently reviewed against the source. Counts carry no length calibration.

The native construction manifest allows only cloned/appended selected page Annots arrays and normalization of raw-stream Length to unchanged encoded payload size. All original objects, existing annotations, unknown/private fields and encoded stream payloads are retained. After serialization, native reopening compares every declared object, geometry/trailer references, exact annotation order, appearance bytes and canonical metadata. The immutable native receipt is fenced to source SHA/token/generation before an exclusive chosen-file Save Copy. Source-bound ledger math is generated from the same pure UI source during compilation. The worker has a two-minute deadline, 256 MiB old-generation heap, 16 MiB single / 64 MiB aggregate compressed-object decoding budgets; this worker is not an OS sandbox. Signed, certified, encrypted, XFA and unsupported sources are refused. No standard Measure dictionary or proprietary Bluebeam measurement editing is promised.

The UI also checks output/ledger/metadata hashes and exact annotation types, coordinates, text/author and appearances with an independent PDF reader. Every changed original/output drawing page must be visibly reviewed before saving (2 MP per preview). Ledger mutation and measurement controls are held while this copy workspace is open. Cancellation/discard retains the source and full separate ledger. Leaving protects unsaved JSON ledger data; saving a PDF does not mark that separate portable recipe as saved. Exported PDF annotations include unencrypted author, names and complete point/calibration metadata. Recovering this embedded metadata into an editable ledger is a remaining feature; existing JSON import remains source-bound.

Decoration templates now save up to 20 named styles / 64 KiB locally: standard font, inset, page numbers, headers, footers, watermarks and Draft/Approved/Reviewed text stamps. Apply requires explicit confirmation and invalidates a previous PDF preview; current physical-page selection and range stay selected. Templates exclude source IDs, page selection, generated PDFs and receipts. Named save, apply, delete/clear and bounded raw-text export are explicit. Corrupt storage fails closed; concurrent library changes are checked before writes. Text/styles are unencrypted local-profile data, separately disclosed in Settings & privacy, with deletion in Page numbers and stamps. Text stamps do not certify approval or create certificate signatures.

Source and build milestone only. Runtime, native-worker, broker, app, print and Revu acceptance tests remain deferred at the user's request. These additions advance B10/B12 drawing workflows without completing the full Bluebeam or master requirements. Earlier subagent source for templates/preview UI was retained; root completed the missing native writer and integration after those agents hit the account limit. Full interoperability, broader editing/format fidelity, release packaging and security/accessibility acceptance remain open.


#### 📅 Recover and revise embedded PDFix takeoffs — 2026-10-04

Saved native read-only recovery, independent-reader comparison and actual drawing-page review for canonical PDFix takeoff metadata. The reader's Takeoff quantities panel now has Recover takeoffs from this PDF and a native-processing cancel control. Recovery is explicit, never automatic. Native inspection requires a unique indirect annotation on its declared physical page; exact canonical metadata/author/NM, recomputed quantity, source geometry/UserUnit, Line/Polygon/PolyLine coordinates or count marker strokes and bounded normal appearance are checked. Unsupported versions/malformed recognized takeoffs fail closed; other/unreadable PDFix metadata is reported as untouched. Maximum 10,000 source annotations, 200 recovered entries, 2 MiB aggregate metadata / 4 MiB complete receipt, two-minute worker deadline and existing bounded worker heap/decode budgets. Protected/signed/XFA and unsupported sources remain refused. This worker is not an OS sandbox.

Each adopted entry receives a new identity bound to the currently opened PDF SHA, retaining original source SHA, annotation structural reference, author and metadata hash as provenance. Optional origin fields are strictly validated and travel with JSON/PDF metadata. Independent PDF-reader checks compare actual source annotation identity/type, bounds, author/text and path/count coordinates; actual crop/UserUnit and shortened labels must match this current source. Every recovered drawing page must be viewed (one reusable 2 MP canvas), then the user explicitly replaces the current in-memory ledger. Source bindings/hash are rechecked after asynchronous steps; cancellation retains the previous ledger. Undo restores it. Recovery is dirty until JSON is saved. Embedded metadata/calibration is untrusted file data and is not authenticated engineering information.

Edit entry now supports reviewed name/group changes and known reference length/unit changes for each calibrated quantity. Saved measurement/reference positions stay fixed. Quantities are recomputed, fully schema-validated and source-fenced before adoption; preview invalidity disables Apply, edits are dirty and Undo is available. Counts carry no length calibration. Editing a ledger alone does not change PDF bytes.

The takeoff PDF-copy dialog now offers an explicit unchecked-by-default option to update supported recovered annotations. Native selection is fenced by source SHA, unique structural reference, original NM/author/metadata hash, unchanged physical-page/path/reference geometry and known annotation fields. Locked/read-only, shared, threaded/replied-to, popup/group/rich/private-extended or independently changed targets are refused. Only declared original page references are removed, replacement appearances/metadata are appended, and all unrelated annotation entries stay in order. Native reopening verifies exact retained objects, arrays, geometry/trailer and new annotation results; the independent reader verifies declared removals and unrelated identity retention before every changed-page actual before/after review. Saving remains an immutable source/token-bound exclusive new copy. Original dictionaries/appearances remain in the retained object graph, including replaced takeoffs; this is neither redaction nor permanent deletion. Leave the update option unchecked to append additional visible annotations.

This supersedes the earlier recovery-pending and always-append-only checkpoint descriptions. Revu/proprietary takeoff interchange, new point/reference placement for an existing recovered entry, deleting embedded annotations and broad compatibility/security/release acceptance remain future work. Full master requirements remain open. No app, native worker, broker or runtime tests were launched; tests remain deferred as requested.


#### 📅 Reviewed XFDF export — 2026-10-04

XFDF has a coded export-only supported standard annotation subset, source-bound XML/JSON receipt preview and exclusive copy saving. Opening/import, full conformance and Revu/Acrobat round-trip acceptance remain unsupported/unverified. [Exact type/geometry/omission boundaries](docs/DRAWING-XFDF-EXPORT.md). Existing TXT/CSV/JSON comment snapshots remain separate metadata exports.


##### XLSX shared-string correction and workspace text — 2026-10-04

Removed a misplaced numeric/boolean validation expression from the sharedStrings loop that referenced undeclared variables and prevented ordinary shared-string workbooks from opening. Cell numeric/boolean validation remains, and decoded shared strings now have an explicit 8 MiB aggregate bound. Source syntax check passed; runtime/corpus verification remains deferred. Home now links to implemented AI connection management without claiming no connection is configured, Settings discloses XFDF/receipt exports, and workspace breadcrumb/close/history symbols use correct Unicode.


#### 📅 Three major-gap agents integrated — 2026-10-04

User requested renewed subagents on the largest gaps. All three new agents completed concrete source slices; root integrated and compiled them. Earlier account-limit failures did not recur for these agents.

- Document fidelity: editable tables with ProseMirror cell selection, bounded rectangular spans, row/column/merge/split/header/fill controls and Undo; supported DOCX import and structured DOCX/PDF export; native recovery validation; TXT/RTF explicit tabular flattening. Original column widths/borders, images/nested tables and page-perfect Word preservation remain open. Details: [DOCUMENT-FIDELITY-PROGRESS.md](docs/DOCUMENT-FIDELITY-PROGRESS.md).
- Original PDF editing: bounded embedded Type1/TrueType one-byte and horizontal Type0 Identity-H two-byte ToUnicode maps, per-string multipart TJ edits retaining numeric spacing, reuse of observed source glyphs, preserved stream dictionaries and reopened source-font graph/encoded-program hash proof. Multicharacter/ligature entries omit affected runs while retaining other usable map entries. New glyph embedding, shaping/reflow, Type3/custom/vertical/nested/marked-content editing and complete unrelated-object preservation acceptance remain open. Details: [PDF-EDITING-FIDELITY-PROGRESS.md](docs/PDF-EDITING-FIDELITY-PROGRESS.md).
- Security Sandbox: fixed document-engine AppContainer/Job Object source with exact token/capability checks, one-process/512 MiB/115-second bounds, read-only staged source/request/runtime and three precreated writable output slots. Codec bundle supports nine fixed operations. Root packages the existing standalone Windows x64 Node runtime/license with SHA pins and bundled dependency attribution; XFDF export adopts the contained path exclusively, with no worker fallback. Cancellation observes broker close, source/output validators remain, cleanup failure/unsafe termination permanently closes the service. Broker close observation is subscribed immediately at launch to cover early failures across async boundaries. Other Office/review/takeoff/redaction routes still need adoption. Details: [SECURITY-SANDBOX-PROGRESS.md](docs/SECURITY-SANDBOX-PROGRESS.md).

Root also completed reviewed 11-type XFDF geometry/plain-comment export with exact XML, filtered source identity/fingerprint checks, per-annotation omissions, reviewed exclusive sealed saves and separately saved JSON receipt. Native runtime/security status is shown in Settings. Existing comment TXT/CSV/JSON snapshots remain separate. The XLSX sharedStrings undeclared-variable failure is fixed with an 8 MiB aggregate bound; current format/workspace/AI/privacy text reflects saved capabilities.

Final compilation passed: 224 Vite modules; index-BFhcaNJF.js / index-kVg5VJNm.css; pdf-job.worker-KFHKMFMu.js / document.worker-BXg1i3K9.js. Broker C# and fixed engine bundle compile; targeted JS/CJS syntax checks passed. Build output includes pinned node.exe, engine.cjs, broker manifests and runtime/dependency licenses. No app, broker, document engine, native worker, network/print or runtime tests were launched. Verifier code and compilation are not evidence of executed fidelity/OS isolation/Revu acceptance. User-requested runtime testing remains deferred; full master requirements and S00 remain open. Original master-list source is unchanged.


#### 📅 Integrated images, table grids, nested editing, containment and search — 2026-10-04

Three user-requested agents delivered inline document images, editable/preserved table column proportions, nested original PDF text/image changes with shared Form isolation, and contained-only Office/comment/takeoff/grid processing. Root integrated native source/lifecycle guards, local search across selected files, import cancellation and current capability/status text. The combined build passed: 231 modules, index-CRv3V24I.js / index-Cc33oWd9.css; Windows broker and fixed engine packaging compiled. Exact support, bounds, artifact identities and pending work: [coding checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md).

Source/compile milestone only; no app/native job/runtime tests were launched. Full master, S00, Word/PDF fidelity and Revu/release acceptance remain open. The original master-list file is unchanged. Current 65% coding / 35% remaining estimate is rough engineering judgment (about ±5 points), separate from runtime delivery and beta readiness.


#### 📅 Integrated headers, batch and XFDF import — 2026-10-04

Authored document header/footer exports, reviewed selected-PDF batch compression, supported XFDF import, contained structural security/cleanup and native API/lifecycle/privacy integration are saved. Combined compilation passed with 237 Vite modules and refreshed engine/broker pins. Runtime tests remain deferred; private-beta, full master-list, Security Sandbox and Revu interoperability acceptance remain open. [Exact implementation and compilation evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [batch limits](docs/BATCH-COMPRESSION-PROGRESS.md); [XFDF import limits](docs/PDF-XFDF-IMPORT-PROGRESS.md).


#### 📅 Band import, preserving page order and contained redaction — 2026-10-04

Plain DOCX/RTF header/footer import, exact original-page permutation retaining drawing comments/links/forms/bookmarks, and fixed contained redaction verification are integrated. Combined compilation passed with 240 modules and current engine/broker/source pins. Windows development packaging and per-user install/uninstall sources are saved; no installation or runtime testing occurred. [Current coding evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [Windows package bounds and remaining gates](docs/WINDOWS-PACKAGING-PROGRESS.md). Full master targets and beta/release/security/Revu acceptance remain open.


#### 📅 Table extraction, scoped health report and selection geometry — 2026-10-04

Reviewed PDF-word/local-English-OCR table extraction with corrected-cell CSV save is integrated. A scoped health report adds visible geometry, permitted text, internal-link/URL-syntax, structure-presence and form-label observations with cancellation and JSON export. Rotated/non-unit text selection uses the source viewport's rotation and UserUnit across all three text-layer views. Source/compile evidence only; broader extraction/font/image/accessibility/fidelity/security/Revu and runtime acceptance remain open. [Latest checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md); [table extraction](docs/TABLE-EXTRACTION-PROGRESS.md); [health scope](docs/PDF-HEALTH-REPORT-PROGRESS.md); [selection fix](docs/PDF-SELECTION-GEOMETRY-PROGRESS.md). Original master-list source and full acceptance checkboxes remain unchanged.



---


---

<a id="free-acrobat-additions-plan-md"></a>
## 📄 `FREE-ACROBAT-ADDITIONS-PLAN.md`

---

### PDFix free Acrobat additions — adopted October 11, 2026


All 20 user-supplied items below are adopted implementation targets. Preserve earlier R01–R46, F01–F46, master, Bluebeam and A01–A25 scope. R47 adopts this addition; R48 defines explicit folder grants. F47–F66 are stable IDs in the same order as the user's list. Overlap with existing work is an expansion, not another independent completed feature.

The user prioritizes **Workspaces, PDF viewing and PDF editing**. Finish the separate Drawing, Document and Pages rooms, clear navigation between them, PDF-only fullscreen, collapsed panels, large-file viewing/search and supported original-content editing. Keep creation/export easy to find. New tools belong inside their relevant room or contextual menu, without adding persistent banners or crowding the page.

PDFix stays free: no required paid API/subscription, payment links or paid unlocks. Prefer local, offline, redistributable free components with reviewed licenses. "$0" means no PDFix feature charge; it does not promise that Microsoft Office, a cloud provider, optional hardware or operating-system distribution/signing services are free. Office shortcuts can use software already installed by the user; maintain free local alternatives. Cloud folders use the user's existing synchronized folders, without purchasing or silently configuring a cloud service. Optional translation models require license, download-size and hardware disclosure.

#### Adopted feature list

| User priority | ID | Feature | Required behavior | Existing overlap / destination |
| --- | --- | --- | --- | --- |
| 1 | F47 | Automatic form-field detection | Detect candidate blank text fields, checkboxes, dates and signature areas on digital and scanned forms. Show confidence, geometry and editable suggestions before creating fields. | R13 / F18; Forms room; scans depend on bounded OCR/layout analysis. |
| 2 | F48 | Smart form autofill | Store names, addresses and reusable values locally; explicitly choose a profile and review proposed values before applying. Edit/delete profiles and exclude passwords/private keys. | Forms room; protected local storage and user-selected matching. |
| 3 | F49 | Automatic form-field labeling | Suggest names, accessible labels, field type and tab order using nearby text; review ambiguous matches and permit correction. | R13 / F18 / F30; form builder and keyboard-order tools. |
| 4 | F50 | Windows right-click PDF tools | Optional context-menu actions to open, convert, compress or merge selected files. Route to the appropriate reviewed PDFix workspace, preserving selected-file permissions. | F32 / R28; Windows installation/removal and safe argument handling. |
| 5 | F51 | Microsoft Word, Excel and PowerPoint shortcuts | Free local export shortcuts and evaluated direct Office integration where compatible. Explicitly declare installed-Office requirements and supported output fidelity. | R16–R20 / F10 / F32; no bundled or required paid Office license. |
| 6 | F52 | Microsoft Edge browser extension | User-triggered handoff of a PDF or web page to PDFix, with exact URL/source and destination review. Use a bounded local native-messaging path; no automatic browsing/history collection. | F32 / A22; optional extension/native host installation and removal. |
| 7 | F53 | Cloud-folder compatibility | Work with Google Drive, OneDrive and Dropbox folders already synchronized on the PC. Handle placeholders, hydration, offline errors, locks, changed sources and provider hardlinks while keeping staging local. | R01/R03/R04/R05; all open/save workflows; no implicit cloud grants or sync guarantees. |
| 8 | F54 | Email-to-PDF conversion | Convert standard .eml messages to PDF, retaining supported headers/body and an explicit attachment inventory. Preserve supported attachments through reviewed output where feasible; declare omissions. | F10 / A17; bounded MIME decoding, inert HTML and no remote images/scripts. |
| 9 | F55 | PDF from clipboard | Create a PDF from explicitly pasted text, images or screenshots, with editable arrangement, page settings and reviewed output. | Document/Images rooms; inspect clipboard only after a user action and bound bytes/pixels. |
| 10 | F56 | Offline PDF translation | Translate permitted extracted/OCR text through optional local models. Show original/translation with physical-page references, language/model identity and uncertain layout/order. Save a separate copy. | Reading/Document rooms; free licensed local models, cancel/resource limits; no silent online fallback. |
| 11 | F57 | Automatic bookmark generation | Detect candidate headings and suggest bookmark hierarchy/destinations. Review and edit suggestions before writing a preserved copy. | F06 / M07.05; outline tools and OCR uncertainty. |
| 12 | F58 | Search across PDF folders | Search hundreds of PDFs in explicitly selected local folders without opening them individually. Show scope, recursive choice, progress, partial results and page/file references. | M07.02 / R48; bounded local index/search, changed-file handling, cancel and index removal. |
| 13 | F59 | Smart file naming | Suggest filenames from titles, dates or OCR metadata. Show the reason and editable proposal; sanitize Windows names and use exclusive save/keep-both rules. | R05 / M02.08; no automatic original renaming. |
| 14 | F60 | Watched-folder automation | Watch only explicitly granted folders and suggest or execute approved recipes when stable files arrive. Persist consent, pause/revoke controls, receipts and recovery. | F27/F28 / R48; avoid output loops, duplicate jobs and partially synchronized/locked sources. |
| 15 | F61 | CSV mail merge | Map local CSV headers to supported PDF form fields, review rows/results, then generate separate documents with safe names, bounded queues and per-row errors. | F18/F27/F28; standard bounded CSV, no spreadsheet macros or network submissions. |
| 16 | F62 | Signature request preparation | Prepare reviewed signing/date/initial locations and an email handoff artifact. The user sends the request; no hosted tracking or inferred cryptographic signing. | F39 / A04; distinguish preparation, visual signatures and certificate signatures. |
| 17 | F63 | PDF fingerprint verification | Compute SHA-256 of selected files, compare expected values/earlier receipts, and export verification records. Clearly distinguish file change from signer authenticity. | File-details hashes/source seals exist; add explicit compare/import/export verification workflow. |
| 18 | F64 | Print-production marks | Add reviewed crop, bleed and registration marks to supported layouts, with units, offset, bounds and ink/color choices. Preserve original artwork in a new copy. | F29/F40 / A05–A08; no claim that marks alone create bleed or establish PDF/X/color compliance. |
| 19 | F65 | Detailed PDF page-box editor | Inspect/edit MediaBox, CropBox, TrimBox, BleedBox and ArtBox, including explicit/inherited/default values, units, rotation and selected-page application. Compare/review before saving. | R33 / A05; existing crop/box inspection is partial; clipping is not redaction. |
| 20 | F66 | Thin-line inspection and repair | Identify very thin vector strokes with page/object locations and effective physical widths. Offer explicit selected fixes and before/after review, preserving unaffected artwork and original files. | F29 / A05–A07; account for transforms/UserUnit/zero-width strokes; disclose unsupported patterns/forms/appearance cases. |

#### Permission and data rules

R48 extends the previous individually selected-file boundary only through an explicit selected-folder grant. Let users choose recursion, operation/indexing purpose, persistence and included file types. Show the expanded scope and permit revocation and index/history removal. Reparse points, symbolic links, junctions and cloud placeholders must never silently expand access outside the selected grant. Shell/Edge input is an open request, not unlimited file/network authority. Watched folders require a separately approved recipe and output destination; selecting a folder for search does not authorize edits or automation.

Retain immutable source snapshots, new-copy outputs, independent output inspection, exclusive saving, cancellation, source binding, recovery, native containment and inert document content. Do not relax hardlink/containment checks to accommodate synchronized folders; stage owned snapshots outside cloud-synced paths.

Local autofill and indexes can contain sensitive data. Provide clear deletion/export settings, local access controls and protected storage where applicable; avoid passwords, document contents and secrets in diagnostics. Clipboard/camera/browser/email operations are user initiated.

#### Work order and honest status

1. Core Workspaces, viewer and original PDF editor gaps stay first; integrate relevant field/outline/page-box tools into those rooms.
2. Forms F47–F49/F61 and clipboard F55; then folder compatibility/search/naming F53/F58/F59.
3. Optional Windows/Office/Edge handoffs F50–F52 and watched recipes F60.
4. Email/signature preparation/fingerprint F54/F62/F63; local translation F56 after a free model is selected.
5. Print marks/page boxes/thin-line tools F64–F66 with geometry and preservation checks.

This adoption adds scope, not implementation. Existing overlaps remain partial and keep their historical evidence; no F47–F66 target is newly coded, tested or release-ready by this document. The complete original list is represented in order above. Track all 20 individually and reconcile overlapping R/M/B/F/A work rather than adding their counts. Acrobat feature parity remains a target, not an established current capability. Do not assume a vendor's current features, licensing or private interoperability from the supplied comparison; research official interfaces when implementation needs them.




---


---

<a id="master-gap-tracker-md"></a>
## 📄 `MASTER-GAP-TRACKER.md`

---

### Saved master-list coverage


**October 7 additional scope:** R41/A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) adopt all ten supplied Acrobat comparison categories. This extension preserves the 71 original M IDs and source file; covered specialist first-release exclusions now also have explicit later planned targets. Existing master acceptance checkboxes retain their evidence.

**Current whole-scope status (October 4):** [complete feature/debug/testing inventory](PDFIX-COMPLETE-STATUS-2026-10-04.md) and [full future list](PDFIX-FUTURE-FEATURES.md). These distinguish older executed tests from newer untested code and unfinished acceptance; older entries below are historical checkpoints. New R40 requires PDF-only fullscreen.


Saved 2026-10-02. The source is preserved verbatim in [PDFix-Missing-Features-Master-List.md](PDFix-Missing-Features-Master-List.md). Every feature below is in the plan. Saving a requirement does not implement it. Existing subsets have narrower evidence in FEATURE-TRACKER.md and PHASE-LOG.md; the complete master-list acceptance targets remain open.

#### S00 — Security Sandbox (explicit user addition)

Required: Windows OS containment for native document engines; job-only file grants; no network capability; bounded memory/processes/time; cancellation kills the contained process; no unsandboxed fallback. Renderer sandbox, blocked active document content, narrow IPC and chosen-file grants remain mandatory. Native Node workers are not OS sandboxes. Security review and hidden runtime containment checks remain release gates.

#### 1. PDF security, cleanup, and protection

- [ ] M01.01 — **Verified permanent redaction:** remove selected text, regions, image content, and underlying objects so hidden information cannot be recovered. Search repeated words/numbers, show every match, and require review before applying.
- [ ] M01.02 — **Sanitize before sharing:** inspect and selectively remove metadata, embedded attachments, hidden layers, comments, form values, scripts/actions, and other hidden content. Show what will be removed.
- [ ] M01.03 — **Password protection and changes:** add or change PDF passwords using a reviewed implementation; explain permissions and never bypass access controls.
- [ ] M01.04 — **Digital signature validation:** detect certificate signatures and report valid, invalid, or unable to verify only when a reviewed validator supports the result. Warn when edits may invalidate signatures.
- [ ] M01.05 — **Separate signature types:** distinguish visual signatures, certificate-based signatures, and external signature requests.
- [ ] M01.06 — **Safe links and attachments:** show external destinations before opening; list attachments with type/size details and save only to a chosen location. Never execute PDF scripts or auto-open extracted files.
- [ ] M01.07 — **Plain-language security report:** explain encryption, signatures, active content, attachments, and unsupported structures.
#### 2. Compression, conversion, and PDF creation

- [ ] M02.01 — **Compression with quality preview:** show expected size savings and let users inspect quality before saving. Disclose possible loss of text, forms, links, annotations, or other structures.
- [ ] M02.02 — **Broader conversions:** support more tested conversions between PDFs, documents, images, and data files. For each, disclose what happens to fonts, page breaks, images, links, bookmarks, forms, and annotations.
- [ ] M02.03 — **Multiple images to PDF:** add an ordered image list, per-image rotation, page layout, paper size, and recoverable source references. Current documented workflow makes one PDF from one image.
- [ ] M02.04 — **Create PDFs from text/documents:** provide page size, margins, fonts, page breaks, and preview.
- [ ] M02.05 — **More export options:** save a page or selected pages as images; export selected pages as separate PDFs; consider reverse PDF-to-image conversion.
- [ ] M02.06 — **Page additions:** insert blank pages, replace pages with corrected scans, and add page numbers, headers, footers, watermarks, or reusable Draft/Approved/Reviewed stamps.
- [ ] M02.07 — **Metadata tools:** inspect and optionally edit or remove title, author, subject, keywords, and other supported metadata.
- [ ] M02.08 — **Output naming:** offer clear names, keep-both, and destination choices; never silently overwrite originals or unrelated files.
#### 3. Paper, print, engineering, and architecture drawings

- [ ] M03.01 — **Paper-size presets:** common US Letter and Legal, engineering ANSI A–E, architectural ARCH A–E, and ISO A-series such as A0–A4, where supported by the operation.
- [ ] M03.02 — **More page views:** single page, continuous scroll, facing pages, two-page spread, and side-by-side pages, with clear page order.
- [ ] M03.03 — **Large-sheet navigation:** smooth pan and zoom, zoom-to-region, fit-sheet, and return-to-previous-view for blueprints, plans, schematics, and maps.
- [ ] M03.04 — **Scale-aware measurement:** calibrate drawing scale first, then measure distance, perimeter, and area with visible units and a way to confirm calibration.
- [ ] M03.05 — **Drawing markups:** dimension lines, arrows, callouts, revision clouds, and color-coded comments alongside notes, highlights, and drawing tools.
- [ ] M03.06 — **PDF layers:** show or hide layers where the PDF contains them.
- [ ] M03.07 — **Drawing revision comparison:** align sheets and compare with a transparent overlay or side-by-side view; allow alignment adjustment when scale or position shifted.
- [ ] M03.08 — **Large-format printing:** print at actual size, fit to a chosen sheet, or tile across pages with overlap and alignment marks. Include ranges, orientation, scaling, and multiple pages per sheet.
- [ ] M03.09 — **Booklet printing:** provide layout preview and clear paper/duplex requirements.
- [ ] M03.10 — **Sheet sets:** group related drawings, navigate sheets, and preserve order.
- [ ] M03.11 — **Drawing information:** show sheet number, title, revision, dimensions, and page size when present.
- [ ] M03.12 — **CAD boundary:** do not imply PDFix edits CAD models; DWG and other CAD formats need separate decoder, licensing, and corpus evaluation.
#### 4. Forms, signatures, and review

- [ ] M04.01 — **Create basic fillable forms:** add supported text, checkbox, radio, and choice fields, in addition to filling existing fields.
- [ ] M04.02 — **Improve form usability:** clearer labels, tab order, required-field guidance, supported fonts, and explanations for unsupported calculations/fields.
- [ ] M04.03 — **Form submission:** save a completed copy, print it, or export supported field data; explain unsupported fields.
- [ ] M04.04 — **Signature placement help:** identify likely signature/date/initial fields and suggest locations, but require confirmation of content and placement.
- [ ] M04.05 — **Reusable assets:** save user-approved signatures, initials, stamps, and common markups with clear local storage and deletion controls.
- [ ] M04.06 — **Broader annotations:** edit third-party annotations, threaded replies, and comment exchange only after preservation tests.
- [ ] M04.07 — **Annotation export:** offer a separate annotation summary or copy where verifiable.
#### 5. Scanning, OCR, and information extraction

- [ ] M05.01 — **Scan from a device:** import from scanner/document camera, including multi-page scans where supported; preview, reorder, rotate, or remove pages before making a PDF.
- [ ] M05.02 — **Scan cleanup:** preview deskew, contrast/brightness cleanup, rotation, and proposed blank-page removal. Distinguish faint content from blank pages and allow undo.
- [ ] M05.03 — **Broader OCR:** add only tested bundled/installed languages; make language choice clear and show confidence as an estimate.
- [ ] M05.04 — **Uncertainty review:** locate uncertain words/lines on the scan, preserve page references, and require review before saving corrections.
- [ ] M05.05 — **Extract tables:** offer table-to-CSV/spreadsheet export only when recognition is suitable, with preview to catch misaligned rows and columns.
- [ ] M05.06 — **Searchable documents:** preserve scan images and explain when OCR reading order or recognition needs review.
- [ ] M05.07 — **Clear scan limits:** explain limits for handwriting, low resolution, skew, mixed languages, and complex reading order.
#### 6. File formats, photos, and editing fidelity

- [ ] M06.01 — Evaluate and add tested support for HEIC/HEIF (orientation and metadata choices), multipage TIFF, RTF, XLSX/PPTX preview/conversion, legacy DOC/XLS/PPT, and Apple Pages/Numbers/Keynote. Add a meaningful Markdown preview and structured table views for CSV/data files while retaining source editing. Complete real-file fixtures for XML, YAML, CSV, BMP, and uncommon image variants before claiming support. Clearly separate Open, Preview, Edit, and Convert for each format. Explain fidelity limits before conversion. Let users choose whether photo metadata/color profiles are kept or removed.
#### 7. Navigation, search, and multi-file workflows

- [ ] M07.01 — **Search navigation:** match counts and next/previous controls.
- [ ] M07.02 — **Search selected files:** search only deliberately selected files; show filename and page for each result.
- [ ] M07.03 — **Quick action finder:** “What do you want to do?” search for sign, split, compress, OCR, compare, or convert.
- [ ] M07.04 — **Move pages across PDFs:** drag pages between open PDFs with a visible preview.
- [ ] M07.05 — **Page navigation:** jump by printed page label; edit bookmarks/table-of-contents entries; safely show internal link destinations.
- [ ] M07.06 — **Batch operations:** queue supported conversion, compression, rename, combine, and other verified actions with per-file progress/results, cancellation, output location, collision handling, and bounded resources.
- [ ] M07.07 — **Reusable workflows:** repeat reviewed sequences such as OCR → review → save copy or combine → number pages → print; show and allow editing of steps before running.
- [ ] M07.08 — **Recover interrupted jobs:** let users retry/discard failed or canceled jobs without confusing partial output for completed work.
- [ ] M07.09 — Search and batch features must not imply broad folder scanning.
#### 8. Accessibility, quality checks, and inspection

- [ ] M08.01 — **Accessibility checks:** inspect tags, reading order, headings, links, and form labels; distinguish searchable OCR from accessible structure.
- [ ] M08.02 — **Guided accessibility repair:** offer fixes only when results can be validated; don’t promise automatic tagging makes a PDF fully accessible.
- [ ] M08.03 — **Document health report:** identify missing fonts, oversized images, broken links, unusual page sizes, unsupported features, and possible print problems; offer safe fixes only where verified.
- [ ] M08.04 — **Trustworthy file details:** show page dimensions/orientation/count, file size, text searchability, encryption state, and feature limits.
- [ ] M08.05 — **Accessible job status:** announce progress, failures, and cancellation to keyboard and screen-reader users.
- [ ] M08.06 — **Scalable interface:** test larger text, contrast, visible focus, keyboard navigation, and reduced motion throughout dialogs/workflows.
- [ ] M08.07 — **Print preview:** inspect prepared output, selected pages, paper, orientation, scaling, annotations, and rasterization before Windows handoff.
- [ ] M08.08 — Physical printer validation remains a release check; simulated preparation alone does not prove paper output.
#### 9. Privacy, sharing, Windows, and AI

- [ ] M09.01 — **Share local copies:** provide Windows share handoff for a new copy. For cloud links/uploads, show service, account, destination, and permissions before sending.
- [ ] M09.02 — **Transfer history:** if online AI/sharing is added, show what files were sent, to which endpoint/service, and when; allow cleanup.
- [ ] M09.03 — **Optional AI providers/agents:** scope each request to selected files; show provider, model, endpoint, destination, and possible account charges before transfer.
- [ ] M09.04 — **Cited answers:** provide page/line references where available and distinguish source text from generated explanation.
- [ ] M09.05 — **Read-only AI by default:** treat document contents as untrusted; prevent automatic saving/exporting/overwriting/tool use. Require separate approval and a reviewable result for changes.
- [ ] M09.06 — **Connection controls:** test, select, and remove connections; store secrets using Windows-backed secure storage and fail closed if unavailable.
- [ ] M09.07 — **Hermes:** evaluate its documented HTTP API before implementing.
- [ ] M09.08 — **Harness:** defer until the exact product/interface is identified.
- [ ] M09.09 — **Windows lifecycle:** installer, uninstaller, updates, optional file associations, and Open with PDFix.
- [ ] M09.10 — **Release readiness:** security, licensing, dependency/SBOM, performance, clean-machine install, and real-file corpus reviews.
#### 10. Later candidates and first-release boundaries

- [ ] M10.01 — Later candidates: online signature requests/tracking, shared/cloud review, online form response collection, PDF/A or PDF/X validation, tagged-PDF validation, accessibility repair, and Bates numbering. Each needs a clear user need and reviewed engine/service before it appears as working.
- [ ] M10.02 — Keep bulk signature/payment workflows, PDF portfolios, barcode fields, advanced print-shop color/trapping, geospatial/3D measurement, embedded multimedia, presentation generation, and CAD model editing out of the initial scope unless the direction changes.

#### 📅 Latest coding checkpoint — 2026-10-02

Native Security Sandbox foundation, M01.06 link-review subset, M01.07 structural reports, M03.01 paper presets, M03.04 calibrated measurement, M03.06 temporary layers, M04.03 supported field-data exports, M04.07 annotation summaries and M06.01 Markdown/CSV preview subsets are coded. Runtime/security/corpus acceptance gates remain unchecked. Attachment saving, certificate validation, complete sanitation, all decoder containment and the other master-list items remain work. Exact boundaries are in FEATURE-TRACKER.md, ARCHITECTURE.md and PHASE-LOG.md.

M08.04 file-details subset is coded, with runtime/corpus gates open. Password-field privacy withholding was added to supported-form UI/data/recovery handling; source password data is retained in original/copy PDFs, not sanitized.


#### 📅 Latest coding increments (acceptance remains open)

Parallel 2026-10-02 coding added selective cleanup (M01.02), reviewed .bin attachment copies (M01.06), range/paper/fit/actual/N-up/booklet print preparation (M03.08–09), continuous/facing-page views (M03.02), new text/checkbox fields with labels/flags/recovery (M04.01–02), scan deskew and OCR uncertainty/review exports (M05 subsets), provider connection/context review and Windows intake metadata (M09 subsets). See PARALLEL-WORKSTREAMS.md, FORMAT-SUPPORT.md and PHASE-LOG.md for exact limits. Full checkbox targets remain unverified and incomplete; source compilation does not establish corpus, preservation, physical printer or sandbox security results.


#### 📅 11. Bluebeam/Revu drawing review — user addition, 2026-10-03

R39 adds [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md). Priority confirmed: review drawings and comments. The source master list is unchanged.

- [ ] B01 — Existing Revu PDF markup artwork and explicit unsupported types.
- [ ] B02 — Searchable/filterable markup list with sheet-location navigation.
- [ ] B03 — Supported reply threads, review states/history and locks.
- [ ] B04 — Verified foreign-markup and unknown-data preservation in edited copies.
- [ ] B05 — Reviewed comment reports and evaluated exchange formats.
- [ ] B06 — Revision clouds, arrows and callouts.
- [ ] B07 — Aligned/color-overlay drawing revision review.
- [ ] B08 — Sheet sets and controlled revision replacement.
- [ ] B09 — Large-sheet markup navigation, fullscreen and collapsible review panel.
- [ ] B10 — Reusable review stamps/tools; separate proprietary tool-set evaluation.
- [ ] B11 — PDF-embedded custom markup data and quantities.
- [ ] B12 — Persistent calibrated measurements/counts/takeoff totals.

Viewing flattened artwork cannot restore missing comment metadata. Studio/cloud integration remains a separate evaluated future item. All acceptance targets above remain open.


R39 drawing-review coding checkpoint: source-bound read-only comments inventory and filtered/threaded panel, named filters, reviewed TXT/CSV reports, comment-location/previous-view navigation, embedded sheet-label jump and line/arrow/cloud/callout markup tools are saved and compiled. Exact limits are in FEATURE-TRACKER.md/PHASE-LOG.md. Bluebeam/Revu round-trip, imported comment editing, unknown-data preservation and the full B01–B12 acceptance targets remain open; no runtime testing performed.


R39 follow-on source coding: supported imported plain-comment edits, additive replies and explicit standard review-history entries now have a preserving native writer and exact changed-page review UI. Reusable local tool styles and searchable direct Workspaces access are saved. B03/B04/B06/B10 progress; no Revu round-trip acceptance or runtime checks. Portable recipes, standard source colors and drawing overlays are currently assigned, not yet delivered. Full master acceptance remains open.


2026-10-03 integrated follow-on: preserving supported plain-comment/reply copies, explicit source-bound portable JSON drafts, standard /C and /IC metadata/reporting, reusable local drawing styles and aligned transparent/cyan-magenta comparison overlays are now saved and compiled (202 modules). Exact bounds and remaining gates are in FEATURE-TRACKER.md/PHASE-LOG.md. Recipes preserve unsaved staged/composer text after explicit save and exact-source restore, with reviewed replacement/Undo. They do not restore output seals or automatically save a PDF. Runtime/Revu round-trip verification and full B01–B12 acceptance remain open. Earlier in-progress/blanket read-only entries record older checkpoints.


2026-10-03 integrated 208-module checkpoint: named related-sheet sets, ordered navigation/user labels and explicit original/new revision-reference review; separate calibrated length/area/count ledger with grouped totals, source-bound reviewed JSON/CSV export/import; reviewed JSON comment metadata; native universal registered-renderer close handshake. Exact limits/status are saved in FEATURE-TRACKER.md/PHASE-LOG.md. B05/B08/B12 and M03.04/M03.10/M03.11 subsets advanced. Physical PDF revision replacement/comment transfer, full embedded measurement annotations and runtime/Revu/release acceptance remain open; these features do not complete the full targets.


#### 📅 Persistent takeoff copies and reusable decoration templates — 2026-10-04

This later checkpoint supersedes earlier statements that takeoffs are separate-ledger-only. The drawing takeoff ledger now opens a frozen PDF-copy workspace. A source-bound native writer adds one Line (distance), PolyLine (open perimeter), Polygon (closed perimeter/area), or Ink (count) annotation per entry. Explicit vector appearances include numeric quantity labels in the chosen display unit. Unicode comments/author and canonical PDFixData retain original points, physical-page identity, source fingerprint, calibration and recomputed quantities. Maximum 200 entries / 10,000 aggregate points, 2 MiB request, 100 MiB PDF and 500 pages. Source crop/media intersection and UserUnit are checked natively. Physical pages are authoritative; sheet labels remain supplied descriptions independently reviewed against the source. Counts carry no length calibration.

The native construction manifest allows only cloned/appended selected page Annots arrays and normalization of raw-stream Length to unchanged encoded payload size. All original objects, existing annotations, unknown/private fields and encoded stream payloads are retained. After serialization, native reopening compares every declared object, geometry/trailer references, exact annotation order, appearance bytes and canonical metadata. The immutable native receipt is fenced to source SHA/token/generation before an exclusive chosen-file Save Copy. Source-bound ledger math is generated from the same pure UI source during compilation. The worker has a two-minute deadline, 256 MiB old-generation heap, 16 MiB single / 64 MiB aggregate compressed-object decoding budgets; this worker is not an OS sandbox. Signed, certified, encrypted, XFA and unsupported sources are refused. No standard Measure dictionary or proprietary Bluebeam measurement editing is promised.

The UI also checks output/ledger/metadata hashes and exact annotation types, coordinates, text/author and appearances with an independent PDF reader. Every changed original/output drawing page must be visibly reviewed before saving (2 MP per preview). Ledger mutation and measurement controls are held while this copy workspace is open. Cancellation/discard retains the source and full separate ledger. Leaving protects unsaved JSON ledger data; saving a PDF does not mark that separate portable recipe as saved. Exported PDF annotations include unencrypted author, names and complete point/calibration metadata. Recovering this embedded metadata into an editable ledger is a remaining feature; existing JSON import remains source-bound.

Decoration templates now save up to 20 named styles / 64 KiB locally: standard font, inset, page numbers, headers, footers, watermarks and Draft/Approved/Reviewed text stamps. Apply requires explicit confirmation and invalidates a previous PDF preview; current physical-page selection and range stay selected. Templates exclude source IDs, page selection, generated PDFs and receipts. Named save, apply, delete/clear and bounded raw-text export are explicit. Corrupt storage fails closed; concurrent library changes are checked before writes. Text/styles are unencrypted local-profile data, separately disclosed in Settings & privacy, with deletion in Page numbers and stamps. Text stamps do not certify approval or create certificate signatures.

Source and build milestone only. Runtime, native-worker, broker, app, print and Revu acceptance tests remain deferred at the user's request. These additions advance B10/B12 drawing workflows without completing the full Bluebeam or master requirements. Earlier subagent source for templates/preview UI was retained; root completed the missing native writer and integration after those agents hit the account limit. Full interoperability, broader editing/format fidelity, release packaging and security/accessibility acceptance remain open.


#### 📅 Recover and revise embedded PDFix takeoffs — 2026-10-04

Saved native read-only recovery, independent-reader comparison and actual drawing-page review for canonical PDFix takeoff metadata. The reader's Takeoff quantities panel now has Recover takeoffs from this PDF and a native-processing cancel control. Recovery is explicit, never automatic. Native inspection requires a unique indirect annotation on its declared physical page; exact canonical metadata/author/NM, recomputed quantity, source geometry/UserUnit, Line/Polygon/PolyLine coordinates or count marker strokes and bounded normal appearance are checked. Unsupported versions/malformed recognized takeoffs fail closed; other/unreadable PDFix metadata is reported as untouched. Maximum 10,000 source annotations, 200 recovered entries, 2 MiB aggregate metadata / 4 MiB complete receipt, two-minute worker deadline and existing bounded worker heap/decode budgets. Protected/signed/XFA and unsupported sources remain refused. This worker is not an OS sandbox.

Each adopted entry receives a new identity bound to the currently opened PDF SHA, retaining original source SHA, annotation structural reference, author and metadata hash as provenance. Optional origin fields are strictly validated and travel with JSON/PDF metadata. Independent PDF-reader checks compare actual source annotation identity/type, bounds, author/text and path/count coordinates; actual crop/UserUnit and shortened labels must match this current source. Every recovered drawing page must be viewed (one reusable 2 MP canvas), then the user explicitly replaces the current in-memory ledger. Source bindings/hash are rechecked after asynchronous steps; cancellation retains the previous ledger. Undo restores it. Recovery is dirty until JSON is saved. Embedded metadata/calibration is untrusted file data and is not authenticated engineering information.

Edit entry now supports reviewed name/group changes and known reference length/unit changes for each calibrated quantity. Saved measurement/reference positions stay fixed. Quantities are recomputed, fully schema-validated and source-fenced before adoption; preview invalidity disables Apply, edits are dirty and Undo is available. Counts carry no length calibration. Editing a ledger alone does not change PDF bytes.

The takeoff PDF-copy dialog now offers an explicit unchecked-by-default option to update supported recovered annotations. Native selection is fenced by source SHA, unique structural reference, original NM/author/metadata hash, unchanged physical-page/path/reference geometry and known annotation fields. Locked/read-only, shared, threaded/replied-to, popup/group/rich/private-extended or independently changed targets are refused. Only declared original page references are removed, replacement appearances/metadata are appended, and all unrelated annotation entries stay in order. Native reopening verifies exact retained objects, arrays, geometry/trailer and new annotation results; the independent reader verifies declared removals and unrelated identity retention before every changed-page actual before/after review. Saving remains an immutable source/token-bound exclusive new copy. Original dictionaries/appearances remain in the retained object graph, including replaced takeoffs; this is neither redaction nor permanent deletion. Leave the update option unchecked to append additional visible annotations.

This supersedes the earlier recovery-pending and always-append-only checkpoint descriptions. Revu/proprietary takeoff interchange, new point/reference placement for an existing recovered entry, deleting embedded annotations and broad compatibility/security/release acceptance remain future work. Full master requirements remain open. No app, native worker, broker or runtime tests were launched; tests remain deferred as requested.


#### 📅 Reviewed XFDF export — 2026-10-04

B05/M04.06/M04.07 advanced with reviewed standard-geometry XFDF export and separate exact JSON omission receipt. Complete annotation exchange, appearance/private-field preservation and runtime interoperability remain open; existing master checkboxes stay unchecked. [Source implementation](docs/DRAWING-XFDF-EXPORT.md). Original master-list file is unchanged.


#### 📅 Three major-gap agents integrated — 2026-10-04

User requested renewed subagents on the largest gaps. All three new agents completed concrete source slices; root integrated and compiled them. Earlier account-limit failures did not recur for these agents.

- Document fidelity: editable tables with ProseMirror cell selection, bounded rectangular spans, row/column/merge/split/header/fill controls and Undo; supported DOCX import and structured DOCX/PDF export; native recovery validation; TXT/RTF explicit tabular flattening. Original column widths/borders, images/nested tables and page-perfect Word preservation remain open. Details: [DOCUMENT-FIDELITY-PROGRESS.md](docs/DOCUMENT-FIDELITY-PROGRESS.md).
- Original PDF editing: bounded embedded Type1/TrueType one-byte and horizontal Type0 Identity-H two-byte ToUnicode maps, per-string multipart TJ edits retaining numeric spacing, reuse of observed source glyphs, preserved stream dictionaries and reopened source-font graph/encoded-program hash proof. Multicharacter/ligature entries omit affected runs while retaining other usable map entries. New glyph embedding, shaping/reflow, Type3/custom/vertical/nested/marked-content editing and complete unrelated-object preservation acceptance remain open. Details: [PDF-EDITING-FIDELITY-PROGRESS.md](docs/PDF-EDITING-FIDELITY-PROGRESS.md).
- Security Sandbox: fixed document-engine AppContainer/Job Object source with exact token/capability checks, one-process/512 MiB/115-second bounds, read-only staged source/request/runtime and three precreated writable output slots. Codec bundle supports nine fixed operations. Root packages the existing standalone Windows x64 Node runtime/license with SHA pins and bundled dependency attribution; XFDF export adopts the contained path exclusively, with no worker fallback. Cancellation observes broker close, source/output validators remain, cleanup failure/unsafe termination permanently closes the service. Broker close observation is subscribed immediately at launch to cover early failures across async boundaries. Other Office/review/takeoff/redaction routes still need adoption. Details: [SECURITY-SANDBOX-PROGRESS.md](docs/SECURITY-SANDBOX-PROGRESS.md).

Root also completed reviewed 11-type XFDF geometry/plain-comment export with exact XML, filtered source identity/fingerprint checks, per-annotation omissions, reviewed exclusive sealed saves and separately saved JSON receipt. Native runtime/security status is shown in Settings. Existing comment TXT/CSV/JSON snapshots remain separate. The XLSX sharedStrings undeclared-variable failure is fixed with an 8 MiB aggregate bound; current format/workspace/AI/privacy text reflects saved capabilities.

Final compilation passed: 224 Vite modules; index-BFhcaNJF.js / index-kVg5VJNm.css; pdf-job.worker-KFHKMFMu.js / document.worker-BXg1i3K9.js. Broker C# and fixed engine bundle compile; targeted JS/CJS syntax checks passed. Build output includes pinned node.exe, engine.cjs, broker manifests and runtime/dependency licenses. No app, broker, document engine, native worker, network/print or runtime tests were launched. Verifier code and compilation are not evidence of executed fidelity/OS isolation/Revu acceptance. User-requested runtime testing remains deferred; full master requirements and S00 remain open. Original master-list source is unchanged.


#### 📅 Integrated images, table grids, nested editing, containment and search — 2026-10-04

Three user-requested agents delivered inline document images, editable/preserved table column proportions, nested original PDF text/image changes with shared Form isolation, and contained-only Office/comment/takeoff/grid processing. Root integrated native source/lifecycle guards, local search across selected files, import cancellation and current capability/status text. The combined build passed: 231 modules, index-CRv3V24I.js / index-Cc33oWd9.css; Windows broker and fixed engine packaging compiled. Exact support, bounds, artifact identities and pending work: [coding checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md).

Source/compile milestone only; no app/native job/runtime tests were launched. Full master, S00, Word/PDF fidelity and Revu/release acceptance remain open. The original master-list file is unchanged. Current 65% coding / 35% remaining estimate is rough engineering judgment (about ±5 points), separate from runtime delivery and beta readiness.


#### 📅 Integrated headers, batch and XFDF import — 2026-10-04

Authored document header/footer exports, reviewed selected-PDF batch compression, supported XFDF import, contained structural security/cleanup and native API/lifecycle/privacy integration are saved. Combined compilation passed with 237 Vite modules and refreshed engine/broker pins. Runtime tests remain deferred; private-beta, full master-list, Security Sandbox and Revu interoperability acceptance remain open. [Exact implementation and compilation evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [batch limits](docs/BATCH-COMPRESSION-PROGRESS.md); [XFDF import limits](docs/PDF-XFDF-IMPORT-PROGRESS.md).


#### 📅 Band import, preserving page order and contained redaction — 2026-10-04

Plain DOCX/RTF header/footer import, exact original-page permutation retaining drawing comments/links/forms/bookmarks, and fixed contained redaction verification are integrated. Combined compilation passed with 240 modules and current engine/broker/source pins. Windows development packaging and per-user install/uninstall sources are saved; no installation or runtime testing occurred. [Current coding evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [Windows package bounds and remaining gates](docs/WINDOWS-PACKAGING-PROGRESS.md). Full master targets and beta/release/security/Revu acceptance remain open.


#### 📅 Table extraction, scoped health report and selection geometry — 2026-10-04

Reviewed PDF-word/local-English-OCR table extraction with corrected-cell CSV save is integrated. A scoped health report adds visible geometry, permitted text, internal-link/URL-syntax, structure-presence and form-label observations with cancellation and JSON export. Rotated/non-unit text selection uses the source viewport's rotation and UserUnit across all three text-layer views. Source/compile evidence only; broader extraction/font/image/accessibility/fidelity/security/Revu and runtime acceptance remain open. [Latest checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md); [table extraction](docs/TABLE-EXTRACTION-PROGRESS.md); [health scope](docs/PDF-HEALTH-REPORT-PROGRESS.md); [selection fix](docs/PDF-SELECTION-GEOMETRY-PROGRESS.md). Original master-list source and full acceptance checkboxes remain unchanged.

#### 📅 Acrobat replacement scope intake — October 7, 2026

R41 adopts the entire supplied comparison: [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) defines all ten categories and A01–A25 work packages, overlaps, priorities, dependencies and acceptance boundaries. The original comparison is preserved in [the intake record](docs/ACROBAT-COMPARISON-USER-INPUT-2026-10-07.txt). The product plan, roadmap, complete planned catalog, future list and status inventory include the new scope. Existing related implementations keep their narrower recorded status; no code, test, acceptance, benchmark or release claim is added. Older completion percentages have not been recalculated for this expanded plan. Covered specialist features become later adopted targets; current containment, consent and no-DRM-bypass rules remain.


#### 📅 October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.



---


---

<a id="parallel-workstreams-md"></a>
## 📄 `PARALLEL-WORKSTREAMS.md`

---

### PDFix parallel coding workstreams


Updated 2026-10-02. The user asked for agents on each remaining workstream, with feature coding prioritized and runtime testing deferred. Three additional agents can run concurrently with the integrating lead. Agents move to another assigned area when their first slice is saved; assignments do not mean the full areas are finished.

| Workstream | Assignment | Saved additions this pass | Remaining major scope |
| --- | --- | --- | --- |
| Security Sandbox / PDF cleanup | security_cleanup | Selective structural metadata, attachments, comments/links, whole forms and scripts/actions cleanup; fresh reachable-object serialization, native token-bound copy saving, rebuilt PDF preview; independently decoded attachment metadata and native exclusive .bin export | More native engine OS containment; hidden-layer cleanup; vector redaction; hostile-file and Windows containment verification |
| Scans / OCR / formats / conversions | scan_conversion, first slice | Explicit image deskew with recovered settings, confidence/review navigation, reviewed TXT and line-inventory CSV export | Scanner/camera integration, direct PDF scan cleanup, more OCR languages, table reconstruction, HEIC/TIFF and remaining format adapters |
| Printing / page views / batches | Lead print preparation plus ai_windows, second slice | Physical page ranges, shared paper presets, orientation, fit/actual size, quality, margin/copies/color/duplex requests, actual raster side previews; 2-up, 4-up and booklet order/blank padding; lazy continuous/facing-page views | Tiled print, sheet sets, batch workflows; physical printer/driver verification |
| AI / Windows sharing and installation | ai_windows, first slice | Provider setup, encrypted native keys, discovery, frozen excerpt review/native confirmation, cancellable requests/citations/content-free history; queued Windows file intake and per-user association metadata | PDF/Office context adapters beyond exact opened UTF-8 source-line selection; Hermes/Harness containment/adapters; installer/update/share lifecycle and clean-machine verification |
| Forms / review | scan_conversion, second slice | New empty text/checkbox fields, bounded page rectangles, labels/tooltips and flags; source-bound recovery and native verified-copy service and reopened-output UI | Additional field types/calculations, cross-viewer tab-order verification, broader comments/replies/placement corpus |

Source and original-copy boundaries remain mandatory. New worker-thread processing has heap/time limits but is not an OS sandbox. AI sends require the user to review a frozen request and exact endpoint; custom servers can still perform their own tool activity. Windows association metadata is packaging input, not an installed registration. Source-backed UI code and compilation are not runtime/security/release evidence. The supplied master list remains verbatim in PDFix-Missing-Features-Master-List.md and its full acceptance checkboxes remain open in MASTER-GAP-TRACKER.md.


Next assignments after the integrated 171-module build: ai_windows is coding named organizer workflow recipes; security_cleanup is coding actual-size print tiling plans/controls; scan_conversion is coding reviewed blank-scan proposals. These slices are in progress and are not counted as delivered. Lead owns shared integrations, compilation, original-copy boundaries and saved status. No runtime tests are assigned.


2026-10-03: named workflows, tiled printing and blank-page proposals are now integrated. Lead added interface text/contrast and separate form-recipe privacy management. Next live agent assignments: ai_windows — editable PDF bookmarks; security_cleanup — page numbers/headers/footers/watermarks/stamps; scan_conversion — radio and choice form fields. These next slices remain in progress. Build of the first integrated three slices passed with 180 modules; later readability/privacy changes await the combined compile with stable agent code.


2026-10-03 integration: the three bookmark/decoration/radio-choice slices are now saved and wired into the application. Compilation passed at 187 modules; runtime acceptance remains deferred. ai_windows also saved docs/BLUEBEAM-SOURCE-GAPS.md. R39/B01–B12 capture the user's new Bluebeam request with drawing/comment review first.


2026-10-03 drawing-review batch: review_inventory saved native inventory/schema/cancellation; review_panel saved comments UI/model/named filters; drawing_tools saved line/arrow/cloud/callout controls/gestures/appearances/recovery. Root wired source-bound IPC, reader/actionfinder/departure, location/previous-view and embedded sheet-label navigation. All three source slices are integrated; syntax + 194-module compile passed. Runtime testing remains deferred, complete goal remains active.


2026-10-03 follow-on coding: review_inventory delivered the preserving comment/reply writer; review_panel delivered its staged edits and actual changed-page review UI; drawing_tools delivered reusable local styles. Lead connected native/preload chosen-copy saves, departure/disposal, workspace intake/search and comparison access. Current fast coding assignments: drawing_tools — aligned transparent/color overlays; review_panel — explicit source-bound portable review draft recipes; review_inventory — literal standard annotation color metadata/display/reporting. No runtime tests assigned.


2026-10-03 final integrated checkpoint: drawing_tools finished aligned overlays; review_inventory finished standard color metadata/display/reporting; review_panel finished portable staged/unstaged review drafts and author-attributed status-only history entries. Root connected bounded draft intake, workspace comparison/Office pickers, privacy disclosure and saved status. All three assignments completed. Combined 202-module compilation passed; runtime testing remains deferred.


Next B08/B12 coding: review_inventory finished the native sheet-set descriptor library and exact-original restore; review_panel is building ordered sheet navigation and explicit revision-reference replacement; drawing_tools is building a calibrated length/area/count ledger with reviewed separate exports/import. Root added JSON review metadata reports and main/preload/reader/workspace/departure integration. Current UI slices are not yet counted as delivered. No runtime tests assigned.


208-module checkpoint: review_inventory completed native SheetSets; review_panel completed ordered sheet navigation/comments and explicit revision-reference review; drawing_tools completed separate calibrated takeoff ledger/counts/quantities/JSON/CSV. Root integrated IPC, purpose-specific source/JSON intake, commands/cards, departure hooks, privacy disclosure, JSON review metadata and registered-renderer native close handshake. All assignments completed; source compilation passed. Runtime tests remain deferred.


#### 📅 Persistent takeoff copies and reusable decoration templates — 2026-10-04

This later checkpoint supersedes earlier statements that takeoffs are separate-ledger-only. The drawing takeoff ledger now opens a frozen PDF-copy workspace. A source-bound native writer adds one Line (distance), PolyLine (open perimeter), Polygon (closed perimeter/area), or Ink (count) annotation per entry. Explicit vector appearances include numeric quantity labels in the chosen display unit. Unicode comments/author and canonical PDFixData retain original points, physical-page identity, source fingerprint, calibration and recomputed quantities. Maximum 200 entries / 10,000 aggregate points, 2 MiB request, 100 MiB PDF and 500 pages. Source crop/media intersection and UserUnit are checked natively. Physical pages are authoritative; sheet labels remain supplied descriptions independently reviewed against the source. Counts carry no length calibration.

The native construction manifest allows only cloned/appended selected page Annots arrays and normalization of raw-stream Length to unchanged encoded payload size. All original objects, existing annotations, unknown/private fields and encoded stream payloads are retained. After serialization, native reopening compares every declared object, geometry/trailer references, exact annotation order, appearance bytes and canonical metadata. The immutable native receipt is fenced to source SHA/token/generation before an exclusive chosen-file Save Copy. Source-bound ledger math is generated from the same pure UI source during compilation. The worker has a two-minute deadline, 256 MiB old-generation heap, 16 MiB single / 64 MiB aggregate compressed-object decoding budgets; this worker is not an OS sandbox. Signed, certified, encrypted, XFA and unsupported sources are refused. No standard Measure dictionary or proprietary Bluebeam measurement editing is promised.

The UI also checks output/ledger/metadata hashes and exact annotation types, coordinates, text/author and appearances with an independent PDF reader. Every changed original/output drawing page must be visibly reviewed before saving (2 MP per preview). Ledger mutation and measurement controls are held while this copy workspace is open. Cancellation/discard retains the source and full separate ledger. Leaving protects unsaved JSON ledger data; saving a PDF does not mark that separate portable recipe as saved. Exported PDF annotations include unencrypted author, names and complete point/calibration metadata. Recovering this embedded metadata into an editable ledger is a remaining feature; existing JSON import remains source-bound.

Decoration templates now save up to 20 named styles / 64 KiB locally: standard font, inset, page numbers, headers, footers, watermarks and Draft/Approved/Reviewed text stamps. Apply requires explicit confirmation and invalidates a previous PDF preview; current physical-page selection and range stay selected. Templates exclude source IDs, page selection, generated PDFs and receipts. Named save, apply, delete/clear and bounded raw-text export are explicit. Corrupt storage fails closed; concurrent library changes are checked before writes. Text/styles are unencrypted local-profile data, separately disclosed in Settings & privacy, with deletion in Page numbers and stamps. Text stamps do not certify approval or create certificate signatures.

Source and build milestone only. Runtime, native-worker, broker, app, print and Revu acceptance tests remain deferred at the user's request. These additions advance B10/B12 drawing workflows without completing the full Bluebeam or master requirements. Earlier subagent source for templates/preview UI was retained; root completed the missing native writer and integration after those agents hit the account limit. Full interoperability, broader editing/format fidelity, release packaging and security/accessibility acceptance remain open.

Final compilation for this checkpoint succeeded: 214 Vite modules, index-tK5KmaBF.js / index-DXArFu-x.css. Targeted source syntax checks passed. No runtime tests or app/native-worker/broker launches were performed.


#### 📅 Recover and revise embedded PDFix takeoffs — 2026-10-04

Saved native read-only recovery, independent-reader comparison and actual drawing-page review for canonical PDFix takeoff metadata. The reader's Takeoff quantities panel now has Recover takeoffs from this PDF and a native-processing cancel control. Recovery is explicit, never automatic. Native inspection requires a unique indirect annotation on its declared physical page; exact canonical metadata/author/NM, recomputed quantity, source geometry/UserUnit, Line/Polygon/PolyLine coordinates or count marker strokes and bounded normal appearance are checked. Unsupported versions/malformed recognized takeoffs fail closed; other/unreadable PDFix metadata is reported as untouched. Maximum 10,000 source annotations, 200 recovered entries, 2 MiB aggregate metadata / 4 MiB complete receipt, two-minute worker deadline and existing bounded worker heap/decode budgets. Protected/signed/XFA and unsupported sources remain refused. This worker is not an OS sandbox.

Each adopted entry receives a new identity bound to the currently opened PDF SHA, retaining original source SHA, annotation structural reference, author and metadata hash as provenance. Optional origin fields are strictly validated and travel with JSON/PDF metadata. Independent PDF-reader checks compare actual source annotation identity/type, bounds, author/text and path/count coordinates; actual crop/UserUnit and shortened labels must match this current source. Every recovered drawing page must be viewed (one reusable 2 MP canvas), then the user explicitly replaces the current in-memory ledger. Source bindings/hash are rechecked after asynchronous steps; cancellation retains the previous ledger. Undo restores it. Recovery is dirty until JSON is saved. Embedded metadata/calibration is untrusted file data and is not authenticated engineering information.

Edit entry now supports reviewed name/group changes and known reference length/unit changes for each calibrated quantity. Saved measurement/reference positions stay fixed. Quantities are recomputed, fully schema-validated and source-fenced before adoption; preview invalidity disables Apply, edits are dirty and Undo is available. Counts carry no length calibration. Editing a ledger alone does not change PDF bytes.

The takeoff PDF-copy dialog now offers an explicit unchecked-by-default option to update supported recovered annotations. Native selection is fenced by source SHA, unique structural reference, original NM/author/metadata hash, unchanged physical-page/path/reference geometry and known annotation fields. Locked/read-only, shared, threaded/replied-to, popup/group/rich/private-extended or independently changed targets are refused. Only declared original page references are removed, replacement appearances/metadata are appended, and all unrelated annotation entries stay in order. Native reopening verifies exact retained objects, arrays, geometry/trailer and new annotation results; the independent reader verifies declared removals and unrelated identity retention before every changed-page actual before/after review. Saving remains an immutable source/token-bound exclusive new copy. Original dictionaries/appearances remain in the retained object graph, including replaced takeoffs; this is neither redaction nor permanent deletion. Leave the update option unchecked to append additional visible annotations.

This supersedes the earlier recovery-pending and always-append-only checkpoint descriptions. Revu/proprietary takeoff interchange, new point/reference placement for an existing recovered entry, deleting embedded annotations and broad compatibility/security/release acceptance remain future work. Full master requirements remain open. No app, native worker, broker or runtime tests were launched; tests remain deferred as requested.

Final compile-only checkpoint: 216 Vite modules; index-BUZLXf5C.js / index-DXf3ZeNo.css. Targeted syntax checks passed. App/native-worker/broker/runtime testing remains deferred, so this is a saved implementation milestone, not runtime/Revu acceptance evidence.


#### 📅 Reviewed XFDF export — 2026-10-04

Root completed the reviewed XFDF XML/native-seal/cancel/save/JSON receipt implementation. New user-requested agents are actively coding three major gaps: major_document_fidelity (editable tables, DOCX/recovery/PDF export), major_pdf_editing (embedded font/ToUnicode source text support), and major_security_sandbox (broader fixed-engine Windows containment). Ownership is separated; agents supply individual progress notes and root handles global integration/build. Earlier usage-limit failures are historical; these new agents have returned substantive implementation updates. Runtime testing remains paused.


#### 📅 Three major-gap agents integrated — 2026-10-04

User requested renewed subagents on the largest gaps. All three new agents completed concrete source slices; root integrated and compiled them. Earlier account-limit failures did not recur for these agents.

- Document fidelity: editable tables with ProseMirror cell selection, bounded rectangular spans, row/column/merge/split/header/fill controls and Undo; supported DOCX import and structured DOCX/PDF export; native recovery validation; TXT/RTF explicit tabular flattening. Original column widths/borders, images/nested tables and page-perfect Word preservation remain open. Details: [DOCUMENT-FIDELITY-PROGRESS.md](docs/DOCUMENT-FIDELITY-PROGRESS.md).
- Original PDF editing: bounded embedded Type1/TrueType one-byte and horizontal Type0 Identity-H two-byte ToUnicode maps, per-string multipart TJ edits retaining numeric spacing, reuse of observed source glyphs, preserved stream dictionaries and reopened source-font graph/encoded-program hash proof. Multicharacter/ligature entries omit affected runs while retaining other usable map entries. New glyph embedding, shaping/reflow, Type3/custom/vertical/nested/marked-content editing and complete unrelated-object preservation acceptance remain open. Details: [PDF-EDITING-FIDELITY-PROGRESS.md](docs/PDF-EDITING-FIDELITY-PROGRESS.md).
- Security Sandbox: fixed document-engine AppContainer/Job Object source with exact token/capability checks, one-process/512 MiB/115-second bounds, read-only staged source/request/runtime and three precreated writable output slots. Codec bundle supports nine fixed operations. Root packages the existing standalone Windows x64 Node runtime/license with SHA pins and bundled dependency attribution; XFDF export adopts the contained path exclusively, with no worker fallback. Cancellation observes broker close, source/output validators remain, cleanup failure/unsafe termination permanently closes the service. Broker close observation is subscribed immediately at launch to cover early failures across async boundaries. Other Office/review/takeoff/redaction routes still need adoption. Details: [SECURITY-SANDBOX-PROGRESS.md](docs/SECURITY-SANDBOX-PROGRESS.md).

Root also completed reviewed 11-type XFDF geometry/plain-comment export with exact XML, filtered source identity/fingerprint checks, per-annotation omissions, reviewed exclusive sealed saves and separately saved JSON receipt. Native runtime/security status is shown in Settings. Existing comment TXT/CSV/JSON snapshots remain separate. The XLSX sharedStrings undeclared-variable failure is fixed with an 8 MiB aggregate bound; current format/workspace/AI/privacy text reflects saved capabilities.

Final compilation passed: 224 Vite modules; index-BFhcaNJF.js / index-kVg5VJNm.css; pdf-job.worker-KFHKMFMu.js / document.worker-BXg1i3K9.js. Broker C# and fixed engine bundle compile; targeted JS/CJS syntax checks passed. Build output includes pinned node.exe, engine.cjs, broker manifests and runtime/dependency licenses. No app, broker, document engine, native worker, network/print or runtime tests were launched. Verifier code and compilation are not evidence of executed fidelity/OS isolation/Revu acceptance. User-requested runtime testing remains deferred; full master requirements and S00 remain open. Original master-list source is unchanged.


#### 📅 Integrated images, table grids, nested editing, containment and search — 2026-10-04

Three user-requested agents delivered inline document images, editable/preserved table column proportions, nested original PDF text/image changes with shared Form isolation, and contained-only Office/comment/takeoff/grid processing. Root integrated native source/lifecycle guards, local search across selected files, import cancellation and current capability/status text. The combined build passed: 231 modules, index-CRv3V24I.js / index-Cc33oWd9.css; Windows broker and fixed engine packaging compiled. Exact support, bounds, artifact identities and pending work: [coding checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md).

Source/compile milestone only; no app/native job/runtime tests were launched. Full master, S00, Word/PDF fidelity and Revu/release acceptance remain open. The original master-list file is unchanged. Current 65% coding / 35% remaining estimate is rough engineering judgment (about ±5 points), separate from runtime delivery and beta readiness.


#### 📅 Integrated headers, batch and XFDF import — 2026-10-04

Authored document header/footer exports, reviewed selected-PDF batch compression, supported XFDF import, contained structural security/cleanup and native API/lifecycle/privacy integration are saved. Combined compilation passed with 237 Vite modules and refreshed engine/broker pins. Runtime tests remain deferred; private-beta, full master-list, Security Sandbox and Revu interoperability acceptance remain open. [Exact implementation and compilation evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [batch limits](docs/BATCH-COMPRESSION-PROGRESS.md); [XFDF import limits](docs/PDF-XFDF-IMPORT-PROGRESS.md).


#### 📅 Band import, preserving page order and contained redaction — 2026-10-04

Plain DOCX/RTF header/footer import, exact original-page permutation retaining drawing comments/links/forms/bookmarks, and fixed contained redaction verification are integrated. Combined compilation passed with 240 modules and current engine/broker/source pins. Windows development packaging and per-user install/uninstall sources are saved; no installation or runtime testing occurred. [Current coding evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [Windows package bounds and remaining gates](docs/WINDOWS-PACKAGING-PROGRESS.md). Full master targets and beta/release/security/Revu acceptance remain open.


#### 📅 Table extraction, scoped health report and selection geometry — 2026-10-04

Reviewed PDF-word/local-English-OCR table extraction with corrected-cell CSV save is integrated. A scoped health report adds visible geometry, permitted text, internal-link/URL-syntax, structure-presence and form-label observations with cancellation and JSON export. Rotated/non-unit text selection uses the source viewport's rotation and UserUnit across all three text-layer views. Source/compile evidence only; broader extraction/font/image/accessibility/fidelity/security/Revu and runtime acceptance remain open. [Latest checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md); [table extraction](docs/TABLE-EXTRACTION-PROGRESS.md); [health scope](docs/PDF-HEALTH-REPORT-PROGRESS.md); [selection fix](docs/PDF-SELECTION-GEOMETRY-PROGRESS.md). Original master-list source and full acceptance checkboxes remain unchanged.



---


---

<a id="pdfix-all-planned-features-md"></a>
## 📄 `PDFIX-ALL-PLANNED-FEATURES.md`

---

### PDFix — complete planned feature catalog


**Planning catalog, updated October 11, 2026.** This document describes the full adopted plan, including future work. It is not a claim that these features are finished or accepted. The status report says no broad master, Security Sandbox, or Bluebeam acceptance target is certified complete on the current build; some rows have coded subsets, and many of those still need runtime, corpus, security, usability, or release acceptance.

The catalog consolidates overlapping commitments from `REQUIREMENTS.md` (R01–R50, including G01–G16/D01–D22 traceability), the supplied master list (71 M-rows), the Security Sandbox addition (S00), Bluebeam/Revu compatibility (12 B-rows), the adopted future list (F01–F67), and the October 7 Acrobat replacement targets (A01–A25). The 20 October 11 additions, F47–F66, are adopted in full in [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md), including their per-item overlap mappings and explicit folder grants. R49 preserves the creation/comment/UI work; R50/F67 adds digital-pen PDF handwriting. Feature counts across these sources must not be added together.

**Current priority:** Workspaces, PDF viewing and PDF editing, with clear Drawing/Document/Pages rooms, uncluttered paper, fullscreen/collapsible panels and easy creation/export. All 20 free additions remain planned expansions, with existing overlapping code retaining its narrower status.

#### Product-wide behavior

PDFix is planned as a Windows-first, local document workspace for reading, editing, organizing and reviewing PDFs, plus supported documents, images and engineering drawings. Every format and operation needs an honest Open / Preview / Edit / Convert capability boundary. Before conversion, show what may change or be lost. Preserve originals, save outputs as new copies, explain collisions and offer keep-both/destination choices. Never suggest that a file type or extension proves fidelity, accessibility, security or standards compliance.

Protect work with source-bound autosave and recovery, undo/redo, bounded local versions, restore previews and timestamps, and recoverable outputs for risky operations. Wait for writes before closing or switching; if saving/recovery fails, keep the work available and offer rescue/export/retry. Restoring checkpoints current state and never rewrites the source. Let people clear recents, recovery, temporary files and transfer history independently, explaining what is removed. Diagnostics must not include document text, passwords or secrets. (R01–R05; R29; M02.08; M07.08; M09.02.)

Keep keyboard, screen-reader, focus, contrast, scalable text, reduced-motion and visible job/error status usable across every workflow. Provide responsive navigation/sidebar/focus controls and a PDF-only fullscreen mode with a reliable return path. Inspect minimum and large windows, dialogs, reader panels, comparison, editing, printing and cancellation. Keep the supplied PDFix master logo intact; create separately reviewed app/icon/background variants with licensing and provenance. (R23, R28, R30–R32, R40; M08.05–06; M09.09; M10.02; F01–F02, F32–F33.)

#### Read, navigate, search and select

- Read PDFs with single-page, continuous, facing-page/two-page and side-by-side views; fit page/width, zoom and temporary view rotation. Provide outline/bookmarks, printed page labels, internal-link destinations, saved reading positions, personal bookmarks and editable bookmark/TOC entries. (R06; M03.02–03; M07.05; F01–F04.)
- Navigate large drawings with pan, zoom-to-region, fit-sheet, previous/next view history and context for sheet/revision. Keep markup selection visible while moving around; make panels collapsible/resizable without losing the selected drawing location. (M03.03, M03.10–11; B02, B09; F04.)
- Search the current document with counts and next/previous controls. Current selected-file search stays explicit. Adopted F58 adds bounded search of folders explicitly granted under R48, with recursion/persistence choices, filename/page results, cancellation and index deletion. F60 watchers require separately approved recipes/destinations. Never imply unrestricted folder or drive access. Provide a quick action finder for common commands. (M07.01–03, M07.09; F28/F58/F60; R48.)
- Copy/select readable text with page references and sensible row/column order when verified. Cover rotated, cropped, scaled, RTL, vertical, multi-column and unusual-font material; allow a bounded local region as fallback. Tables, footnotes, captions and arbitrary PDF reading order need testing, so communicate uncertainty rather than promising perfect extraction. (R07; F03.)
- Review external link destinations before opening. Do not execute PDF scripts. Show embedded attachments with type/size, and save only to a chosen location; never auto-open extracted content. Any extraction must safely handle traversal, bombs, device names and symlinks. (R08; M01.06; F26.)

#### Organize, edit and compare PDFs

- Arrange, rotate, remove, extract, combine, insert, reorder, crop and resize pages; split by ranges, odd/even, every-N/custom groups and bookmarks/sections. Include page-range recipes and explain affected pages/boundaries. Crop only hides outside-page artwork; it is not redaction. Recover operations and preserve supported comments, forms, links, bookmarks and unknown data or disclose/refuse when preservation cannot be proven. (R04, R33; M02.05–06; M07.04; F05–F07.)
- Drag/copy pages between explicitly selected PDFs with preview, source mapping, keyboard alternatives, undo and output reordering. Preserve page-associated data where the supported route proves it. (M07.04; F06–F07.)
- Edit PDF text and images within a declared supported subset, add positioned text/image overlays, and edit supported existing objects. Explain font, spacing, layout, nested-resource and reflow limits. Provide preview, undo, source/output comparison and a new-copy save. Extracting text to a document is not editing PDF objects. (R34; F10.)
- Compare two PDFs side by side with independent or linked navigation, page count/order, text and artwork differences. Compare scanned pages visually and label OCR uncertainty. Align drawings with proposed/manual page matches, adjustable overlays and synchronized navigation; a pixel difference is not proof of a design change. Review lossy conversion output against source before accepting it. (R09; M03.07; B07–08; F08–09, F22.)
- Provide safe PDF compression with estimated size/quality preview, output review and disclosure of possible structure loss. Broaden image/filter/color/form coverage only after corpus and resource-limit review; existing-JPEG recompression/downsampling is not assumed. (M02.01; F24.)
- Provide useful PDF creation from supported text/documents/images, including ordered multiple images, per-image setup, paper size, margins, fonts, page breaks and preview. Export pages or selected pages to separate PDFs or images where supported. Make page additions such as blank/replacement pages, numbers, headers/footers, watermarks and reusable Draft/Approved/Reviewed stamps explicit. (R35; M02.03–06; F10–11, F41.)
- Inspect/edit/remove supported metadata, including title, author, subject and keywords. Sanitize selectively, showing planned removals for metadata, attachments, hidden layers, comments, form values, scripts/actions and other hidden content. Report limits; do not imply a complete clean bill if structures are unsupported. Permanent redaction must remove selected text/image/object content and survive forensic search/copy/object inspection. A vector-preserving mode is planned; the current clean-image approach flattens pages. (M01.01–02, M01.07, M02.07; R29; F25–26.)

#### Drawings, markups, sheet sets and takeoffs

- Show existing annotations/markups from Revu-produced PDFs, with unsupported types or missing appearances identified. Add a drawing-wide searchable/filterable comments panel showing page/sheet, subject, comment, author/date, type/color/status and exact location; support stable selection and jump/highlight. (R39; B01–02, B09; F20.)
- Where supported, show reply threads, review states/history, locks and read-only status without inventing missing data. Preserve foreign markups, appearances, authors/dates, flags, IDs and unknown extension data in edited copies, or refuse/disclose a reviewed conversion. Flattened artwork cannot recreate lost metadata. (B03–04; F20.)
- Export reviewed comment reports and supported annotation exchange formats, including evaluated FDF/XFDF and separately evaluated Bluebeam BAX/XML. Report omissions. Provide reusable review stamps/styles; investigate BTX tool-set import separately. (M04.05–07; B05, B10; F21.)
- Add drawing markups such as dimensions, arrows, callouts, revision clouds, notes and color-coded comments. Distinguish visual stamps from certificate signatures. (M03.05; B06, B10.)
- Group sheets into ordered sets, use sheet number/title/revision metadata where present, and compare/revise with explicit old/new mappings. Preview missing/duplicate matches and decide whether and how comments carry forward; do not silently transfer comments to a wrong revision. Show dimensions and page size. (M03.10–11; B08; F22.)
- Show/hide actual PDF optional-content layers where supported. (M03.06.)
- Calibrate a drawing scale, then measure distance, perimeter and area with visible units and confirmation. Support persistent measurement/count markups, grouped totals, sheet-specific scale, recovery/import/export and unit conversion with disclosed precision. Distinguish source quantities from PDFix calculations; do not claim proprietary Bluebeam measurement editing or profile-only data. (M03.04; B11–12; F23.)
- Offer engineering/architectural/ISO paper presets and large-format printing at actual size, fit-to-sheet or tiled with overlap/alignment marks. Support page ranges, orientation, scaling, N-up and booklet preview with paper/duplex requirements. Physical printer validation remains necessary. (M03.01, M03.08–09; M08.07–08.)
- Treat CAD model editing and DWG-style support as a separate decoder/licensing/corpus evaluation. PDF drawing review does not imply CAD model editing. (M03.12; F12.)

#### Forms, signatures and annotations

- Fill supported AcroForms and create supported text, checkbox, radio and choice fields. Improve labels, required-field guidance, tab order, fonts and supported calculations. Explain unsupported calculations/XFA. Save a completed copy, print, or export supported field data. Never execute arbitrary form JavaScript; scanned forms use confirmed user-positioned overlays unless automatic detection is validated. (R13; M04.01–03; F18.)
- Suggest likely signature/date/initial locations with uncertainty; users confirm placement and content. Support typed/drawn/stored visual signatures and reusable signatures, initials, stamps and markups with local storage/deletion controls. Explain that visual marks are not certificate validation. Certificate signatures need a reviewed validator for integrity, identity and trust; edits may invalidate them. Certified signing is not a first-release promise. External signature requests are a separate evaluated service. (R14; M01.04–05; M04.04–05; F18–19, F39.)
- Provide highlights, underline, drawing, text, notes/comments and supported preservation of existing markups. Allow show/hide, print inclusion, flattening or separate annotation-copy/report only where verified. Keep reading marks, source artwork and saved annotations distinct. (R15; M04.06–07; B04–06, B10; F20–21.)

#### Scanning, OCR and extracted information

- Add direct scanner/document-camera acquisition after Windows device evaluation, including multi-page preview, ordering, rotation, removal and cancellation. Importing existing scan files is separate from device capture. (M05.01; F14.)
- Preserve originals while previewing rotation, deskew, contrast/brightness cleanup and proposed blank-page removal. Allow undo; distinguish faint content from blank. Let users locate/review uncertain OCR words/lines on the scan, correct them and verify searchable output against reviewed text. (R11–12; M05.02, M05.04, M05.06–07; F16.)
- Offer only bundled/installed, tested OCR languages; widen language/font support with corpus evidence. Show confidence as an engine estimate and explain handwriting, mixed-language, poor-resolution, skew and reading-order limits. Current tested baseline is printed English. (M05.03, M05.07; F15–16.)
- Extract tables to CSV/spreadsheet only when recognition is suitable; preview/correct cells and retain source/page references. Expand to merged, irregular and rotated tables, and validate literal exports. Do not promise automatic reconstruction of arbitrary tables. (M05.05; F17.)

#### Documents, data, images and conversion

- Support tested Open/Preview/Edit/Convert subsets for PDF; DOCX/RTF/TXT/Markdown; JSON/XML/YAML/CSV; XLSX/PPTX; PNG/JPEG/WebP/BMP; multipage TIFF; HEIC/HEIF. Stage legacy DOC/XLS/PPT and Apple Pages/Numbers/Keynote behind decoder, licensing and corpus gates. Provide meaningful Markdown preview and structured data/table views while retaining source editing. (R16–19; M06.01; F09–13.)
- Improve DOCX/RTF/table/image/header/footer and PPTX fidelity with explicit layout, font, page-break, table, image, band and source-preservation review. New decoders do not imply page-perfect Word/slide fidelity. Add source/output comparison for document, office and image conversions. (M02.02, M02.04; F09–12.)
- Handle HEIC/HEIF orientation, color and metadata choices; recognize whether a Live Photo's still and motion assets were both supplied. Never invent a missing motion component. Separate component exports are explicit and codec/distribution-reviewed. (R19; F11–13.)
- Explain which links, images, page size, outlines, annotations and fields survive each conversion. Preview page breaks, fonts and tables. Do not call a byte-for-byte copy a conversion. (R16–18; F09–11.)

#### Batches and reusable workflows

- Queue supported selected-file convert/compress/rename/combine operations with per-file progress/results, cancellation, bounded concurrency, output folder and collision handling. Batch rename defaults to new copies. Failures must not be silently skipped or called successful; distinguish completed, failed, canceled and unstarted work. Current planned batches include broader work beyond coded PDF copy/rename, compression and narrow TXT routes. No broad folder scan. (R21; M07.06, M07.08–09; F27.)
- Make multi-step workflows editable and reviewable, such as OCR → review → save, or combine → number → print. Reuse page recipes/settings and recover interrupted jobs without treating partial outputs as complete. (M07.07–08; F05, F28.)

#### Document health, accessibility and output review

- Inspect tags, reading order, headings, links and form labels; distinguish searchable OCR from accessible structure. Add guided repairs only where semantics/results can be validated. (R20, R23; M08.01–02; F29–30, F40.)
- Expand health reports to missing/embedded fonts, oversized images, broken links, unusual dimensions, unsupported structures and print issues. Provide trustworthy file details such as dimensions, orientation, page count, size, searchability and encryption. Report only inspected evidence. (M01.07; M08.03–04; F29.)
- Prepare exact print output for preview with range, paper, orientation, scaling, annotations and raster resolution/flattening disclosed; detect invalid ranges and clipping. Clean temporary pages after OS cancellation. Validate on physical printers before release. (R10; M08.07–08.)
- Validate PDF/A, PDF/X and tagged-PDF output only with reviewed engines and actual compliance evidence. A visual match, OCR layer or filename extension is not standards proof. (R20; M10.01; F40.)

#### Privacy, AI, sharing, Windows and release

- Keep ordinary processing local. For each AI request, choose provider/model or agent and exact files; show endpoint/destination, selected context and charges, and obtain consent bound to that request and file identity. An address that looks local does not prove local processing. Show image capability and require deliberate consent before page images/charts are sent. (R24, R27; M09.03–06; F34–35.)
- Keep AI read-only by default. Treat document content as untrusted, cite pages/lines and label OCR/model uncertainty. No automatic edits, exports, overwrites or file tools; proposed changes need specific approval and a reviewable diff/output. Securely manage/delete credentials and fail closed if Windows secure storage is unavailable. Show connection testing/model selection/removal and transfer history. (R25–27; M09.02–08; F34–35.)
- Evaluate Hermes against its documented API and capabilities. Identify the exact Harness product/interface before committing to integration. Generic provider support is not proof of either named integration. (M09.07–08; F35.)
- Offer a Windows share handoff for a new local copy. Cloud links/shared reviews require an identified service/account, explicit upload consent, destination and permission display, and transfer history. Bluebeam Studio Sessions/Projects are separate API/licensing/privacy evaluations; a local Revu PDF does not connect to Studio. (R22; M09.01–02; F31, F36–37.)
- Complete Windows installer/uninstaller, upgrade/update/rollback, optional Open With/file associations and user-initiated default-reader path. Never silently change defaults or delete documents/settings. Review branded/signed packaging and icon assets. (R28, R30; M09.09; F32–33.)
- Complete a real-file/adversarial corpus, performance, accessibility, physical printing, clean-machine install, licensing/SBOM/provenance and independent security review. These are release gates, not extra user-facing buttons. (R29; M08.08; M09.10; F42.)

#### 📅 Acrobat replacement expansion — adopted October 7

All ten categories in the user's supplied comparison are now included. The detailed acceptance, staging and source intake are saved in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). This expansion is planned work, with existing narrower implementations tracked separately; it establishes no new completion or Adobe benchmark claim.

| Target | Planned capability | Existing relationship |
| --- | --- | --- |
| A01 | Cryptographic validation, chain/revocation/timestamp results and evaluated trust lists | F19; M01.04 |
| A02 | Certificate signing/certification with authorized hardware tokens, SmartCards and certificate stores | Later signing expansion; M01.05 |
| A03 | Timestamp and durable long-term signature evidence | A01–A02 dependency |
| A04 | Multi-recipient routing, tracking, authentication, bulk requests and audit records | F39 |
| A05 | Commercial preflight rules, reports and reviewed fixes | F29/F40 |
| A06 | Reviewed ICC/color-profile conversion and output intents | F40; later print-production scope |
| A07 | CMYK/spot plates, overprint, ink coverage, dot gain and trapping | Later print-production scope |
| A08 | Evaluated PDF/X edition validation and output | F40 |
| A09 | Evaluated PDF/A profiles, conversion and independent validation | F40; M10.01 |
| A10 | Engineering PDF/E feasibility, supported output and validation | Standards expansion |
| A11 | Full tag-tree/reading-order editing, artifacts, alt text and table semantics | F30; M08.01–02 |
| A12 | PDF/UA, WCAG and Section 508 rule evidence plus manual/assistive-technology review | F29–F30 |
| A13 | Contained static/dynamic XFA layout, binding and data/print compatibility | F18 expansion |
| A14 | Reviewed isolated form logic; current/general document script execution stays disabled | F18; S00/R08 constraints |
| A15 | 2D barcode fields, encoding and print/scan interoperability | Later form expansion |
| A16 | Explicit consented form endpoint/database submissions | F38; M04.03 |
| A17 | Safe portfolio navigation, previews, extraction and creation | Later container support |
| A18 | Evaluated U3D/PRC 3D viewing, assemblies, sections and measurements | Later specialist decoder support |
| A19 | Georegistration, coordinate systems and calibrated GIS measurements | Later specialist decoder support |
| A20 | Contained, user-initiated embedded audio/video and evaluated rich media | Later media support |
| A21 | Authenticated enterprise policy service, expiry/revocation and offline behavior | Later service evaluation; no DRM bypass |
| A22 | Permissioned browser reviews across desktop/mobile browser clients | F36; review preservation work |
| A23 | Evaluated Mac/iOS/Android clients and Chromebook/browser reach | Windows-first platform expansion |
| A24 | Phone-friendly reflow with uncertainty and exact source-page return | Mobile reading/selection expansion |
| A25 | Legacy/malformed/large/adversarial corpus, bounded diagnostics and verified repair copies | F42; R29; S00 |

#### Later candidates and explicit initial-release exclusions

These appear in the planning sources as later candidates subject to a reviewed service, standard, engine or clarified product need; they are not promised as working integrations today: cloud/shared review and links (F36); Bluebeam Studio (F37); online forms and response collection (F38); external signature requests, tracking and templates (F39); PDF/A, PDF/X and tagged-PDF validation/output (F40); and broader Bates workflows (F41). The October 7 source records a bounded single-PDF Bates feature as coded, but multi-file continuity, existing-identifier detection/registries and runtime acceptance remain. F42 is broader release acceptance, not a feature button.

Historical sources exclude from initial release: a complete office suite; unrestricted agent tools; running document macros/scripts; certified digital signatures; DRM bypass; arbitrary proprietary-format fidelity guarantees; bulk signature/payment workflows; PDF portfolios; barcode fields; advanced print-shop color management/trapping; geospatial/3D measurements; embedded multimedia playback; presentation/marketing generation; and CAD model editing/DWG-style formats. The October 7 user decision adds specialist targets covered by A02/A04/A06–A07/A13–A15/A17–A21/A23–A24 to later adopted scope; they are no longer permanently outside the full plan. General uncontained script execution, DRM bypass and payment pipelines remain excluded. Editing supported existing PPTX text and reviewing PDF drawings are distinct in-scope tasks. (M01.05, M03.12, M10.02; `PRODUCT-PLAN.md`; `PDFIX-FUTURE-FEATURES.md`; `ACROBAT-COMPETITIVE-PLAN.md`.)

#### Traceability index

The following IDs are all represented in the workflows above. M IDs are the 71 distinct master-list rows; B IDs are the 12 Bluebeam rows. Source wording and detailed acceptance boundaries remain in the linked planning documents.

| Source set | IDs and subjects |
| --- | --- |
| Requirements | R01–R05 work protection/privacy; R06–R10 reading/selection/links/comparison/printing; R11–R15 OCR/forms/signatures/annotations; R16–R20 formats/conversion/Apple photos/standards; R21–R23 batches/sharing/accessibility; R24–R27 AI; R28–R30 Windows/corpus/brand; R31–R36 window/layout, visual polish, page tools, PDF editing/creation, guided signing; R37–R39 sandbox/master/Bluebeam; R40 PDF-only fullscreen; R41 all ten Acrobat replacement categories; R42 virtual printer; R43 read aloud; R44 word count; R45 spell-checking; R46 free-app rule; R47 all 20 free additions; R48 explicit folder grants; R49 creation/comment/UI integration; R50 digital-pen PDF drawing. |
| Acrobat extension | A01–A04 signatures/trust/services; A05–A08 prepress/color/PDF-X; A09–A10 archival/PDF-E; A11–A12 accessibility; A13–A16 forms; A17 portfolios; A18–A20 3D/GIS/media; A21 policy-managed access; A22–A24 browser/platform/mobile; A25 difficult-PDF reliability. All detailed targets and dependencies are in ACROBAT-COMPETITIVE-PLAN.md. |
| Security Sandbox | S00 Windows native-engine AppContainer/Job Object containment, job-only file grants, no network, bounded resources, cancellation/termination, no fallback and independent security acceptance. |
| Master: PDF security | M01.01 permanent redaction; M01.02 sanitation; M01.03 password protection/change; M01.04 certificate validation; M01.05 signature-type distinction; M01.06 safe links/attachments; M01.07 security report. |
| Master: conversion/output | M02.01 compression preview; M02.02 conversions; M02.03 multiple images to PDF; M02.04 document/text PDF creation; M02.05 page/image exports; M02.06 page additions/decorations; M02.07 metadata; M02.08 naming/collisions. |
| Master: drawings/print | M03.01 paper presets; M03.02 views; M03.03 large-sheet navigation; M03.04 calibrated measurement; M03.05 drawing markups; M03.06 layers; M03.07 revision comparison; M03.08 large-format print; M03.09 booklet; M03.10 sheet sets; M03.11 drawing information; M03.12 CAD boundary. |
| Master: forms/review | M04.01 create fields; M04.02 usability; M04.03 submission/data export; M04.04 signature placement; M04.05 reusable assets; M04.06 broader annotations; M04.07 annotation export. |
| Master: scan/OCR | M05.01 device capture; M05.02 scan cleanup; M05.03 languages; M05.04 uncertainty review; M05.05 table extraction; M05.06 searchable output; M05.07 scan limits. |
| Master: formats | M06.01 format/codec evaluation, Open/Preview/Edit/Convert distinctions, Markdown/data previews, photo metadata/color handling and corpus. |
| Master: search/jobs | M07.01 search navigation; M07.02 selected-file search; M07.03 action finder; M07.04 cross-PDF pages; M07.05 labels/bookmarks/internal links; M07.06 batches; M07.07 reusable workflows; M07.08 interrupted jobs; M07.09 no implied folder scan. |
| Master: quality/accessibility | M08.01 accessibility checks; M08.02 guided repair; M08.03 health report; M08.04 file details; M08.05 announced jobs; M08.06 accessible UI; M08.07 print preview; M08.08 physical print validation. |
| Master: privacy/Windows/AI | M09.01 sharing; M09.02 transfer history; M09.03 scoped providers; M09.04 citations; M09.05 read-only AI; M09.06 connections/secrets; M09.07 Hermes evaluation; M09.08 Harness identification; M09.09 Windows lifecycle; M09.10 release readiness. |
| Master: candidates/boundaries | M10.01 later services/standards/Bates candidates; M10.02 explicit first-release exclusions. |
| Bluebeam/Revu | B01 markup artwork; B02 comments panel; B03 replies/states/locks; B04 foreign-markup preservation; B05 reports/exchange; B06 clouds/arrows/callouts; B07 aligned revision comparison; B08 sheet sets/replacement; B09 large-sheet review navigation; B10 reusable tools; B11 custom data; B12 takeoffs. |
| Future additions | F01 fullscreen; F02 reading density; F03 complex selection; F04 large-sheet navigation; F05 split recipes; F06 object preservation; F07 cross-PDF drag; F08 drawing comparison; F09 conversion comparison; F10 editing fidelity; F11 conversion/photo handling; F12 decoders; F13 Live Photos; F14 device capture; F15 OCR; F16 cleanup/uncertainty; F17 tables; F18 forms/signing; F19 certificate validation; F20 markup preservation; F21 exchange/tools; F22 revisions; F23 custom data/takeoffs; F24 compression; F25 vector redaction; F26 sanitation; F27 batches; F28 workflows; F29 health/accessibility inspection; F30 accessibility repair; F31 Windows sharing; F32 Windows lifecycle; F33 brand variants; F34 selected-file AI; F35 Hermes/Harness; F36 cloud review; F37 Bluebeam Studio; F38 online forms; F39 signature requests; F40 standards validation; F41 Bates; F42 release acceptance; F43 virtual printer; F44 read aloud; F45 word count; F46 spell-checking; F47 form detection; F48 local autofill; F49 labels/tab order; F50 Explorer tools; F51 Office shortcuts; F52 Edge handoff; F53 synced folders; F54 EML conversion; F55 clipboard PDF; F56 local translation; F57 bookmark proposals; F58 granted-folder search; F59 naming; F60 approved watched folders; F61 CSV form merge; F62 signature preparation; F63 hashes; F64 production marks; F65 five page boxes; F66 thin lines; F67 digital-pen drawing. |

#### Source precedence and status notes

The full future inventory and October 7 updates in `PDFIX-FUTURE-FEATURES.md` provide the adopted F01–F67 scope. `MASTER-GAP-TRACKER.md` and `PDFix-Missing-Features-Master-List.md` preserve the 71 original master rows and their criteria. `BLUEBEAM-COMPATIBILITY-PLAN.md` is authoritative for B01–B12 boundaries. `REQUIREMENTS.md` supplies the R01–R50 user requirements. `PDFIX-COMPLETE-STATUS-2026-10-04.md` is the status source for what is historically tested, newly coded, still untested, deferred or excluded; use it together with its October 7 linked coding checkpoints. `FEATURE-TRACKER.md` provides cross-links and older implementation detail. Older statements that a now-coded subset is absent are superseded by the dated newer status entries, but coding/build status never by itself means accepted delivery.


Latest integrated source milestone: [October 8 coding checkpoint](docs/INTEGRATED-FEATURES-CODING-2026-10-08.md). Supported scanning/OCR/certificate integrity/tag-tree/portfolio/large-comment subsets are coded and compiled; broader scope and runtime acceptance remain.


#### 📅 October 9 implementation update

[Saved integration and compilation record](docs/INTEGRATED-FEATURES-CODING-2026-10-09.md) records initial local certificate signing, offline base-chain inspection, initial tags/artifacts, geospatial coordinates/distances, measured size splitting and readable-text controls. 282 modules and native helpers compiled. Broad runtime/document/device/security acceptance remains pending; full adopted scope remains active. The running app was not restarted.


#### 📅 October 9 preflight, audit and form calculation update

[Integrated coding and compilation record](docs/PREFLIGHT-FORMS-CODING-2026-10-09.md) adds practical print profiles, structural accessibility findings, source-bound JSON evidence exports and reviewed user-authored form calculations. 288 modules compiled. These are partial implementations toward A05/A12/A14 and overlapping F18/F29/F30/F40. Broader specialist engines, standards mappings, source-logic compatibility and runtime acceptance remain open. The full adopted scope is unchanged.


#### 📅 October 9 repair, forms and selection coding update

[Integrated coding and compilation record](docs/REPAIR-FORMS-SELECTION-CODING-2026-10-09.md) adds contained existing form filling/visual placements with native sealed saving, bounded supported qpdf repair-to-copy and rectangle-selection pointer/page lifetime plus row/column preview controls. 292 modules compiled; current runtime acceptance remains pending. Repair requires a complete independently inspected baseline and preserves supported content; broader damaged-file recovery and complex selection layouts remain open. No broad feature is newly accepted, and the full adopted scope remains unchanged.


#### 📅 October 9 form order, FDF and editable workflows

[Integrated coding and compilation record](docs/FORMS-FDF-WORKFLOWS-CODING-2026-10-09.md) adds reviewed supported-page form keyboard order, native FDF comment import/export, editable native page-reorder/Bates sequences and broker-envelope alignment with existing bounded source/request contracts. 301 modules compiled. Broader form/appearance/interchange coverage, combine/OCR/print workflow steps, durable recovery and current runtime/security/performance acceptance remain. No broad row is newly accepted; the full adopted scope is unchanged.


#### 📅 October 9 native combination, TIFF and workflow library

[Integrated coding and compilation record](docs/COMBINE-TIFF-WORKFLOWS-CODING-2026-10-09.md) adds standalone native full-source PDF combination with supported comments/forms/bookmarks/destinations, supported classic multipage TIFF decoding and reviewed page import, and named reorder/Bates definitions with exact-source editable draft recovery. 306 modules compiled. Partial/duplicate PDF selection, wider graph and TIFF modes, combine/OCR/print runner stages, durable in-flight resume and runtime/security/fidelity acceptance remain open. Restoring settings never restores output approval. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 9 Bates, combined workflows, TIFF fax and tag semantics

[Integrated coding and compilation record](docs/BATES-COMBINE-TIFF-TAGS-CODING-2026-10-09.md) adds continuous multi-file Bates numbering with reviewed saves/identifier reports, native combine → editable reorder/Bates continuations, real CCITT fax TIFF decoding and reviewed existing table/list/printable-form tag semantics. 308 modules compiled. Persistent queues/global identifier registries, other workflow stages, broader PDF/TIFF/tree compatibility and runtime/security/fidelity/standards acceptance remain. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 9 adopted printing, reading and writing additions

- Virtual PDF printer: receive explicit print jobs from other Windows applications into reviewed local PDF copies. (F43/R42.)
- Read aloud: free local voices, transport/speed/language controls, scoped text, highlighting and incremental reading with OCR/order disclosures. Whisper is audio-to-text, not the read-aloud engine. (F44/R43.)
- Word count: selection/page/document statistics for supported editor and PDF text, with declared counting rules and omissions; expand the existing basic editor counter. (F45/R44.)
- Spell-checking: free local suggestions, approved replacement, ignore/personal dictionary and Undo/recovery in supported editable content. (F46/R45.)

R46: PDFix is free. No required paid API/subscription, purchase/upgrade link or paid feature unlock; these additions stay local. Engine/integration choices throughout the plan must respect this rule. [Detailed plan](READING-WRITING-PRINT-PLAN.md). All four remain planned rather than newly implemented/tested.


#### 📅 October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.


#### 📅 October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.



---


---

<a id="pdfix-complete-status-2026-10-04-md"></a>
## 📄 `PDFIX-COMPLETE-STATUS-2026-10-04.md`

---

### PDFix — complete feature, debugging and testing status


**October 7 planned-scope addition:** R41/A01–A25 now record all ten categories of the supplied Acrobat comparison in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). These are planned expansions with existing overlap, not 25 newly implemented features. The historical acceptance tables below retain their original evidence; the additional targets have no new implementation or acceptance from this intake. The full catalog and future list include them. Older completion estimates do not measure this expanded scope and must not be reused as a current percentage.

Baseline audit **October 4, 2026**, with coding updates through **October 9, 2026**. This is the current status index for the whole saved scope. It covers the original requirements R01–R39, new PDF-only fullscreen R40, all 71 master targets, Security Sandbox S00, all 12 Bluebeam targets, and current debugging/release work. These lists overlap; their row counts are not separate features to add together.

**PDFix is a working development preview. Core workflows have older test evidence; many newer features are saved code awaiting runtime debugging and acceptance. The current build is not a fully verified beta.** The user has now opened the current app and said its appearance looks good, while reporting substantial debugging and missing usability features. That is useful preview feedback, not an open/edit/save/security acceptance pass.

**October 7 update:** PDF artwork fullscreen, hand/pointer navigation and saved reading density are implemented and compiled (250 modules), with runtime acceptance pending. [Implementation record](docs/PDF-READER-USABILITY-2026-10-07.md).

**Latest October 7 batch:** seven major-gap feature families are integrated and compiled (257 modules); [scope and remaining acceptance](docs/MAJOR-GAP-CODING-2026-10-07.md). The future list and machine-readable inventory include these coding updates.

#### How to read the status

| Mark | Meaning |
| --- | --- |
| Done | The exact agreed scope has acceptance evidence for the current version. It does not mean a feature can never have a bug. |
| H | A limited subset was historically runtime-tested. Later code has changed, so current regression is still due. |
| U | Implementation exists, but its current workflow has no recorded runtime acceptance. Syntax/build passes are the available evidence. |
| H+U | An older tested subset plus newer untested functionality or integration. |
| N | A requested capability or expansion still needs its first implementation or execution. Existing related features are listed explicitly. |
| L | Deferred candidate or integration requiring an identified/reviewed API, engine or product. |
| X | Explicit initial-release boundary; not a missing first-release feature. |

An item can be coded and still have missing subfeatures. The tables show both. A test file's existence or a product's validation code is not proof that it was executed successfully. Older green tests do not certify later changes to that feature or its dependencies.

#### 1. What is 100% done

**No whole broad master acceptance target is certified 100% complete on the current build.** Full master/Sandbox/Bluebeam acceptance remains open. The foundational Phase 1 and Phase 2 scopes were accepted on September 29; many narrower workflows were verified later, as listed below. Their current regression status is pending.

The following concrete project deliverables are complete:

- The PDFix name and supplied master logo are saved and used in the app. Separate executable/small/dark/monochrome branding is still unfinished.
- The original user master list is preserved and every item has a stable tracking ID. New R40 and this whole-scope inventory are saved.
- The October 8 integrated milestone compiled successfully with 276 renderer modules and packaged fixed native components. Further source additions remain in progress; runtime acceptance is a separate task.
- The current development app was visibly opened at Workspaces at the user's request. The user reviewed its appearance. Launching the app did not test every workspace.

#### 2. What has actually been tested

These are **historically tested, bounded subsets**, principally September 29–October 2. All need appropriate current regression because substantial code has been added since then.

| Tested subset | Recorded evidence | Current limits / remaining checks |
| --- | --- | --- |
| Picker/drop/reopen, Files/Favorites/filename search | Phase 1 foundation and FileStore/native tests | New multi-file/type integrations and current UI need regression. |
| Save a new copy without overwriting original/existing files/aliases | FileStore tests, disk/source checks, failure cases | Exercise every new writer, native picker races and partial-output failures. |
| PDF rendering, thumbnails, page/keyboard navigation, basic search/copy/zoom/fit | Phase 2 and reader tests on actual synthetic PDF files | Wider real documents, huge drawings and new multi-page modes are not accepted. |
| Damaged PDFs, password entry/cancel, copy/print restrictions | Reader and password fixtures | Broader encryption variants, errors and newer actions need regression. |
| Word/Docs-inspired basic rich document and source editing, DOCX/TXT output | Document editor/codec tests, source-preservation and draft tests | Rich tables/images/bands/RTF/PDF fidelity additions are newer and untested. |
| Source-bound autosave, versions, undo/redo, restore, failed-write rescue and cleanup | Recovery/FileStore/native tests | Recovery in every newer workspace and latest lifecycle changes need checks. |
| Word/rectangle selection on awkward interleaved columns | Actual PDF fixture and selection checks | New rotated/non-unit alignment fix, RTL/vertical text/tables/footnotes need current corpus checks. |
| General fullscreen/sidebar/focus, reader pane toggles, minimum-window layout | Earlier visible layout tests and later offscreen layout checks | PDF-only fullscreen is not implemented. Hidden suites skipped native fullscreen; larger scales/DPI/accessibility remain open. |
| Outline/page labels, saved pages, last reading position, fit/view rotation | Reading-state/native navigation tests | New label jump, bookmark editing and internal destinations are newer code. |
| Standard page organization, vector crop/resize, ordered ranges and automatic splits | PDF/split tests and independently reopened output | New preserving reorder and recipe recovery need acceptance; unsupported forms/comments can be dropped by the standard organizer with disclosure. |
| Two-document text/visual comparison and source/output comparison | Comparison and PDF-difference tests | New manually aligned/color overlays need testing. |
| Five basic PDFix markup tools, edit/remove/undo/recovery, visibility/flatten options | Markup output/recovery/native tests, cropped/rotated cases | New drawing tools/foreign comment edits/replies/styles/XFDF/Revu compatibility are not accepted. |
| Existing supported AcroForm values and visual signatures, local signature library | Form output/recovery/native tests | New field creation and data export, broader fonts/tab order/calculations and real forms remain open. |
| Confirmed selectable-label signature/date/initial proposals | Native forms tests including placement geometry | Broader label/OCR/uncertainty corpus needed; suggestions never imply automatic signing. |
| Local printed-English OCR, corrections and image-preserving searchable copies | OCR output/native tests on text/scan/mixed PDFs, pixel/text checks | More languages, poor scans, cleanup and new confidence/table paths are not verified. |
| One still image to one-page PDF with layout/rotation/crop/recovery | Image output/native tests | Multi-image collections, tone/deskew and newer exports remain untested. |
| Single-PDF measured compression and reviewed output | Compression file/native tests and independently reopened pages | Current native containment/batch routes, larger varied image/filter/form corpus need tests. |
| Clean-image permanent redaction subset | Text/object/pixel/disk/recovery/native tests | New contained source/output verification needs fresh acceptance; vector-preserving redaction remains absent. |
| AES-256 password copies and supplied-owner removal/change | Password/file/native tests including Unicode, geometry, forms/images and saved-copy reopening | Current containment and larger legacy/public-key/normalization/security corpus unfinished. |
| Older bounded raster print preparation and OS handoff | Reader/image/native checks with mocked OS completion | No physical printer acceptance; newer range/tile/N-up/booklet settings need checks. |

The October 2 log records **147 passing checks in a complete hidden run** (69 Node + 78 executed native), followed by targeted refinements that brought the documented checked corpus to **149** (70 Node + 79 executed native across verified runs). One native fullscreen check was intentionally skipped in hidden runs; older visible evidence is separate. These numbers are historical, not results from the present build. `test-results/.last-run.json` says passed but carries no source identity or usable date/count, so it is not promoted to current-build acceptance.

Test-source coverage exists in [tests](tests), including foundation, reader, recovery, editor, layout, comparison, pages/splitting, markup, forms, OCR, image, compression, redaction and password suites. This audit read records/source only; it did not run them.

#### 3. Coded but not runtime-accepted

The following saved additions have source/syntax/build evidence and still need debugging with actual workflows and files:

| Feature family | What is coded | Main evidence / next acceptance |
| --- | --- | --- |
| PDF reader usability | Artwork fullscreen with temporary exit/view restoration; hand drag and pointer zoom; Compact/Comfortable spacing | Current runtime/visual/DPI/transition/focus/drawing tests pending; [October 7 scope](docs/PDF-READER-USABILITY-2026-10-07.md). |
| New major-gap additions | Zoom-region/history, reviewed matching, bookmark split, cross-source drag staging, persistent table corrections, Bates identifiers and contained rich documents | Source/compile evidence only; [October 7 checkpoint](docs/MAJOR-GAP-CODING-2026-10-07.md). |
| PDF content editing | Text/image overlays; supported original font/glyph/TJ edits; nested Form resources and shared-instance isolation | Reopen/preservation/geometry/font/image/cancel/real-file tests; [editing](docs/PDF-EDITING-FIDELITY-PROGRESS.md), [nested text](docs/PDF-NESTED-TEXT-PROGRESS.md), [images](docs/PDF-NESTED-IMAGE-PROGRESS.md). |
| Preserving page reorder | Exact all-page permutation retaining original comment/link/widget/form/bookmark references within supported bounds | Execute graph/artwork/retention/unsafe-source/review/save tests; [scope](docs/PDF-PRESERVING-PAGE-ORDER-PROGRESS.md). |
| Richer documents | Editable table structure/widths/merges, inline images, page setup/breaks, find/replace, formatting, authored/imported plain bands and reviewed PDF export | Actual DOCX/RTF/PDF round trips/layout/recovery/preservation; [tables](docs/DOCUMENT-FIDELITY-PROGRESS.md), [images](docs/DOCUMENT-IMAGE-FIDELITY-PROGRESS.md), [bands](docs/DOCUMENT-BAND-IMPORT-PROGRESS.md). |
| New format workspaces | RTF, supported XLSX values and PPTX text, Markdown/CSV structured previews | Adapter/source/recovery/round-trip/corpus and current containment tests; [formats](FORMAT-SUPPORT.md). |
| Image/scan tools | Multi-image collections, tone/deskew, blank proposals, OCR confidence/review exports, image/page PNG/JPEG exports | Poor/faint scans, mixed image variants, geometry/relink/recovery/output and cancellation. |
| Reading/search | Continuous/facing pages, match next/previous, selected-file content search, label jumps, editable bookmarks, links/attachments, layers, file details | Reader/source identity/permissions/large-file/memory/keyboard/cancel tests; [selected search](docs/SELECTED-FILE-SEARCH.md). |
| Selection correction | PDF.js container rotation and UserUnit-scaled text layers in single/multi/table views | Rotated/cropped/non-unit/RTL/multi-column real PDFs; [geometry fix](docs/PDF-SELECTION-GEOMETRY-PROGRESS.md). |
| Table extraction | Region/grid, PDF words or English scan OCR, corrected cells, uncertainty highlights, reviewed source-bound CSV | Accuracy/merged/irregular cells, literal CSV, page/grid changes, unsaved close and cancellation; [scope](docs/TABLE-EXTRACTION-PROGRESS.md). |
| PDF health/security/cleanup | Scoped reports, supported metadata edits and selective structural cleanup | Actual structures, partial/error results, retained/removed data and misleading-result checks; [health](docs/PDF-HEALTH-REPORT-PROGRESS.md). |
| New print settings | Ranges/paper/scaling/N-up/tile/booklet, prepared-output preview | Exact preview/handoff, memory/cancel/annotations and actual printers. |
| New forms/decorations | Text/check/radio/choice creation, field-data exports, numbers/bands/watermarks/stamps/templates | Geometry/appearance/fonts/tab order/source retention, safe export and recovery. |
| Drawing/Bluebeam review | Comments panel, location navigation, replies/states/locks, supported edits, colors/clouds/callouts/styles, portable drafts and XFDF | Authorized Revu files and round trips; see every B target below and [Bluebeam plan](BLUEBEAM-COMPATIBILITY-PLAN.md). |
| Sheet sets/takeoffs | Source-linked sets/revision references, calibration, persistent measurement/count annotations, quantities, recovery/updates | Known-scale math/geometry/units, exact data/appearance retention, Revu compatibility and recovery. |
| Batch/workflows | Reviewed compression queue with retry/skip/cancel/results/new-folder copies; page-plan recipes and reusable styles/templates | Partial failures/collisions/close/source changes/resources; broader batch and multi-step execution remain to build. |
| Security Sandbox integrations | Fixed AppContainer/Job Object routes, schemas, source/token seals, bounds, close/cleanup fences and native pinned artifacts | Actual Windows isolation/ACL/network/child/memory/time/parent-death/cancel/cleanup; [adoption](docs/SECURITY-SANDBOX-ADOPTION.md). |
| AI connections | Explicit provider/model/endpoint/context review, read-only requests, citations/history, Windows-backed secrets | Real provider and unavailable-secret cases, injection/consent/timeout/privacy tests; no online calls made in this audit. |
| Windows/package | Open-with request queue/metadata, versioned development package and per-user install/uninstall scripts | Real install/upgrade/uninstall/associations, signature/icon/license/SBOM/clean-machine checks; [packaging](docs/WINDOWS-PACKAGING-PROGRESS.md). |
| Workspace/accessibility UI | Action finder, task filtering/direct entries, larger-text/contrast/reduced-motion controls and job announcements | Every workflow at larger scales/keyboard/screen reader/DPI; visual feedback is not full usability acceptance. |

#### 4. Still needs a first implementation or broader feature work

- **Certificate signature validation:** current signature presence/unknown reporting is not cryptographic trust validation.
- **Direct scanner/document-camera capture:** file import is present; actual capture/device handling is absent.
- **Additional OCR languages:** English exists; additional models, choice, fonts and quality evidence do not.
- **Windows Share handoff / cloud links:** local copies exist; actual Windows Share and cloud service sharing do not.
- **Accessibility repair and complete checks:** current tag/form-label observations do not validate or repair reading order, headings and semantics.
- **Health-report completion:** actual embedded/missing font and oversized-image inspection, more print/problem checks and validated fixes.
- **Additional decoders:** HEIC/HEIF, multipage TIFF, legacy DOC/XLS/PPT and Apple iWork; orientation/color/metadata/Live Photo handling.
- **Broader PDF/document fidelity:** new glyphs/font embedding, shaping/reflow, unsupported text/image/resource cases, complex Word/slide layouts, rich/multi-section bands, borders/wrapped media and wider structure preservation.
- **Vector-preserving redaction and wider sanitation:** clean-image redaction is a bounded mode; expand safely after validation.
- **Broader batches and multi-step workflows:** conversion/rename/combine queues and editable chained steps beyond current compression/recipes.
- **Broader Bluebeam data/exchange:** private/custom columns, proprietary BAX/BTX formats and unsupported annotations/appearances; Studio/cloud is later evaluation.
- **Broader sheet revision handling:** physical page replacement with controlled comment transfer; richer sheet metadata and takeoff interchange.
- **Installer/update polish:** current scripts/package are development tools; installer signatures/branding, update/rollback and clean-machine installation remain unfinished.
- **Later reviewed services/standards:** Hermes/Harness product/API evaluation, online signature requests, cloud review/forms, PDF/A/PDF/X/tagged-PDF validation and Bates numbering.

Physical printer checks, security review, real-file/regression/accessibility/performance/license/SBOM/provenance checks are also required; they are acceptance work, not missing buttons. Excluded first-release items stay separately marked X below.

#### 5. Debugging and usability priorities

The user reports substantial debugging needs but has not supplied individual reproducible defects beyond missing PDF-only fullscreen. The following are an ordered work/acceptance backlog, not claims that each path is broken. No new tests were executed for this report.

| Priority / ID | Work | Acceptance before closing |
| --- | --- | --- |
| P1 D01 | Accept and debug implemented PDF-only fullscreen R40 | Hide all surrounding chrome; retain page/zoom/scroll/reading mode/unsaved work; keyboard navigation and reliable Escape/temporary exit; exact layout restoration. |
| P1 D02 | Daily reader/workspace debugging | Reproduce user-visible errors, missing/disabled actions, clipped controls and incorrect task routing; record file/view/action/expected/actual/fix/current evidence. |
| P1 D03 | Current open/edit/save/reopen/original safety | Actual supported files through each writer, canceled pickers, collisions, altered sources, retained structure/artwork and saved bytes. |
| P1 D04 | Recovery and unsaved work | Close/switch/reload/crash/disk failures in every new workspace; avoid losing corrections or claiming a failed output is complete. |
| P1 D05 | Security Sandbox acceptance | Effective Windows boundaries, no unrestricted fallback, termination/parent death, job limits and safe cleanup; complete remaining adoption. |
| P1 D06 | Stable weird-PDF selection | Rotation/UserUnit/crop/columns/tables/RTL/fonts, zoom/resize/reading-mode changes; copied text matches visible selection. |
| P1 D07 | Dad's drawing/comment workflow | Real authorized Revu drawings/comments/replies/states/locks, exact locations, source retention and reopened copies in Revu. |
| P2 D08 | New feature correctness | Table/OCR cells and word boxes, takeoff math/units, field appearances, bands/images/tables, XFDF and batch results. |
| P2 D09 | Fast, usable large documents | Lazy canvases/text, memory bounds, high-DPI/DPI changes, responsiveness, cancellations, queue fairness and error recovery. |
| P2 D10 | Layout/accessibility/keyboard | Minimum/large screens, larger text/contrast, focus order, screen reader, reduced motion and all dialogs/panels. |
| P2 D11 | Exact print output | Prepared preview, handoff/cancel, real ordinary/large/tiled/booklet printouts and annotation choices. |
| P2 D12 | Windows installation/release | Current package on clean Windows, install/upgrade/uninstall, associations/default control, signatures, branding and dependency review. |
| P2 D13 | AI privacy and reliability | Provider/account/endpoint/context review, secret errors, timeout/cancel, injection, citations and transfer-history cleanup. |

Later testing should stay hidden/offscreen where technically possible, reflecting the user's preference. Native fullscreen, actual scanner/printer hardware and manual assistive-technology validation may need specifically arranged visible/hardware review. The earlier five-different-failed-approaches instruction remains a workflow preference; it does not turn unexecuted checks into acceptance.

#### 6. Original requirements — every target accounted for

| ID | Requirement | Current status and remaining scope |
| --- | --- | --- |
| R01 | Recovery and versions | H+U — tested editor/version/recovery subsets; newer workspace recipes/drafts need crash/recovery acceptance. |
| R02 | Leaving unsaved work | H+U — tested failed-save guards; latest dialog/job/renderer close barriers need regression. |
| R03 | Cleanup and privacy | H+U — older local cleanup tested; newer job/provider/library cleanup and diagnostic privacy need acceptance. |
| R04 | Recoverable operations | H+U — bounded older jobs tested; complete newer recipe/output/recovery scope remains. |
| R05 | Output collisions | H — older exclusive safety tested; all new writers and better keep-both UX still need checks/work. |
| R06 | Navigation and views | H+U — old reader/navigation tested; new modes/search/layers/labels/bookmarks need acceptance. |
| R07 | Complex selection | H+U — awkward-column subset tested; new geometry and broader reading-order corpus open. |
| R08 | Safe links/attachments | U — reviewed source-bound code exists; security/runtime/attachment corpus open. |
| R09 | Comparison | H+U — old comparisons tested; drawing overlay/alignment acceptance open. |
| R10 | Printing | H+U — old mocked handoff tested; new print settings and physical output open. |
| R11 | OCR | H+U — bounded English tested; newer review paths and additional languages/quality open. |
| R12 | Scan cleanup | U — deskew/tone/blank proposal code; real faint/poor scans and destructive changes need checks. |
| R13 | Forms | H+U — supported filling/signing tested; field creation/data/fonts/tab order/corpus open. |
| R14 | Signature distinctions | H+U — visual signing tested, structural unknown reporting coded; cryptographic validation absent. |
| R15 | Annotations | H+U — old PDFix tools tested; foreign/reply/exchange/drawing scope needs acceptance. |
| R16 | Explicit capability matrix | H+U — documented format/operation limits; current matrix honesty and UX need review. |
| R17 | Format coverage | H+U — tested basics/new adapters coded; HEIC/TIFF/legacy/iWork and broad corpus absent. |
| R18 | Conversion preservation | H+U — older bounded outputs tested; new rich exports/writers need retention/layout acceptance. |
| R19 | Apple photos | N — HEIC/HEIF/color/metadata/Live Photo support pending decoder evaluation/implementation. |
| R20 | Archival/tagged outputs | L — reviewed validators and compliance proof absent. |
| R21 | Batch jobs | U — compression, reviewed PDF copy/rename and supported TXT queues coded; broader operation types and queue/failure/runtime acceptance remain. |
| R22 | Sharing | N — Windows Share/cloud integration absent; copy export is existing related functionality. |
| R23 | Accessibility | H+U — older keyboard/layout subsets tested, scalable UI coded; full assistive/current-workflow audit open. |
| R24 | AI request consent/scope | U — explicit selected-context request review coded; actual provider/privacy tests open. |
| R25 | Read-only AI | U — no auto file-write/tool route coded; injection/consent/citation acceptance open. |
| R26 | Connections/secrets | U — Windows-backed controls coded; actual provider/secret/error/delete tests open. |
| R27 | Visual AI context/uncertainty | U/partial — context/citation/uncertainty controls; image-capable provider breadth and exact visual-source acceptance open. |
| R28 | Windows integration | U — request intake/package/install sources; clean-machine install/upgrade/uninstall/association/update work open. |
| R29 | Real-file/adversarial corpus | H+U — old synthetic/actual-file safety fixtures exist; current whole-feature/real-world/security corpus open. |
| R30 | Brand assets | Partial — supplied master/name complete; executable/icon/background/monochrome/provenance acceptance open. |
| R31 | General fullscreen/layout | H+U — earlier visible/native evidence, newer workflows unverified; R40 is a separate new scope. |
| R32 | Visual polish | H+U — old screenshots/minimum checks; user now flags debugging, all new screens need review. |
| R33 | Page tools | H+U — old standard crop/resize/split/organizer tested; new recovery/preserving modes and wider rules open. |
| R34 | Useful PDF editing | U — bounded overlays/original/nested object edits coded; real-file fidelity acceptance and unsupported cases open. |
| R35 | PDF creation | H+U — one-image/basic document subsets tested; multi-image/rich table/image/band PDF exports open. |
| R36 | Guided signature assistance | H — bounded selectable-label/manual confirmation tested; broader uncertain/OCR cases open. |
| R37 | Security Sandbox | U — S00 source/build implementation; full adoption and actual OS isolation/security acceptance open. |
| R38 | Full master-list coverage | Planning done — all 71 saved targets mapped below; feature implementation/acceptance remains open. |
| R39 | Bluebeam review | U — standard-PDF subsets coded; B01–B12 and actual Revu acceptance open. |
| R40 | PDF-only fullscreen | U — artwork mode and restoration implemented October 7; current runtime, focus, transition and DPI acceptance pending. |

#### 7. Master, Sandbox and Bluebeam targets — complete detail

All 84 targets are mapped below. H/U labels describe evidence for a subset, not completion of the broad target. The original acceptance checkboxes remain open. Each row states implemented behavior and remaining work; related requirements above intentionally overlap.


##### Security Sandbox

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| S00 | U | Security Sandbox | Fixed Windows AppContainer/Job Object code; qpdf and adopted document families have contained routes and pinned builds. | Finish other native parser/writer routes; prove ACL/network/process/memory/time/parent-death/cancel/cleanup isolation on Windows; independent security review. |

##### PDF security and protection

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M01.01 | H+U | Permanent redaction | Clean-image reconstruction was tested; current contained inspection/verification route is newer and untested. | Retest removal/object/pixel/disk proofs and recovery on current route; vector-preserving redaction, forensic/real-file corpus. |
| M01.02 | U | Sanitize before sharing | Structural inventory and selective cleanup copy are coded with contained native routes and reviewed outputs. | Execute hidden-content/retention cases; expand unsupported structures, metadata/layer/form/action cases; avoid blanket clean/safe verdict. |
| M01.03 | H+U | Password protection/change/removal | AES-256 and owner-authorized removal/change passed older real-file tests; later native sandbox code needs regression. | Current containment/cancel/cleanup checks, wider legacy/public-key/password-normalization corpus and encrypted editing boundaries. |
| M01.04 | U | Certificate signature validation | Restricted contained CMS ByteRange integrity and signer identity plus Windows offline base-chain/root-anchor inspection are integrated and compiled October 9. Runtime acceptance pending. | Revocation, trusted timestamps, document EKU/policy, AATL/EUTL, broader signature profiles and cryptographic/security corpus acceptance. |
| M01.05 | H+U | Separate signature types | Visual signature workflows tested; newer structural report differentiates certificate signatures and external requests. | Retest current UI and all write warnings; cryptographic validation and online requests remain separate unfinished work. |
| M01.06 | U | Safe links and attachments | Source-bound destination review, internal links, attachment inventory and reviewed inert .bin copies are coded. | Native/renderer bypass, unusual destination, attachment identity/size, cancellation and exclusive-save runtime checks; broader type handling. |
| M01.07 | U | Plain-language security report | Encryption/signature/action/attachment/unsupported-structure reporting is coded on contained inspection. | Real-file truthfulness/error/cancel/partial-result and accessibility checks; certificate validity remains unknown. |

##### Conversion, creation and output

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M02.01 | H+U | Compression with quality preview | Single-PDF measured compression and page review tested historically; later containment and batch integrations untested. | Current file/filter/image/form/cancel regressions, quality corpus, native resource limits and package operation. |
| M02.02 | H+U | Broader conversions | Basic DOCX/TXT and one-image PDF subsets tested; RTF, richer DOCX/PDF, workbook/slide and image/page exports are coded. | Each new conversion needs reopen/preservation/corpus tests; more decoders and faithful document/slide layouts. |
| M02.03 | U | Multiple images to PDF | Ordered multi-image collection, per-page setup/crop/tone/order, recovery and preview are coded. | Mixed-image/duplicate/relink/rotate/cancel/recovery/save tests and expanded EXIF/color/metadata behavior. |
| M02.04 | H+U | PDF creation from documents/text | Basic document editing/export was tested; richer PDF page setup, bands/images/tables and page breaks are newer code. | Reopen and layout/fonts/page-break/table/image/header corpus; complex source layout fidelity remains limited. |
| M02.05 | H+U | Selected-page PDF/image exports | Ordered range extraction and split copies tested; selected-page PNG/JPEG export is coded. | Image-export current runtime/size/quality/cancel/output-name checks and wider split/export corpus. |
| M02.06 | U | Page additions and decorations | Blank/replacement page workflows, numbering/bands/watermarks/stamps and reusable templates are coded. | Actual outputs, appearance, source retention, every-page review and recovery tests; more preservation cases. |
| M02.07 | U | Metadata tools | Declared metadata inspection/edit/removal and structural sanitation are coded. | Exact retained/removed keys, XMP/encodings/unsupported metadata, cancellation and independent reopening. |
| M02.08 | H | Output naming and safe destinations | Exclusive new-copy saving, original/alias/existing-file refusal and destination picking tested historically. | Regression every new writer, clear collision/keep-both UX and folder/name/long-path cases; no silent overwrites. |

##### Paper, printing and drawings

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M03.01 | U | Paper-size presets | US, ANSI engineering, ARCH and ISO presets coded for supported page/document/print operations. | Physical dimensions/orientation/margins/current UI tests across each operation and large sheets. |
| M03.02 | H+U | Page views | Single-page view tested; continuous/facing-page views are coded. | Mode/page order, lazy release, large-file/zoom/selection/cancel and accessibility tests; broader independent spreads. |
| M03.03 | H+U | Large-sheet navigation | Basic zoom/fit tested; markup-location zoom, previous-view and drawing navigation coded. | PDF-only fullscreen R40, general region zoom/pan improvements, high-DPI/large-sheet responsiveness and position retention. |
| M03.04 | U | Calibrated measurement | Calibration, distance/perimeter/area/count ledger and supported persistent takeoffs are coded. | Known dimensions/UserUnit/rotations/units/math/recovery/save tests; Revu takeoff interoperability. |
| M03.05 | H+U | Drawing markups | Five basic PDFix tools tested; line/arrow/cloud/callout and measurement artwork coded. | New appearance/geometry/colors/retention/undo/print tests on real drawings; unsupported markup handling. |
| M03.06 | U | PDF layers | Optional-content inventory and temporary visibility controls coded. | Hierarchy/state/artwork/unsupported configuration and view/print tests; no claim of saved layer edits. |
| M03.07 | H+U | Drawing revision comparison | Linked two-PDF/text/source-output comparison tested; manually aligned/color overlay is newer code. | Overlay alignment/scale/rotation/pan/labels/differences and realistic drawing corpus; no automatic design verdict. |
| M03.08 | H+U | Large-format printing | Older bounded raster preparation/OS handoff tested; range/paper/scale/N-up/tile controls coded. | Preview/handoff/cancel/large-sheet memory tests plus actual printer output, overlap/alignment/annotation checks. |
| M03.09 | U | Booklet printing | Booklet page planning and reviewed layout/duplex disclosures coded. | Page pairing, blank insertion, binding/duplex/orientation and real printer validation. |
| M03.10 | U | Sheet sets | Named ordered sets, navigation, source references and controlled revision-reference review coded. | Changed/missing/relinked sources, selection/recovery/navigation tests; physical revision replacement/comment transfer expansion. |
| M03.11 | U | Drawing information | Printed/sheet labels, user-entered title/revision and visible-page details coded. | Source accuracy/ambiguous labels and real-drawing checks; richer reliable embedded-sheet metadata extraction. |
| M03.12 | X | CAD boundary | PDF viewing/measurement is scoped separately from CAD model editing. | Keep DWG/CAD editing out of initial release; any future adapter needs its own licensed decoder/corpus. |

##### Forms, signatures and review

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M04.01 | U | Create fillable forms | Supported text/check/radio/choice field placement, labels/flags and source-bound recovery coded. | Actual field geometry/appearances/values/tab behavior/retention/export/reopen/cancel tests. |
| M04.02 | H+U | Form usability | Required/blank guidance and supported existing field values tested; newer field creation coded. Reviewed user-authored declarative field calculations, dependency/cycle checks, explicit inputs/results/rounding review, undo/recovery and write consistency are coded and compiled October 9; source PDF actions remain inert. Native contained fill inspection/build and source/output preservation verification are integrated and compiled; reviewed calculations and recovery retained. Reviewed supported-page custom widget order, numbered overlays, undo/recovery and native PDF 2.0 order verification are integrated and compiled October 9. | Tagged/mixed/ambiguous widget navigation and wider fonts, document declarative validation/formatting/legacy calculation compatibility, screen-reader labels and broad real forms; current calculation/precision/recovery/behavior acceptance. Arbitrary PDF scripts stay inactive. |
| M04.03 | H+U | Form submission/output | Completed-copy saving and visual signing tested; field-data JSON/CSV/text exports coded. Filled copies now save from a main-retained source-bound seal, with awaited cancellation/departure cleanup; compiled October 9. | Current data exports, withheld password-field content, print/cancel and unsupported-field disclosures; online submission later. |
| M04.04 | H | Signature placement suggestions | Current-page selectable label proposals and manually confirmed placement tested historically. | Broader label/OCR/uncertainty/cropped/rotated/date/initial placement corpus; no automatic signing. |
| M04.05 | H+U | Reusable assets | Local approved visual signature library tested; reusable drawing styles and stamps/templates coded. | New template/style import/delete/apply/undo/storage/recovery tests; more portable assets and proprietary tools. |
| M04.06 | U | Third-party annotations and threads | Standard comment inventory, threads/states/locks, supported plain-comment/reply edits coded. | Foreign/unknown/appearance/provenance preservation and real Revu round trips; broader annotation types/private fields. |
| M04.07 | U | Annotation reports and exchange | Reviewed TXT/CSV/JSON reports, summary PDFs and supported XFDF import/export coded. Supported native FDF comments with bounded grammar, chosen-source import, omission review, actual PDF comparison and sealed FDF/PDF saving are integrated and compiled October 9. | Every format/omission/formula/source-seal/import-retention/interop test; Broader FDF/form-data/appearance coverage, BAX/BTX and private data remain unfinished. |

##### Scanning, OCR and extraction

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M05.01 | U | Scanner/document-camera capture | Windows WIA flatbed/repeated and simplex feeder capture, bounded pinned native helper, cancellation, durable verified PNG copies and image/PDF page review integration are coded and compiled October 8. | Actual scanner/device/driver and cancellation acceptance; document camera, duplex/TWAIN/vendor-only and broader acquisition compatibility. WIA device normalization is outside document AppContainer. |
| M05.02 | H+U | Scan cleanup | Basic still-image rotation/crop/layout tested; deskew/tone/multi-image cleanup and blank-page proposals coded. | Faint-content/blank/undo/skew/geometry/OCR and destructive-change review tests on real scans. |
| M05.03 | U | Additional OCR languages | Six bundled local OCR languages (English, Spanish, French, German, Portuguese, Italian), selected-language request/result/output provenance and packaged metadata/notices are coded and compiled October 8. | Recognition quality, fonts/shaping/RTL/CJK, mixed-language/orientation/handwriting expansion and restart recovery. |
| M05.04 | H+U | OCR uncertainty review | English correction/source-position/searchable output tested; richer confidence overlays/exports/table OCR coded. | Low-confidence word/line mapping, corrections, poor scans, output and recovery on current code. |
| M05.05 | U | Table extraction | Region/grid, selectable words or English OCR, editable cells, paged review, source-bound CSV/correction drafts and contained literal XLSX coded. | Accuracy/irregular/merged/rotated tables, cancellation/source/recovery and Excel/runtime acceptance. |
| M05.06 | H+U | Searchable scan documents | Mixed/text/scan image-preserving searchable copies tested historically; newer cleanup/review integration coded. | Current output geometry/text/pixels/reading order and poor-scan/language corpus; tagging is separate. |
| M05.07 | H+U | Clear scan limits | Printed-English, handwriting/quality/reading-order limits documented; newer scan/table UI has updated disclosures. | Review every path for accurate language/score/output limits and user comprehension; broaden quality evidence. |

##### Formats and editing fidelity

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M06.01 | H+U | Formats, photos and editing fidelity | PDF/basic DOCX/TXT/source and still images have historical subsets; RTF/XLSX/PPTX/Markdown/CSV/richer DOCX code exists. | HEIC/HEIF/multipage TIFF/legacy Office/iWork decoders; real XML/YAML/CSV/BMP/photo variants, EXIF/color/metadata and layout fidelity. |

##### Navigation and multi-file work

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M07.01 | U | Search occurrence navigation | In-document counts/next/previous match navigation coded beyond older page-result search. | Exact offsets/highlights/multiple columns/copy restrictions/huge texts, resize/cancel and keyboard tests. |
| M07.02 | U | Search selected files | Chosen-source local search, filenames/pages/lines, bounded extraction and hash-checked reopening coded. | Cross-format/cancel/partial-result/source-change/navigation/limits tests; no broad folder scanning. |
| M07.03 | U | Quick action finder | Searchable actions/shortcuts and workspace filtering/direct tasks coded. | Keyboard focus, disabled-action reasons, correct routing and every new task at minimum/larger UI scales. |
| M07.04 | N | Move pages across PDFs by drag | Adding another PDF to the organizer is supported; direct cross-document page dragging is absent. | Visible drag preview/source mapping, ordering/cancel/retention and verified output. |
| M07.05 | H+U | Page labels, bookmarks and destinations | Source outline/labels/personal pages tested; label jumps, bookmark editing and destination review coded. | Current label ambiguity/internal-link coordinates/bookmark graph/retention/recovery tests. |
| M07.06 | U | Batch operations | Selected-PDF compression plus reviewed PDF copy/rename and narrowly supported TXT queues with new-folder saves coded. | Queue/resource/output/partial/failure/collision acceptance; broader conversions/combine and multi-step batches. |
| M07.07 | U | Reusable workflows | Named page-plan recipes and reusable drawing/decorative settings coded. Editable page-reorder/Bates sequences now run through native verified intermediates with actual output review and token-only save; integrated and compiled October 9. | Native multi-source combine, OCR/print/other step families, durable workflow definitions/recovery/resume and current execution/cancel/preservation/source-binding acceptance. |
| M07.08 | H+U | Interrupted job recovery | Older known-job cleanup/recovery subsets tested; newer source recipes and batch retry/discard coded. | Abrupt death/partial output/disk-full/cleanup failures across all new services and stages. |
| M07.09 | U | Selected-file scope boundaries | Search/batch pick exact sources and disclose no broad folder scanning. | Prove unselected files are never inspected and grants remain scoped through failure/reopen/import. |

##### Accessibility and inspection

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M08.01 | U | Accessibility inspection | Source-bound metadata/tag/ParentTree/role/heading/figure/table/link/form audit with page/object evidence, human checks, tag repair routing and sealed evidence export is integrated and compiled October 9. | Marked-content coverage, broader semantics, verified standard rule mappings, manual order/focus correctness, assistive technology and PDF/UA/WCAG/508 acceptance. |
| M08.02 | U | Guided accessibility repair | Existing tag-tree editing plus eligible initial structure creation, reading order, artifact marking, Figure Alt, language and supported table associations are integrated with undo/redo and exact tree/page output review; compiled October 9. | Broader marked-content/nested-form/link/list/table/MCID remediation and recovery; actual semantic, assistive-technology and standards acceptance. |
| M08.03 | U | Document health report | Visible geometry, permitted text problems, internal destinations, structure/form-label observations coded. | Embedded/missing fonts, oversized images, broader unsupported/print checks; current partial/cancel/report tests and verified safe fixes. |
| M08.04 | U | Trustworthy file details | Snapshot dimensions/rotation/count/size/hash/metadata/permissions/text scope and all-page geometry coded. | Actual diverse-file accuracy, current permission Set handling, partial/cancel/error/export and accessibility tests. |
| M08.05 | H+U | Accessible job status | Older workflows have tested statuses/keyboard names; new workflows contain progress/error/cancel announcements. | Screen-reader confirmation of every current job/dialog, errors, focus transitions and cancellation. |
| M08.06 | H+U | Scalable interface | Minimum-window/focus/keyboard subsets tested; larger text/contrast/reduced-motion controls coded. | All workflows at large text/high contrast, assistive technology, high DPI and multi-monitor screens. |
| M08.07 | H+U | Print preview | Older bounded prepared output tested; full range/paper/layout/tile/booklet preview coded. | Verify exact current preview equals handoff, annotation choices/resolution/clipping/cancel and memory limits. |
| M08.08 | N | Physical printer validation | Historical OS handoff used mocked completion; no accepted physical-printer evidence. | Print ordinary and large-sheet/tiled/booklet/form/annotation copies on real printers. |

##### Privacy, Windows and AI

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M09.01 | N | Windows/local/cloud sharing | New-copy export exists; Windows Share handoff and cloud share links are absent. | Local copy handoff; future cloud service/account/destination/permission/consent handling. |
| M09.02 | U | Transfer history | Provider request/history/privacy-cleanup code records online context disclosures. | Actual provider/request/error/cancel/log/redaction/cleanup checks; cloud-share transfer history if sharing is added. |
| M09.03 | U | Optional AI providers/agents | Explicit connection/context/request review and provider calls coded. | Provider interoperability/timeouts/errors/consent/account-charge/context/source checks; expanded agent runtimes. |
| M09.04 | U | Cited answers | Read-only answers and source page/line references/navigation coded. | Exact citation/source offsets, generated-vs-source text, uncertain OCR and malformed-response tests. |
| M09.05 | U | Read-only AI and untrusted documents | No automatic file-write/tool route; scoped context and proposed-answer review coded. | Adversarial document/provider injection tests, no implicit grants/actions, privacy and source retention. |
| M09.06 | U | Connection controls and secrets | Windows secure-storage connection/model/test/remove controls coded, fail-closed intent. | Real secure-storage unavailable/locked/error/remove cases, request cancellation, endpoint/model validation and no leaked keys. |
| M09.07 | L | Hermes integration | Evaluation requirement recorded; generic supported provider routes do not prove Hermes integration. | Identify/verify documented API, capabilities/authentication/privacy; implement a bounded adapter only after evaluation. |
| M09.08 | L | Harness integration | Exact product/interface still unidentified; deferred by requirement. | Resolve product/API before adapter design; do not invent integration. |
| M09.09 | U | Windows lifecycle | Open-with intake/association metadata, portable development package and install/uninstall scripts coded; old package built only. | Real install/upgrade/uninstall/Open With, signing/icon branding, current package, update/rollback and clean-machine acceptance. |
| M09.10 | U | Release readiness | Locked dependencies/notices, bounded source/build inventories and older safety tests exist. | Full security/license/SBOM/provenance, performance/large corpus/accessibility/clean-machine review and scope-specific beta acceptance. |

##### Later scope and boundaries

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| M10.01 | L | Later candidates | Practical profile-based preflight with source-bound page/font/image/color/transparency/output-intent evidence and report exports is integrated and compiled October 9; existing Bates groundwork is coded. Online services, standards validation/output and broad repair remain later adopted work. | Reviewed validators/services and explicit requirements before adding working claims. |
| M10.02 | X | Initial-release exclusions | Bulk signing/payments, portfolios/barcodes, print-shop color/trapping, geospatial/3D, multimedia, presentation generation and CAD editing excluded. Source-bound geospatial CRS/calibration inventory, supported coordinate/path queries and page/layer workspace are integrated and compiled October 9; accuracy remains unknown. | Do not count excluded items as missing beta features unless the user changes scope. |

##### Bluebeam / Revu targets

| ID | Status | Feature | Implemented / available evidence | Still to do |
| --- | --- | --- | --- | --- |
| B01 | U | Revu markup artwork | Standard annotation artwork/metadata handling and unsupported cases coded. | Authorized Revu originals with rotated/cropped/large sheets, missing appearances, flattened marks and uncommon fonts. |
| B02 | U | Comments/Markups panel | Search/filter/sort/page/reply-state/metadata and row-to-location navigation coded. | Real Revu row identity/location/selection, panel resize/collapse, huge inventories and malformed data tests. |
| B03 | U | Replies, states and locks | Supported relationships/history/read-only flags and preserving additive reply/plain-comment editing coded. | Multi-level/missing-parent/duplicate/private-state/locked/provenance and Revu reopen tests. |
| B04 | U | Foreign markup preservation | Declared-object graph and retained-data validation code exists in supported copy writers; preserving reorder added. | Execute unknown/private/appearance/reply/identifier/layer retention tests in every writer and Revu. |
| B05 | U | Reports and exchange | TXT/CSV/JSON reports and 11-type standard XFDF export plus supported import coded. Supported native FDF comment import/export integrated and compiled October 9, with explicit mapping omissions and actual prepared PDF review. | Current XFDF/FDF/Revu round trips and omission/appearance/private-field acceptance; wider FDF, BAX and BTX/private adapters remain unfinished. |
| B06 | U | Clouds, arrows, callouts | New drawing tools with color/subjects/styles and reviewed copy paths coded. | Artwork/geometry/undo/crop/rotation/retention/print and Revu compatibility tests. |
| B07 | H+U | Revision review | Older comparison tested; new aligned/cyan-magenta/transparent overlays coded. | Shifted/scaled/rotated drawing alignment, zoom/pan/labels, large-sheet behavior and human interpretation. |
| B08 | U | Sheet sets and revisions | Ordered source-linked sets and explicit new revision reference review coded. | Real multi-file changes/relink/recovery/navigation tests; physical replacement and comment carry-forward. |
| B09 | H+U | Large-sheet layout/navigation | Older generic fullscreen/panes tested; comment jump/zoom/return/review-panel code newer. | R40 PDF-only fullscreen, large-sheet/high-DPI/view-state retention and collapsed review-panel tests. |
| B10 | U | Reusable review tools/stamps | Local style presets, decoration templates and portable review drafts coded. | Create/apply/export/import/delete/recovery/appearance tests; proprietary .btx/tool-set evaluation separate. |
| B11 | U | Custom data and quantities | PDFixData structured takeoff metadata/recovery/editing coded. | Bluebeam private/custom columns/quantity decoding/exchange not implemented; evaluate formats and real fixtures. |
| B12 | U | Persistent calibrated takeoffs | Distance/perimeter/area/count annotations, totals, recovery and supported update copies coded. | Known quantities, unit/scale/geometry/source proofs, appearance preservation/recovery/real Revu and printed output tests. |

#### 8. Complete future feature list

**Plan decision, October 4:** the user has incorporated all F01–F42 into [the product plan](PRODUCT-PLAN.md). This establishes the future scope to complete, with implementation, debugging and acceptance taking priority over further speculative additions. Current/later staging and first-release exclusions remain as listed.

Also saved separately as [PDFIX-FUTURE-FEATURES.md](PDFIX-FUTURE-FEATURES.md). These 42 expansion/candidate/acceptance rows overlap existing requirements and are not 42 additional missing beta features.

#### Next usability and feature expansions

| ID | Planned addition / expansion | Starting point and what remains |
| --- | --- | --- |
| F01 | PDF-only fullscreen | R40 artwork mode, auto-hiding exit, keyboard entry/navigation and previous-view restoration coded October 7; runtime/DPI/focus/transition acceptance pending. |
| F02 | Comfortable/compact reading appearance | Larger UI text/contrast controls are coded; density and consistent reader/dialog behavior need completion and acceptance. |
| F03 | Reliable selection on complex PDFs | Single-pointer rectangle selection with page/geometry cleanup and row/column/content-order copy previews is coded and compiled October 9. Complex layout, vertical/rotated writing and runtime acceptance remain. |
| F04 | More capable large-sheet navigation | Hand/pointer zoom plus zoom-to-region and session Previous/Next view history coded October 7. Synchronized navigation, DPI/monitor/very-large-drawing behavior and current acceptance remain. |
| F05 | More page selection/split recipes | Bookmark/range recipes and actual encoded file-size splitting integrated and compiled October 9. Size/work budgets and single-page refusals apply; current acceptance remains. |
| F06 | Broader page/object preservation | Current standard organizer and separate preserving reorder; preserve comments/forms/links/bookmarks/unknown data across more insert/delete/replace/combine operations. |
| F07 | Drag pages between PDFs | Chosen-source drag/copy, output reorder, reviewed insertion/source mapping, keyboard alternatives and undo/redo coded October 7. Broader object preservation and current acceptance remain. |
| F08 | Broader drawing comparison | Local text/dimension/artwork matching proposals, manual correction, reviewed counterpart mappings and unmatched-page handling coded October 7. High-resolution/sensitivity/alignment expansion and drawing-corpus acceptance remain. |
| F09 | Source/output comparison for more formats | Current PDF comparison; review actual document/office/image conversions and changed fonts/tables/page breaks against original content. |
| F10 | More complete document/PDF editing | New glyphs/fonts/shaping/reflow, wider original/nested PDF text/image cases, richer Word/slide layouts, rich/multi-section bands and source-preservation evidence. |
| F11 | Wider conversion and photo handling | Tested conversions with explicit preservation choices; original orientation, color profiles and metadata options, and clear lossy-output review. |
| F12 | Additional file decoders | HEIC/HEIF and multipage TIFF, then legacy DOC/XLS/PPT and Apple Pages/Numbers/Keynote after licensed-engine/corpus evaluation. |
| F13 | Live Photo components | Recognize separately supplied still/motion assets and explicit exports; no fabricated missing motion component. Depends on decoder/metadata work. |
| F14 | Direct scanner/document-camera capture | Actual Windows device integration, multi-page acquisition/preview/order/rotate/remove/cancel and bounded security handling. |
| F15 | More OCR languages and better quality | Bundled/installed language selection, wider output fonts and mixed-language/poor-scan/handwriting limitations. Printed English is the current tested subset. |
| F16 | Better scan cleanup and uncertainty review | Current deskew/tone/blank/confidence code needs accuracy tests; expand low-resolution/faint/skew/crop/rotated sources and recoverable corrections. |
| F17 | Stronger table extraction | Reviewed CSV, source-bound correction drafts and contained literal XLSX export with exact cell readback are coded. Merged/irregular/rotated tables, automatic reconstruction and runtime/Excel acceptance remain. |
| F18 | Broader forms and signing assistance | Reviewed supported-page custom tab order, numbered widgets, undo/recovery and native output verification are coded and compiled October 9. Wider appearance fonts, tagged/mixed navigation, declarative/source logic and current runtime acceptance remain. |
| F19 | Certificate signature validation | Reviewed integrity/identity/trust results and edit warnings; visual signing and signature-presence reporting remain separate. |
| F20 | Wider third-party markup preservation | Broader annotations, appearances, reply/status/lock/provenance/unknown-data retention and actual round trips, especially dad's Revu drawings. |
| F21 | Broader review exchange and reusable tools | Supported native FDF comment import/export is integrated and compiled October 9 alongside XFDF/JSON/stamp/style code. Broader FDF/form data/appearance, BAX/BTX/private adapters and actual Revu interchange remain. |
| F22 | Richer sheet revision handling | Physical page replacement with reviewed comment carry-forward, more reliable title/revision/sheet metadata and changed-source/relink handling. |
| F23 | Bluebeam custom data and takeoff interoperability | Decode understood PDF-embedded custom columns/quantities without fabricating profile-only values; extend current PDFix takeoff metadata and unit/scale workflows. |
| F24 | Broader compression | Wider real image/filter/color/form files and reviewed optimization choices; current code does not promise existing-JPEG recompression/downsampling. |
| F25 | Vector-preserving redaction | Remove selected source text/image/objects while retaining unmarked vector artwork, with forensic proofs and recovery; current secure mode rebuilds image-only pages. |
| F26 | More complete sanitation/security coverage | Contained DOCX/RTF, bookmarks, decorations/Bates, attachment inspection/decoding, source-bound web destinations, literal table XLSX and supported batch PDF text routes are coded. Other native families, Chromium image/OCR/PDF decode, hidden structures and effective OS security acceptance remain. |
| F27 | More batch actions | Compression plus reviewed source-sealed PDF copy/rename and narrowly supported literal TXT queues are coded, with chosen new folders, keep-both names, individual results and cancellation. Wider conversions/combine/workflow batches and current acceptance remain. |
| F28 | Editable multi-step workflows | Editable native reorder/Bates steps, receipt continuity and actual output review are integrated and compiled October 9. Trusted combine, OCR/print/other stages, durable workflow recovery/resume and runtime acceptance remain. |
| F29 | Complete health/accessibility inspection | Embedded/missing fonts, oversized images, broader print issues, actual tags/reading order/headings/link/form semantics and carefully scoped results. |
| F30 | Guided accessibility repair | Only reviewed repairs with validated semantics/results; tagging or OCR alone never establishes accessible output. |
| F31 | Windows local sharing | Share a newly exported local copy through Windows handoff, with a clear destination and no original mutation. |
| F32 | Finished Windows lifecycle | Branded/signed installer, clean-machine install/upgrade/uninstall, optional Open With/associations/default-reader flow, updates/rollback and user-data safety. |
| F33 | Final brand derivatives | Separate inspected executable/app icons, small/light/dark/monochrome variants, licensing/provenance; preserve the supplied master unchanged. |
| F34 | Broader selected-file AI | Real provider acceptance, image-capable context when consented, better citation/uncertainty handling and separately approved proposed edits; no automatic file tools. |
| F35 | Hermes / Harness / agent integrations | Hermes requires documented API/capability/authentication verification; Harness requires identifying the exact product. Generic provider code is not named integration proof. |

#### Later candidates requiring service or standards evaluation

| ID | Candidate | Dependency / boundary |
| --- | --- | --- |
| F36 | Cloud/shared reviews and links | Identified service/account, authentication, selected destination/permissions, transfer consent/history and no implied public link. |
| F37 | Bluebeam Studio Sessions/Projects | Supported API/licensing/account/privacy evaluation; opening a local Revu PDF does not fetch session-only data or connect to Studio. |
| F38 | Online forms and response collection | Reviewed collection service, explicit submission destination, privacy/permission and response handling. Existing local form saving is separate. |
| F39 | External signature requests, tracking and templates | Evaluated service/authentication/consent and clear separation from visual signatures and certificate validation. |
| F40 | PDF/A, PDF/X and tagged-PDF validation/output | Reviewed standards engines/validators and actual corpus/compliance evidence; appearance/file extension is insufficient. |
| F41 | Bates numbering workflows | Bounded single-PDF Bates affixes/start/padding, selected-page sequences, native mappings and saved templates coded October 7. Multi-file continuity, existing-identifier detection/registries and runtime acceptance remain. |
| F42 | Wider release acceptance | Full real-world/adversarial corpus, performance, accessibility, physical printing, clean-machine packaging, licensing/SBOM/provenance and independent security review. This is acceptance work rather than a new app feature. |

#### Explicit initial-release exclusions

These remain recorded for future product decisions. They are not commitments or missing beta requirements. A direction change is needed before implementation scope expands.

- Bulk signature/payment workflows.
- PDF portfolios and barcode fields.
- Advanced print-shop color management/trapping.
- Geospatial and 3D measurements.
- Embedded multimedia playback.
- Presentation/marketing generation; editing supported existing PPTX text is a different existing capability.
- CAD model editing and DWG-style formats; PDF drawing review remains in scope.

Source coverage: [roadmap](ROADMAP.md), [requirements](REQUIREMENTS.md), [master list](PDFix-Missing-Features-Master-List.md), [feature tracker](FEATURE-TRACKER.md) and [Bluebeam plan](BLUEBEAM-COMPATIBILITY-PLAN.md). Current implementation and evidence are in the complete status report, whose detailed rows take precedence over older roadmap statements that a now-coded feature is still entirely absent.

#### 9. Evidence and build identity

- Historical execution evidence: [PHASE-LOG.md](PHASE-LOG.md), supported test sources/fixtures and saved internal artifacts. Full checked-corpus results above are dated historical records, not a new run.
- New coding evidence: [October 4 checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md) and the per-feature documents linked above.
- Latest compiled launch build: 244 modules, renderer `index-CuvP69x0.js`, CSS `index-piqzjQiR.css`, source snapshot `4e7231d219bbed5b90b13a706c3977bfd60ff557f5d16ca27487bc624f44f6f9`. It includes the launch-to-Workspaces routing addition after the preceding coding checkpoint. The current native app was opened only on the user's request; no new feature/regression test suite was executed for this report.
- The local development package `releases/PDFix-0.1.0-20261004T094146195-8d92a0e5-win-x64` is older (240 modules). It predates table extraction, health and selection fixes and is not the current accepted release. Install/uninstall were not executed.
- Full machine-readable S00/M/B mapping: [inventory JSON](docs/PDFIX-STATUS-INVENTORY-2026-10-04.json).

This report supersedes earlier conversational percentages for acceptance decisions. The old approximately 65% coding estimate was engineering judgment, not a measured workload, test score or beta-readiness percentage. This audit does not turn it into a new percentage. Updating a status to Done requires current source/version, exact supported scope, executed evidence and any relevant remaining limitations.

Latest biggest-gap coding continuation: [docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md). Literal table XLSX, batch PDF copy/rename/supported TXT and four additional native PDF containment families are coded; runtime acceptance remains pending.

#### 📅 October 7 editing fidelity and feature catalog

The complete adopted planned scope is saved in [PDFIX-ALL-PLANNED-FEATURES.md](PDFIX-ALL-PLANNED-FEATURES.md), including every original requirement, master/Bluebeam row and F01–F42 future item. It is a plan, not a completion claim.

The latest source changes and compilation evidence are recorded in [Editing fidelity coding checkpoint](docs/EDITING-FIDELITY-CODING-2026-10-07.md): supported formatted document bands and DOCX import, original mapped-glyph proofs, manual table merge/split correction, contained form creation and initial-inspection cancellation. [Document PDF output containment](docs/DOCUMENT-OUTPUT-CONTAINMENT-PROGRESS.md) records the new generated-output check route. Runtime, corpus, effective security and release acceptance remain deferred/open. No broad master row is newly marked fully accepted.

#### 📅 October 7 large PDF reading

[Large PDF opening](docs/LARGE-PDF-OPENING-PROGRESS.md) records the newly coded file-backed range route, memory/disk admission, visible slow-file/progress notices, source/cleanup guards and separate reading/whole-file tool capabilities. It supersedes the blanket 100 MiB opening limit for eligible PDFs. The current viewer budget is 1 GiB and 500 pages; per-operation editing/export limits remain. No actual-file performance, runtime or security acceptance is claimed.


#### 📅 October 8 integrated coding milestone

[Saved integration and compilation record](docs/INTEGRATED-FEATURES-CODING-2026-10-08.md) supersedes older entirely-unstarted descriptions for certificate integrity, direct scanner capture, additional OCR languages and guided existing tag-tree edits. It also records portfolios with embedded-PDF preview and large-PDF comment inventory. 276 modules compiled; no new runtime/device/document acceptance is claimed. Further size splitting, readable-text controls, initial tagging, geospatial support and offline certificate-chain trust source work is being recorded separately. The full adopted goal stays active.


#### 📅 October 9 implementation update

[Saved integration and compilation record](docs/INTEGRATED-FEATURES-CODING-2026-10-09.md) records initial local certificate signing, offline base-chain inspection, initial tags/artifacts, geospatial coordinates/distances, measured size splitting and readable-text controls. 282 modules and native helpers compiled. Broad runtime/document/device/security acceptance remains pending; full adopted scope remains active. The running app was not restarted.


#### 📅 October 9 preflight, audit and form calculation update

[Integrated coding and compilation record](docs/PREFLIGHT-FORMS-CODING-2026-10-09.md) adds practical print profiles, structural accessibility findings, source-bound JSON evidence exports and reviewed user-authored form calculations. 288 modules compiled. These are partial implementations toward A05/A12/A14 and overlapping F18/F29/F30/F40. Broader specialist engines, standards mappings, source-logic compatibility and runtime acceptance remain open. The full adopted scope is unchanged.


#### 📅 October 9 repair, forms and selection coding update

[Integrated coding and compilation record](docs/REPAIR-FORMS-SELECTION-CODING-2026-10-09.md) adds contained existing form filling/visual placements with native sealed saving, bounded supported qpdf repair-to-copy and rectangle-selection pointer/page lifetime plus row/column preview controls. 292 modules compiled; current runtime acceptance remains pending. Repair requires a complete independently inspected baseline and preserves supported content; broader damaged-file recovery and complex selection layouts remain open. No broad feature is newly accepted, and the full adopted scope remains unchanged.


#### 📅 October 9 form order, FDF and editable workflows

[Integrated coding and compilation record](docs/FORMS-FDF-WORKFLOWS-CODING-2026-10-09.md) adds reviewed supported-page form keyboard order, native FDF comment import/export, editable native page-reorder/Bates sequences and broker-envelope alignment with existing bounded source/request contracts. 301 modules compiled. Broader form/appearance/interchange coverage, combine/OCR/print workflow steps, durable recovery and current runtime/security/performance acceptance remain. No broad row is newly accepted; the full adopted scope is unchanged.


#### 📅 October 9 native combination, TIFF and workflow library

[Integrated coding and compilation record](docs/COMBINE-TIFF-WORKFLOWS-CODING-2026-10-09.md) adds standalone native full-source PDF combination with supported comments/forms/bookmarks/destinations, supported classic multipage TIFF decoding and reviewed page import, and named reorder/Bates definitions with exact-source editable draft recovery. 306 modules compiled. Partial/duplicate PDF selection, wider graph and TIFF modes, combine/OCR/print runner stages, durable in-flight resume and runtime/security/fidelity acceptance remain open. Restoring settings never restores output approval. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 9 Bates, combined workflows, TIFF fax and tag semantics

[Integrated coding and compilation record](docs/BATES-COMBINE-TIFF-TAGS-CODING-2026-10-09.md) adds continuous multi-file Bates numbering with reviewed saves/identifier reports, native combine → editable reorder/Bates continuations, real CCITT fax TIFF decoding and reviewed existing table/list/printable-form tag semantics. 308 modules compiled. Persistent queues/global identifier registries, other workflow stages, broader PDF/TIFF/tree compatibility and runtime/security/fidelity/standards acceptance remain. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 9 user additions — free printing and reading/writing tools

Adopt F43–F46 / R42–R45: virtual PDF printer, local read aloud, expanded word count and spell-checking. R46 requires PDFix to stay free, with no required paid APIs/subscriptions, feature unlocks or purchase/upgrade links. These features use free local components; Whisper is not a speech-synthesis engine. The existing basic editor word counter is only a starting point. See [detailed scope and dependencies](READING-WRITING-PRINT-PLAN.md). No new code, tests, installs or paid integrations are claimed. Prior adopted scope remains, with provider/engine choices subject to the free-app requirement.


#### 📅 October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.


#### 📅 October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.

#### 📅 October 11 final UI integration and complete plan

See [final integration checkpoint](docs/UI-INTEGRATION-AND-FINAL-SCOPE-2026-10-11.md) for the 332-module build, repaired contained startup/custom styles/PDF.js geometry/lifecycle, seven scoped functional passes and independently reopened comment outputs. Native fullscreen exposed the temporary UI test window, so its aggregate hidden-only result did not pass. Current actual SW3 scrolling passed hidden. The final plan/register preserve all earlier and future scope; no broad feature or release gate is newly certified 100% complete.

#### 📅 October 11 forms, bookmarks and drawing revision coding batch

[Batch checkpoint](docs/FEATURE-BATCH-FORMS-REVISIONS-2026-10-11.md) records F47/F49 digital/scan proposal integration, F48 OS-protected local autofill with review/undo, F57 editable automatic bookmark proposals and F22/B08 actual preserving drawing revision/comment carry-forward. The 342-module build passed. One focused known-fixture writer/storage batch passed, including unchanged originals and independent output/private-data reopen; a real async-decryption result bug was fixed. Broader UI/device/corpus/Revu/transform and remaining full-scope work are still pending. No complete product or broad feature is certified 100%.



---


---

<a id="pdfix-future-features-md"></a>
## 📄 `PDFIX-FUTURE-FEATURES.md`

---

### PDFix — full future feature list


Updated **October 9, 2026**. Baseline adoption: October 4. This brings together the saved roadmap, original requirements, master list, useful additions, Bluebeam plan and the October 7 Acrobat replacement expansion (R41/A01–A25). It is part of the [complete status report](PDFIX-COMPLETE-STATUS-2026-10-04.md). Future rows overlap existing requirements and are not additional feature counts. Rows with coded groundwork still need the listed expansion and current testing. Evaluation items have no promised delivery date or claimed working integration.

Latest implementation batch: [seven major gaps coded and compiled](docs/MAJOR-GAP-CODING-2026-10-07.md); current runtime acceptance remains pending.

#### Next usability and feature expansions

**Adopted into the product plan on October 4, 2026, at the user's request:** all F01–F42 rows below. This is the baseline future scope to complete, with continued work focused on implementation, debugging and acceptance. Further speculative feature growth is not the priority. The product plan preserves each item's current/later placement and the exclusions below.

| ID | Planned addition / expansion | Starting point and what remains |
| --- | --- | --- |
| F01 | PDF-only fullscreen | R40 artwork mode, auto-hiding exit, keyboard entry/navigation and previous-view restoration coded October 7; runtime/DPI/focus/transition acceptance pending. |
| F02 | Comfortable/compact reading appearance | Larger UI text/contrast controls are coded; Compact/Comfortable reading density coded October 7; consistent reader/dialog behavior and runtime acceptance remain. |
| F03 | Reliable selection on complex PDFs | Single-pointer rectangle selection with page/geometry cleanup and row/column/content-order copy previews is coded and compiled October 9. Complex layout, vertical/rotated writing and runtime acceptance remain. |
| F04 | More capable large-sheet navigation | Hand/pointer zoom plus zoom-to-region and session Previous/Next view history coded October 7. Synchronized navigation, DPI/monitor/very-large-drawing behavior and current acceptance remain. |
| F05 | More page selection/split recipes | Bookmark/range recipes and actual encoded file-size splitting integrated and compiled October 9. Size/work budgets and single-page refusals apply; current acceptance remains. |
| F06 | Broader page/object preservation | Current standard organizer and separate preserving reorder; preserve comments/forms/links/bookmarks/unknown data across more insert/delete/replace/combine operations. |
| F07 | Drag pages between PDFs | Chosen-source drag/copy, output reorder, reviewed insertion/source mapping, keyboard alternatives and undo/redo coded October 7. Broader object preservation and current acceptance remain. |
| F08 | Broader drawing comparison | Local text/dimension/artwork matching proposals, manual correction, reviewed counterpart mappings and unmatched-page handling coded October 7. High-resolution/sensitivity/alignment expansion and drawing-corpus acceptance remain. |
| F09 | Source/output comparison for more formats | Current PDF comparison; review actual document/office/image conversions and changed fonts/tables/page breaks against original content. |
| F10 | More complete document/PDF editing | New glyphs/fonts/shaping/reflow, wider original/nested PDF text/image cases, richer Word/slide layouts, rich/multi-section bands and source-preservation evidence. |
| F11 | Wider conversion and photo handling | Tested conversions with explicit preservation choices; original orientation, color profiles and metadata options, and clear lossy-output review. |
| F12 | Additional file decoders | Supported classic multipage TIFF including MH/Group 3/Group 4 fax decoding and reviewed page import is integrated and compiled October 9. Wider TIFF, HEIC/HEIF, legacy DOC/XLS/PPT and Apple Pages/Numbers/Keynote remain, with decoder/licensing/corpus acceptance. |
| F13 | Live Photo components | Recognize separately supplied still/motion assets and explicit exports; no fabricated missing motion component. Depends on decoder/metadata work. |
| F14 | Direct scanner/document-camera capture | Actual Windows device integration, multi-page acquisition/preview/order/rotate/remove/cancel and bounded security handling. |
| F15 | More OCR languages and better quality | Bundled/installed language selection, wider output fonts and mixed-language/poor-scan/handwriting limitations. Printed English is the current tested subset. |
| F16 | Better scan cleanup and uncertainty review | Current deskew/tone/blank/confidence code needs accuracy tests; expand low-resolution/faint/skew/crop/rotated sources and recoverable corrections. |
| F17 | Stronger table extraction | Reviewed CSV, source-bound correction drafts and contained literal XLSX export with exact cell readback are coded. Merged/irregular/rotated tables, automatic reconstruction and runtime/Excel acceptance remain. |
| F18 | Broader forms and signing assistance | Reviewed supported-page custom tab order, numbered widgets, undo/recovery and native output verification are coded and compiled October 9. Wider appearance fonts, tagged/mixed navigation, declarative/source logic and current runtime acceptance remain. |
| F19 | Certificate signature validation | Reviewed integrity/identity/trust results and edit warnings; visual signing and signature-presence reporting remain separate. |
| F20 | Wider third-party markup preservation | Broader annotations, appearances, reply/status/lock/provenance/unknown-data retention and actual round trips, especially dad's Revu drawings. |
| F21 | Broader review exchange and reusable tools | Supported native FDF comment import/export is integrated and compiled October 9 alongside XFDF/JSON/stamp/style code. Broader FDF/form data/appearance, BAX/BTX/private adapters and actual Revu interchange remain. |
| F22 | Richer sheet revision handling | October 11: reviewed native physical artwork replacement with exact-geometry original comment retention, donor comments and stable page/private graph preservation is coded; a contained known-pair output/reopen passed. Coordinate transforms, larger pairs, unsupported dependencies, metadata/relink expansion and actual Revu remain. |
| F23 | Bluebeam custom data and takeoff interoperability | Decode understood PDF-embedded custom columns/quantities without fabricating profile-only values; extend current PDFix takeoff metadata and unit/scale workflows. |
| F24 | Broader compression | Wider real image/filter/color/form files and reviewed optimization choices; current code does not promise existing-JPEG recompression/downsampling. |
| F25 | Vector-preserving redaction | Remove selected source text/image/objects while retaining unmarked vector artwork, with forensic proofs and recovery; current secure mode rebuilds image-only pages. |
| F26 | More complete sanitation/security coverage | Contained DOCX/RTF, bookmarks, decorations/Bates, attachment inspection/decoding, source-bound web destinations, literal table XLSX and supported batch PDF text routes are coded. Other native families, Chromium image/OCR/PDF decode, hidden structures and effective OS security acceptance remain. |
| F27 | More batch actions | Compression plus reviewed source-sealed PDF copy/rename and narrowly supported literal TXT queues are coded, with chosen new folders, keep-both names, individual results and cancellation. Wider conversions/combine/workflow batches and current acceptance remain. |
| F28 | Editable multi-step workflows | Native reorder/Bates with definitions/drafts, plus native combine → reorder/Bates continuation, integrated and compiled October 9. OCR/print/other stages, saved combined definitions, in-flight resume and runtime acceptance remain. |
| F29 | Complete health/accessibility inspection | Embedded/missing fonts, oversized images, broader print issues, actual tags/reading order/headings/link/form semantics and carefully scoped results. |
| F30 | Guided accessibility repair | Only reviewed repairs with validated semantics/results; tagging or OCR alone never establishes accessible output. |
| F31 | Windows local sharing | Share a newly exported local copy through Windows handoff, with a clear destination and no original mutation. |
| F32 | Finished Windows lifecycle | Branded/signed installer, clean-machine install/upgrade/uninstall, optional Open With/associations/default-reader flow, updates/rollback and user-data safety. |
| F33 | Final brand derivatives | Separate inspected executable/app icons, small/light/dark/monochrome variants, licensing/provenance; preserve the supplied master unchanged. |
| F34 | Broader selected-file AI | Real provider acceptance, image-capable context when consented, better citation/uncertainty handling and separately approved proposed edits; no automatic file tools. |
| F35 | Hermes / Harness / agent integrations | Hermes requires documented API/capability/authentication verification; Harness requires identifying the exact product. Generic provider code is not named integration proof. |

#### 📅 October 9 user additions — free local features

All four are adopted planned implementation under R46's free-app rule. Details: [reading/writing/print plan](READING-WRITING-PRINT-PLAN.md).

| ID | Addition | Current starting point and remaining scope |
| --- | --- | --- |
| F43 | Virtual PDF printer | No PDFix virtual printer is implemented. Existing document export and physical-print preparation are separate features. Provide an optional PDFix Windows print destination for other applications, bounded local job capture, paper/orientation settings, review/import/save, cancellation and recovery; choose a free supported integration and complete signing/install/uninstall work. |
| F44 | Read aloud | No integrated document/PDF read-aloud controller is implemented. Free local text-to-speech, voice/language/speed controls, selected text/current page/document scopes, play/pause/resume/stop, highlighting/source navigation, bounded incremental reading and OCR/reading-order disclosures. |
| F45 | Word count and document statistics | The document editor currently displays a basic whitespace-based word count in src/document-editor.js. This does not implement the complete requested scope. Selection/page/document statistics for supported editor and PDF text; words/characters with and without spaces/paragraphs/pages; language-aware rules, explicit counted scope, cancellation and honest OCR/unsupported-content omissions. |
| F46 | Spell-checking | Desktop native spell-checking is currently disabled; source editor spell-checking is also disabled. No complete review/suggestion/personal-dictionary feature is implemented. Free local dictionary/native-engine integration, language selection, underlines/suggestions, replace/ignore/ignore-all/personal dictionary, undo/recovery and read-only PDF findings linked to supported editing; keep source/code fields opt-in. |

#### Later candidates requiring service or standards evaluation

| ID | Candidate | Dependency / boundary |
| --- | --- | --- |
| F36 | Cloud/shared reviews and links | Identified service/account, authentication, selected destination/permissions, transfer consent/history and no implied public link. |
| F37 | Bluebeam Studio Sessions/Projects | Supported API/licensing/account/privacy evaluation; opening a local Revu PDF does not fetch session-only data or connect to Studio. |
| F38 | Online forms and response collection | Reviewed collection service, explicit submission destination, privacy/permission and response handling. Existing local form saving is separate. |
| F39 | External signature requests, tracking and templates | Evaluated service/authentication/consent and clear separation from visual signatures and certificate validation. |
| F40 | PDF/A, PDF/X and tagged-PDF validation/output | Reviewed standards engines/validators and actual corpus/compliance evidence; appearance/file extension is insufficient. |
| F41 | Bates numbering | Single-file numbering and continuous multi-file reviewed queue/report are integrated and compiled October 9. Persistent/global registry, existing-ID/artwork detection, wider fonts/limits and runtime acceptance remain. |
| F42 | Wider release acceptance | Full real-world/adversarial corpus, performance, accessibility, physical printing, clean-machine packaging, licensing/SBOM/provenance and independent security review. This is acceptance work rather than a new app feature. |

#### Explicit initial-release exclusions

These remain recorded as initial-release staging. On October 7 the user adopted the full Acrobat comparison as A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). Specialist capabilities below represented by A04/A06–A07/A15/A17–A20 are now later planned targets with engine/service/security gates, rather than permanently excluded scope. They are not automatically requirements for the first beta. Payment pipelines, unrelated presentation generation and CAD authoring remain outside this addition.

- Bulk signature/payment workflows.
- PDF portfolios and barcode fields.
- Advanced print-shop color management/trapping.
- Geospatial and 3D measurements.
- Embedded multimedia playback.
- Presentation/marketing generation; editing supported existing PPTX text is a different existing capability.
- CAD model editing and DWG-style formats; PDF drawing review remains in scope.

Source coverage: [roadmap](ROADMAP.md), [requirements](REQUIREMENTS.md), [master list](PDFix-Missing-Features-Master-List.md), [feature tracker](FEATURE-TRACKER.md) and [Bluebeam plan](BLUEBEAM-COMPATIBILITY-PLAN.md). Current implementation and evidence are in the complete status report, whose detailed rows take precedence over older roadmap statements that a now-coded feature is still entirely absent.

#### 📅 Additional adopted future scope — Acrobat replacement, October 7

F01–F42 are retained unchanged as IDs. The entire new comparison is saved as 25 overlapping work packages in [the Acrobat replacement plan](ACROBAT-COMPETITIVE-PLAN.md) and included in [the complete planned catalog](PDFIX-ALL-PLANNED-FEATURES.md). R41 records adoption. None is marked newly coded or tested.

| Category | Added targets |
| --- | --- |
| Certificate signatures and services | A01–A04: validation/trust lists, token/SmartCard signing, durable evidence, routed/bulk requests and audit history. |
| Commercial printing | A05–A08: preflight, ICC/color conversion, plates/overprint/trapping and evaluated PDF/X editions. |
| Standards | A09–A10: evaluated PDF/A conversion/profiles and PDF/E support. |
| Accessibility | A11–A12: full tag-tree/reading-order remediation and detailed standards/requirement evidence. |
| Forms | A13–A16: XFA, separately gated contained logic, barcode fields and reviewed submissions. |
| Portfolios | A17: bounded navigation, previews, creation and extraction. |
| 3D/GIS/media | A18–A20: U3D/PRC, geospatial measurements and user-initiated contained media. |
| Enterprise policies | A21: authorized managed access, expiry/revocation and explicit offline policy. |
| Browser/mobile/platforms | A22–A24: link reviews, additional clients and phone reflow. |
| Difficult-file reliability | A25: legacy/malformed/giant/adversarial corpus and verified repair-to-copy. |

Core reliability, editing, comments, accessibility and containment retain priority. Current script restrictions and no-DRM-bypass rules remain. Current Adobe/legal claims in the supplied comparison need primary-source verification before use in product comparisons.

Latest biggest-gap coding continuation: [docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md). Literal table XLSX, batch PDF copy/rename/supported TXT and four additional native PDF containment families are coded; runtime acceptance remains pending.

#### 📅 October 7 editing fidelity and feature catalog

The complete adopted planned scope is saved in [PDFIX-ALL-PLANNED-FEATURES.md](PDFIX-ALL-PLANNED-FEATURES.md), including every original requirement, master/Bluebeam row and F01–F42 future item. It is a plan, not a completion claim.

The latest source changes and compilation evidence are recorded in [Editing fidelity coding checkpoint](docs/EDITING-FIDELITY-CODING-2026-10-07.md): supported formatted document bands and DOCX import, original mapped-glyph proofs, manual table merge/split correction, contained form creation and initial-inspection cancellation. [Document PDF output containment](docs/DOCUMENT-OUTPUT-CONTAINMENT-PROGRESS.md) records the new generated-output check route. Runtime, corpus, effective security and release acceptance remain deferred/open. No broad master row is newly marked fully accepted.

#### 📅 October 7 large PDF reading

[Large PDF opening](docs/LARGE-PDF-OPENING-PROGRESS.md) records the newly coded file-backed range route, memory/disk admission, visible slow-file/progress notices, source/cleanup guards and separate reading/whole-file tool capabilities. It supersedes the blanket 100 MiB opening limit for eligible PDFs. The current viewer budget is 1 GiB and 500 pages; per-operation editing/export limits remain. No actual-file performance, runtime or security acceptance is claimed.


Latest integrated source milestone: [October 8 coding checkpoint](docs/INTEGRATED-FEATURES-CODING-2026-10-08.md). Supported scanning/OCR/certificate integrity/tag-tree/portfolio/large-comment subsets are coded and compiled; broader scope and runtime acceptance remain.


#### 📅 October 9 implementation update

[Saved integration and compilation record](docs/INTEGRATED-FEATURES-CODING-2026-10-09.md) records initial local certificate signing, offline base-chain inspection, initial tags/artifacts, geospatial coordinates/distances, measured size splitting and readable-text controls. 282 modules and native helpers compiled. Broad runtime/document/device/security acceptance remains pending; full adopted scope remains active. The running app was not restarted.


#### 📅 October 9 preflight, audit and form calculation update

[Integrated coding and compilation record](docs/PREFLIGHT-FORMS-CODING-2026-10-09.md) adds practical print profiles, structural accessibility findings, source-bound JSON evidence exports and reviewed user-authored form calculations. 288 modules compiled. These are partial implementations toward A05/A12/A14 and overlapping F18/F29/F30/F40. Broader specialist engines, standards mappings, source-logic compatibility and runtime acceptance remain open. The full adopted scope is unchanged.


#### 📅 October 9 repair, forms and selection coding update

[Integrated coding and compilation record](docs/REPAIR-FORMS-SELECTION-CODING-2026-10-09.md) adds contained existing form filling/visual placements with native sealed saving, bounded supported qpdf repair-to-copy and rectangle-selection pointer/page lifetime plus row/column preview controls. 292 modules compiled; current runtime acceptance remains pending. Repair requires a complete independently inspected baseline and preserves supported content; broader damaged-file recovery and complex selection layouts remain open. No broad feature is newly accepted, and the full adopted scope remains unchanged.


#### 📅 October 9 form order, FDF and editable workflows

[Integrated coding and compilation record](docs/FORMS-FDF-WORKFLOWS-CODING-2026-10-09.md) adds reviewed supported-page form keyboard order, native FDF comment import/export, editable native page-reorder/Bates sequences and broker-envelope alignment with existing bounded source/request contracts. 301 modules compiled. Broader form/appearance/interchange coverage, combine/OCR/print workflow steps, durable recovery and current runtime/security/performance acceptance remain. No broad row is newly accepted; the full adopted scope is unchanged.


#### 📅 October 9 native combination, TIFF and workflow library

[Integrated coding and compilation record](docs/COMBINE-TIFF-WORKFLOWS-CODING-2026-10-09.md) adds standalone native full-source PDF combination with supported comments/forms/bookmarks/destinations, supported classic multipage TIFF decoding and reviewed page import, and named reorder/Bates definitions with exact-source editable draft recovery. 306 modules compiled. Partial/duplicate PDF selection, wider graph and TIFF modes, combine/OCR/print runner stages, durable in-flight resume and runtime/security/fidelity acceptance remain open. Restoring settings never restores output approval. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 9 Bates, combined workflows, TIFF fax and tag semantics

[Integrated coding and compilation record](docs/BATES-COMBINE-TIFF-TAGS-CODING-2026-10-09.md) adds continuous multi-file Bates numbering with reviewed saves/identifier reports, native combine → editable reorder/Bates continuations, real CCITT fax TIFF decoding and reviewed existing table/list/printable-form tag semantics. 308 modules compiled. Persistent queues/global identifier registries, other workflow stages, broader PDF/TIFF/tree compatibility and runtime/security/fidelity/standards acceptance remain. No broad row is newly accepted; the full adopted scope stays active.


#### 📅 October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.

#### 📅 October 11 adopted additions — F47–F66

All 20 new targets are adopted, in the user's supplied priority order: F47 field detection; F48 local autofill; F49 field labels/types/tab order; F50 Windows right-click tools; F51 Office PDF shortcuts; F52 Edge extension; F53 synchronized-folder compatibility; F54 EML to PDF; F55 clipboard to PDF; F56 offline translation; F57 automatic bookmark suggestions; F58 explicitly selected-folder search; F59 smart naming; F60 approved watched folders; F61 CSV form mail merge; F62 signature handoff preparation; F63 SHA-256 verification; F64 production marks; F65 page-box editing; F66 thin-line inspection/repair.

[Required behavior, dependencies, permission boundaries and overlap mapping](FREE-ACROBAT-ADDITIONS-PLAN.md). Workspaces/viewing/editing remain first. These are planned expansions; existing hashes, crop, forms, selected-file search and related code do not finish the expanded targets. The free-app rule remains; earlier IDs and specialist scope are unchanged.

#### 📅 October 11 final plan and digital-pen addition

| ID | Addition | Required behavior and current boundary |
| --- | --- | --- |
| F67 | Digital-pen handwriting and drawing on PDFs | R50: saved editable PDF Ink and standard appearances; pen/highlighter/color/width/opacity, supported pressure with honest fallback, palm rejection, explicit pen/touch/navigation modes, stroke selection/move/delete/erasing, Undo/Redo, zoom/rotation/crop coordinates, multi-page use and recoverable drafts. Preview and save a new copy, reopen to continue editing; flatten only by explicit choice. Basic existing Ink is groundwork; hardware and saved-output acceptance remain open. |

[Final consolidated work order](FINAL-IMPLEMENTATION-PLAN.md) preserves all earlier R/M/B/F/A/G/D scope and constraints. R49 adds familiar creation-toolbar organization, improved comment viewing/adding/eligible editing and the requested complete UI/function pass. The user's Store-app clarification defines digital-pen behavior without requiring an exact app identity. Future features remain in the final ledger even when they require a device, free licensed engine or external service evaluation.




---


---

<a id="pdfix-missing-features-master-list-md"></a>
## 📄 `PDFix-Missing-Features-Master-List.md`

---

### PDFix Missing Features — Master Gap List


This consolidates the useful missing-feature ideas discussed for PDFix. It is a planning list, not a claim that these features are implemented. The goal is a simple document workspace with useful PDF, document, photo, and engineering drawing tools—not a copy of every professional publishing suite.

#### Status note

The Drive project documents working PDF reading, page organization, crop/resize, markups, supported forms and visual signatures, OCR, image-to-PDF, comparison, and local recovery. The README and architecture describe page-range selection and automatic splitting as implemented, while the older feature tracker still lists automatic splitting as future work. Confirm that tracker status against the current build.

#### 1. PDF security, cleanup, and protection

- **Verified permanent redaction:** remove selected text, regions, image content, and underlying objects so hidden information cannot be recovered. Search repeated words/numbers, show every match, and require review before applying.
- **Sanitize before sharing:** inspect and selectively remove metadata, embedded attachments, hidden layers, comments, form values, scripts/actions, and other hidden content. Show what will be removed.
- **Password protection and changes:** add or change PDF passwords using a reviewed implementation; explain permissions and never bypass access controls.
- **Digital signature validation:** detect certificate signatures and report valid, invalid, or unable to verify only when a reviewed validator supports the result. Warn when edits may invalidate signatures.
- **Separate signature types:** distinguish visual signatures, certificate-based signatures, and external signature requests.
- **Safe links and attachments:** show external destinations before opening; list attachments with type/size details and save only to a chosen location. Never execute PDF scripts or auto-open extracted files.
- **Plain-language security report:** explain encryption, signatures, active content, attachments, and unsupported structures.

#### 2. Compression, conversion, and PDF creation

- **Compression with quality preview:** show expected size savings and let users inspect quality before saving. Disclose possible loss of text, forms, links, annotations, or other structures.
- **Broader conversions:** support more tested conversions between PDFs, documents, images, and data files. For each, disclose what happens to fonts, page breaks, images, links, bookmarks, forms, and annotations.
- **Multiple images to PDF:** add an ordered image list, per-image rotation, page layout, paper size, and recoverable source references. Current documented workflow makes one PDF from one image.
- **Create PDFs from text/documents:** provide page size, margins, fonts, page breaks, and preview.
- **More export options:** save a page or selected pages as images; export selected pages as separate PDFs; consider reverse PDF-to-image conversion.
- **Page additions:** insert blank pages, replace pages with corrected scans, and add page numbers, headers, footers, watermarks, or reusable Draft/Approved/Reviewed stamps.
- **Metadata tools:** inspect and optionally edit or remove title, author, subject, keywords, and other supported metadata.
- **Output naming:** offer clear names, keep-both, and destination choices; never silently overwrite originals or unrelated files.

#### 3. Paper, print, engineering, and architecture drawings

- **Paper-size presets:** common US Letter and Legal, engineering ANSI A–E, architectural ARCH A–E, and ISO A-series such as A0–A4, where supported by the operation.
- **More page views:** single page, continuous scroll, facing pages, two-page spread, and side-by-side pages, with clear page order.
- **Large-sheet navigation:** smooth pan and zoom, zoom-to-region, fit-sheet, and return-to-previous-view for blueprints, plans, schematics, and maps.
- **Scale-aware measurement:** calibrate drawing scale first, then measure distance, perimeter, and area with visible units and a way to confirm calibration.
- **Drawing markups:** dimension lines, arrows, callouts, revision clouds, and color-coded comments alongside notes, highlights, and drawing tools.
- **PDF layers:** show or hide layers where the PDF contains them.
- **Drawing revision comparison:** align sheets and compare with a transparent overlay or side-by-side view; allow alignment adjustment when scale or position shifted.
- **Large-format printing:** print at actual size, fit to a chosen sheet, or tile across pages with overlap and alignment marks. Include ranges, orientation, scaling, and multiple pages per sheet.
- **Booklet printing:** provide layout preview and clear paper/duplex requirements.
- **Sheet sets:** group related drawings, navigate sheets, and preserve order.
- **Drawing information:** show sheet number, title, revision, dimensions, and page size when present.
- **CAD boundary:** do not imply PDFix edits CAD models; DWG and other CAD formats need separate decoder, licensing, and corpus evaluation.

#### 4. Forms, signatures, and review

- **Create basic fillable forms:** add supported text, checkbox, radio, and choice fields, in addition to filling existing fields.
- **Improve form usability:** clearer labels, tab order, required-field guidance, supported fonts, and explanations for unsupported calculations/fields.
- **Form submission:** save a completed copy, print it, or export supported field data; explain unsupported fields.
- **Signature placement help:** identify likely signature/date/initial fields and suggest locations, but require confirmation of content and placement.
- **Reusable assets:** save user-approved signatures, initials, stamps, and common markups with clear local storage and deletion controls.
- **Broader annotations:** edit third-party annotations, threaded replies, and comment exchange only after preservation tests.
- **Annotation export:** offer a separate annotation summary or copy where verifiable.

#### 5. Scanning, OCR, and information extraction

- **Scan from a device:** import from scanner/document camera, including multi-page scans where supported; preview, reorder, rotate, or remove pages before making a PDF.
- **Scan cleanup:** preview deskew, contrast/brightness cleanup, rotation, and proposed blank-page removal. Distinguish faint content from blank pages and allow undo.
- **Broader OCR:** add only tested bundled/installed languages; make language choice clear and show confidence as an estimate.
- **Uncertainty review:** locate uncertain words/lines on the scan, preserve page references, and require review before saving corrections.
- **Extract tables:** offer table-to-CSV/spreadsheet export only when recognition is suitable, with preview to catch misaligned rows and columns.
- **Searchable documents:** preserve scan images and explain when OCR reading order or recognition needs review.
- **Clear scan limits:** explain limits for handwriting, low resolution, skew, mixed languages, and complex reading order.

#### 6. File formats, photos, and editing fidelity

Evaluate and add tested support for HEIC/HEIF (orientation and metadata choices), multipage TIFF, RTF, XLSX/PPTX preview/conversion, legacy DOC/XLS/PPT, and Apple Pages/Numbers/Keynote. Add a meaningful Markdown preview and structured table views for CSV/data files while retaining source editing. Complete real-file fixtures for XML, YAML, CSV, BMP, and uncommon image variants before claiming support. Clearly separate Open, Preview, Edit, and Convert for each format. Explain fidelity limits before conversion. Let users choose whether photo metadata/color profiles are kept or removed.

#### 7. Navigation, search, and multi-file workflows

- **Search navigation:** match counts and next/previous controls.
- **Search selected files:** search only deliberately selected files; show filename and page for each result.
- **Quick action finder:** “What do you want to do?” search for sign, split, compress, OCR, compare, or convert.
- **Move pages across PDFs:** drag pages between open PDFs with a visible preview.
- **Page navigation:** jump by printed page label; edit bookmarks/table-of-contents entries; safely show internal link destinations.
- **Batch operations:** queue supported conversion, compression, rename, combine, and other verified actions with per-file progress/results, cancellation, output location, collision handling, and bounded resources.
- **Reusable workflows:** repeat reviewed sequences such as OCR → review → save copy or combine → number pages → print; show and allow editing of steps before running.
- **Recover interrupted jobs:** let users retry/discard failed or canceled jobs without confusing partial output for completed work.
- Search and batch features must not imply broad folder scanning.

#### 8. Accessibility, quality checks, and inspection

- **Accessibility checks:** inspect tags, reading order, headings, links, and form labels; distinguish searchable OCR from accessible structure.
- **Guided accessibility repair:** offer fixes only when results can be validated; don’t promise automatic tagging makes a PDF fully accessible.
- **Document health report:** identify missing fonts, oversized images, broken links, unusual page sizes, unsupported features, and possible print problems; offer safe fixes only where verified.
- **Trustworthy file details:** show page dimensions/orientation/count, file size, text searchability, encryption state, and feature limits.
- **Accessible job status:** announce progress, failures, and cancellation to keyboard and screen-reader users.
- **Scalable interface:** test larger text, contrast, visible focus, keyboard navigation, and reduced motion throughout dialogs/workflows.
- **Print preview:** inspect prepared output, selected pages, paper, orientation, scaling, annotations, and rasterization before Windows handoff.
- Physical printer validation remains a release check; simulated preparation alone does not prove paper output.

#### 9. Privacy, sharing, Windows, and AI

- **Share local copies:** provide Windows share handoff for a new copy. For cloud links/uploads, show service, account, destination, and permissions before sending.
- **Transfer history:** if online AI/sharing is added, show what files were sent, to which endpoint/service, and when; allow cleanup.
- **Optional AI providers/agents:** scope each request to selected files; show provider, model, endpoint, destination, and possible account charges before transfer.
- **Cited answers:** provide page/line references where available and distinguish source text from generated explanation.
- **Read-only AI by default:** treat document contents as untrusted; prevent automatic saving/exporting/overwriting/tool use. Require separate approval and a reviewable result for changes.
- **Connection controls:** test, select, and remove connections; store secrets using Windows-backed secure storage and fail closed if unavailable.
- **Hermes:** evaluate its documented HTTP API before implementing.
- **Harness:** defer until the exact product/interface is identified.
- **Windows lifecycle:** installer, uninstaller, updates, optional file associations, and Open with PDFix.
- **Release readiness:** security, licensing, dependency/SBOM, performance, clean-machine install, and real-file corpus reviews.

#### 10. Later candidates and first-release boundaries

Later candidates: online signature requests/tracking, shared/cloud review, online form response collection, PDF/A or PDF/X validation, tagged-PDF validation, accessibility repair, and Bates numbering. Each needs a clear user need and reviewed engine/service before it appears as working.

Keep bulk signature/payment workflows, PDF portfolios, barcode fields, advanced print-shop color/trapping, geospatial/3D measurement, embedded multimedia, presentation generation, and CAD model editing out of the initial scope unless the direction changes.

#### Current product features (not missing)

The project documents a Windows-first local Electron workspace; picker and drag/drop; recents/favorites; PDF reading, search, selection, print preparation, outlines and saved reading positions; page organization, crop/resize, page ranges and documented automatic splitting; PDF comparison; PDFix markups; supported AcroForm filling and confirmed visual signatures; local English OCR with review; basic DOCX/TXT/source editing; version/recovery tools; and one-image-to-one-page PDF creation. Each has limits; some support applies only to tested subsets.




---


---

<a id="phase-log-md"></a>
## 📄 `PHASE-LOG.md`

---

### Phase log


#### 📅 2026-09-29 — inspected and planned

Workspace empty; supplied HTML inspected; no project instructions found. Full product and ordered phase gates recorded. Dependency versions and licenses researched against upstream sources and registry. Implementation begins with Phase 1. No phase is complete yet.

#### 📅 Phase 1 — complete, verified 2026-09-29

- Native Electron 44.5.0 window, mockup-inspired home, format support/settings and accurate planned-feature labels.
- OS picker and real OS-backed drop, bounded opening, recent history, favorites, filename/path search, reopen/forget.
- Exclusive save-a-copy flow; originals, existing files and hard-link aliases cannot be overwritten. Snapshot copy remains safe if the source changes after opening.
- Sandboxed/context-isolated renderer; no Node API, blocked remote resources, narrow IPC and app-directory-only protocol.
- `npm test`: 5/5 pass (history, exclusive output, hard links, stale handles, malformed/oversized inputs and corrupt metadata recovery).
- `npm run test:desktop`: 4/4 pass (actual picker/drop/copy/favorite/search/reopen, cancel/error states, network/Node restrictions, keyboard shortcuts).
- Production build passes. Local screenshot visually inspected at `.test-data/inspection/home.png`.
- Dependency install audit: 0 reported vulnerabilities. This is not a complete security or licensing release review.
- Text/data/images currently open as metadata; preview/edit/conversion still planned. Phase 2 now begins.

#### 📅 Phase 2 — complete, verified 2026-09-29

- PDF.js 6.3.289 with packaged worker/CMaps/fonts/WASM/ICC assets, actual page rendering and selectable text.
- Lazy thumbnails, page input/buttons/keyboard, zoom/fit, copy page text and page-referenced text search.
- Per-page no-text hint (scan or blank), damaged-file recovery message, wrong/correct password entry/cancel and PDF copy/print permissions.
- Raster print preparation includes every page, caps memory/page count and clears temporary output. Native handoff tested with mocked OS completion; physical printer output remains a manual release check.
- Synthetic actual-file corpus: three-page selectable PDF, image-only scan, protected/restricted PDFs and structurally damaged PDF. Generator: `scripts/generate-fixtures.py` (bundled test-only Python runtime).
- `npm run test:desktop`: 8/8 pass including Phase 1 regression; production build passes. Reader screenshot visually inspected; a render race found during inspection was fixed and tests now also check page/thumbnail/status consistency.
- Limits: 100 MiB opening, 500 reading pages, 16M pixels/canvas; print at 108 dpi, 100 pages/80M aggregate pixels. No arbitrary PDF text editing, OCR or conversion.
- Phase 3 begins. Subsequent phases remain gated until its required operations pass.

#### 📅 Phase 3 — page operations verified; whole phase incomplete

- Product renamed to **PDFix** using the user's supplied logo in the sidebar/window. Original mockup preserved in `docs/reference`.
- Local Web Worker runs bounded PDF inspection and page transforms; cancel/120-second timeout terminates the worker.
- Reorder, rotate, remove, duplicate, extract/split-by-saving-selected-pages and combine PDFs from a native picker. Maximum 10 sources/100 MiB aggregate and 500 output pages.
- Fresh catalog drops source metadata/bookmarks/attachments; page annotations/links/actions are removed with an explicit warning. Forms/signatures and encrypted editing are refused. Ordinary page artwork and selectable text remain.
- Output reopens with independent PDF.js before saving, and uses the same exclusive new-copy safety flow. Originals are unchanged. No conversion, redaction or encryption claim.
- `npm test`: 8/8 pass, including transforms/output counts/rotation/input preservation, protected/form refusal and removed annotations/actions/metadata.
- `npm run test:desktop`: 10/10 pass, including combined output preview/save/reopen with correct source text and original bytes, empty-selection gate and encrypted-edit refusal. Screenshots visually checked under `.test-data/pages-*/page-workspace.png`.

##### Page-operations checkpoint (superseded by later entries)

Run `npm start`. Open `tests/fixtures/reading-sample.pdf`, choose **Organize pages**, arrange the list, preview, then **Save this copy**. Home's **Fix or combine pages** is also active. Choose a new output filename; existing files cannot be overwritten.

Phase 3 remains incomplete: local OCR with bundled language assets and editable recognition review; compression preview; annotation creation; AcroForms/signatures; independently verified permanent redaction; password-aware protection/removal. These remain clearly labeled planned. Phases 4–7 have not started, honoring the requested gates.

Next implementation: bundle Tesseract worker/WASM/English traineddata, run recognition on `scan-only.pdf`, compare expected words/coordinates, then produce/reopen a searchable copy with reviewed text. Do not mark OCR complete on text-only recognition; saved PDF output must be searchable and verified. Extend the corpus with mixed scan/text, skew/low-resolution and multilingual cases before general support. Then annotations/forms, compression, redaction and encryption gates.

Known release gaps: no signed installer, physical print review, full accessibility/codec/security/licensing corpus or broad format previews/editor yet. The app is an honest runnable development checkpoint, not the complete product.

#### 📅 User-prioritized editor and selection slice — implemented 2026-09-29

The user requested editing permitted downloaded files, predictable selection on awkward PDFs and a visible Word/Google Docs inspired workspace. They also requested simplifying All files/Recent. Basic document editing was pulled forward from Phase 4; Phase 3 and Phase 4 both remain incomplete.

- Sidebar now has Home, Files, Favorites and Workspaces. Files consolidates All files/Recent; Home retains recently opened documents.
- Workspaces offers Read PDF, Edit a document and Organize pages. Home has New document. The editor is actual Tiptap/ProseMirror software with a paper page, headings, bold/italic/underline, lists, undo/redo, word count and native edited-copy export.
- TXT becomes editable text, DOCX imports a clearly labeled simplified copy, and Markdown/data use an inert UTF-8 source editor. DOCX export was independently reimported with Mammoth and checked for text/heading/bold/list preservation. Original bytes stay unchanged.
- Local 2 MB recovery drafts are fingerprint-bound to source bytes; stale external changes do not silently apply an old draft. Drafts contain content locally in userData, are not encrypted, and clear after successful export. Close waits for a pending draft save where possible.
- PDFs have Page/Readable text views and Text/Rectangle selection. Geometric area selection uses visible rows and excludes a distant column even when the source content stream is deliberately interleaved. This mitigates erratic selection; it does not claim perfect semantic order for arbitrary layouts.
- Edit a document copy extracts permitted selectable PDF text with source-page headings into the editor. It loses layout/images/tables and warns accordingly. Copy-restricted PDFs are refused and scans require OCR. Permission alone does not make an unsupported format reliably editable; guided import/conversion adapters remain part of the full roadmap.
- DOCX processing is sandboxed-worker bounded (60 seconds), ZIP preflight limits expansion/file count, disables external access/embedded style maps, omits images and sanitizes imported/pasted HTML. No macro execution.
- Verification: 12 Node tests and 15 native Electron tests (27 total), production build, rich editor screenshot visually reviewed. Coverage includes formatted DOCX reimport, original preservation, draft fingerprints/recovery, source save safety, rectangle selection on an awkward interleaved-column PDF and all prior regressions. The 15-test native run passed; the later save-snapshot/canceled-export regression also passed. Current combined verification is recorded in the next entry.

Next: complete Phase 3 local OCR/searchable PDF output and recognition review, then annotations/forms, compression and verified permanent redaction. Continue format fidelity evaluation; do not generalize the basic DOCX import into a full office layout guarantee.

#### 📅 Local English OCR and selection refinement — verified 2026-09-30

- Bundled Tesseract.js/core 7.0.0 worker/WASM and English best-int language data. No runtime CDN/model download; renderer network remains restricted to the app origin. Engine and generated worker license notices accompany the assets.
- **Make a scan searchable** works from Home or an opened PDF. It detects pages without selectable text, preserves existing selectable/blank pages and recognizes upright printed English locally. Review shows scan artwork beside editable recognized lines with position highlights and engine confidence. A review checkbox gates searchable-copy preview or document import.
- Corrections change invisible searchable text; the scan image stays unchanged. Searchable output is a fresh PDF catalog with source annotations/links/bookmarks/metadata removed and a warning before processing. Forms/signatures/encrypted editing are refused. PDF.js reopens the output and verifies every reviewed line before native exclusive saving.
- The actual-file scan test recognizes expected words, changes 5,000 to 6,000, saves/reopens/searches the correction, compares original file bytes and compares rendered pixel hashes before/after. Mixed selectable/blank/scanned pages preserve page count and existing text. Cancellation and scan-to-editable-document import pass. Unsafe OCR positions, empty/oversized/unsupported correction text and forms are rejected.
- OCR bounds: 20 document pages, 16M raster pixels/page, two-minute initialization/page/job timeouts, 2 MB reviewed text. Searchable PDF uses a Western font and refuses unrepresentable correction characters with an actionable message; the document editor can retain Unicode. Handwriting, multilingual, skew and low-resolution quality are not verified. Rotate sideways scans first. OCR review itself is temporary until document import/export.
- Rectangle selection now measures word ranges within PDF text runs, so a small rectangle copies the words inside it rather than an entire line. Visual row order excludes distant columns even in deliberately interleaved content streams. Browser custom highlights show selected ranges. Measurement is capped at 10,000 words per selected area. Resize observation ignores unchanged widths and stable scrollbar gutters avoid selection-disrupting render churn.
- Editor exports temporarily hold editing controls so a successful export cannot clear a newer unsaved recovery draft. Canceled export restores editing and preserves recovery. Settings explains local draft content and lack of encryption.
- Final `npm run check`: **14/14 Node tests + 21/21 native Electron tests = 35 passing checks**; production build passes. Editor and OCR review screenshots were visually inspected. OCR license/model attribution and the verified format matrix were updated. Dependency installation audit reported zero known vulnerabilities; full release review remains incomplete.

##### Current runnable checkpoint

Run `npm start`, or double-click `Launch PDFix.cmd` for the built app. Sidebar **Files** consolidates All files/Recent; **Workspaces → Edit a document** opens the Word/Docs inspired editor. Use `tests/fixtures/scan-only.pdf` with **Make scan searchable**, review/correct the lines, preview and save a new file. **Edit reviewed text in a document** creates a text document with source-page headings; layout/images/tables do not carry over. `tests/fixtures/awkward-columns.pdf` exercises bounded rectangle selection.

Phase 3 remains incomplete. Next gates: expand OCR quality fixtures (skew, low resolution, rotated/cropped and multilingual inputs), annotations/forms/signature, previewed compression, independently verified permanent redaction and password-aware writing. Continue Phase 4 format fidelity only within the recorded user-directed editor slice. AI, packaging, full accessibility/security/licensing review and signed installation remain later gates. No universal document-editing or arbitrary PDF layout fidelity claim.

#### 📅 Expanded requirements, work protection and layout — verified 2026-09-30

The user supplied a 38-entry gap checklist and then prioritized fullscreen, sidebar collapse and easier daily use. `REQUIREMENTS.md` now contains 30 checklist-derived acceptance targets plus R31 for window/layout controls, with traceability for all checklist entries. Planning, sequencing, decisions and capability documentation were updated; targets do not imply implemented features.

- Editor **Version history** lists dated local snapshots with a text preview, named checkpoints and supported-format restore. Restore saves the current state first and never writes the source. Fingerprint matching avoids applying stale history to externally changed source bytes. Latest drafts autosave after 350 ms; automatic versions occur at most once a minute, with explicit opened/leaving/export/restore checkpoints.
- History retains up to 20 revisions/8 MiB per managed history; drafts are capped at 2 MiB. Each managed data category is capped at 64 MiB/100 files. UTF-8 serialized bytes, structural complexity, bounded reads and atomic replacement are tested. Failed replacement preserves prior committed data. All content is local and unencrypted; committed drafts/history survive an abrupt renderer crash. The last unsaved interval is not guaranteed recoverable.
- Failed latest-draft writes keep the document open, show retry/export guidance and block navigation/new file grants. Emergency edited-copy export still works. Main-process close protection replaces unreliable browser-only unload handling; native failure tests verify closing keeps unsaved edits available. Canceled file picking/export releases held editing controls. Per-profile single-instance locking prevents competing recovery writers.
- **Settings & privacy** clears recents independently and offers a concrete recovery/history discard confirmation. Only validated managed file names are removed; unrelated files, source documents and exported copies stay unchanged. Successful export clears the latest draft while retaining saved versions.
- Top-bar native fullscreen button and F11; Escape respects open dialogs before leaving fullscreen/focus mode. Ctrl Shift B collapses the sidebar to named icon navigation. Ctrl Shift F enters/exits focus mode; the always-visible sidebar control restores navigation. Native maximize/resize remains available through the Windows frame.
- PDF **Pages panel**/**Search panel** toggles independently reclaim document space and trigger fit-width reflow. Ctrl F reopens/focuses search; rectangle selection reveals its results panel. Non-sensitive sidebar/pane booleans persist locally. Minimum 800×620 window use, accessible button names and retained editor drafts are exercised; a full screen-reader/text-scaling review is still pending.
- `npm run check`: **20/20 Node + 29/29 native Electron tests = 49 passing checks**, including production build. Native versions, focus editor and reader pane screenshots were visually reviewed. A minor collapsed-logo crop was refined afterward and the layout-specific checks rerun; the supplied logo file itself remains unchanged.

##### Current runnable checkpoint and next gates

Run `npm start` or use the rebuilt `Launch PDFix.cmd`. Try the top-bar view controls, **New document → Version history**, and separate cleanup under **Settings & privacy**. Current recovery/version controls apply to supported document editing; they are not a promise of arbitrary PDF structure preservation or job-output history.

Phase 3 and the full product remain incomplete. Next reader gates: outline/page labels, fit-page/view rotation/additional views, safe links/attachments, two-document text/visual comparison and print settings/preview. Continue OCR quality expansion and the remaining annotation/forms/signature, compression, verified permanent-redaction and password-writing gates. Batch, broader format fidelity, AI, Windows integration/installer and accessibility/security/licensing release work remain staged in ROADMAP.md.

#### 📅 Compact layout, navigation and scope audit — verified 2026-09-30

- Reconciled the original brief, gap checklist and later core-feature inventory in FEATURE-TRACKER.md and R01–R36 in REQUIREMENTS.md. Planning coverage is complete; the weighted engineering estimate is approximately 40% implementation. Every unfinished feature retains a completion gate.
- Removed repeated editor chrome and decorative rulers; tightened Home, editor, reader and dialog spacing. Version history and OCR scan/corrections remain side by side at the minimum window. The OCR scan has its own scroll frame and focused correction positions remain visible. Supplied logo artwork is unchanged.
- Reader adds fit page, temporary view rotation, bounded embedded outlines/page labels and named saved pages. Last-read position and bookmarks are fingerprint-bound to immutable source bytes. External outline destinations stay inert. Navigation tabs have keyboard controls; search opens on demand. Rectangle results float over the page without changing its width.
- Workspace metadata changes now commit transactionally. An injected rename failure exposed invalidation of the current document handle; the fix preserves the prior handle, recents and rescue export after failed open/favorite/forget/clear writes. Workspace metadata is bounded to 8 MiB. Output previews omit the original source id so reading transformed pages cannot overwrite its reading position/bookmarks.
- Final `npm run check`: **23/23 Node + 34/34 native Electron tests = 57 passing checks**, production build included. Relevant checks exercise actual outlines/page labels, rotation with unchanged output bytes, restart/stale-source metadata, minimum-window controls, transactional failures and transformed-preview isolation.
- Visually inspected Home/editor/reader/organizer/version/OCR screens at normal and minimum sizes. Audit artifacts: `.test-data/visual-audit-1790759553561`. Normal native 1380×920: editor canvas 639.5 CSS px versus the prior 500.4; reader stage 632.8. Native 800×620: imported editor canvas 286.4, reader stage 308.2. Fit-width stage has no horizontal overflow; audit reports no page errors. These measurements do not prove subjective perfection or complete assistive-technology support.

Next: source/output and two-version comparison, followed by remaining Phase 3 annotation/form/signature, compression, verified redaction, password writing and expanded OCR quality gates. Broader document/image adapters, AI, Windows integration, accessibility and release work remain incomplete.

#### 📅 Two-version and source/output comparison — verified 2026-09-30

- **View options → Compare with another PDF** opens two user-chosen snapshots side by side. Linked or independent page navigation, linked scrolling, fit/zoom and keyboard page navigation work. Arbitrary versions use physical page numbers with explicit manual alignment for inserted/reordered pages; the whole-document check explains its physical pairing. The native picker now has a comparison-specific title and rejects unknown purpose values.
- Page-organizer **Compare with originals** follows the actual output source/page mapping, including combined, rotated, reordered and duplicated pages. It reports distinct retained/omitted source pages. OCR **Compare with original** shows newly searchable text separately from the unchanged visible scan. Both controls require an independently reopened output before they become available. Comparison never saves or changes reading-position metadata.
- Literal additions/removals are presented as inert text with distinct color and underline/strikeout. Word comparison is bounded to 100,000 characters/8,000 tokens per page and 250,000 LCS cells, with a labeled coarse-block fallback. Restricted-copy documents do not undergo text extraction. Scan-only/absent/oversized text retains a visual-review warning.
- An independently rendered, shared-scale artwork map marks changed preview pixels pink, detects image-only edits and reports changed dimensions/orientation. Difference rasters are at most 512×768 with a 24/255 channel threshold. This is a bounded review preview, not proof of equivalence or validation of metadata, attachments, links, permissions, interactive forms or signatures. Whole-document checking supports up to 100 output page pairs, yields/cancels and preserves partial-result labels; individual review supports the existing 500-page limit.
- Visible canvases use display pixel ratio up to 2 and 16M pixels each. A source header-height mismatch was corrected; Close stays visible when reviewing long results. Resize readiness is invalidated immediately when a render is scheduled, so stale completion cannot describe a partially drawn page pair. Final normal/minimum comparison captures were visually inspected (`.test-data/comparison-1790831426132`), along with image-difference and OCR-comparison captures. No source artwork was cropped.
- Testing found and fixed the global busy state blocking Unlock in the comparison password dialog. Wrong/correct passwords and cancellation pass. Owned comparison PDF tasks are destroyed on close; borrowed reader/output documents stay usable. Cancellation and closing during a 40-page check preserve the original reader. Tests cover literal script-shaped content, Unicode/whitespace/coarse text reconstruction, image-only differences, manually aligned reordered versions, whole-document page counts, 101-page limits, damaged files, fullscreen/layout regressions and unchanged source hashes.
- Full `npm run check`: **25/25 Node + 40/40 native Electron tests = 65 passing checks**, including production build. After the final picker/readiness/sticky-header refinements, all **15 relevant native comparison/OCR/page-workspace/layout tests** passed again. A test assertion was corrected to await the native dialog close event before checking the remaining reader. The rebuilt app remains runnable with `Launch PDFix.cmd` or `npm start`.

FEATURE-TRACKER.md now estimates approximately **41% product implementation**, with planning coverage complete and all remaining gates retained. Next core work: annotations and guided supported forms/visual signatures, page crop/resize/automatic split, compression with quality review, independently verified permanent redaction and password-aware writing. Broaden OCR quality, comparison alignment/non-PDF fidelity, documents/images, AI, Windows integration and release testing. The full product remains incomplete and the goal stays active.

#### 📅 Persistent PDFix markup — verified 2026-09-30

- **View options → Mark up PDF** offers word/area highlights, underline, Unicode notes, Western-font text boxes and freehand drawing. Word geometry avoids joining distant columns; blank/scanned regions use the drawn rectangle. Side-panel comments/colors/text sizes, removal, bounded undo/redo and reset work. Original PDF bytes are unchanged.
- Markup uses native PDF annotation dictionaries with explicit appearances. Owned PDFix marks reopen for editing/removal. Existing foreign annotations, links, catalog metadata and ordinary unsigned form values remain. Reply/shared references, signatures/certification, encryption and XFA are refused when replacement could lose structure or invalidate controls. Retaining foreign structures does not sanitize their scripts for other viewers; PDFix continues to disable them.
- Preview independently reopens the new bytes with PDF.js and checks expected annotation subtype, literal contents and rectangle before enabling exclusive-copy saving. Source/output comparison is available. Flattening turns visual marks into page artwork while notes retain their contents as editable annotations; this is not redaction. Native raster comparison at unchanged dimensions uses the existing 24/255 tolerance.
- **Notes on this page**, **Show annotations** and **Include annotations in print** are available in reader View options. Notes render as inert literal strings. Annotation choices include form appearances; flattened artwork remains page content. Print preparation changes with the chosen annotation option and original bytes stay safe. Physical printer verification remains a release gate.
- Markup drafts have a separate source-fingerprinted namespace from rich/source editor drafts. Restart recovery works. Injected disk failure blocks leaving while preserving editing/preview; a verified rescue export clears the draft and stale rejected write state. Pending autosaves settle before saving. Main-window close selects the active guard. Focused preview Ctrl+P prints once, without also printing the editable baseline.
- Fixed generic pdf-lib lookups, a removed PDF.js rectangle helper, initial page fit, and an autosave completion overwriting the independently verified preview status. Full `npm run check`: **29/29 Node + 45/45 native Electron tests = 74 passing checks**, production build included. Native markup tests cover all five tools, edit/remove/reopen, Unicode/script-shaped literal notes, visibility/print options, preserved form values, undo/redo, restart/failed-recovery rescue, cropped 90°/180°/270° pages and flattening. Standard PDF file tests additionally cover linked replies, regular form/link/foreign annotation retention, metadata, signatures/encryption and invalid/oversized geometry.
- Normal preview and minimum-window markup screens inspected. Final resize captures await whole-page fit rather than recording the brief pre-resize canvas; After the stronger resize assertion and sticky Close/header refinement, all 5 native markup checks passed again. Inspected final minimum-window capture: `.test-data/markup-1790834191065/markup-minimum.png`; the whole source page fits and Close remains visible during preview scrolling. Markup limits remain: 100 MiB input/output, 500 pages/marks, 50 regions per text selection, 1,000 points per stroke/20,000 aggregate ink points, 2,000 characters per mark and 2 MiB recovery. Western text-box fonts and the broader annotation/real-document/accessibility corpus remain documented limitations.

FEATURE-TRACKER.md now estimates **44% implementation** (43.5% rough weighted contribution), with planning coverage complete. Next: guided supported forms/visual signatures, crop/resize/automatic split, compression, independently verified permanent redaction and password-aware writing, alongside the existing format/AI/Windows/release gates. Phase 3 and the full product goal remain incomplete.

#### 📅 Guided fill and visual signing — verified 2026-09-30

- **Workspaces → Fill and sign**, or PDF reader **View options → Fill and sign**, opens supported ordinary AcroForms. Text, checkbox, radio, dropdown and list values, required/blank guidance, undo/redo/reset and readonly explanations are implemented. Values remain editable after saving; readonly/calculated/password/rich-text/file-selector and unsupported fields remain unchanged. Calculations and form scripts are not executed. Custom PDF tab order, broader fonts/calculations and a real-form/accessibility corpus remain gates.
- Typed, drawn, imported and explicitly saved/reused visual signatures, initials, dates and text require **Add at this location**. The current-page label finder proposes uncertain locations; it never guesses values or inserts automatically. Scans accept manual placements, while label suggestions require selectable text or reviewed OCR. Placements compensate for crop/media bounds and page rotation. Typed content uses Western fonts; drawing/image assets support other scripts. Visual signatures are fixed artwork, not certificate signatures; signed/certified, encrypted and XFA writing is refused before form mutation.
- Worker output is reopened and checked with pdf-lib, then independently opened with PDF.js. Changed native widget values, full multi-choice values and readable typed placement text are checked before preview review and exclusive-copy saving. Export/display choice aliases and numeric multi-selection indices were corrected around the locked pdf-lib adapter. Existing unsigned form structures, foreign annotations and catalog metadata remain, including foreign scripts kept inert in PDFix; output is not a sanitizer for other viewers. Originals stay byte-for-byte unchanged in real-file tests.
- Form recovery has a separate source-fingerprinted identity from rich/source and markup editing. Valid unplaced signature composer content survives restart but never enters an output without confirmed placement. Failed recovery blocks departure and permits preview/rescue-copy saving. Successful rescue export clears the stale failed write and recovery warning. The side panel is inert during saving/departure, preserving the exported snapshot. Saved signatures are stored only by an explicit **Save signature for reuse** choice; selected/all deletion is available. Clearing recents/recovery retains the library, which is unencrypted and separately bounded to 10 signatures/8 MiB.
- Signature imports use a dedicated chooser with no recents/path grant. Bounds: 4 MiB selected image, 4M decoded pixels, 4,096 pixels per side; normalized PNG is bounded and downscaled to at most 1,200×600. Drawings allow 50 strokes/5,000 points; output allows 500 fields/2,000 widgets/50 confirmed placements and existing 100 MiB/500-page bounds. Serialized recovery is limited to 2 MiB. PNG import/drawing are verified natively; broader JPEG/WebP/general-image fixtures remain pending.
- At the user's request, isolated native tests now render offscreen with no shown/focused windows. Plain hidden-window rendering caused a signature timeout through slow input processing; CPU offscreen rendering at 60 Hz resolves it. Window invisibility is asserted. Native fullscreen is deliberately skipped in hidden runs and retains earlier visible-run evidence; it requires an explicitly requested visible run. Compact reader tests request the corresponding content viewport because offscreen windows lack the native border. Normal user launches keep native window behavior.
- Full hidden **npm run check: 33/33 Node + 48/48 executed native Electron tests = 81 passing checks**, production build included; **one native fullscreen test skipped**. The earlier full run exposed a comparison resize race that could disable a navigation button between press/release, plus a native-border assumption in a minimum-layout test. Comparison readiness/controls now invalidate immediately on actual geometry changes, and pending resize timers are canceled by explicit navigation. All 15 affected comparison/forms/navigation tests passed, followed by the complete green hidden run. Markup readiness likewise invalidates when resize is scheduled; rotated normal/flattened previews wait for the completed render.
- Normal and minimum form screens were visually inspected. Sticky Close remains available, the source page fits, the recovery warning clears after rescue, Fit page is accurately selected and side-panel buttons wrap without horizontal overflow. The final visual review also narrowed suggested placements before adjacent signature/date/initial labels; all **4 native form tests passed again** after rebuilding. The native geometry assertion confirms the signature suggestion ends before the Date label. Final inspected captures: `.test-data/forms-1790837356355/forms-preview.png` and `.test-data/forms-1790837366802/forms-minimum.png`.

FEATURE-TRACKER.md now estimates **46% implementation**, with planning coverage complete. Next: crop/resize/automatic split, compression with measured quality/size review, independently verified permanent redaction and password-aware writing; broaden form/annotation/OCR quality, image/document conversion, comparison alignment, AI, Windows integration and release checks. Phase 3 and the full product goal remain incomplete.


#### 📅 Local image workspace and image-to-PDF copies — verified 2026-10-01

- Home and Workspaces now offer **Image to PDF**. PNG, JPEG, static WebP and supported uncompressed BMP open as actual local image previews. Rotate, undo/redo/reset, A4/Letter/image-sized paper, orientation, margins and source-preview collapse produce one image-only PDF page, with an independently rendered preview and an explicit artwork/layout review before saving a copy. Source files remain unchanged; existing destination files are refused.
- Bounded header inspection precedes browser decoding: 32 MiB source, 8,192 pixels per side and 16M decoded pixels. Animated PNG/WebP and unsupported BMP variants are refused. Normalized PNG retains decoded resolution and transparency; browser camera orientation and color conversion apply. Original image metadata/color profiles are not copied. No searchable OCR text, tagged-PDF compliance, pixel editing, reverse conversion or multi-image assembly is claimed. Native BMP coverage currently verifies 24-bit bottom-up input; broader 32-bit/top-down/color fixtures remain a gate.
- The worker reopens PDF output and checks its one-page geometry and full-resolution embedded artwork. Independent PDF.js reopening checks page size and image operations before preview/review/copy saving. Native fixtures verify output quadrant pixels, PNG transparency on paper, all four clockwise rotations and all eight JPEG camera orientations. The source preview uses available space with a separate 4M-pixel display bound; full output artwork stays at decoded source resolution.
- Separate source-fingerprinted image recipes recover page settings. Failed recovery blocks departure and additional file grants while allowing preview and rescue export. Canceled saving preserves review/settings; successful rescue clears the stale recovery warning. Pixel data is not stored in the recipe. Native tests cover restart, recovery failures, output collision and damaged/oversized/animated input handling.
- Full hidden **npm run check: 36/36 Node + 56/56 executed native Electron tests = 92 passing checks**, including production build; **one native fullscreen test skipped** because it requires a deliberately visible run. Test profiles render offscreen and image fixtures assert window invisibility. Source-canvas printing prepares exactly one print operation and cleans up temporary pages. No user-profile app was opened or focused for these checks.
- Normal and minimum image screens were visually inspected from saved offscreen captures: `.test-data/images-1790838876969/image-preview.png` and `.test-data/images-1790838883960/image-minimum.png`. Source/output fit, controls wrap and no body scrolling hides bottom controls. A final refinement preserves the correct **Show source preview** caption and pressed state when regenerating output with the source hidden; the production rebuild and affected native rotation/layout/hidden-preview regression passed again (**1/1**).

FEATURE-TRACKER.md estimates **49% implementation**, a rough weighted engineering estimate with planning coverage complete. The full product remains unfinished. Next gates include crop/resize/automatic split, compression with size/quality review, independently verified permanent redaction, password-aware writing, broader document/image conversions and corpus checks, selected-file AI, Windows integration and release validation.


#### 📅 Visible PDF crop boundaries and vector page resizing — verified 2026-10-01

- **Organize pages → Crop / resize** renders the actual source artwork with a visible boundary. Drag a rectangle or enter displayed top/right/bottom/left margins in millimeters. Apply to one page or atomically validate every output page before applying to all. A4/Letter/custom dimensions and fit margins center the visible artwork without stretching. Custom paper uses literal width/height; source quarter-turn rotation and offset/intersected media/crop boxes are handled.
- Crop-only output changes crop/trim/bleed/art boxes and retains the source media box. Resizing embeds vector/selectable artwork into a new page, applies clockwise geometry and preserves the source transparency-group dictionary. Blank pages remain blank at the requested size. Cropped-out content remains in the PDF and is not securely redacted. Existing annotation/link/catalog-removal disclosure and form/signature/encrypted writing refusal remain. Nonstandard user units, unsupported rotations, invalid/empty/non-finite boxes and invalid margin/paper settings are refused.
- Whole page-plan undo/redo retains up to 30 in-memory snapshots across arrangement, rotation, crop, resize, duplication, removal, adding pages and reset. Rotating a cropped page rotates its visual margins, preserving the selected raw content. Boundary move buttons retain their disabled state after jobs. Session sources are bounded to ten/100 MiB and outputs to 500 pages/100 MiB. Source grants remain available across undo; automatic splitting and crash-recoverable operation recipes are still pending.
- Worker reopening checks every page's expected size/rotation; independent PDF.js reopening checks every output viewport dimension before saving is enabled. Actual native fixtures cover all four source rotations with offset boxes, quadrant-color preservation after cropped vector resizing, selectable text, standalone crop-only output, precise/custom paper dimensions and byte-for-byte original preservation. Invalid all-page crop leaves the complete plan unchanged. Save-dialog dismissal is held while export is in flight, verified with an explicit native test barrier.
- Targeted file tests: **6/6**, including three new geometry/safety checks. Targeted organizer/comparison regression: **10/10**. Full hidden **npm run check: 39/39 Node + 58/58 executed native Electron tests = 97 passing checks**, production build included; **one native fullscreen check skipped** as required by hidden testing. No test window was shown/focused and no default user-profile app was opened.
- Saved captures exposed a narrow crop dialog and Apply controls below the minimum viewport. The final dialog uses a wider actual-page preview, separately scrolling settings and always-visible status/Apply controls. After that refinement, the production rebuild and all **4/4 native organizer checks passed again**. Assertions cover whole preview bounds, no dialog overflow, visible status/actions and in-flight save protection. Final normal/minimum captures visually inspected: `.test-data/pages-1790840280155/crop-resize.png` and `.test-data/pages-1790840280155/crop-resize-minimum.png`.

FEATURE-TRACKER.md estimates **50% implementation**, a rough weighted engineering judgment, with planning coverage complete. Phase 3 and the full product goal remain incomplete. Continue automatic split and page-plan recovery, compression with measured quality/size review, independently verified permanent redaction and password-aware writing; broaden geometry/form/markup/OCR/format corpus checks, then the remaining selected-file AI, Windows integration and release gates.


#### 📅 Ordered page ranges and automatic split copies — verified 2026-10-01

- **Organize pages → Keep a page range** accepts ordered physical output positions/ranges and odd/even presets. Input overlap, empty/invalid/out-of-range selections are refused without changing the page plan. Whole-plan Undo restores prior arrangement and geometry. **Split into files** supports every-N-page files or explicit semicolon-separated groups; overlapping groups are refused and omitted current output positions are disclosed.
- The worker builds the arranged/cropped/resized page copy once, then creates and reopens each split PDF. The renderer independently reopens every part, checks every page count/viewport geometry and loads artwork operators before enabling output review. Actual selected-part previews and source-mapped comparison are available. A separate review checkbox precedes saving. Parts retain the organizer's disclosed structure limitations; they are not secure redaction or a universal fidelity promise.
- Native **Save split PDFs** authorizes a parent directory and creates an exclusively new named folder with part-001.pdf and subsequent numbered PDFs. Folder components and aggregate parts are validated; existing directories/files are refused. Writes use exclusive descriptors and bounded same-descriptor hash verification. On failure, only files created by that operation are unlinked, followed by removing the empty new folder. Cleanup failure reports remaining copies explicitly; no recursive deletion is used. Source files and recent metadata remain unchanged. Up to 500 files/500 included pages/100 MiB combined output are bounded.
- Native window close is held throughout folder picking/writing. The dialog also prevents Escape/Close while saving. Cancellation retains verified previews, while canceling/closing generation writes nothing and keeps the original reader usable. Actual native tests cover cancellation, explicit omitted groups, unsafe names before picker invocation, existing-folder refusal, transformed-page geometry/text, source comparison and a deterministic in-flight close barrier. Five new Node tests cover range limits, actual split PDFs, exclusive saving, stale sessions and injected write/partial-cleanup failures.
- The crop source preview's asset path was corrected to the reader's bundled pdf-assets directory. All four native organizer tests passed with this correction. The first split UI run encountered an outdated test locator for the comparison Close label; that locator was corrected and all **4/4 native split tests passed**. No application behavior was changed for that locator issue.
- Full hidden **npm run check: 44/44 Node + 62/62 executed native Electron checks = 106 passing checks**, production build included; **one fullscreen check intentionally skipped**. No test window was shown/focused and no default user-profile app was launched.
- The final split layout uses a compact intrinsic height before previews and expands for actual reading. A stronger idle-height assertion exposed fixed-dialog height stretching; height:fit-content corrected it. Saved minimum captures now wait for completed resize rendering and assert the whole PDF page fits, in addition to visible Save controls and no dialog overflow. After these scoped refinements, the production rebuild and all **4/4 native split checks passed again**. Final minimum capture inspected: `.test-data/split-1790915376991/split-minimum.png`; normal preview capture: `.test-data/split-1790915376991/split-preview.png`. Long status/range disclosures scroll within bounds.

FEATURE-TRACKER.md estimates **51% implementation** (50.5% rough weighted contribution), with planning coverage complete. The user requested faster progress on less important details; defer minor cosmetic adjustments while retaining output/original-safety verification. The full goal remains active and incomplete. Next major work: compression with measured size/quality review, permanent redaction verification and password-aware writing, page-operation recovery and the remaining document/image, AI, Windows/accessibility and release gates. Size/bookmark split rules and broad large-real-file/adversarial directory-race corpus remain pending.

#### 📅 Compression with measured size and quality review — verified 2026-10-01

The user asked to continue faster on less important details. This slice prioritizes a usable compression workflow and document/original preservation, with minor cosmetic work deferred. It does not complete the full product or Phase 3.

- Added Home's **Make a file smaller**, **Workspaces → Compress a PDF** and **PDF View options → Compress PDF**. Lossless rewrites streams/object storage while retaining image quality. Optional JPEG quality 40–95 optimizes supported non-JPEG images; existing JPEG/inline images and pixel dimensions remain unchanged. No downsampling/raster-only conversion is used. The sheet shows actual before/after bytes, percentage savings or explicit larger/no-saving results, real output navigation and source/output artwork comparison. Changing settings invalidates previews/review; an explicit quality-review checkbox precedes saving a new filename.
- Bundled official portable Windows x64 qpdf 12.4.2 inside the project. Release ZIP SHA-256 db87077e683630c1217e0e8f9a20a9749d952ab676e881c3689187763a5de25d matched the official API digest before extraction/execution. The build includes manifest-selected executable/DLLs and upstream attribution texts. Runtime job startup checks each selected binary hash. This does not claim signature verification or a complete matching binary SBOM/notice review; Microsoft runtime redistribution, exact linked library versions, vulnerabilities and clean-machine installer loading remain gates. No system-wide installer ran.
- Native code receives an immutable opened PDF snapshot, a validated token and whitelisted options. One active job uses app-owned exclusive temporary input/marker files and fixed hidden no-shell process arguments. Native diagnostics/output are monitored and each process/verification stage has a two-minute timeout. Source/output caps are 100 MiB; verification limits include 100 MiB expanded content, 64 MiB individual expanded streams, 500 pages/100,000 objects, 16M pixels/8,192 per image side and bounded nesting. Node verification workers have heap limits; hard native process memory containment and a broad adversarial corpus are still incomplete.
- Preflight refuses encrypted/restricted, certified/permission-controlled, existing digital signatures or empty certificate-signature fields, and XFA PDFs. A reference-independent reachable graph checks root/Info structures, text/content streams, regular form values/appearances, links/outlines/metadata/attachments and geometry; lossless also matches image payloads. JPEG permits image payload/filter changes while preserving other checked structures. The renderer independently reopens every output page and checks boxes/rotation/operators. Normal rewriting can discard unreachable historical objects; compression preserves reachable private metadata/attachments and is not redaction or PDF/A validation.
- A compact generated blank PDF exposed an independent-parser collision when obsolete orphaned object streams were preserved. Normal unreachable-object removal avoids that collision; the fixture now reopens and clearly reports a larger output. Unsupported filter and image cases are handled conservatively; further color/alpha/filter/form/real-file coverage remains a gate.
- Cancel/close during native generation or independent reopening terminates/discards work, preserves the explicit canceled state and permits retry. Native app close is held during compression and Save picking/writing. A renderer crash cancels native work. Global drops cannot replace an open modal source session. Cleanup unlinks only known job files and removes the empty directory; startup accepts only marked jobs with known filenames, skips unknown content/symlinks and uses no recursive deletion. Interrupted preview/options recovery is not implemented.
- Ten new Node checks cover real lossless/JPEG outputs, form/link/outline/metadata/attachment retention, compact/no-saving files, protected and nested-signature/XFA inputs, malformed/changed-content/oversized-image refusal, changed engine hashes, cancellation, interrupted-job cleanup and original/overwrite protections. Five new hidden native checks cover actual page/text/artwork review, measured sizes, quality invalidation, exclusive saving/canceled Save, deterministic in-flight close protection, cancellation during generation/reopening, clean retry and 800×620 layout with whole-page fit and visible Save controls.
- Final **npm test: 54/54 passing**. Full hidden **npm run test:desktop: 66/66 executed checks passing**, with one fullscreen check intentionally skipped. After the final cancellation-state refinement and added reopening-cancel check, the production rebuild and all **5/5 compression native checks passed** again. Current checked corpus comprises **121 passing checks** (54 Node + 67 executed native across those verified runs), with the fullscreen check skipped. An earlier full run's only failure was an ambiguous test locator immediately after dialog close; waiting for removal and scoping the original reader fixed it. No test window was shown/focused and the user's normal app profile was not launched.

FEATURE-TRACKER.md now estimates **52% implementation** (51.5% rough weighted contribution). Planning coverage remains complete; the full goal remains active and incomplete. Next major work: verified permanent redaction and password-aware writing, page-operation recovery, broader document/image conversions and editing, AI, Windows/accessibility, native resource hardening and release gates.

#### 📅 Clean-image redaction and hidden-information removal — verified 2026-10-01

The user requested faster progress on less important details and hidden testing. This slice adds a usable, explicitly flattened redaction mode, with output/original-safety checks retained. The full product and Phase 3 remain incomplete.

- Home **Hide private information**, **Workspaces → Redact a PDF** and reader **View options → Redact private information** open the actual source. Drag rectangles on ready page artwork, add keyboard-accessible regions, enter percentage positions, undo/redo and navigate a region list. Literal text search proposes whole matching text runs, with explicit split-phrase/scan/font uncertainty. It never claims complete sensitive-data detection. Review the regions before building.
- Accept the flattening/hidden-information tradeoff before building. All visible pages render on white at 144/180/216 dpi; outward-rounded selected pixel regions are made opaque black before encoding. Only sanitized RGB frames reach the writer, sequentially. A fresh PDF contains only page tree, one RGB Flate image and an exact image-drawing content stream per page. Original text, interactive forms, links, layers, annotations, metadata and attachments are excluded. Visible unmarked field/comment artwork remains in the image. The original is unchanged and still contains its private content.
- Strict writer/native verification checks source protection/signatures/XFA, object whitelist/page tree/geometry, black mask pixels, canonical compressed streams and whole serialized bytes. Extra objects, hidden text/operators, original structures, appended/historical bytes, compressed payload tails, trailer identifiers and extra geometry data are refused. An independent PDF.js pass checks all output pages for recoverable text, annotations, metadata/extra structures, exact geometry and full sanitized RGB hashes. Source/output comparison is available; the general comparison display is not itself the redaction verifier.
- Native verification retains immutable output bound to the opened source and token. Save receives only that token, exclusively creates a new copy, hashes bounded reads from the same descriptor and holds native close throughout the picker/write. Disk mismatch removes only the operation's new file. Cleanup failure reports the remaining unverified path explicitly. Original bytes, existing output files and source reading positions are protected. Saved output was independently inspected with bundled qpdf: no syntax/stream errors, one RGB image page, no forms/attachments/outlines; this limited probe is not a broad forensic certification.
- Recovery separately binds coordinates/settings to the source fingerprint, storing no search query or page pixels. Failed recovery blocks departure; retry/discard or verified rescue export remain available. Cancellation/close saves no PDF, cancels workers/native verification and returns the source reader. A new independent-verification cancellation test exposed a pending PDF.js await after preview destruction; cancellation signals now interrupt those awaits and release busy controls for retry. Failed jobs terminate their writer and discard incomplete native output. One earlier focused Workspaces retry encountered a history-save error; retry and subsequent full hidden run passed while original protections held. No unverified filesystem workaround was applied.
- Limits: 100 pages, 500 regions, 100 MiB source/output, 100M total rendered pixels, 16M per page/8,192 per side and 90 MiB combined compressed image payload. Native streams are capped at 64 MiB, source scanning at 100k objects/depth64/500k visits; writer/native stages have two-minute bounds and Node heap limits. Hard OS containment, larger realistic/adversarial files, additional color/font/optional-content/forensic probes and vector-preserving redaction remain gates. This mode deliberately flattens original text/forms; it does not complete those remaining product requirements.
- Eight new Node checks cover actual clean PDFs, all quarter rotations/offset crops/user units, hidden structures/streams/trailer/geometry payloads, surviving image pixels, protected/signature/XFA/unsafe/oversized inputs, worker ordering, native immutable source/token ownership, region-only recovery, disk checks and injected failed-write/cleanup behavior. Seven hidden native tests cover fractional A4/UserUnit/translucent artwork, failed-recovery rescue, independent-verification cancellation/retry, real text-match removal/comparison, review/canceled/exclusive Save and held native close, precise region undo/restart/settings invalidation, actual drag masks on four crop rotations and cancel/close/Workspaces reopening.
- Full hidden **npm run check: 62/62 Node and 74/74 executed native Electron checks = 136 passing checks**, production build included; **one fullscreen check intentionally skipped**. After strict trailer/geometry checks, the focused Node redaction suite also passed **8/8**. After the final failed-job cleanup and strict output refinements, the production rebuild and all **7/7 hidden native redaction checks passed again**. No test windows were shown/focused and the user's normal app profile was not launched. Minimum/normal redaction captures were inspected internally; Save remained visible and the whole PDF fit at 800×620.

FEATURE-TRACKER.md estimates **53% implementation** (52.5% rough weighted contribution). Planning coverage remains complete; the full goal is active and incomplete. Next work: owner-authorized password-aware writing, page-operation recovery, broader PDF/document/image editing and conversions, AI, accessibility/Windows distribution, native resource hardening and release gates. Broader redaction corpus and vector-preserving redaction remain explicit work.

#### 📅 Password protection and owner-authorized removal — verified 2026-10-02

This continuation read the user-supplied core-feature inventory before work. The preceding redaction turn made progress. The user’s request for faster work on less important details and hidden testing remains in effect; this slice adds working password-copy actions without claiming complete PDF editing or release readiness.

- Added Home and **Workspaces → Protect or unlock a PDF**. Enter distinct opening/owner passwords and confirmations, choose printing/copying/editing permissions, or supply an existing owner password to remove protection. A source opened with only its user/opening password is refused for protection changes. No password recovery/bypass is attempted. Password fields clear after processing/cancel/close; no password/settings draft is stored. Permission flags depend on cooperating viewers.
- Reused the pinned local Windows x64 qpdf engine and bounded pdf-lib verification worker. Actual output queries verify AES-256 revision 6, user/owner roles and requested permission flags. Passwords travel through qpdf’s documented `@-` stdin argument channel; process command lines contain only @-, and no plaintext password/job-option file is written. A first JSON-job stdin attempt failed because this qpdf file option does not read stdin; a synthetic named-pipe file-API diagnostic also failed. Both approaches were removed. Raw native diagnostics are bounded/discarded, not logged or returned; recovered legacy user-password values are not passed to the renderer.
- Native decrypted inspection checks existing signature/certification/XFA/geometry/image/stream limits. A reference-independent reachable graph compares ordinary forms/annotations, metadata/attachments, text/content/image streams and geometry. AES protection adds the exact ADBE /1.7 extension-level-8 declaration; the password verifier alone normalizes that declaration in memory. Other extension keys or content changes still fail, and normal compression keeps its original strict graph contract. Source/output serializations remain unchanged by the inspector.
- PDF.js independently opens the original and actual copy, verifies output permissions and checks every page’s dimensions, selectable text items and white-background RGBA hashes. Source/output comparison is available. The explicit settings/page review box precedes Save. The reader continues disabling restricted copy/print actions. An initial hidden test exposed the workspace’s generic controls enabling those buttons after verification; control locking now excludes the reader’s own permission state. A separate test assertion was corrected to the fixture’s actual text.
- Native caches immutable source/token-bound output and SHA-256. Save accepts only the identity, exclusively creates a new filename, verifies bounded same-descriptor disk reads and holds native close during picker/writing. Originals/existing destinations are preserved. Removal adds **Open saved unprotected copy**: native code keeps the user-authorized saved path and verifies its expected hash before changing FileStore metadata/handles; the renderer cannot choose another path. Changed files are refused, and a restored exact copy opens directly in the reader/edit-copy workspace.
- Cancellation/close interrupts native processes/worker checks/text streams/render awaits, removes only known job files and permits retry. Password jobs have separate bounded ownership markers; startup cleans known interrupted jobs, skipping symlinks/unknown content. Temporary inputs/intermediates can contain unprotected document content, explicitly disclosed in the workspace. Synthetic diagnostic artifacts were removed through verified project paths and known-file cleanup. No system installer or normal-profile app was launched; all desktop windows stayed hidden/offscreen.
- Limits: 100 MiB source/output/expanded native content, 64 MiB individual decoded streams, 500 pages/100k objects and bounded recursion/visits. Independent artwork checking additionally caps 100M total pixels, 16M per page and 8,192 per side; streamed text caps 50k runs/2 MiB characters per page. Native/worker and renderer waits have two-minute bounds. New passwords require 8+ characters, distinct roles and at most 127 UTF-8 bytes without control/compatibility variants. Japanese passwords pass native and independent reader checks. Standard protected files require owner authentication; alternative/public-key, wider legacy/normalization/extension/real-file corpus, hard native memory containment and binary/installer review remain gates. Other writers still refuse encrypted sources; users can open the authorized unprotected copy.
- Eight new Node checks now cover actual RGB-image/form/metadata/attachment protection/removal, wrong/opening password refusal, certification/XFA, Unicode, cancellation, interrupted-job cleanup, bounded/injection-resistant settings, exact extension normalization and actual command-line/temporary-file absence of supplied password strings. Five hidden desktop tests cover image/form plus a rotated fractional A4/UserUnit/translucent second page, independent text/pixels/permissions, wrong/correct saved-file passwords, restricted controls, review/canceled/exclusive Save and in-flight close guards, owner removal/comparison, direct reopening with changed-file refusal, Unicode/settings invalidation, cancellation/retry and 800×620 page-fit/visible Save controls.
- Full hidden **npm run check passed: 69 Node + 78 executed native = 147 passing checks**, one fullscreen check intentionally skipped. After the final image/multi-page/password-channel additions, the password Node suite passed **8/8** and hidden desktop suite **5/5**. After adding saved-copy reopening, the production build and all **5/5 native password tests passed again**, and **15/15 FileStore/password Node tests passed**. The current checked corpus therefore contains **149 passing checks** (70 Node + 79 executed native across those verified runs), with one fullscreen check skipped. The final support-table wording production rebuild also passed. Internal minimum capture: `.test-data/passwords-1790926232497/password-minimum.png`; the whole page and Save fit without dialog overflow.

FEATURE-TRACKER.md now estimates **54% implementation** (53.5% rough weighted contribution). The full goal remains active and incomplete. Next work: recoverable page-operation recipes, broader document/PDF/image editing and conversions, larger corpus and accessibility/Windows/AI/release gates. Vector-preserving redaction, broad password compatibility and native resource containment remain explicit unfinished requirements.

#### 📅 Page-arrangement recovery — coded 2026-10-02, runtime verification pending

The user asked to stop repeated testing/planning and prioritize implementation. No Node or Electron test suites were run in this continuation, and no app windows were opened.

- Added local automatic recovery of combined PDF sources, output page order, duplicate/remove/rotation decisions, crop/resize settings, and split rule/group/folder inputs. Reopening restores the recipe; previews and split outputs must be rebuilt. Live Undo/Redo starts from the restored arrangement.
- Native recovery derives file locations and fingerprints from opened source handles; the renderer submits source identities and page settings rather than arbitrary recovery paths or PDF bytes. Additional originals are bounded-read and matched by SHA-256 before live handles are committed. Missing/changed sources preserve the recipe, disable arrangement edits, and offer native-picker relinking to matching bytes, retry, or an explicit two-click discard/start-fresh action.
- Pending recipe writes and page/split processing hold departure guards. Closing waits for recovery; failed writes leave the workspace open for retry. Ordinary new-copy saving now holds the native close counter through its picker and writer. Recovery stores recipes/source descriptors, not generated PDF output or passwords, in the existing local unencrypted recovery store.
- Production frontend compilation passed. The initial sandboxed invocation was blocked by process-spawn permissions; the authorized build succeeded. This is compilation evidence only: restart, recovery failure, relinking and cancellation behavior remain untested. Existing historical test counts and the 54% estimate are unchanged.

#### 📅 Search match navigation — coded 2026-10-02

Added individual occurrence counts, page-group results, Next/Previous buttons, F3/Shift F3 and search-box Enter/Shift Enter navigation, wrapping through matches and a Stop search action. Artwork highlighting uses exact DOM ranges across PDF text spans and Unicode-aware offsets; each reader owns separate highlight names. Search respects copy permissions. Work is bounded to 10,000 matches, 50,000 text runs / 2 MiB extracted characters per page, 16 MiB cached characters and 2,000 background highlight ranges plus the selected match. Capped/stopped searches disclose incomplete coverage. Layout/reading order still depends on the PDF text stream; readable-text navigation has a coarser paragraph target. No test suites were run. Runtime verification remains pending.

#### 📅 PDF text/image additions — coded 2026-10-02, runtime verification pending

Added a PDF content workspace from Home, Workspaces, the PDF tab row and reader View options. Users can add Western-font text or supported still images, move/resize by dragging or percentage fields, choose font/size/color, use arrow-key placement, duplicate/remove additions and undo/redo. Preview writes actual page content, preserves source page geometry, checks font wrapping/overflow and embedded image dimensions, reopens the PDF independently, reads back added text and provides source/output comparison. Saving requires explicit layout review and exclusively creates a new copy.

Recovery stores source-fingerprint-bound additions and normalized image artwork in the existing unencrypted local store. Latest snapshots are automatically saved; history is bounded and remains in-session. Failed/oversized recovery permits reviewed export or explicit two-click discard; unresolved saved recovery is kept until retry/discard. Source PDF bytes stay unchanged. New native image picking is bounded and uses a file picker rather than renderer paths. Limits: 500 pages, 200 additions, 20 imported images, 4 MiB per normalized PNG / 32 MiB total session images, 16M pixels / 8,192 per side, 2 MiB local draft and 100 MiB source/output. Large images can fit the editor while exceeding recovery capacity; the UI requires saving a reviewed PDF or discarding before leaving. Encrypted/certified/signed/XFA and custom UserUnit writing remain refused.

This increment adds content; rewriting original PDF text/image objects, editing previously saved additions as separate objects, broader fonts and metadata editing remain incomplete requirements. Search/navigation and this editor have only compilation evidence in this continuation. No automated test suites or visible app windows were run. Historical checked counts and the 54% estimate remain unchanged pending runtime evidence.

#### 📅 Existing PDF text replacement — coded 2026-10-02

Extended the content workspace with a list of supported original text runs on the current page, replacement text, existing font/size disclosure, source highlighting, per-run revert and undo/recovery. The writer edits the selected literal/hex string token in an existing page content stream, keeps the text operator and original font resource, and clones changed streams per page so a shared stream is not unintentionally changed on other pages. Supported Type1 standard fonts use explicit WinAnsi or a deliberately restricted ASCII subset with no custom font descriptor/ToUnicode. Tj, single-string TJ and quote text-showing operators are supported; multi-part kerning arrays, embedded/subset/CID/Type3 fonts, marked content, nested Form XObjects and inline-image streams remain unfinished. Longer replacements can affect following text; reviewed output remains required. This is editing, not permanent redaction, and old objects can remain serialized.

Inspection caps decoded streams at 8 MiB each / 64 MiB total, syntax at 100k tokens/depth32, candidate runs at 2,000 and selected changes at 200 / 2,000 characters each. Hard native resource containment and broader font/layout/fidelity compatibility remain open gates. No test suites were run; compilation is the only new verification evidence. The full product goal remains active.

Compilation evidence for these increments: all three frontend production builds passed; native JavaScript syntax compilation passed for main/preload/FileStore/recovery and new content/page validation modules. No runtime test suites were executed.

#### 📅 Existing PDF image replacement — coded 2026-10-02

Added an original-image list, original-artwork thumbnail, replacement-artwork thumbnail, native file picking, per-image restore, Undo/Redo, source-bound recovery and reviewed export. The writer replaces the selected image resource, preserving its page content operators/placement, and clones inherited/shared Resources and XObject dictionaries for the changed page. Other pages keep their original resources; repeated uses of the selected resource on its page all change. Differently shaped replacements can stretch, which the UI explains. Worker reopening verifies the selected resource reference and replacement dimensions, and the final PDF still goes through the existing independent page-reopening/review flow.

Original thumbnails are isolated one-image PDFs using the original image/color/mask dependencies; the parent renderer draws the thumbnail locally. Limits include 2,000 candidates, 16M pixels / 8,192 per side, a 32 MiB thumbnail PDF and bounded preview pixels. ImageMask stencils, nested Form XObject images, larger/unsupported resources and broad color/mask/adversarial compatibility remain unfinished. Replaced objects can remain serialized: this is editing, not permanent redaction. No test suites or visible app windows were run. Runtime verification remains pending; the overall release estimate is unchanged.


#### 📅 Multi-image PDF collections and image editing - coded 2026-10-02

Added native multi-file image picking, ordered PDF pages, individual page rotation/paper/orientation/margins, duplication/removal, shared page setup, Undo/Redo and full multi-page output preview. Image collections recover from native-derived source references and exact SHA-256 snapshots. Missing or changed inputs preserve the draft and block accidental replacement; retry, native exact-source relocation and explicitly confirmed fresh collections are available. Recovery commits source handles only after all source reads match. Limits: 10 inputs, 100 output pages, 32 MiB per original, 100 MiB of input/normalized artwork and 64M normalized pixels. Native save-dialog/export operations hold the close guard.

Added per-page crop edges in original-image percentages and brightness/contrast controls, original-image restoration and shared preview/output adjustment math. Pixels are cropped before rotation; tone changes preserve alpha and source files. Export reuses identical edited assets, limits distinct output artwork to 100 MiB/64M pixels, checks every generated page size/image dimension, and requires full output review. This is image-only PDF output, not searchable text or a tagged PDF claim. Broader real-file/color/codec compatibility, drag crop selection, image-file export and runtime verification remain incomplete.

No runtime tests or visible app windows were launched. Compilation is the only new validation; historical checked counts and the release estimate stay unchanged.


#### 📅 Document PDF export - coded 2026-10-02

Added PDF export from the rich document and UTF-8 source editors. The export dialog provides A4/Letter, portrait/landscape, 5-50 mm margins, local sans/serif/monospace fonts, 10-24 pt text, line spacing and optional page numbers. A separate always-hidden sandboxed Chromium renderer generates pages from a native-validated, escaped text/formatting tree; it has no document scripts or network resources. Native generation is limited to one job, 60 seconds, 20k nodes, depth 64, a 2 MiB document, 500 PDF pages and 100 MiB output. Cancellation destroys the hidden renderer. Native output reopens page count/geometry; the visible export preview reopens all pages and requires layout review before saving. Export retains editable recovery and checkpoints. Document/image PDF exports now use SHA-256 disk read-back through the existing exclusive new-copy writer.

Supported heading/list/emphasis/source-text formatting is exported from the current editor. Simplified DOCX imports cannot restore omitted images/tables/headers/revisions or original pagination. Installed font fallback and automatic page breaks require human layout review. Manual page-break controls, richer original document fidelity, accessibility/standards and broader compatibility remain unfinished. No runtime tests or application windows were launched during implementation; hidden rendering described here runs only when the product user requests document PDF export.


#### 📅 Document page breaks and page setup - coded 2026-10-02

Added an editable/selectable page-break marker, toolbar insertion and Ctrl+Enter, with ordinary editor Undo/Redo and source-bound recovery. PDF generation emits explicit CSS page breaks; DOCX generation emits native Word page breaks. Plain-text conversion preserves manual breaks as form-feed characters. The existing simplified DOCX importer does not claim restoration of original pagination.

Added document page setup for A4/Letter, orientation, margins, default font/size/spacing and exported page numbers. The editable sheet reflects selected settings; it scrolls continuously, while PDF preview shows final pagination. Layout is part of local rich/source recovery and version restoration, and DOCX/PDF exports use the settings. PDF-specific overrides remain separate from document layout. Imported complex layout, mixed sections and richer document formatting remain unfinished. No runtime test suites or visible app windows were run.


#### 📅 Document/source Find and Replace - coded 2026-10-02

Added literal search, match-case and Unicode whole-word choices, previous/next matches, Ctrl+F, F3/Shift+F3, individual replacement and Replace all. Rich-document matches can cross adjacent formatted runs inside one text block; replacement uses native editor transactions and Undo. Highlight decorations are kept out of document/recovery/export content. Source-text replacements have an explicit single-operation undo that remains available only while the source still matches the replaced snapshot, avoiding loss of subsequent edits. Search caps at 5,000 matches and 500 background highlights plus the selected match; Replace all is disabled for capped searches. Replacement output is bounded to 2 MiB. Broader rich-layout/input-method corpus and runtime verification remain pending. No runtime test suites or visible app windows were run.


#### 📅 Selected-text formatting and paragraph alignment - coded 2026-10-02

Added local sans/serif/monospace fonts, 8-72 pt sizes, hex text colors and Clear text style for selected text or subsequent typing. Added paragraph/heading left/center/right/justify controls and Ctrl+Shift+L/E/R/J shortcuts. Formatting uses native editor marks/attributes, ordinary Undo/Redo and document recovery. Supported marks/alignment carry to generated DOCX runs/paragraphs and escaped native PDF markup. Manual page breaks, layout, search/replacement and formatting have compilation evidence only; larger document/import/clipboard/input-method/accessibility compatibility remains pending. No runtime test suites or visible app windows were launched.


#### 📅 PDF document information editing - coded 2026-10-02

Added title/author/subject/keywords/creator property controls to the PDF content workspace, with bounded literal values, per-field changes, revert, Undo/Redo, source-bound recovery and metadata-only PDF preview/save. The writer changes only chosen standard document information fields and reads them back after serialization. Independent PDF.js output metadata is also compared before reviewed saving. Long original values are displayed shortened with an explicit overwrite disclosure; unreadable fields stay disabled/unchanged. Existing XMP is preserved with a visible conflict warning. Old/hidden metadata can remain serialized: this is editing, not private-information removal. Broader XMP synchronization, metadata compatibility and runtime verification remain unfinished. No runtime test suites or visible app windows were run.


#### 📅 PDF pages to PNG/JPEG - coded 2026-10-02

Added Home/Workspaces and reader View options entry points for current/all/custom PDF page ranges. The local export workspace supports PNG/JPEG, 72/144/216/300 dpi, JPEG quality, PNG transparent paper, annotation/form appearance inclusion and optional current view rotation. Selected crop/page artwork is rendered sequentially, encoded and independently decoded for dimension checking before image review. Copies preserve original PDF bytes and flatten visible page content into pixels; this does not promise private-information removal or archival fidelity. Reader copy/print restrictions gate the tool.

Single-page output uses native Save with exclusive new-copy creation and SHA-256 disk read-back. Multi-page output uses a newly created user-named folder with numbered page images, native signature/dimension validation, same-descriptor disk hashes, and failure cleanup of only known operation-created files. Existing files/folders are preserved. Native picker/writer operations hold close; rendering has cancellation signals and a two-minute deadline. Limits: 100 pages, 100M combined pixels, 100 MiB output, 32 MiB / 16M pixels / 8,192 per side per image. Larger real-file/color/transparency/form appearance, encrypted-file permissions, interruption/disk and resource/accessibility compatibility remain pending. No runtime test suites or visible app windows were launched.


#### 📅 Edited-image PNG/JPEG copies - coded 2026-10-02

Added direct image-file export from the selected image-collection page. Source crop/tone and clockwise rotation are applied at decoded source resolution; PDF paper/margins are excluded. PNG retains transparency, while JPEG uses white behind transparent pixels and offers 70/85/95% quality. Outputs are previewed and independently decoded for dimensions before explicit review and native copy saving. The writer reuses bounded image signature/dimension checks, exclusive output creation and SHA-256 disk verification. Camera orientation and browser color conversion remain normalized; original photo metadata/color profiles are omitted. Other collection pages and recovery are retained after single-image export. Runtime color/rotation/transparency/failure/cancellation compatibility remains pending; no runtime test suites or visible app windows were launched.


#### 📅 Searchable actions and shortcut help - coded 2026-10-02

Added an Actions button and F1/Ctrl+Shift+P panel that searches available tools and keyboard shortcuts. It offers global files/navigation/view commands, PDF reading/editing/export tools, document Find/Replace/export/page-break/Undo controls and image rotation/export actions. Current document type, readiness, copy/print restrictions and processing state determine availability; disabled rows explain requirements. Arrow navigation and Enter activate commands after closing the panel and restoring prior focus. Ctrl+K retains opened-file search. Broad UI/input/focus and assistive-technology verification remain pending; no runtime test suites or visible app windows were launched.


#### 📅 RTF rich-text adapter - coded 2026-10-02

Added a local worker-based RTF 1 reader and writer, native RTF opening/signature checks and exclusive hash-verified new-copy export. RTF opens in the existing rich editor with recovery/version history, Find/Replace, Undo, document layout and RTF/DOCX/TXT/reviewed PDF exports. Ctrl+S chooses RTF for an opened RTF document; the Actions panel exposes explicit RTF export. Basic bold/italic/underline/strike, Unicode escapes and Windows-1252 text, font-family/size/color, paragraph alignment, headings identified by outline level and manual page breaks are supported.

The bounded reader accepts up to 10 MiB input, 2 MiB resulting editor content, 64 nested groups, 500k processing tokens, 20k elements and 256 font/color entries. No document instructions, links, fields, embedded objects or pictures are executed. Unsupported/optional destinations, hidden text, metadata, images/objects and headers/footers are omitted with a visible simplification notice; tables/list labels become paragraphs/visible text. Other code pages/font character sets and alternate Unicode groups are refused rather than decoded incorrectly. Fonts map to Arial/Times New Roman/Consolas and sizes to 8–72 pt. Original page layout is not reconstructed. Export writes escaped ASCII/UTF-16 Unicode controls, font/color tables, basic styles, page setup, optional page-number footer and flattened visible list labels; no claims of exact round-trip fidelity. Grammar reference: [Microsoft RTF specification](https://learn.microsoft.com/en-us/previous-versions/office/developer/office2000/aa140277(v=office.10)). Runtime real-file/round-trip/malformed/cancellation/fidelity and accessibility verification remain pending. No runtime test suites or app windows were launched.


#### 📅 Document view zoom - coded 2026-10-02

Added writing-workspace footer controls for 25–200% zoom, Fit width, plus/minus buttons and Ctrl+wheel over the document canvas. The preference is saved locally. Fit width responds to canvas/sidebar/window changes and paper/orientation changes; larger views scroll horizontally. CSS layout zoom keeps the editable text and selection at the displayed scale. Zoom affects the on-screen sheet, not document content, recovery or export formatting. Controls include accessible labels, keyboard-native selection and a current-percentage output. Runtime caret/selection/scroll/resize and assistive-technology verification remain pending. No runtime test suites or app windows were launched.


#### 📅 XLSX workbook workspace - coded 2026-10-02

Added local XLSX opening, worksheet tabs with hidden/protected labels, a bounded paged raw-value grid, Go-to-address/arrow navigation/F2, sheet-text search, explicit text/number/boolean cell editing, per-cell revert, Undo/Redo, staged-input departure protection, source-bound recovery, XLSX copy saving and current-sheet CSV export. Formula/special-type/dynamic metadata/covered merged cells and protected sheets remain read-only. Existing numbers/dates/styles are shown as stored values; no spreadsheet calculation or formatting engine is claimed. Cached formula outputs can be stale after editing. Export requires a review checkbox, retains workbook recovery and requests full recalculation when opened by a capable spreadsheet app. CSV uses raw/current values and prefixes formula-looking text with an apostrophe; styling/images/formulas and other sheets do not carry over.

The Office ZIP reader validates central/local bounds, duplicates/path names, compression methods, declared expansion and CRCs without extracting files. 10 MiB compressed, 30 MiB expanded, 2k archive parts, 10 MiB per part; no encrypted/multipart/ZIP64 or active embedded VBA/OLE. UTF-8 XML is parsed with DTD/entities refused, errors rejected and 200k nodes/64-depth limits. Parsing/writing runs in a bounded worker with a 45-second deadline. Limits: 50 worksheets, 100k stored cells, 8 MiB preview text, 5k changed cells / 500k changed characters; CSV one million dense cells / 8 MiB text. Charts/images/styles/unknown inactive package parts are retained but not rendered. Chart sheets and unsupported encodings are refused. External relationships, package signatures or reserved workbooks disable edits; no links/objects/formulas are executed.

XLSX output edits selected cell XML only, retains existing cell styles and all other decoded package parts, updates calculation flags and omits stale optional worksheet dimensions. Output is independently reopened, every expected part compared and changed values/types/formula absence read back before the native Save chooser, exclusive copy creation and disk SHA-256 verification. ZIP compression/container headers are regenerated. Existing files and original snapshots remain unchanged. Added the already-installed @xmldom/xmldom 0.8.15 as an explicit pinned runtime dependency. References: [Microsoft SpreadsheetML cells](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.spreadsheet.cell) and [calculation properties](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.linq.x.calcpr?view=openxml-3.0.1). Runtime/corpus/malformed/archive preservation, formula recalculation, disk interruption, grid selection/accessibility and resource verification remain pending. No runtime suites or app windows were launched.


#### 📅 PPTX presentation workspace - coded 2026-10-02

Added local PPTX opening with a slide list (including hidden labels), previous/next/page-key/direct navigation, collapsible slide pane, Fit width/preset zoom, a simplified positioned shape/text/PNG-JPEG preview, text search and per-existing-run editing. Native edits replace only chosen DrawingML text nodes, retaining their run/paragraph properties, other slide nodes and all untouched decoded package parts. Fields and unsupported-object text remain read-only; signed/modification-protected presentations refuse editing. Undo/Redo, per-run revert, staged-input departure guards and source-bound recovery are connected. PPTX export requires review, independently reopens output, compares all expected package parts and chosen text before exclusive native copy saving plus disk SHA-256 verification. ZIP container headers/compression are regenerated; originals and editing recovery remain intact.

The adapter reuses the bounded ZIP/UTF-8 XML worker introduced for XLSX. Limits: 100 slides, 3k objects, 20k text runs, 2 MiB extracted text; 3k changed runs / 500k changed characters / 32,767 characters per single-line run; no new paragraphs/shapes. Regular and strict PresentationML namespaces are accepted. Simple inherited placeholder geometry, unrotated group scaling and direct/theme-slot colors are approximated. Actual PNG/JPEG preview assets are signature/dimension checked, bounded to 32 assets / 8 MiB / 24M pixels combined, 4 MiB / 4M pixels / 8,192 per side individually, and independently browser-decoded; image loading has individual five-second and aggregate thirty-second limits with departure cancellation. Unsupported images are visibly represented as retained but unavailable artwork. Animated PNG previews are refused.

Exact master artwork/theme inheritance/font metrics/wrapping, image crop/effects/flips, charts/SmartArt/tables, notes and animation are not faithfully rendered; complex shapes use simplified bounds, unavailable positions show text below the slide. Embedded macros/OLE and unsupported archives/encodings are refused. External links/media are retained in PPTX copies but never followed or activated in PDFix. Text TXT/DOCX/reviewed PDF exports include hidden slides, keep readable slide text and slide breaks, and omit slide artwork/layout/notes/animation; PDF is explicitly a text outline, not a faithful slide conversion. References: [Microsoft presentation slides](https://learn.microsoft.com/en-us/office/open-xml/presentation/working-with-presentation-slides) and [masters](https://learn.microsoft.com/en-us/office/open-xml/presentation/working-with-slide-masters). Runtime/corpus/package preservation, actual PowerPoint re-opening, fonts/selection/accessibility, interruption/disk and resource verification remain pending. Production compilation and native syntax checks passed; no runtime suites or app windows were launched.

#### 📅 Security Sandbox, master-list intake and parallel feature coding — 2026-10-02

Preserved the complete user master list verbatim as PDFix-Missing-Features-Master-List.md and saved every item with stable IDs in MASTER-GAP-TRACKER.md. Added R37 Security Sandbox and R38 complete master-list coverage to requirements, product plan and roadmap. Unchecked master-list acceptance gates remain open even when a subset is coded.

Implemented the Windows AppContainer/Job Object broker and integrated it into qpdf compression/password processing with fail-closed launching, staged pinned binaries, exact token/capability/job checks, parent-death/cancellation monitoring, bounded resources and profile/file cleanup. Added global renderer sandbox/stricter local protocol/download/device restrictions and Settings status. Initial production build, native C# compilation and syntax checks passed; the user continues to defer runtime testing. No broker process, app window or runtime suite was launched. Node workers and ordinary AppContainer/private-storage/disk-quota limitations remain explicit.

At the user's explicit request, three additional agents coded features in parallel while the main agent integrated them and added source previews. Added structural PDF security report, source-bound native-confirmed safe link review, engineering paper presets, calibrated distance/perimeter/area, optional PDF layer visibility, current/all/range annotation summaries, supported form-data JSON/CSV export, and basic Markdown/CSV source/split previews. Each preserves existing original-copy boundaries and displays its narrower limits. Syntax checks are compilation evidence only. Hidden runtime behavior, hostile-file/corpus/preservation/selection/keyboard/accessibility and Windows security/clean-machine checks remain deferred. Historical test totals do not verify this new code.

Added trustworthy PDF file details with exact source hash, literal bounded metadata, current physical/printed page, dimensions/orientation/UserUnit, saved/view rotation distinction, copying/printing facts, current-page text uncertainty, optional bounded all-page size check and chosen JSON export. Encryption uses known PDF.js facts or remains unknown. Added password-field withholding before getText(), empty read-only UI placeholders, sensitive-value filtering for exports/history/recovery and cleanup of the selected recovered form draft; originals retain their password field content and this is not document sanitation. Runtime verification remains deferred.

Combined October feature compilation passed: 153 Vite modules, renderer/native syntax compilation and Windows x64 sandbox C# source compilation. Dist assets and sandbox manifest/executable are saved. Master-list copy matches the supplied file byte-for-byte. No runtime suites, broker execution or app windows were launched. Goal remains active: the complete master list and original product/release scope are not finished.


#### 📅 Parallel feature coding — 2026-10-02

Selective structural PDF cleanup now supports chosen metadata, embedded-file references, comments/links, complete forms and scripts/actions. It freshly writes the reachable graph, prunes disconnected history/orphans, independently reinspects output, shows actual rebuilt pages and saves native verified bytes under a new name. Repeated page artwork/text remains. Encrypted/signature-bearing/permission-constrained/XFA/malformed/unsupported shared structures are refused. Hidden-layer cleanup and vector redaction remain pending. Worker heap/time bounds are not OS sandboxing.

Image deskew is explicit ±15 degrees and expands white corners; guides stay in preview. Existing image recovery/undo/export paths carry the angle. OCR confidence is an estimate; uncertain-line cycling and reviewed TXT/line-inventory CSV exports are available. CSV is not reconstructed table data. No scanner/camera integration, extra OCR languages or HEIC/TIFF decoder is claimed.

Printing now offers bounded physical ranges (100 selected pages), named paper/orientation/margins, Fit or actual size (clipping refused), copies/color/duplex requests and reviewed actual raster side previews. 2-up, 4-up and left-bound booklet reorder/pad the chosen source pages; imposition is Fit-only. Booklet requests landscape short-edge duplex; Windows driver flipping and physical output remain unverified. Raster limits: 16M pixels/page, 80M total, conservative 100 MiB encoded-character budget, 120-second preparation; 72/150/216/300 dpi choices. Unsaved marks/forms and temporary layer changes are not included.

AI connections support OpenAI-compatible Chat Completions providers, HTTPS endpoints or explicit numeric HTTP loopback, native encrypted keys, model discovery, frozen question/pasted-excerpt review plus native confirmation, bounded cancellation, excerpt citation IDs and content-free history. No renderer network connection or PDFix file/tool execution is granted. A custom endpoint can forward text or execute server-side tools. Hermes is discovery-only. Native file-context selection, additional runtime adapters and server containment remain pending. Corrupt connection storage fails the AI controls closed while preserving the rest of the app.

Windows launch/Open-with arguments are queued as explicit document-open requests with editor departure review. Per-user association metadata avoids default takeover; no registry/installer/update execution occurred. Runtime tests, app launches, online requests and broker execution remain deferred by user instruction. See PARALLEL-WORKSTREAMS.md for assignments and remaining scope.

Combined parallel-pass compilation passed: 166 Vite modules, native syntax compilation and the existing Windows x64 C# sandbox source compilation. Saved dist assets include index-Br1nZxtA.js and index-CMVTjJNW.css. No app/worker/broker launches, network requests or runtime test suites were run. Continuous/facing-page and reviewed attachment saving are the next agent slices.


Further integrated slices: new empty single-line PDF text fields and unchecked checkboxes (100 new, 500 total) with unique names, Unicode tooltips, required/read-only flags, bounded PDF-point rectangles, overlap refusal, source-bound local recovery/undo and actual reopened native verified-copy output. Western text appearance fonts; no radio/choice/calculation/tagging or guaranteed cross-viewer tab order. Recovery recipes contain unencrypted labels/names/rectangles separately from general recovery; Delete saved recipe removes this recipe. Encrypted/signed/certified/XFA/protected sources are refused.

Reader continuous/facing modes display real PDF.js page artwork and text with lazy nearby-page rendering (four live pages, 16M pixels/page and 32M live pixels, 500 physical placeholders). First page is a cover in facing view, followed by 2/3 spreads. Scroll/go/keyboard physical-page tracking and fit/zoom/rotation/layer choices are supported; rectangle selection, measurements and active-match highlighting return to single-page view. Interactive annotation controls are not added.

Embedded-file export displays full literal declared names/types/sizes, actual decoded byte counts and SHA-256; explicit selection independently decodes again and binds native bytes to source/inventory/selection tokens. Saving uses a chosen new .bin filename, exclusive same-descriptor hashing and no automatic opening. Raw/plain Flate only: 100 descriptions, 10 MB/file, 25 MB cumulative decoding work. Unavailable entries stay visible; external/exotic/multimedia/encrypted containers are refused; signatures remain unable to verify. Bounded Node worker parsing is not an OS sandbox.

AI saved-source context now explicitly lists already opened UTF-8 text/Markdown/data snapshots under 2 MB/20,000 lines. A chosen 1–200-line excerpt is displayed literally, capped at 60,000 characters and source-fingerprint-bound in the frozen transfer review. Unsaved edits are excluded. PDF/Office excerpt adapters remain pending; pasted excerpts are supported. No native-context data is sent until transfer approval.

Final combined compilation for the latest integrated slices passed: 171 Vite modules plus changed native/renderer syntax checks and existing native sandbox C# compilation. The final 171-module build includes the action-finder page-view entries. Latest saved assets are index-BX9VsKCI.js and index-B3Q-gCq1.css. Runtime tests/app launches/network/broker execution stayed deferred. The complete product goal remains active. Next subagent assignments are named organizer workflows, tiled printing and reviewed blank-scan proposals; their unfinished work is tracked separately.

Final forms cancellation/recovery read/500-field limit fixes are included in the saved 171-module build. Current assets: index-BX9VsKCI.js and index-B3Q-gCq1.css. All three agents have the next coding assignments; no runtime testing was performed.


#### 📅 Fast parallel coding — 2026-10-03

Named organizer workflows now save exact arrangements, source fingerprints and split settings. Loading requires fresh native selection of every exact original, validates before replacing the current plan and requires a new output preview. No automatic export. 20 workflows/128 KB each; atomic local storage, duplicate names refused, explicit deletion. Workflows contain unencrypted source descriptors and are managed separately from generic recovery.

Actual-size tiled printing is integrated with chosen paper/margins, 0–25 mm overlap, fixed row/column pitches, partial edge crops and at most 100 output sides. Full-size source images are clipped in both actual previews and print HTML; alignment/trim marks and sheet/row/column labels sit outside artwork. Tiling requests one-sided/100% output and excludes N-up/booklet. Existing per-source and aggregate raster budgets remain; lower DPI changes sharpness, not physical scale. Physical printer, driver scaling and alignment remain unverified.

Possible blank-scan review is integrated with the organizer. An explicit range of at most 50 original pages is sampled; text, all annotations, hidden crops and optional layers are retained/refused. Every proposal starts unchecked and requires an actual full-page review. Returning a selection removes nothing. A separate organizer button removes all matching output occurrences only after source-fingerprint checking; at least one output page remains, Undo/recovery are retained and a new output preview is required. Brightness statistics never prove blankness. Source/sample SHA-256, page labels and geometry accompany the reviewed selection. Shared PDF.js waits and owned render operations are cancellable/bounded; original shared document is retained.

Interface readability controls are saved: standard/125%/150% text and stronger contrast, with wrapping/scrolling controls and persistent local preference. PDF artwork/text layers and document fonts are not CSS-zoomed. Broad keyboard/screen-reader/large-text/contrast verification remains a release gate. Field-builder recovery has a separate counted privacy section and explicitly confirmed native cleanup of only known local recipes/temp files; original/exported documents, workflows, signatures and AI connections remain.

Three subagents are coding the next slices: editable PDF bookmarks; page numbers/headers/footers/watermarks/stamps; radio and choice field creation. These unfinished slices do not count as delivered. Runtime testing, app launches, online requests and broker execution remain deferred. The complete master list and product/release scope remain active.


#### 📅 2026-10-03 — Bluebeam/Revu request saved

Saved R39 and B01–B12 across the requirements, product plan, roadmap and master gap tracker, with detailed BLUEBEAM-COMPATIBILITY-PLAN.md. The user confirmed their dad primarily reviews drawings/comments; that is the first priority. Primary Bluebeam documentation informed the review feature list and flattened/custom-data boundaries. Original supplied master list remains unchanged. No compatibility or runtime testing claimed. A subagent is inspecting existing annotation source coverage to inform later implementation.


#### 📅 Integrated coding checkpoint — 2026-10-03

Reader View options now opens editable document outlines and page numbers/stamps workspaces. Native source-bound inspect/build/cancel/discard/output APIs and exclusive chosen-copy saves are wired through preload; close/render-loss/quit dispose both services. Bookmark editing supports plain labels and physical page targets, branch operations and bounded full original inventory; unsupported destinations/protected sources are refused. Replacement requires inventory consent and native/independent PDF outline verification plus actual output review. Old outline objects may remain; this is not sanitation.

Page decorations support chosen pages, page numbers, headers/footers, text watermarks and DRAFT/APPROVED/REVIEWED stamp artwork, with Western-font/ASCII restrictions, per-page resource cloning, unchanged source-object/geometry verification and every selected page rendered before review/save enables. Artwork can cover original content and needs review. Signed/encrypted/certified/XFA sources are refused.

Radio groups, dropdowns and single-select lists extend v1 field-builder recipes without IPC changes. Separate radio widgets share one field name; at least two unique exported buttons are required, and defaults are unselected. Choice labels/export values are explicit, with an empty-value dropdown placeholder and unselected list. Native and independent PDF.js output checks cover geometry/defaults/flags/options/tooltips. Radio/choice recovery remains local and unencrypted, and separate recipe privacy controls apply.

Compilation: Vite completed with 187 modules (index-D_cSo899.js / index-dkOErLTz.css); targeted integration/privacy/accessibility source syntax checks passed. This includes readability controls and separate form-recovery privacy controls. No app, worker, broker, printer or online runtime test was launched. Preservation/security/real-file/accessibility acceptance remains open. Bluebeam/Revu requirements were saved separately; these additions do not establish Bluebeam interoperability.


#### 📅 Drawing review and markup coding — 2026-10-03

Three subagents completed native review inventory, the comments panel/saved filters and drawing tools. Root connected main/preload/reader/action finder/departure handling and added markup-location and exact embedded sheet-label navigation.

Existing-source comments: a read-only native PDF inventory now reports literal subtype, identity, plain comment, author, subject, dates, reply/group references, state/model, flags/locks, appearance/popup availability and unknown field names. Raw object references determine relationships; NM names never guess parents. Shared annotation instances have distinct keys, and ambiguous/orphan/outside-selection/cyclic parents remain explicit. Popup rows are omitted while owning comments report popup availability. Rich/private values are not decoded; no actions/HTML/resources execute. Signed sources are inventory-only, with certificate validity unable to verify. Encrypted sources need an authorized decrypted copy. Limits: 100 MB, 500 physical pages, 10,000 source annotations including popups, 8 MB review data, 16,384 characters per comment, 4,096 per metadata field, bounded graph/object/stream parsing and two-minute worker deadline. Native workers have resource limits, not an OS sandbox. Cancellation waits for worker termination; renderer loss restarts the service after that termination.

Review comments: a collapsible/resizable bottom panel inspects all/current/explicit-range pages, checks source SHA-256 against the actual opened snapshot, searches/filter/sorts literal fields, paginates 100 rows and displays bounded reply/group branches and source warnings. Selected keys survive filtering/sorting. Ten explicitly saved local named filter sets have bounded storage and explicit deletion; filter text can be sensitive and is retained locally. TXT/CSV export previews the exact filtered source snapshot and requires a review checkbox plus native filename selection. Formula-looking CSV cells are inert. It is a report, not an annotation-exchange file or proof of third-party preservation. Imported comments remain read-only. Saved/current source data excludes unsaved PDFix markup drafts.

Drawing navigation: clicking a comment navigates to its physical page and temporarily outlines its PDF rectangle, with rotation/crop-aware viewport mapping and an optional zoom to bounds. Return to previous view restores page, mode, zoom/fit, view rotation and scroll position. The highlight changes no saved artwork. Exact embedded page-label search supports repeated labels with physical-page disambiguation and at most 50 visible matches; label titles are never inferred from drawing artwork. Source labels are kept separately from shortened display labels, bounded to 4,096 characters each/1 MB overall.

Drawing tools: line, arrow, scalloped revision cloud and text callout are added to existing markup tools, with red review color, editable callout text/size, Undo/recovery and actual PDF output preview. Native/model recovery limits agree on 500 marks and 20,000 generated drawing points. Generated annotation identity, native geometry/appearance ownership and reopened appearance bytes are checked; independent PDF.js checks match annotation IDs and line endpoints/endings. PDF.js does not expose every cloud/callout field, so those fields use native reopen checks plus actual preview. Callout text uses the existing Western font restrictions; foreign comments stay non-editable. Existing flattening and protected-source restrictions remain. These checks are code paths, not runtime results.

Verification performed: 17 changed integration/module files passed syntax checks; Vite built 194 modules successfully (index-F2AfmZe0.js, index--uBMjJ9a.css, pdf-job.worker-Bj1F3Tq7.js). No app, native worker, sandbox broker, runtime test, online request or printer was launched. Real-file/Revu round-trip fidelity, complete foreign annotation preservation, proprietary custom data, editing imported threads/statuses, FDF/BAX/BTX interchange, Studio and broad accessibility/security validation remain open. This advances R39/B01–03/B05–06/B09 and M03.05/M04.07/M07.05 subsets without completing the full master list.


#### 📅 Preserving review copies and workspace access — 2026-10-03

Supported imported plain comments can now be staged for editing, and new replies or explicit standard review-history entries can be added to unique indirect source annotations. Existing author, creation date, subject, IDs, flags, original appearances and unknown/private fields are retained; comment edits change only Contents and modification date. A new reply has its own author/timestamps, exact IRT parent and visible vector note appearance. Current parent workflow state is never inferred or overwritten. Signed/certified/encrypted/XFA sources are refused. Rich-text, grouped, PDFix-owned and FreeText comment edits are refused; additive replies to supported FreeText parents are allowed. Source read-only flags block both operations; locked geometry/contents blocks comment edits without blocking an otherwise supported additive reply.

A native immutable source-bound output service reinspects the exact source receipt, preserves original objects and encoded stream payloads, appends replies to cloned page annotation arrays, and independently reopens the rebuilt copy. Native object, array, geometry, comment, parent, appearance and output-inventory checks must match before output bytes become saveable. Independent PDF.js checks and actual before/after previews of every changed physical page are implemented in the UI. Source files stay unchanged, and the chosen-copy writer saves only the native sealed output. These verification paths have not been executed in this coding pass. This is preserving editing, not hidden-information removal: original metadata/actions/attachments/private data remain. Limits: 100 staged changes, 1 MB combined literal text, 100 MB source/output, 500 pages, bounded graph/stream parsing and two-minute native processing. Replies require UserUnit 1, right-angle page rotation and a crop-contained 16-point note rectangle. Existing visible appearance text may differ from an edited plain comment body.

The comments panel owns the editing workspace and protects staged/unstaged text on close or file departure. Undo/Redo, cancellation, explicit discard/keep, every-changed-page preview and reviewed new-copy save are connected. Drafts currently remain in memory; a separate portable recipe slice is in progress and is not counted as delivered here. Renderer loss waits for native worker termination before replacing the source-bound service. Node worker bounds are not an OS sandbox.

Workspaces now has search and category filters, separate New document/Open a document entries, direct drawing-comment, markup, decoration, outline and form-creation cards, and native PDF/image/document file filters. Read a PDF and Compare drawing revisions use PDF-specific intake; comparison is also in the action finder. Reusable markup styles save up to 20 local named styles and optional default comments, apply only to the next successfully placed mark, and never copy geometry. Explicit delete/clear and bounded corrupt-library export are included. These unencrypted local libraries remain separate from general recovery.

Source saved; combined compilation is pending the current overlay/color/portable-draft slices. Runtime tests, app launches, native worker/broker execution, online requests and printer checks remain deferred. Full Bluebeam/Revu fixture and round-trip acceptance, proprietary formats/data, sheet sets/takeoffs, broad editing and the complete product/release goals remain open.


#### 📅 Integrated overlay, color and portable review drafts — 2026-10-03

Drawing comparison now includes transparent and cyan/magenta overlays, reused from the actual rendered page canvases. Manual translation ±2,000 physical points, scale 25–400%, clockwise rotation ±180°, opacity 10–90% and reset apply only to the current physical page pair. Expanded union bounds retain transformed artwork; original/compared names, physical numbers and bounded embedded labels remain explicit. Existing linked zoom/scrolling are retained. Overlay and each tint scratch raster are capped at 1,600 pixels on the longest edge / 2,560,000 pixels; display expansion caps at 12,000 CSS pixels. Labels are bounded to 200 characters and a ten-second cancellable wait. Changing physical pairs resets alignment. Text/difference/whole-document checks retain their existing physical/page-plan pairs and ignore overlay adjustments. This read-only visual alignment neither transfers comments nor proves design changes.

Review metadata now includes literal standard /C and /IC colors: transparent/DeviceGray/DeviceRGB/DeviceCMYK, raw finite 0–1 component arrays, and absent/malformed/unavailable notices. Selected-comment details and TXT/CSV report exports include this metadata. Screen swatches are explicitly approximate; appearance/private colors are not decoded. Optional descriptors preserve older inventory compatibility, canonical receipts include new native fields, and source color declarations remain checked when building edited copies. CSV uses a named 39-column mapping to keep metadata and scope aligned.

Portable review drafts can be explicitly saved/loaded as UTF-8 JSON. They contain exact source SHA-256, inventory receipt, inspected page sequence, supported staged changes and optional current unstaged composer; no source PDF objects or output/save receipts. Limits: 2 MiB file, 1 MiB canonical recipe, 100 changes, 16,384 characters per comment and 200 per author. Native chosen-file reading is bounded, checks file length/change timestamps and fatal UTF-8, keeps the active source untouched and rechecks source identity. Renderer validation checks known schema fields, exact source/inventory/pages/references/eligibility and shows the normalized recipe before explicit confirmed replacement. Undo restores both staged and unstaged text. Loading never automatically builds/saves a PDF. Recipe saving does not mark the PDF copy saved, and departure protection remains. Comment/author text in exported recipes is unencrypted; no automatic review-draft crash recovery is claimed. Standard review-history entries can have empty comment text when a required author and nonempty supported state are supplied; parent state remains unchanged.

Workspaces has a direct Compare drawing revisions entry and comparison action-finder command. PDF, image, document, XLSX workbook and PPTX presentation workspaces have purpose-specific native file filters. Settings discloses exported review recipe storage separately from local recovery and named libraries. All source slices from the three agents are integrated; prior in-progress/read-only statements are historical and superseded for these supported operations.

Compilation completed successfully with 202 Vite modules: index-BHehx5iH.js, index-DZyzn4is.css and pdf-job.worker-Bj1F3Tq7.js. Targeted source syntax checks passed. The restricted first build attempt encountered child-process EPERM; the authorized compile-only retry succeeded. No app, native worker, sandbox broker, runtime test, online request or printer was launched. Verification code paths are implemented, not runtime/Revu acceptance results. B02/B03/B04/B06/B07/B10 subsets advanced; all full compatibility, preservation, release and master-list acceptance targets remain open.


#### 📅 Sheet-set and takeoff integration in progress — 2026-10-03

Reviewed comment export now supports a bounded JSON metadata snapshot alongside TXT/CSV. JSON includes exact source and inventory hashes, inspected physical pages, current matching annotation rows, standard colors, structural parent references, scope and warnings. This is displayed metadata only: no appearance resources/private dictionaries or import/third-party annotation interchange is promised. Filtered parents can be absent. The existing 8 MiB export bound, exact preview, review checkbox and exclusive native chosen-file save apply.

The native sheet-set library is saved in desktop/sheet-sets.cjs: 20 named sets, 500 ordered sheet references, 10 original snapshots / 100 MB aggregate, 128 KB per item and bounded local library. Stored records contain original path/name/size/fingerprint descriptors, declared page counts, user sheet titles/revisions and order, without source bytes or active IDs. Declared counts are metadata; the UI must verify actual PDF counts/references before adoption. Local persistence is atomic, duplicate names are refused, corrupt/external-changed storage fails closed without replacement, and load requires a fresh native picker for every exact original. Source SHA/size and unchanged session/saved-item identities are verified before adding handles. Remembered paths are never auto-read. This groups references only and neither merges PDF bytes nor transfers comments between revisions.

Root saved sheet-set APIs, purpose-specific source selection, direct Workspaces/action-finder/reader access and named-library privacy disclosure. Takeoff JSON intake is bounded to 2 MiB, checks same-handle file length/time and fatal UTF-8, and preserves the active source. Source-changing routes protect sheet sets and takeoff entries before opening a new file. Reader disposal/application close also await takeoff departure. The two UI slices are still coding; source integration alone is not a delivered runnable UI claim. Runtime tests remain deferred.


#### 📅 Integrated sheet sets, revision references and takeoff ledger — 2026-10-03

Sheet-set UI and the native library are now integrated. Start from an opened PDF, explicitly add related source PDFs, arrange up to 500 sheet references, change user-entered titles/revision labels, move/remove/add pages and navigate Previous/Next sheet. Lists paginate 100 rows. The selected source has one owned drawing reader with original comments; same-source navigation reuses it, while source changes protect unfinished comment/takeoff drafts before disposal. Title/revision typing commits immediately without replacing the focused input; Undo captures each focused edit. Actual source SHA/page counts and bounded embedded labels are inspected before adoption. Source count remains 10/100 MB aggregate; each PDF supports up to 500 pages. Labels are limited to 200 characters / 100,000 UTF-8 bytes per source. User labels are distinguished from actual embedded labels and physical page references.

Named sets save/restore order and labels. Save keeps a bounded unencrypted original descriptor library, with explicit removal independent of general recovery. Maximum 20 sets / 128 KiB per saved item / about 2.6 MiB library. Native restores select every exact original with fresh chosen-file permission; source size/SHA/session/saved-item fences precede handle commit. UI checks actual declared counts/references and previews the proposed arrangement before explicit confirmed replacement. Revision replacement separately previews both actual original/new drawing pages (2 MP each, sequential owned parsers), requires explicit confirmation and changes only one set reference. Undo retains the old source/reference. Existing comments remain with their original PDFs. No PDF bytes are merged or physically replaced, and no comments are transferred. Physical PDF revision replacement, preservation-aware comment mapping and automatic sheet matching remain future gates.

The new takeoff ledger retains explicitly named/grouped finished distances, perimeters, areas and count points. Length/area entries keep their own confirmed page reference scale; counts do not claim calibration. Canonical PDF coordinates, source SHA, physical page, crop bounds/UserUnit, label and computed mm/mm²/count quantities are source-bound. Group totals never mix dimensions; display/export units convert without changing canonical values. Area boundaries reject repeated/retraced/self-intersecting edges; count points reject duplicates. Saved entries have remove/Undo and jump-to-page with point overlays. Limits: 200 entries, 1,000 measurement points each, 10,000 aggregate including scale references, 10 Undo snapshots / 4 MiB. Floating-point and four-decimal display precision do not establish engineering accuracy; reference placement and a uniform scale need human checking.

Reviewed JSON preserves the complete separate ledger; inert CSV contains entry quantities and grouped totals, without all points/calibration references. JSON loading validates strict schema, exact source SHA/page count, actual source crop/UserUnit, bounded labels and quantities recomputed from points/reference scales before explicit replacement; Undo restores previous entries. JSON files/exports are capped at 2 MiB, per-source steps at 30 seconds and imported geometry checks at two minutes. Labels are truncated at 200 characters or blank when unavailable, with physical-page references retained and disclosed. No automatic local/cloud persistence or PDF measurement-annotation embedding is claimed. Copy-restricted sources disable retention/load/export. File/doc/bytes/ID bindings and SHA are rechecked across source waits/picker/review. CSV does not mark the full ledger saved. Busy or unsaved ledger departure requires keeping the reader open or explicitly discarding quantities; readers/application close and source-changing routes await this guard.

Reviewed source-comment metadata now also exports JSON within the existing 8 MiB bound. It contains source/inventory SHA, inspected pages, matching displayed annotation rows/colors/parent references, warnings and scope. Filtered parents can be absent, and appearances/private data are not embedded. This is a data snapshot, not FDF/XFDF/BAX interchange or an import route.

Native app close now always requests renderer departure when its close handler is registered, because the shared boolean editor-guard can be cleared by another workspace. Finish-close is the sole ordinary close authorization after UI departure, and native file operations still block it. An unavailable/crashed/unregistered renderer can close without waiting for a missing handler. This source fix addresses unfinished in-memory work being skipped; runtime close/cancellation behavior remains unverified.

All three subagent slices and root integration are saved. Eight root integration source syntax checks passed, plus changed main/preload readiness checks and the agents' targeted module checks. Vite compiled 208 modules successfully: index-Bk7KS8cS.js, index-C8IQF8EQ.css, pdf-job.worker-Bj1F3Tq7.js. No app, native worker, sandbox broker, runtime test, online request or printer was launched. This advances B05/B08/B12 and M03.04/M03.10/M03.11 subsets. Revu interoperability, embedded persistent measurement markups, physical revision replacement/annotation mapping, broader formats/editing and all release/master-list acceptance remain open. Prior in-progress checkpoint statements are historical.


#### 📅 Persistent takeoff copies and reusable decoration templates — 2026-10-04

This later checkpoint supersedes earlier statements that takeoffs are separate-ledger-only. The drawing takeoff ledger now opens a frozen PDF-copy workspace. A source-bound native writer adds one Line (distance), PolyLine (open perimeter), Polygon (closed perimeter/area), or Ink (count) annotation per entry. Explicit vector appearances include numeric quantity labels in the chosen display unit. Unicode comments/author and canonical PDFixData retain original points, physical-page identity, source fingerprint, calibration and recomputed quantities. Maximum 200 entries / 10,000 aggregate points, 2 MiB request, 100 MiB PDF and 500 pages. Source crop/media intersection and UserUnit are checked natively. Physical pages are authoritative; sheet labels remain supplied descriptions independently reviewed against the source. Counts carry no length calibration.

The native construction manifest allows only cloned/appended selected page Annots arrays and normalization of raw-stream Length to unchanged encoded payload size. All original objects, existing annotations, unknown/private fields and encoded stream payloads are retained. After serialization, native reopening compares every declared object, geometry/trailer references, exact annotation order, appearance bytes and canonical metadata. The immutable native receipt is fenced to source SHA/token/generation before an exclusive chosen-file Save Copy. Source-bound ledger math is generated from the same pure UI source during compilation. The worker has a two-minute deadline, 256 MiB old-generation heap, 16 MiB single / 64 MiB aggregate compressed-object decoding budgets; this worker is not an OS sandbox. Signed, certified, encrypted, XFA and unsupported sources are refused. No standard Measure dictionary or proprietary Bluebeam measurement editing is promised.

The UI also checks output/ledger/metadata hashes and exact annotation types, coordinates, text/author and appearances with an independent PDF reader. Every changed original/output drawing page must be visibly reviewed before saving (2 MP per preview). Ledger mutation and measurement controls are held while this copy workspace is open. Cancellation/discard retains the source and full separate ledger. Leaving protects unsaved JSON ledger data; saving a PDF does not mark that separate portable recipe as saved. Exported PDF annotations include unencrypted author, names and complete point/calibration metadata. Recovering this embedded metadata into an editable ledger is a remaining feature; existing JSON import remains source-bound.

Decoration templates now save up to 20 named styles / 64 KiB locally: standard font, inset, page numbers, headers, footers, watermarks and Draft/Approved/Reviewed text stamps. Apply requires explicit confirmation and invalidates a previous PDF preview; current physical-page selection and range stay selected. Templates exclude source IDs, page selection, generated PDFs and receipts. Named save, apply, delete/clear and bounded raw-text export are explicit. Corrupt storage fails closed; concurrent library changes are checked before writes. Text/styles are unencrypted local-profile data, separately disclosed in Settings & privacy, with deletion in Page numbers and stamps. Text stamps do not certify approval or create certificate signatures.

Source and build milestone only. Runtime, native-worker, broker, app, print and Revu acceptance tests remain deferred at the user's request. These additions advance B10/B12 drawing workflows without completing the full Bluebeam or master requirements. Earlier subagent source for templates/preview UI was retained; root completed the missing native writer and integration after those agents hit the account limit. Full interoperability, broader editing/format fidelity, release packaging and security/accessibility acceptance remain open.

Final compilation for this checkpoint succeeded: 214 Vite modules, index-tK5KmaBF.js / index-DXArFu-x.css. Targeted source syntax checks passed. No runtime tests or app/native-worker/broker launches were performed.


#### 📅 Recover and revise embedded PDFix takeoffs — 2026-10-04

Saved native read-only recovery, independent-reader comparison and actual drawing-page review for canonical PDFix takeoff metadata. The reader's Takeoff quantities panel now has Recover takeoffs from this PDF and a native-processing cancel control. Recovery is explicit, never automatic. Native inspection requires a unique indirect annotation on its declared physical page; exact canonical metadata/author/NM, recomputed quantity, source geometry/UserUnit, Line/Polygon/PolyLine coordinates or count marker strokes and bounded normal appearance are checked. Unsupported versions/malformed recognized takeoffs fail closed; other/unreadable PDFix metadata is reported as untouched. Maximum 10,000 source annotations, 200 recovered entries, 2 MiB aggregate metadata / 4 MiB complete receipt, two-minute worker deadline and existing bounded worker heap/decode budgets. Protected/signed/XFA and unsupported sources remain refused. This worker is not an OS sandbox.

Each adopted entry receives a new identity bound to the currently opened PDF SHA, retaining original source SHA, annotation structural reference, author and metadata hash as provenance. Optional origin fields are strictly validated and travel with JSON/PDF metadata. Independent PDF-reader checks compare actual source annotation identity/type, bounds, author/text and path/count coordinates; actual crop/UserUnit and shortened labels must match this current source. Every recovered drawing page must be viewed (one reusable 2 MP canvas), then the user explicitly replaces the current in-memory ledger. Source bindings/hash are rechecked after asynchronous steps; cancellation retains the previous ledger. Undo restores it. Recovery is dirty until JSON is saved. Embedded metadata/calibration is untrusted file data and is not authenticated engineering information.

Edit entry now supports reviewed name/group changes and known reference length/unit changes for each calibrated quantity. Saved measurement/reference positions stay fixed. Quantities are recomputed, fully schema-validated and source-fenced before adoption; preview invalidity disables Apply, edits are dirty and Undo is available. Counts carry no length calibration. Editing a ledger alone does not change PDF bytes.

The takeoff PDF-copy dialog now offers an explicit unchecked-by-default option to update supported recovered annotations. Native selection is fenced by source SHA, unique structural reference, original NM/author/metadata hash, unchanged physical-page/path/reference geometry and known annotation fields. Locked/read-only, shared, threaded/replied-to, popup/group/rich/private-extended or independently changed targets are refused. Only declared original page references are removed, replacement appearances/metadata are appended, and all unrelated annotation entries stay in order. Native reopening verifies exact retained objects, arrays, geometry/trailer and new annotation results; the independent reader verifies declared removals and unrelated identity retention before every changed-page actual before/after review. Saving remains an immutable source/token-bound exclusive new copy. Original dictionaries/appearances remain in the retained object graph, including replaced takeoffs; this is neither redaction nor permanent deletion. Leave the update option unchecked to append additional visible annotations.

This supersedes the earlier recovery-pending and always-append-only checkpoint descriptions. Revu/proprietary takeoff interchange, new point/reference placement for an existing recovered entry, deleting embedded annotations and broad compatibility/security/release acceptance remain future work. Full master requirements remain open. No app, native worker, broker or runtime tests were launched; tests remain deferred as requested.

Final compile-only checkpoint: 216 Vite modules; index-BUZLXf5C.js / index-DXf3ZeNo.css. Targeted syntax checks passed. App/native-worker/broker/runtime testing remains deferred, so this is a saved implementation milestone, not runtime/Revu acceptance evidence.


#### 📅 Reviewed XFDF export — 2026-10-04

Saved native reviewed XFDF export for 11 standard annotation types, literal plain comments and supported geometry; source/inventory/selection/output/receipt fingerprints, exact XML preview, paginated omission results, cancellation and exclusive sealed XML/JSON receipt saves are connected. Full Revu/FDF/BAX/BTX/XFDF interoperability and OS containment remain open. See [implementation limits](docs/DRAWING-XFDF-EXPORT.md). Syntax checks and compilation only; runtime tests deferred.


##### XLSX shared-string correction and workspace text — 2026-10-04

Removed a misplaced numeric/boolean validation expression from the sharedStrings loop that referenced undeclared variables and prevented ordinary shared-string workbooks from opening. Cell numeric/boolean validation remains, and decoded shared strings now have an explicit 8 MiB aggregate bound. Source syntax check passed; runtime/corpus verification remains deferred. Home now links to implemented AI connection management without claiming no connection is configured, Settings discloses XFDF/receipt exports, and workspace breadcrumb/close/history symbols use correct Unicode.


#### 📅 Three major-gap agents integrated — 2026-10-04

User requested renewed subagents on the largest gaps. All three new agents completed concrete source slices; root integrated and compiled them. Earlier account-limit failures did not recur for these agents.

- Document fidelity: editable tables with ProseMirror cell selection, bounded rectangular spans, row/column/merge/split/header/fill controls and Undo; supported DOCX import and structured DOCX/PDF export; native recovery validation; TXT/RTF explicit tabular flattening. Original column widths/borders, images/nested tables and page-perfect Word preservation remain open. Details: [DOCUMENT-FIDELITY-PROGRESS.md](docs/DOCUMENT-FIDELITY-PROGRESS.md).
- Original PDF editing: bounded embedded Type1/TrueType one-byte and horizontal Type0 Identity-H two-byte ToUnicode maps, per-string multipart TJ edits retaining numeric spacing, reuse of observed source glyphs, preserved stream dictionaries and reopened source-font graph/encoded-program hash proof. Multicharacter/ligature entries omit affected runs while retaining other usable map entries. New glyph embedding, shaping/reflow, Type3/custom/vertical/nested/marked-content editing and complete unrelated-object preservation acceptance remain open. Details: [PDF-EDITING-FIDELITY-PROGRESS.md](docs/PDF-EDITING-FIDELITY-PROGRESS.md).
- Security Sandbox: fixed document-engine AppContainer/Job Object source with exact token/capability checks, one-process/512 MiB/115-second bounds, read-only staged source/request/runtime and three precreated writable output slots. Codec bundle supports nine fixed operations. Root packages the existing standalone Windows x64 Node runtime/license with SHA pins and bundled dependency attribution; XFDF export adopts the contained path exclusively, with no worker fallback. Cancellation observes broker close, source/output validators remain, cleanup failure/unsafe termination permanently closes the service. Broker close observation is subscribed immediately at launch to cover early failures across async boundaries. Other Office/review/takeoff/redaction routes still need adoption. Details: [SECURITY-SANDBOX-PROGRESS.md](docs/SECURITY-SANDBOX-PROGRESS.md).

Root also completed reviewed 11-type XFDF geometry/plain-comment export with exact XML, filtered source identity/fingerprint checks, per-annotation omissions, reviewed exclusive sealed saves and separately saved JSON receipt. Native runtime/security status is shown in Settings. Existing comment TXT/CSV/JSON snapshots remain separate. The XLSX sharedStrings undeclared-variable failure is fixed with an 8 MiB aggregate bound; current format/workspace/AI/privacy text reflects saved capabilities.

Final compilation passed: 224 Vite modules; index-BFhcaNJF.js / index-kVg5VJNm.css; pdf-job.worker-KFHKMFMu.js / document.worker-BXg1i3K9.js. Broker C# and fixed engine bundle compile; targeted JS/CJS syntax checks passed. Build output includes pinned node.exe, engine.cjs, broker manifests and runtime/dependency licenses. No app, broker, document engine, native worker, network/print or runtime tests were launched. Verifier code and compilation are not evidence of executed fidelity/OS isolation/Revu acceptance. User-requested runtime testing remains deferred; full master requirements and S00 remain open. Original master-list source is unchanged.


#### 📅 Integrated images, table grids, nested editing, containment and search — 2026-10-04

Three user-requested agents delivered inline document images, editable/preserved table column proportions, nested original PDF text/image changes with shared Form isolation, and contained-only Office/comment/takeoff/grid processing. Root integrated native source/lifecycle guards, local search across selected files, import cancellation and current capability/status text. The combined build passed: 231 modules, index-CRv3V24I.js / index-Cc33oWd9.css; Windows broker and fixed engine packaging compiled. Exact support, bounds, artifact identities and pending work: [coding checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md).

Source/compile milestone only; no app/native job/runtime tests were launched. Full master, S00, Word/PDF fidelity and Revu/release acceptance remain open. The original master-list file is unchanged. Current 65% coding / 35% remaining estimate is rough engineering judgment (about ±5 points), separate from runtime delivery and beta readiness.


#### 📅 Integrated headers, batch and XFDF import — 2026-10-04

Authored document header/footer exports, reviewed selected-PDF batch compression, supported XFDF import, contained structural security/cleanup and native API/lifecycle/privacy integration are saved. Combined compilation passed with 237 Vite modules and refreshed engine/broker pins. Runtime tests remain deferred; private-beta, full master-list, Security Sandbox and Revu interoperability acceptance remain open. [Exact implementation and compilation evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [batch limits](docs/BATCH-COMPRESSION-PROGRESS.md); [XFDF import limits](docs/PDF-XFDF-IMPORT-PROGRESS.md).


#### 📅 Band import, preserving page order and contained redaction — 2026-10-04

Plain DOCX/RTF header/footer import, exact original-page permutation retaining drawing comments/links/forms/bookmarks, and fixed contained redaction verification are integrated. Combined compilation passed with 240 modules and current engine/broker/source pins. Windows development packaging and per-user install/uninstall sources are saved; no installation or runtime testing occurred. [Current coding evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [Windows package bounds and remaining gates](docs/WINDOWS-PACKAGING-PROGRESS.md). Full master targets and beta/release/security/Revu acceptance remain open.


#### 📅 Table extraction, scoped health report and selection geometry — 2026-10-04

Reviewed PDF-word/local-English-OCR table extraction with corrected-cell CSV save is integrated. A scoped health report adds visible geometry, permitted text, internal-link/URL-syntax, structure-presence and form-label observations with cancellation and JSON export. Rotated/non-unit text selection uses the source viewport's rotation and UserUnit across all three text-layer views. Source/compile evidence only; broader extraction/font/image/accessibility/fidelity/security/Revu and runtime acceptance remain open. [Latest checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md); [table extraction](docs/TABLE-EXTRACTION-PROGRESS.md); [health scope](docs/PDF-HEALTH-REPORT-PROGRESS.md); [selection fix](docs/PDF-SELECTION-GEOMETRY-PROGRESS.md). Original master-list source and full acceptance checkboxes remain unchanged.


#### 📅 Whole-scope status and PDF-only fullscreen request — 2026-10-04

The user reviewed the visible current development preview and requested substantial debugging, PDF artwork-only fullscreen, and a whole-product list of accepted/tested/untested/unfinished features including all future work. R40 records the new fullscreen acceptance criteria; generic F11/focus is narrower. Root audited existing source and saved execution logs, preserving all original master targets and acceptance gates. The [complete inventory](PDFIX-COMPLETE-STATUS-2026-10-04.md) covers R01–R40, 71 master targets, S00, B01–B12, 13 debugging priorities and the [42-entry future list](PDFIX-FUTURE-FEATURES.md). Counts overlap and are not a workload/completion score. No broad target is certified fully accepted on the current build. Older 147-full-run/149-across-recorded-run check counts remain historical. The current app launch was user-requested preview use, not a full feature acceptance pass; no new application/runtime/regression/security/print/provider tests were run for this documentation audit.


#### 📅 Complete future scope adopted — 2026-10-04

At the user's request, all F01–F42 entries in PDFIX-FUTURE-FEATURES.md are incorporated into PRODUCT-PLAN.md and the roadmap with explicit reader/fixes/fidelity/drawing/AI/Windows/later/release placement. The user wants this baseline completed and debugged rather than continually expanded with speculative additions. Existing evaluation prerequisites and first-release exclusions remain recorded. Requirements and the complete status report link the adopted scope; no code, runtime tests or feature acceptance status changed in this planning update.


#### 📅 Banner cleanup — 2026-10-04

Removed the repeated sidebar privacy card, preview labels, topbar local-workspace badge, shell status footer, Home AI promotion and task availability badges, and static PDF-reader reassurance text. Privacy and development details remain in Settings; page status and operation/error messages remain available. Long editor format/import notes now use a closed-by-default native disclosure, hidden when empty. Import failures automatically expand it; recovery-save failure alerts and source-preview controls are outside the disclosure.

Source syntax checks passed for app.js, document-editor.js, pdf-reader.js and source-preview.js. Compilation passed: 244 modules, renderer index-sL_bsGWS.js, stylesheet index-D3kjXCNU.css. Existing large-chunk build warning remains. No application/runtime tests were run. The user's running PDFix window was not interrupted; reopening the app loads the changed build. This is implemented and compiled, with visual/runtime acceptance still pending.


#### 📅 Compact document headers and larger paper area — 2026-10-04

In an open document, the filename, back button, copy save and existing window/sidebar/focus controls share the app bar. The separate file-title row and PDF mode-tab strip are removed; security inspection, PDF content editing, extracted-document editing and OCR remain available from a compact PDF tools disclosure. Ctrl K and its Actions entry navigate through the normal departure guard to Files before focusing file search, since the workspace hides global search. Returning to other views removes the document header and restores their regular app bar.

The PDF row keeps page navigation, zoom, fit width, search and printing. Existing secondary buttons, including comments, measuring, layers, organizing, copying, bookmarking and fit page, move into the existing Tools & view menu without replacing their handlers; the menu scrolls within the screen height. PDF and editor paper gutters are smaller, and the PDF page-status footer is narrower. First-use thumbnails now start closed; explicit stored panel preferences are retained. PDF fit-width behavior already existed and now has more available space. Zoom/pixel bounds and content geometry are unchanged. Adaptive wrapping and existing interface scaling remain available.

Source syntax checks passed for app.js and pdf-reader.js. Compilation passed: 244 modules; renderer index-C-LSTlwd.js; stylesheet index-7JqzSyyR.css. Existing large-chunk warning remains. No application/runtime/visual tests were run; implemented and compiled, with visual acceptance pending. The running app was not restarted or reloaded. Reopening PDFix loads the changed build. PDF-only fullscreen R40 remains separate unfinished scope.


#### 📅 PDF fullscreen, canvas navigation and reading density — 2026-10-07

Three additions are implemented and compiled: PDF artwork fullscreen (R40/F01), hand/pointer navigation (part of F04), and saved Compact/Comfortable document spacing (part of F02). Root integrated a subagent-authored canvas controller. Combined build passed with 250 modules; no runtime tests or app interruption. [Scope and remaining acceptance](docs/PDF-READER-USABILITY-2026-10-07.md). Broad acceptance gates remain open.


#### 📅 Seven major-gap implementations — 2026-10-07

Root and three subagents integrated zoom-region/view history, portable table corrections, bookmark splitting, contained DOCX/RTF import/rich export, reviewed drawing-page matching, cross-document drag staging and single-PDF Bates numbering. Combined compilation passed with 257 modules. [Exact scope, bounds and compilation](docs/MAJOR-GAP-CODING-2026-10-07.md). Runtime/visual/Windows/corpus acceptance remains pending; full scope remains unfinished. No app tests or app interruption.

##### October 7 biggest-gap continuation

[docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md) records literal XLSX table export, reviewed PDF copy/rename/supported TXT queues, and contained bookmark, decoration/Bates, attachment and URI inspection routes. Source/compilation evidence only; current runtime acceptance and remaining full-plan work are not marked complete.

#### 📅 October 7 editing fidelity and feature catalog

The complete adopted planned scope is saved in [PDFIX-ALL-PLANNED-FEATURES.md](PDFIX-ALL-PLANNED-FEATURES.md), including every original requirement, master/Bluebeam row and F01–F42 future item. It is a plan, not a completion claim.

The latest source changes and compilation evidence are recorded in [Editing fidelity coding checkpoint](docs/EDITING-FIDELITY-CODING-2026-10-07.md): supported formatted document bands and DOCX import, original mapped-glyph proofs, manual table merge/split correction, contained form creation and initial-inspection cancellation. [Document PDF output containment](docs/DOCUMENT-OUTPUT-CONTAINMENT-PROGRESS.md) records the new generated-output check route. Runtime, corpus, effective security and release acceptance remain deferred/open. No broad master row is newly marked fully accepted.

#### 📅 October 7 large PDF reading

[Large PDF opening](docs/LARGE-PDF-OPENING-PROGRESS.md) records the newly coded file-backed range route, memory/disk admission, visible slow-file/progress notices, source/cleanup guards and separate reading/whole-file tool capabilities. It supersedes the blanket 100 MiB opening limit for eligible PDFs. The current viewer budget is 1 GiB and 500 pages; per-operation editing/export limits remain. No actual-file performance, runtime or security acceptance is claimed.

#### 📅 October 7 source queue and computer capacity follow-up

[Source range queue repair](docs/PDF-RANGE-QUEUE-PROGRESS.md) replaces the failing 64-request metadata cap with a source-derived queue budget and nearby-read coalescing. [Reading capacity](docs/READING-CAPACITY-PROGRESS.md) adds local memory/processor/graphics estimates in Settings, shared memory admission and smaller preview/read workloads for lower-resource computers. Ten source syntax checks and compilation (266 modules) passed. Current app restart, the actual large drawing, runtime behavior and performance acceptance remain pending. Reading still has 1 GiB/500-page limits, 64 MiB individual range assembly and 100 MiB whole-file tool limits; no lag-free guarantee or broad feature completion is claimed.

#### 📅 Acrobat replacement scope intake — October 7, 2026

R41 adopts the entire supplied comparison: [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) defines all ten categories and A01–A25 work packages, overlaps, priorities, dependencies and acceptance boundaries. The original comparison is preserved in [the intake record](docs/ACROBAT-COMPARISON-USER-INPUT-2026-10-07.txt). The product plan, roadmap, complete planned catalog, future list and status inventory include the new scope. Existing related implementations keep their narrower recorded status; no code, test, acceptance, benchmark or release claim is added. Older completion percentages have not been recalculated for this expanded plan. Covered specialist features become later adopted targets; current containment, consent and no-DRM-bypass rules remain.



---


---

<a id="product-plan-md"></a>
## 📄 `PRODUCT-PLAN.md`

---

### PDFix product plan


PDFix is a Windows-first, local document workspace for people who need to read a manual, fix a scan, organize paperwork, or understand a file without learning a professional publishing suite.

#### Users and problems

- Individuals: readable documents, searchable scans, simple edits, private copies.
- Office staff: dependable page organization, form filling, conversion previews, clear output names.
- Researchers: selectable text, source references, search across deliberately selected files.
- People using assistive technology: keyboard access, scalable controls, readable layouts and progress announcements.

#### Product principles

1. Preserve originals. Every output is a new copy; never silently overwrite.
2. Explain capabilities per format: Open, Preview, Edit, Convert. Opening a file is not proof of editability.
3. Make processing local by default. File content must not cause network requests.
4. Explain risks before lossy conversion, rasterization, redaction, remote sharing or agent access.
5. Show actual progress and failures. No fabricated recent files, connections, OCR or AI answers.
6. Offer plain actions, using the supplied HTML's mint palette, restrained sidebar and familiar document controls.

#### Scope and acceptance criteria

##### Acrobat replacement scope — user decision, October 7, 2026

The entire supplied Acrobat gap comparison is adopted in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md), with 25 traceable work packages, A01–A25, covering all ten categories. R41 records this addition. These packages expand or clarify existing work; overlapping R/M/B/F/A counts must not be added as separate features. The original comparison is preserved as planning input, with its product/legal claims unverified.

| Adopted category | Targets and placement |
| --- | --- |
| Certificate signatures and services | A01–A04: integrity/identity/trust, trust sources, token/SmartCard signing, durable evidence and routed requests/audits; expands F19/F39. |
| Commercial prepress and color | A05–A08: preflight, profile conversion, plate/overprint/trapping tools and evaluated PDF/X editions; expands F29/F40. |
| Archival and engineering standards | A09–A10: evaluated PDF/A conversion/validation and PDF/E support; expands F40. |
| Full accessibility remediation | A11–A12: tag-tree/reading-order workspace, semantics, audits and requirement evidence; expands F29/F30. |
| Advanced forms | A13–A16: XFA, isolated form logic, 2D barcode fields and reviewed endpoint/database submissions; expands F18/F38. |
| Portfolios | A17: inert navigation, supported previews, creation/extraction and reviewed layout support. |
| 3D, GIS and multimedia | A18–A20: evaluated U3D/PRC, geospatial coordinates/measurements and contained user-initiated media. |
| Managed enterprise rights | A21: supported service policies, expiry/revocation and offline rules; no DRM bypass. |
| Browser and mobile reach | A22–A24: permissioned browser reviews, additional clients and phone-friendly reflow; expands F36. |
| Difficult real-world PDFs | A25: legacy/malformed/adversarial/large-file corpus, bounded diagnostics and verified repair copies; expands F42. |

Core reliability, selection/editing, drawing comments, recovery, output and containment retain priority. Previously excluded specialist capabilities represented in A01–A25 are now adopted later targets subject to their engine/service/security dependencies. Initial-release exclusions explain staging and do not remove these new targets from the full plan. Arbitrary uncontained scripts, unrestricted agents, DRM bypass and payment pipelines remain excluded. No new implementation or acceptance is claimed, and this scope addition does not set a first-beta deadline for specialist services.

##### Two-way conversions and Apple photo support — user decision, October 8, 2026

Adopted at the user's explicit request: ensure every core supported format operates reliably in **both directions** (Format ↔ PDF), and add native support for Apple iPhone/iPad photo formats:

1. **Two-way conversion requirements:**
   - **Documents:** `.docx` ↔ PDF, `.rtf` ↔ PDF, and `.txt` ↔ PDF must both import into editable formats and export to verified PDF copies.
   - **Markdown (`.md`):** Two-way support must include (a) **Styled Markdown → PDF** (rendering `#` headings, `**bold**`, bullet lists, and tables as formatted document pages, not only raw monospace code blocks) and (b) **PDF → Clean Markdown** (1-click export of structured text, headings, and tables for use with LLMs, Obsidian, and Notion).
   - **Spreadsheets (`.csv`, `.xlsx`):** In addition to PDF table extraction → CSV/XLSX, add direct **Sheet/Workbook → PDF** export from the workbook workspace with formatted grid lines and page bounds.
   - **Standard Images:** `.png` ↔ PDF, `.jpg`/`.jpeg` ↔ PDF, `.webp` ↔ PDF, and `.bmp` ↔ PDF with two-way conversion (adding WebP and BMP to the image export dropdown).

2. **Apple photo formats (HEIC / HEIF):**
   - Provide intake for Apple iOS photos (`.heic` / `.heif`) to convert directly into PDF pages alongside standard JPEG/PNG scans.
   - Support Live Photo component extraction (still photo frame) and export.
   - Evaluate a licensed, contained local decoder (such as Windows Imaging Component WIC integration or bundled WebAssembly libheif) so users can drop iPhone photos directly into PDFix without conversion warnings.

##### Adopted future scope — user decision, October 4, 2026

The full [future feature list](PDFIX-FUTURE-FEATURES.md), **F01–F42**, is incorporated into this product plan. It is the saved backlog to finish alongside the original requirements, master list, Security Sandbox and Bluebeam targets. Overlapping entries describe expansions of existing features rather than additional independent features. The [complete status report](PDFIX-COMPLETE-STATUS-2026-10-04.md) distinguishes tested subsets, untested code, unfinished implementation and later evaluation.

The user wants this to establish the scope so work can concentrate on completing, debugging and validating the planned app. Do not continually add speculative features. Add further product scope when the user requests it; necessary fixes and dependencies remain part of finishing existing requirements. Keep later evaluation items and initial-release exclusions explicitly staged.

| Future scope | Plan placement |
| --- | --- |
| F01–F08: PDF-only fullscreen, appearance, selection, drawing navigation, page recipes/preservation/dragging/comparison | Reader and PDF fixes; PDF-only fullscreen is the immediate usability priority. |
| F09–F13: conversion comparison, editing fidelity, conversions/decoders and Live Photo components | Documents/images and compatibility, with engine and real-file gates. |
| F14–F19: capture, OCR, cleanup, tables, forms and certificate validation | Scanning and guided PDF fixes, with device/engine/validation dependencies. |
| F20–F23: markup preservation/exchange, sheet revisions and Bluebeam custom data/takeoffs | Drawing/comment review; retain the dad's-workflow priority. |
| F24–F28: compression, vector redaction, sanitation/containment, batches and multi-step workflows | PDF fixes and recoverable jobs. |
| F29–F33: health/accessibility, repair, sharing, Windows lifecycle and brand derivatives | Accessibility, Windows polish and release; repairs require validated results. |
| F34–F35: selected-file AI and evaluated agent integrations | AI connections, including the existing scope/consent/read-only requirements. |
| F36–F41: cloud/Studio/forms/signature services, standards and Bates workflows | Later evaluated integrations and standards work; not implied current capabilities. |
| F42: full release acceptance | Security, corpus, performance, accessibility, printing, licensing/SBOM and clean-machine release gates. |

All feature details and initial-release exclusions in the future list are retained. Incorporation into the plan does not mark their implementation or acceptance complete.

##### Workspace

Native picker and drag/drop open real files. Recent files and favorites persist locally, can be filtered and forgotten, and stale paths yield an actionable error. Unsupported, corrupt, empty and excessive files are handled without crashing. Whole-file operations retain a 100 MiB budget. The October 7 large-PDF reading route allows file-backed, on-demand opening up to the current 1 GiB viewer budget, subject to RAM/disk admission and explicit per-operation capabilities; larger or resource-heavy files receive a specific reason. Actual large-file performance acceptance remains pending. No recursive directory indexing. Support matrix is visible from Home.

##### PDF reading

Local PDF.js renders actual pages, thumbnails and selectable text. Users navigate, zoom, fit width, search with page references, copy page text and print all pages. Password prompts permit reading only with a supplied password and respect document permissions. Encrypted originals are never rewritten through an ignore-encryption option. Scan detection is a heuristic per page, not an OCR success claim.

##### PDF fixes

Ordered page list supports rotation, removal, duplication, extraction, combining and splitting; output is reopened and verified. Annotations include highlight, underline, drawing, text, notes/comments; output retains them. Supported AcroForms and saved signatures are separately tested; XFA/digital signature certification is out of scope initially. OCR runs offline with bundled engine/language data, offers editable recognized text, preserves page coordinates and produces a searchable copy. Compression explicitly previews actual size and quality. The initial lossless/optional JPEG workflow preserves supported reachable structures and non-image content, verifies real output and discloses larger results; broader corpus and resource hardening remain gates. Any future raster mode must disclose lost text/forms. Redaction reconstructs sanitized output, excludes original streams/metadata/attachments, and passes extraction, object inspection and visual tests. Password protection uses a reviewed engine; no DRM bypass.

##### Documents and images

Plain UTF-8 text, Markdown and data formats first. Familiar page editor offers headings, lists, bold/italic, undo/redo where the source representation supports them. Plain text must not be marketed as preserving rich formatting. Image preview and conversion operate locally. DOCX import warns about fidelity; RTF and office conversions require corpus tests. XLSX/PPTX initially preview/convert only. HEIC/TIFF require reviewed decoders. Legacy and Apple formats stay unavailable until verified.

##### AI and agents

Models and agents are separate connection kinds. Local and custom OpenAI-compatible models can be tested and removed, with selected model displayed. Hermes uses its documented HTTP API; a loopback agent can still send context to its upstream provider and must never be labeled local-only on address alone. Harness is ambiguous: defer a named integration until its product/interface is identified. Each request selects files and shows endpoint and data destination; explicit consent precedes remote transfer. Context is text with page/line references, never broad filesystem access. Secrets use Windows-backed Electron safeStorage; fail closed if unavailable. AI results cannot invoke save/export/edit commands.

##### Reliability and release

Job cancellation and memory/page limits, recovery for edits, keyboard workflows, accessible names/focus, clear errors. Windows installer and portable build, clean-machine smoke tests, notices/SBOM, dependency/security review and verified format corpus are release gates. Signing/distribution require owner credentials and a later explicit publishing decision.

#### 📅 Expanded requirements added 2026-09-30

The user's gap checklist is incorporated in [REQUIREMENTS.md](REQUIREMENTS.md), with 36 detailed requirements (30 checklist requirements plus window/layout, polish and the later core inventory) and traceability for all 38 checklist entries. Its targets include bounded version history/crash recovery, failed-autosave departure protection, privacy cleanup, PDF outline/page views, text and visual comparison, safe link/attachment handling, batch queues, dependable print previews, language/uncertainty/cleanup for OCR, forms/signature distinctions, annotation preservation, conversion choices, BMP/Apple photos, standards evaluation, sharing, accessibility and opt-in Windows integration. AI requirements explicitly include read-only proposals, document-injection boundaries, image capability, per-request consent, billing/account disclosure and transfer records.

Each new operation needs a tested corpus, an explicit capability label and original-preservation/output checks. Recoverable local editor versions, privacy controls and fullscreen/collapsible workspace controls are the first additions to the existing editor slice. Comparison and remaining PDF fixes follow; format/batch/Windows/AI features retain their dependencies. Planned requirements are not verified features.

Current comparison slice: two chosen PDFs can be reviewed locally with linked/independent pages and scrolling, literal text changes and a bounded artwork-change map. Page-organizer and OCR outputs offer source/output comparison before saving. Organizer page plans supply exact source alignment; arbitrary reordered versions use explicit manual alignment until a broader matcher passes its corpus. Scan/OCR uncertainty, resolution limits and excluded metadata/form checks remain visible. See PHASE-LOG.md for native verification; this advances R09 without completing the full PDF-fix or format-fidelity phase.

#### Non-goals for first release

A complete office suite, unrestricted agent tools, running document macros/scripts, certified digital signatures, DRM bypass, fidelity guarantees for arbitrary proprietary files, remote processing without consent.

#### Verification policy

Complete and verify one roadmap phase before entering the next. Log exact commands, tested fixtures and known limits in PHASE-LOG.md. Infrastructure tests do not imply release readiness. Experimental operations remain labeled accordingly. A runnable checkpoint is acceptable at a session limit; incomplete phases must remain incomplete.

#### Scope reconciliation and progress

[FEATURE-TRACKER.md](FEATURE-TRACKER.md) reconciles the original request, gap checklist and later core feature inventory against actual implemented adapters. It records the roughly 54% weighted product estimate, every remaining gate, useful lower-complexity additions and larger workflows. Planning coverage is complete; implementation and release verification are not. Fullscreen/compact layout, outline/page labels/saved reading state and temporary rotation are user-prioritized usability work. Cloud reviews/signature requests/standards repair remain later candidates; enterprise specialist tools remain outside the first release.

Current markup slice: PDFix highlights, underlines, notes, text boxes and drawings persist as editable PDF annotations, with independent preview/reopen checking, undo/redo, separate recovery and exclusive-copy output. Users can remove owned marks, flatten visuals while retaining notes, and choose reader/print annotation visibility. Existing foreign annotations and ordinary unsigned form values are retained; their editing and broader threaded-review support remain gates. This advances R15 without completing phase 3.

Current fill-and-sign slice: supported ordinary AcroForms retain editable values and native appearances, with blank/required guidance and independently reopened output. Typed/drawn/imported visual signatures, initials, date and text require confirmed placement; reuse is saved only by an explicit choice. Selectable label suggestions remain uncertain, and unplaced composer recovery never inserts content. Custom PDF tab order, broader fonts, calculations, OCR-based candidates and a real-form corpus remain gates. Signed/certified, encrypted and XFA writing is refused; visual signatures do not claim certificate validity. This advances R13/R14/R34 without completing phase 3.

Current image slice: PNG/JPEG/static WebP/supported BMP show actual bounded artwork and create one real PDF page with rotation, paper/orientation/margins, retained decoded resolution/transparency, source/output review and exclusive-copy saving. Camera orientation is normalized, while original photo metadata/color profiles are omitted. Source-bound page-settings recovery and failed-save departure protection extend to image workspaces. Multi-image output, pixel edits/crop, reverse export, broader color/codec corpus and text/Office PDF creation retain their gates; this advances R16–R18/R35 without completing phase 4.

Current page-geometry slice: actual-page crop boundaries support dragging or precise visual-edge margins; all-page application validates atomically. A4/Letter/custom paper fitting preserves proportions and centers vector/selectable artwork. Rotation preserves the selected crop, and bounded organizer undo/redo/reset cover the full page plan. Both worker and independent reader verify output dimensions before copy saving. Nonstandard user units, forms/signatures and encrypted writing remain refused. Hidden cropped content is retained; this is not redaction. Operation recovery, further split rules and broader preservation/fidelity corpus remain gates.

Current split slice: ordered page ranges/odd/even presets and every-N/custom-group splitting are implemented on the current page plan. Explicit omissions are disclosed, each output is independently reopened before review, and native exclusive-folder saving verifies disk bytes and handles failures without overwriting originals. Native close is guarded during export. Size/bookmark rules, operation crash recovery and broad real-file/large-split performance remain incomplete.

Current compression slice: measured lossless stream/object compression and optional supported non-JPEG image optimization use a pinned local Windows x64 engine. A reachable-structure/content check and independent all-page reopening precede actual size/quality review and protected new-copy saving. Larger outputs are disclosed. Source files, ordinary reachable forms/links/outlines/metadata/attachments are retained within verified fixture limits; image-quality loss is explicit in JPEG mode. No raster-only conversion, image downsampling, existing-JPEG recompression, sanitization or standards validation is claimed. Signed/certified/encrypted/XFA inputs are refused. Cancellation, interrupted temporary-job cleanup and native close guards are implemented; broader file/filter/color corpus, hard native memory containment, binary notices and clean-machine distribution remain gates.

Current redaction slice: explicit clean-image mode renders all visible pages and replaces marked pixels before encoding. A fresh image-only PDF excludes original text, fields, links, metadata, attachments and annotation objects. Whole-text-run matching proposes reviewable regions; manual dragging/precise positions and source-bound region-only recovery are available. Native canonical object/stream checks, independent all-page pixel/text/geometry checks and exact saved-byte verification precede success. The source remains private and unchanged. This mode flattens all text/forms; vector-preserving redaction, a broader realistic/forensic corpus and hard resource containment remain gates.

Current password slice: local AES-256 revision-6 protection uses distinct opening and owner passwords and chosen print/copy/edit permissions. Changing an encrypted source requires qpdf-confirmed owner authorization; an opening password alone is refused. Output roles/algorithm/permissions and preservation of supported reachable structures are checked natively, then all pages independently match text/geometry/pixels. Native immutable token-bound bytes are saved exclusively with disk hashing. Password fields are cleared on processing/close and are not recovered; temporary jobs can contain unprotected content and known interrupted jobs are cleaned on startup. Compatibility/real-file/normalization/native containment and distribution review remain gates. Permission flags depend on the receiving viewer.

#### October scope addition

The user's complete October master list is saved verbatim as PDFix-Missing-Features-Master-List.md; MASTER-GAP-TRACKER.md records all ten sections. The user separately prioritizes **Security Sandbox**: native-engine OS containment must precede treating worker resource limits as security isolation. Continue fast coding increments; defer broad runtime testing as requested, with security/release verification still required before shipping. Engineering drawing tools, sanitation, forms, scan import, format adapters, multifile workflows, accessibility and Windows/AI additions are retained with their stated fidelity and release boundaries.


2026-10-02 parallel coding checkpoint: the saved implementation now includes selective structural PDF cleanup, attachment copies, scan deskew/OCR review exports, simple new form fields, continuous/facing-page views, range/paper/scaling/N-up/booklet printing and AI/Windows connection intake. Exact limits and next agent assignments are in PARALLEL-WORKSTREAMS.md; full feature and release gates stay open. Runtime verification remains deferred.


#### 📅 Bluebeam/Revu drawing review — 2026-10-03

R39 is added for the user's dad's workflow: **review drawings and comments first**. Prioritize existing markup visibility, a searchable sheet-linked comments panel, supported threads/states/locks and preservation of other people's annotations. Revision clouds/callouts, aligned revision comparison, sheet sets, reusable tools, custom columns and takeoffs follow. [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md) saves B01–B12 and their compatibility boundaries; the original master list stays intact. This is added scope, not a claim of existing Revu interoperability or Studio support.


##### October 7 major-gap coding checkpoint

Seven feature families are now implemented and compiled: zoom-region/view history, portable table corrections, bookmark splitting, contained rich-document processing, reviewed drawing-page matching, cross-source page drag staging and single-PDF Bates numbering. [Exact scope and remaining acceptance](docs/MAJOR-GAP-CODING-2026-10-07.md). Current runtime/corpus/Windows acceptance and broader scope remain open; original acceptance checkboxes are unchanged.

##### October 7 biggest-gap continuation

[docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md) records literal XLSX table export, reviewed PDF copy/rename/supported TXT queues, and contained bookmark, decoration/Bates, attachment and URI inspection routes. Source/compilation evidence only; current runtime acceptance and remaining full-plan work are not marked complete.


#### 📅 October 9 user additions — free printing and reading/writing tools

Adopt F43–F46 / R42–R45: virtual PDF printer, local read aloud, expanded word count and spell-checking. R46 requires PDFix to stay free, with no required paid APIs/subscriptions, feature unlocks or purchase/upgrade links. These features use free local components; Whisper is not a speech-synthesis engine. The existing basic editor word counter is only a starting point. See [detailed scope and dependencies](READING-WRITING-PRINT-PLAN.md). No new code, tests, installs or paid integrations are claimed. Prior adopted scope remains, with provider/engine choices subject to the free-app requirement.

#### 📅 Top release priorities — reliability, scale, and workspace clarity (October 9, 2026)

Adopt the [reliability, performance, and usability gates](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) across the full planned scope. Save, sign, split, redact, and blueprint outputs must fail closed, preserve originals, and be independently reopened and validated. Real 500-page PDFs and 300 MB sets must navigate smoothly on a documented realistic hardware tier through bounded visible-page work; numeric interaction targets will be set from measurements. Drawing, Document, and Pages need separate, task-specific workspaces without banner clutter. “Never corrupt” and “100% bug-free” are goals, not provable guarantees. All acceptance rows remain pending; source compilation is not runtime evidence. The free-app rule and all previously adopted requirements remain in force.

#### 📅 October 11 — core workspaces and 20 free Acrobat additions

The user's current order is **Workspaces → PDF viewing → PDF editing**, keeping Drawing, Document and Pages tools in clear rooms with easy creation/export paths and a large paper area. Continue implementing the broader adopted scope; place new controls contextually.

All 20 additional free features are adopted as F47–F66 / R47, with explicit folder permissions under R48. [Complete list, overlap mapping and work order](FREE-ACROBAT-ADDITIONS-PLAN.md). Retain R46: no required paid providers, unlocks or payment links. Office integration may require the user's existing installed Office; free alternatives remain available. Optional local translation models and native/extension distribution require license/dependency review. No current Acrobat parity or implementation is claimed by this plan update.



#### 📅 October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.



---


---

<a id="reading-writing-print-plan-md"></a>
## 📄 `READING-WRITING-PRINT-PLAN.md`

---

### PDFix reading, writing and virtual printing additions


Adopted 2026-10-09 at the user's request. F43–F46 and R42–R45 extend the full existing scope without renumbering F01–F42 or R01–R41. R46 records the user's free-app constraint. Planned implementation is separate from coded, tested and release-ready status.

#### Free-app requirement (R46)

PDFix is a free app. These additions must work with free, locally available or freely redistributable components, with no paid API, required subscription, purchase/upgrade links or paid feature unlock. Do not route document text/audio/print jobs to a remote provider. Choose compatible licenses and disclose attribution. Optional downloads/installations must be explicit and free. Preserve this rule when evaluating the rest of the adopted plan: pursue free supported integrations and record any target that cannot be delivered under it instead of quietly adding a paid dependency. Historical provider/service suggestions do not authorize paid integrations.

#### F43 / R42 — Virtual PDF printer

Add an optional PDFix Windows print destination so a user can print from another application into a PDF, review it in PDFix and save/import a new copy. Offer supported paper size/orientation/resolution and disclose any rasterization, font or metadata loss. Keep text/vector content where the selected free integration supports it. Print jobs are explicit, bounded, local and cancelable; concurrent jobs need a queue and useful errors. Protect spool/intermediate files and clean them after cancellation; recover incomplete jobs without treating them as completed PDFs. Preserve originals and the originating application's print permissions.

This is a real operating-system printer integration, not merely another export button. Choose a free supported printer/driver/capture design and record signing, administrator consent, installer, upgrade and uninstall prerequisites. Installation is optional, and default-printer changes are never silent. Existing physical-print preview and document PDF export do not satisfy this requirement. The user requested planning; no printer is installed by this addition.

#### F44 / R43 — Read aloud

Use free local text-to-speech voices/engines. Provide play, pause, resume and stop, voice/language/rate controls, and selected text/current page/whole supported document scopes. Follow spoken content with highlighting and page navigation where word boundaries are available; otherwise disclose the coarser highlighting. Preserve the document and respect extraction/copy permissions. Never start playback automatically. Stop and release speech when switching files or closing the app.

Prefer the reviewed logical/tagged reading order; expose the existing text-order controls for ambiguous columns. Scanned pages require local OCR first and must disclose uncertainty. Avoid loading or synthesizing an entire giant PDF at once: extract and speak bounded chunks, with responsive cancellation and hardware-friendly resource limits. Missing local voices or unsupported languages need useful explanations and free options.

Whisper is speech recognition (audio to text), so it cannot synthesize read-aloud audio. Its name is recorded as the user's suggestion, with the correct engine role. No Whisper/API provider, cloud TTS or paid service is adopted for read aloud. Local Whisper would only be relevant to a separately requested future dictation/transcription feature.

#### F45 / R44 — Word count

Expand the existing basic editor counter into explicit selection/page/document statistics for supported editor content and PDF extracted text. Show words, characters including/excluding spaces, paragraphs and page count where meaningful. Declare the chosen scope, language/counting rules and whether headers, footers, tables, annotations or hidden text are included. Do not count raw JSON/XML/code syntax or omitted import content as visible prose without an explicit mode. OCR counts are estimates of recognized text and should expose omissions/uncertainty. Use cancellable incremental PDF extraction and preserve extraction permissions; report unavailable content rather than a false complete count. The current whitespace counter is a coded starting point, not completion evidence.

#### F46 / R45 — Spell-checking

Use a free local spelling engine/dictionary with language selection, misspelling underlines, suggestions, Replace, Ignore, Ignore all and a user-managed personal dictionary. User-approved replacements participate in Undo and recovery. Never silently change document text or send it to a server. Personal dictionaries stay local and can be edited/cleared. Technical drawing identifiers, names and mixed languages should be easy to ignore.

Enable review in editable document text, form/comment text and supported PDF text editing. Read-only PDFs may report findings linked to their page/text location; replacing original PDF text still requires the existing permission/font/geometry capabilities and explicit output review. Source/code editors and exact XML/JSON/receipt fields remain opt-in or excluded. Dictionary/licensing integration, resource limits and offline behavior remain to implement; toggling a browser flag alone does not complete this feature.

#### Status

All four now have integrated coded subsets. See [October 9 compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for exact implementation and remaining gaps. Runtime tests, printer installation/inspection, audio playback and dictionary enumeration remain deferred. No paid integration or payment link is adopted. Compilation is not full acceptance.



---


---

<a id="readme-md"></a>
## 📄 `README.md`

---

### PDFix


**New here (person or AI)? Read [docs/START-HERE.md](docs/START-HERE.md) first.** It explains how the project is run, where every document is, how it is tested and what is decided. The notes below are older history.

**Current whole-scope status (October 4):** [complete feature/debug/testing inventory](PDFIX-COMPLETE-STATUS-2026-10-04.md) and [full future list](PDFIX-FUTURE-FEATURES.md). These distinguish older executed tests from newer untested code and unfinished acceptance; older entries below are historical checkpoints. New R40 requires PDF-only fullscreen.


A Windows-first local document workspace, using the supplied PDFix mockup as a visual starting point. Development preview; see PHASE-LOG.md for tested capabilities and the exact checkpoint.

#### Run

Node 22.13+ and npm are required.

```powershell
npm install
npm start
```

`npm start` builds the renderer and launches the native Electron app. `npm run dev` is a browser design preview only; native operations require Electron. All document assets are bundled; no CDN resources are fetched at runtime.

With dependencies already installed, double-click **Launch PDFix.cmd** to open the existing built app. After source changes, use `npm start` to rebuild first.

```powershell
npm test
npm run test:desktop
```

Tests use generated local fixtures and isolated application data under `.test-data`. Native tests render offscreen by default, without showing or focusing windows. The native fullscreen test is skipped in hidden runs; it needs a separately requested visible Windows check. Source files are never overwritten. Recents live in `%APPDATA%\pdfix-document-workspace\workspace.json` (Electron userData), not in project files.

#### 📅 Parallel coding status

The latest saved bundle includes structural PDF cleanup, attachment-copy review, scan deskew/OCR exports, form-field creation, continuous/facing views, paper/range/N-up/booklet print preparation, AI provider and saved-source context review, and Windows file-request intake. Compilation passed; runtime testing remains deferred. See PARALLEL-WORKSTREAMS.md for current assignments, exact scope and unfinished release gates.

#### Product documents

- PRODUCT-PLAN.md — users, scope and acceptance criteria
- ARCHITECTURE.md — processes, security, licenses and extension points
- FORMAT-SUPPORT.md — verified capabilities
- REQUIREMENTS.md — expanded checklist, acceptance targets and traceability
- FEATURE-TRACKER.md — implementation progress, full scope reconciliation and useful additions
- ROADMAP.md — ordered gates
- DECISIONS.md — assumptions and reasons
- PHASE-LOG.md — evidence, limitations and next steps

The foundation and PDF reading phases are verified. Open `tests/fixtures/reading-sample.pdf` to try the reader. The synthetic password for `password.pdf` is `pdfix-test`; `scan-only.pdf` demonstrates actual local OCR.

Page organization is also implemented: choose **Organize pages** in a PDF, arrange/rotate/remove/duplicate pages, optionally **Add another PDF**, then **Preview new copy** and **Save this copy**. Extraction or a manual split means retaining the desired pages and saving each selection as a separate new file. Existing annotations, links, bookmarks and metadata are dropped with a warning; forms/signatures and protected editing are refused.

**Workspaces → Edit a document**, or **New document** on Home, opens the Word/Docs inspired page editor. Open a DOCX to edit a simplified imported copy; TXT can become a formatted DOCX. Markdown and data formats use an inert UTF-8 source editor. Formatting includes headings, bold/italic/underline, lists and undo/redo. **Export DOCX copy** or **Save text/source copy** writes a new file. Local recovery drafts contain edits in userData and never overwrite originals. DOCX import has explicit fidelity limits and 10 MB compressed/30 MB expanded bounds.

**Version history** in the editor shows saved revisions and a text preview. Save a named version or restore an earlier version; the current state is preserved first. Up to 20 revisions/8 MiB per document history are retained locally, with 2 MiB recovery drafts and 64 MiB limits per managed data category. Drafts and versions contain document text and are not encrypted. Export clears the latest draft but keeps saved versions. **Settings & privacy** clears recents separately from recovery/history. Failed recovery saves keep the editor open and available for retry or export; committed drafts and versions survive a renderer crash.

The top bar has **Collapse sidebar**, **Focus mode** and **Enter fullscreen**. Use **F11** for native fullscreen, **Ctrl Shift B** for the sidebar and **Ctrl Shift F** for focus mode. **Esc** closes a dialog first, then exits fullscreen or focus mode. Sidebar and PDF pane choices are remembered locally. **View options → Pages panel/Search panel** toggles reader panes; search is closed until needed; **Find in PDF** or **Ctrl F** reopens PDF search. **Fit page** shows the whole page; **Rotate view** changes only the displayed orientation. **Pages/Outline/Saved** navigate thumbnails, embedded document bookmarks or personal saved pages. **Save page** (Ctrl D) stores a named page locally; the last-read page is remembered. These positions/bookmarks are bound to the source bytes and are cleared with recent-file metadata. Print and Save a copy preserve the original page orientation. Changing the view preserves editor content.

In PDFs, **Rectangle selection** selects text in a local area, and **Readable text** provides a reflowed view. **Edit a document copy** imports selectable text with source page headings; images/tables/layout are lost, and reading order needs review. Copy-restricted PDFs and scans are not imported through this path. `electron . --editor` opens directly into the editor.

Printing prepares all pages at 108 dpi with a 100-page/80-million-pixel memory limit. Physical printer output is not manually verified. Reading remains limited to 500 pages. PDFs above 100 MiB now have a file-backed on-demand route up to 1 GiB, subject to RAM/disk admission; whole-source editing/export tools retain their 100 MiB limits. Large-file runtime/performance acceptance is pending. See [Large PDF opening](docs/LARGE-PDF-OPENING-PROGRESS.md).

**Make a scan searchable** on Home or in a PDF opens local English OCR. Start recognition, review every scan beside the recognized lines, correct mistakes and check the review box. Then preview/save a verified searchable PDF copy or **Edit reviewed text in a document**. Existing selectable pages and blank pages are retained. Corrections change searchable text, while the scan image stays unchanged. The writer removes annotations, links, bookmarks and metadata; forms/signatures/encrypted editing are refused. OCR is limited to 20 pages, 16 million pixels per page, English upright printed text and two minutes per OCR job/page. Rotate sideways scans first using Organize pages. Recognition errors and complex reading order need review; handwriting, multilingual, skew and low-resolution quality are not verified. Searchable output uses a Western font; unsupported correction characters fail with an actionable message, while the document editor retains Unicode text.

Online AI remains planned. Phase 3 remains incomplete, and this is not a release installer.

**Make a file smaller** on Home, **Workspaces → Compress a PDF**, or **View options → Compress PDF** opens compression. Lossless packs objects/recompresses streams without changing image quality. Optional JPEG quality (40–95) optimizes supported non-JPEG images; it does not downsample or recompress existing JPEG/inline images. Build the actual output, review measured savings (or a larger/no-saving result), compare page quality, check the review box and save a new filename. Supported reachable structures/non-image content are checked and every output page independently reopens. Compression preserves private metadata/attachments; it is not redaction or PDF/A validation. Signed/certified/encrypted/XFA PDFs are refused. Limits: 500 pages, 100 MiB input/output/expanded verification content, 64 MiB individual expanded stream, 16M pixels/8,192 per image side, two minutes per native/verification stage. Interrupted marked temporary jobs are removed on next launch; previews/settings are not recovered. The pinned Windows x64 qpdf 12.4.2 engine is bundled from vendor/qpdf-release, with archive/binary checksums and upstream license texts. Complete binary notices, hard native process memory limits, clean-machine and broader corpus review remain release gates.

The compact layout removes repeated editor headers and unused measurement graphics; source artwork is unchanged. Version history, OCR review and page controls use bounded dialogs at smaller windows. Source/output preview navigation is independent of the original saved reading position. `node scripts/audit-ui.mjs` captures the core screens and measures their viewport bounds at normal and minimum sizes in an isolated test profile.

**Compare PDFs:** open a PDF, then **View options → Compare with another PDF**. Choose the second file. Link pages/scrolling, or unlink pages to align reordered versions manually. Expand **Text changes** to inspect additions/removals and use **Show visual changes** for the pink artwork-change map. **Check all page pairs** reviews up to 100 output pages with cancelable results; larger PDFs can be reviewed page by page. **Compare with originals** is available after page-organizer preview and follows the output page order across sources. **Compare with original** is available after searchable-OCR preview; added searchable text is distinct from a visible scan edit. This is a local, read-only review with a resolution threshold, not verification of metadata, attachments, interactive forms or file equivalence.

**Mark up PDFs:** open a PDF, then **View options → Mark up PDF**. Choose highlight, underline, note, text box or drawing; use the side panel to change text/color/size or remove a PDFix markup. Undo/redo and separate source-bound recovery protect the staged edits. Preview independently reopens the copy and checks annotation type, contents and location before **Save annotated copy** becomes available. **Flatten visual marks** turns supported visuals into page artwork while keeping notes editable. Existing foreign annotations, regular unsigned form values and catalog structures are retained; signed/certified, encrypted and XFA PDFs are refused. Text boxes use a Western font; notes support Unicode. Up to 500 marks/500 pages, 50 selected regions per highlight and 1,000 points per stroke are supported. Foreign annotations and reply threads are not editable here. Recovery is unencrypted and can be cleared in Settings.

**Notes on this page**, **Show annotations** and **Include annotations in print** are in reader View options. These visibility/print choices cover PDF annotations, including form appearances; flattened artwork cannot be hidden this way. Hiding annotations does not remove note contents. Native print preparation is tested; physical printer verification remains pending.

**Fill and sign:** choose **Workspaces → Fill and sign**, or **View options → Fill and sign** in an opened PDF. Fill supported text, checkbox, radio and choice fields; **Next blank field** helps find missing entries. Read-only/calculated/unsupported fields remain unchanged. Type, draw, import a bounded PNG/JPEG/WebP image, or explicitly save/reuse a visual signature. Signature/initial/date/text placement requires **Add at this location**; possible label locations are suggestions only. Preview reopens the actual output and checks changed values; check the review box before saving a new copy. Ordinary fields stay editable. Typed appearances use Western fonts; calculations/scripts are not executed. Signed/certified, encrypted and XFA writing is refused.

Form edits and valid unplaced signature content have separate source-bound recovery, with failed-save departure protection and rescue-copy saving. Only confirmed placements enter the output. **Save signature for reuse** explicitly retains up to 10 signatures locally; delete selected/all signatures in the saved-signature controls. The library is unencrypted and is retained when clearing recents or recovery. Visual signatures are fixed artwork, not cryptographic signatures. General image preview/conversion, custom form tab order and broader form/font/accessibility verification remain unfinished.

**Image to PDF:** open PNG, JPEG, static WebP or a supported uncompressed BMP, or choose **Image to PDF** on Home/Workspaces. Review the actual image; rotate it, choose A4/Letter/image-sized paper, orientation and margins, then **Preview PDF**. The source and independently reopened PDF remain side by side; **Hide source preview** gives the PDF more room. Check the image/page review box before **Save PDF copy**. Full decoded image resolution and transparency are kept without stretching/cropping. Camera orientation is applied; browser color conversion and PNG normalization omit original photo metadata/color profiles. This creates one image-only page, without searchable OCR or tagged-PDF claims. Inputs are limited to 32 MiB, 16M pixels and 8,192 pixels per side; animated PNG/WebP and unsupported BMP variants are refused. Page settings recover locally with failed-save departure protection; originals are unchanged. Multi-image PDFs and further image editing/conversions remain planned.

**Crop and resize PDF pages:** open **Organize pages → Crop / resize** beside an output page. Drag the green boundary on the actual artwork or enter crop margins in millimeters. Choose the cropped size, A4, Letter or custom dimensions and fit margins, then apply to one/all output pages. Invalid bulk settings leave the plan unchanged. Use Undo/Redo/Reset, preview the actual new copy and save under a new filename. Rotating an already cropped page keeps the selected region. Cropping hides edges but leaves their content in the PDF; use a secure redaction tool for private information. The organizer retains its disclosed structure limitations and does not edit protected PDFs, forms/signatures or nonstandard user-unit pages.

**Page ranges and automatic splitting:** in **Organize pages**, expand **Keep a page range** to keep numbers/ranges in the current output order, or choose odd/even pages. Undo restores the full prior list. **Split into files** builds every-N-page files or semicolon-separated groups such as `1–3; 4–6`. Custom groups disclose omitted output positions and reject overlap. Each actual PDF is reopened independently; select a part to preview or compare with its originals. Check the split groups/preview, choose a new folder name, then **Save split PDFs** into a chosen parent folder. Existing folders are refused. Failed writes remove only their own copies and report any incomplete cleanup. Original files stay unchanged; current page-copy structure restrictions still apply. Page plans and split outputs are in memory only until saved; crash recovery and size/bookmark-driven splitting remain future gates.

**Hide private information:** choose the Home task, **Workspaces → Redact a PDF**, or **View options → Redact private information**. Drag areas, add precise regions or propose whole matching text runs, then review the pending marks. Accept the flattening tradeoff and build an actual clean preview. Every page becomes a lossless image: marked pixels are replaced before encoding, and original text, fields, links, annotation objects, metadata and attachments are excluded. Visible unmarked form/comment artwork remains in the image. Compare all pages, check the review box and save a new copy; the original still contains its private information. Optional hidden-information cleanup uses the same all-page flattening without regions. Positions/settings recover locally; search phrases and page pixels are not saved in that draft. Copy verification checks canonical PDF structures/streams, exact independently rendered pixels and saved-file hashes. Limits: 100 pages, 500 regions, 100 MiB input/output, 100M total/16M per-page rendered pixels, 8,192 pixels per side, 144/180/216 dpi. Signed/certified/encrypted/XFA sources are refused. Scans, split text runs and unusual glyphs need manual review. Vector-preserving redaction, broader real-file/color/font/forensic coverage and resource hardening remain unfinished.

**Protect or unlock a PDF:** choose the Home task or **Workspaces → Protect or unlock a PDF**. For a new protected copy, enter different opening and owner passwords and confirmations; choose printing/copying/editing permissions. To change/remove existing protection, supply the owner password; the opening password alone is refused. Build the actual AES-256 preview, review unchanged pages/settings, check the review box and save a new filename. Removal saves an unprotected copy that other supported PDF tools can open. **Open saved unprotected copy** immediately opens that exact verified file; an externally changed copy is refused without replacing the current session. Originals, ordinary form values, metadata and attachments remain unchanged within verified fixture limits. Passwords use a private stdin argument channel to the local engine, are cleared from visible fields after processing/close, and are not written to history/recovery or process command lines. Keep both passwords; forgotten passwords are not recovered. Permissions are enforced by cooperating viewers. Signed/certified/XFA inputs are refused. Existing protection with supported standard owner-password authentication can be removed; alternative/public-key and broader legacy encryption are not promised. New passwords require 8+ characters, distinct roles and at most 127 UTF-8 bytes without control/compatibility variants. Native file/content limits match compression; independent artwork verification additionally caps 100M total rendered pixels, 16M/page/8,192 per side and page text at 50k runs/2 MiB characters. Temporary jobs can contain unprotected content; known marked jobs are cleaned after processing and on restart. Broad compatibility/normalization/resource containment/installer review remains incomplete.

##### October additions saved in this build

The complete requested feature list is preserved in [PDFix-Missing-Features-Master-List.md](PDFix-Missing-Features-Master-List.md); [MASTER-GAP-TRACKER.md](MASTER-GAP-TRACKER.md) keeps every acceptance target. The Windows native sandbox implementation and boundaries are in [docs/SECURITY-SANDBOX.md](docs/SECURITY-SANDBOX.md). Compression/password jobs require its compiled broker and do not fall back to unrestricted native processing. The build compiles it with the Windows x64 Framework C# compiler. OS containment/release verification remains pending.

New coding includes PDF security reports and destination review, engineering paper sizes, temporary calibrated measurements and layers, annotation summaries, supported form-data JSON/CSV, Markdown preview and CSV table/source/split views. These additions have not completed runtime/corpus verification; use the feature tracker and phase log for precise status.


**Bluebeam/Revu support is on the saved roadmap:** [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md) prioritizes reviewing drawings and existing comments, followed by revision tools, sheet sets and takeoffs. This is planned compatibility; basic PDF annotation support does not establish full Revu interoperability.


**Drawing comments:** open a PDF, then **Review comments** or **View options → Review drawing comments**. Inspect all/current/range source pages, search/filter and click a markup to locate it. The panel shows available replies, literal states, authors/dates and limitations; supported imported plain comments can be staged for editing, with new replies or standard review-history entries saved to a reviewed copy. Unsupported/protected entries remain read-only. Save local filter sets or review a TXT/CSV snapshot before choosing its filename. **Go to sheet label** finds embedded PDF labels; it does not read sheet titles from artwork. **Mark up PDF** now includes lines, arrows, revision clouds and text callouts. These standard-PDF features are coded/compiled; complete Bluebeam compatibility and runtime verification remain open.


**Review-copy editing:** select a source comment in the review panel and choose Edit plain comment or Add reply. Stage edits, build a copy, inspect the exact comment results and every changed physical page, then save a new filename. Existing provenance, appearances and private fields are retained within the supported preserving route; appearance artwork can retain its original visible text. Drafts are protected on departure. Save portable draft (.json) explicitly keeps staged changes and optional unstaged text; Load portable draft checks the exact original/inventory and requires reviewed replacement. Loading can be undone and does not automatically build or save a PDF. Recipes contain unencrypted review text; saving one does not mark the PDF copy saved. Standard-font FreeText appearance edits, rich/grouped/locked comments and protected documents remain unsupported. Additive replies can target otherwise eligible FreeText annotations. This code is awaiting runtime and Revu-file acceptance.

**Find a workspace:** search or filter the Workspaces cards. New document and Open a document are separate; drawing review, markup, drawing comparison, outline editing, decorations and fillable-field creation have direct entries. In Mark up PDF, explicitly save named styles/default comments for reuse on the next placed mark. Local styles are unencrypted and have their own delete/clear controls.


**Drawing overlays:** in Compare PDFs, choose Transparent overlay or Two-color overlay and adjust X/Y, scale, rotation or opacity. Original cyan and compared magenta artwork remain labeled; alignment resets on a new physical page pair. The overlay shares zoom/scrolling and is a bounded visual review. Whole-document checks ignore manual overlay adjustments.

**Source comment colors:** selected details and TXT/CSV reports retain standard /C and /IC raw color components. Approximate swatches are labeled; missing/malformed/private appearance colors are not guessed. The final combined build contains 202 modules; runtime and Revu-file acceptance remain deferred.


**Drawing sheet sets:** choose Workspaces → Drawing sheet sets, or Drawing sheet sets in an opened PDF's View options. Add exact original PDFs, arrange sheet references, edit your title/revision labels and use Previous/Next sheet to inspect drawings and their comments. Save a named local set to keep order/labels; loading selects every exact original again and previews the replacement arrangement. Review revision replacement shows both actual drawings and changes one selected set reference after confirmation. Comments stay in their original PDFs; this does not replace PDF page bytes or transfer comments. Remove named sets in their library. Up to 20 sets / 128 KiB metadata each, 500 sheets and 10 source PDFs / 100 MB.

**Drawing takeoffs:** choose Workspaces → Drawing takeoffs or Measure drawing. Calibrate a known reference, finish a distance/perimeter/area (or choose count points), enter a name/group and check the points/scale before Add to takeoff. Inspect entries and separate length/area/count totals; jump back to their saved points. Review/save JSON retains the full separate ledger; CSV retains quantities/totals only. Loading JSON checks the exact original, page geometry and recomputed quantities before reviewed replacement. Up to 200 entries / 10,000 total points / 2 MiB file. Copy-restricted PDFs cannot retain/export/load takeoffs. Unfinished full ledgers require save or explicit discard before leaving. These are separate exported files, not embedded PDF measurement annotations; runtime/engineering/Revu acceptance remains open.

**JSON comment reports:** Review TXT / CSV / JSON export offers the exact filtered comment metadata, including source/inventory hashes, colors and structural references. Filtered parents can be absent. It does not contain appearance resources or private dictionaries and is not an interchange/import format.

The integrated build now compiles 208 modules. Runtime tests remain deferred; the complete master list and product goal remain active.


#### 📅 Persistent takeoff copies and reusable decoration templates — 2026-10-04

This later checkpoint supersedes earlier statements that takeoffs are separate-ledger-only. The drawing takeoff ledger now opens a frozen PDF-copy workspace. A source-bound native writer adds one Line (distance), PolyLine (open perimeter), Polygon (closed perimeter/area), or Ink (count) annotation per entry. Explicit vector appearances include numeric quantity labels in the chosen display unit. Unicode comments/author and canonical PDFixData retain original points, physical-page identity, source fingerprint, calibration and recomputed quantities. Maximum 200 entries / 10,000 aggregate points, 2 MiB request, 100 MiB PDF and 500 pages. Source crop/media intersection and UserUnit are checked natively. Physical pages are authoritative; sheet labels remain supplied descriptions independently reviewed against the source. Counts carry no length calibration.

The native construction manifest allows only cloned/appended selected page Annots arrays and normalization of raw-stream Length to unchanged encoded payload size. All original objects, existing annotations, unknown/private fields and encoded stream payloads are retained. After serialization, native reopening compares every declared object, geometry/trailer references, exact annotation order, appearance bytes and canonical metadata. The immutable native receipt is fenced to source SHA/token/generation before an exclusive chosen-file Save Copy. Source-bound ledger math is generated from the same pure UI source during compilation. The worker has a two-minute deadline, 256 MiB old-generation heap, 16 MiB single / 64 MiB aggregate compressed-object decoding budgets; this worker is not an OS sandbox. Signed, certified, encrypted, XFA and unsupported sources are refused. No standard Measure dictionary or proprietary Bluebeam measurement editing is promised.

The UI also checks output/ledger/metadata hashes and exact annotation types, coordinates, text/author and appearances with an independent PDF reader. Every changed original/output drawing page must be visibly reviewed before saving (2 MP per preview). Ledger mutation and measurement controls are held while this copy workspace is open. Cancellation/discard retains the source and full separate ledger. Leaving protects unsaved JSON ledger data; saving a PDF does not mark that separate portable recipe as saved. Exported PDF annotations include unencrypted author, names and complete point/calibration metadata. Recovering this embedded metadata into an editable ledger is a remaining feature; existing JSON import remains source-bound.

Decoration templates now save up to 20 named styles / 64 KiB locally: standard font, inset, page numbers, headers, footers, watermarks and Draft/Approved/Reviewed text stamps. Apply requires explicit confirmation and invalidates a previous PDF preview; current physical-page selection and range stay selected. Templates exclude source IDs, page selection, generated PDFs and receipts. Named save, apply, delete/clear and bounded raw-text export are explicit. Corrupt storage fails closed; concurrent library changes are checked before writes. Text/styles are unencrypted local-profile data, separately disclosed in Settings & privacy, with deletion in Page numbers and stamps. Text stamps do not certify approval or create certificate signatures.

Source and build milestone only. Runtime, native-worker, broker, app, print and Revu acceptance tests remain deferred at the user's request. These additions advance B10/B12 drawing workflows without completing the full Bluebeam or master requirements. Earlier subagent source for templates/preview UI was retained; root completed the missing native writer and integration after those agents hit the account limit. Full interoperability, broader editing/format fidelity, release packaging and security/accessibility acceptance remain open.


#### 📅 Recover and revise embedded PDFix takeoffs — 2026-10-04

Saved native read-only recovery, independent-reader comparison and actual drawing-page review for canonical PDFix takeoff metadata. The reader's Takeoff quantities panel now has Recover takeoffs from this PDF and a native-processing cancel control. Recovery is explicit, never automatic. Native inspection requires a unique indirect annotation on its declared physical page; exact canonical metadata/author/NM, recomputed quantity, source geometry/UserUnit, Line/Polygon/PolyLine coordinates or count marker strokes and bounded normal appearance are checked. Unsupported versions/malformed recognized takeoffs fail closed; other/unreadable PDFix metadata is reported as untouched. Maximum 10,000 source annotations, 200 recovered entries, 2 MiB aggregate metadata / 4 MiB complete receipt, two-minute worker deadline and existing bounded worker heap/decode budgets. Protected/signed/XFA and unsupported sources remain refused. This worker is not an OS sandbox.

Each adopted entry receives a new identity bound to the currently opened PDF SHA, retaining original source SHA, annotation structural reference, author and metadata hash as provenance. Optional origin fields are strictly validated and travel with JSON/PDF metadata. Independent PDF-reader checks compare actual source annotation identity/type, bounds, author/text and path/count coordinates; actual crop/UserUnit and shortened labels must match this current source. Every recovered drawing page must be viewed (one reusable 2 MP canvas), then the user explicitly replaces the current in-memory ledger. Source bindings/hash are rechecked after asynchronous steps; cancellation retains the previous ledger. Undo restores it. Recovery is dirty until JSON is saved. Embedded metadata/calibration is untrusted file data and is not authenticated engineering information.

Edit entry now supports reviewed name/group changes and known reference length/unit changes for each calibrated quantity. Saved measurement/reference positions stay fixed. Quantities are recomputed, fully schema-validated and source-fenced before adoption; preview invalidity disables Apply, edits are dirty and Undo is available. Counts carry no length calibration. Editing a ledger alone does not change PDF bytes.

The takeoff PDF-copy dialog now offers an explicit unchecked-by-default option to update supported recovered annotations. Native selection is fenced by source SHA, unique structural reference, original NM/author/metadata hash, unchanged physical-page/path/reference geometry and known annotation fields. Locked/read-only, shared, threaded/replied-to, popup/group/rich/private-extended or independently changed targets are refused. Only declared original page references are removed, replacement appearances/metadata are appended, and all unrelated annotation entries stay in order. Native reopening verifies exact retained objects, arrays, geometry/trailer and new annotation results; the independent reader verifies declared removals and unrelated identity retention before every changed-page actual before/after review. Saving remains an immutable source/token-bound exclusive new copy. Original dictionaries/appearances remain in the retained object graph, including replaced takeoffs; this is neither redaction nor permanent deletion. Leave the update option unchecked to append additional visible annotations.

This supersedes the earlier recovery-pending and always-append-only checkpoint descriptions. Revu/proprietary takeoff interchange, new point/reference placement for an existing recovered entry, deleting embedded annotations and broad compatibility/security/release acceptance remain future work. Full master requirements remain open. No app, native worker, broker or runtime tests were launched; tests remain deferred as requested.


#### 📅 Reviewed XFDF export — 2026-10-04

Drawing comments now offer Review XFDF export with exact XML, supported source geometry/plain comments, per-annotation omission reporting and separate JSON receipt saving. [Supported subset and limits](docs/DRAWING-XFDF-EXPORT.md). Source is saved; runtime/Revu interoperability testing remains deferred.


#### 📅 Three major-gap agents integrated — 2026-10-04

User requested renewed subagents on the largest gaps. All three new agents completed concrete source slices; root integrated and compiled them. Earlier account-limit failures did not recur for these agents.

- Document fidelity: editable tables with ProseMirror cell selection, bounded rectangular spans, row/column/merge/split/header/fill controls and Undo; supported DOCX import and structured DOCX/PDF export; native recovery validation; TXT/RTF explicit tabular flattening. Original column widths/borders, images/nested tables and page-perfect Word preservation remain open. Details: [DOCUMENT-FIDELITY-PROGRESS.md](docs/DOCUMENT-FIDELITY-PROGRESS.md).
- Original PDF editing: bounded embedded Type1/TrueType one-byte and horizontal Type0 Identity-H two-byte ToUnicode maps, per-string multipart TJ edits retaining numeric spacing, reuse of observed source glyphs, preserved stream dictionaries and reopened source-font graph/encoded-program hash proof. Multicharacter/ligature entries omit affected runs while retaining other usable map entries. New glyph embedding, shaping/reflow, Type3/custom/vertical/nested/marked-content editing and complete unrelated-object preservation acceptance remain open. Details: [PDF-EDITING-FIDELITY-PROGRESS.md](docs/PDF-EDITING-FIDELITY-PROGRESS.md).
- Security Sandbox: fixed document-engine AppContainer/Job Object source with exact token/capability checks, one-process/512 MiB/115-second bounds, read-only staged source/request/runtime and three precreated writable output slots. Codec bundle supports nine fixed operations. Root packages the existing standalone Windows x64 Node runtime/license with SHA pins and bundled dependency attribution; XFDF export adopts the contained path exclusively, with no worker fallback. Cancellation observes broker close, source/output validators remain, cleanup failure/unsafe termination permanently closes the service. Broker close observation is subscribed immediately at launch to cover early failures across async boundaries. Other Office/review/takeoff/redaction routes still need adoption. Details: [SECURITY-SANDBOX-PROGRESS.md](docs/SECURITY-SANDBOX-PROGRESS.md).

Root also completed reviewed 11-type XFDF geometry/plain-comment export with exact XML, filtered source identity/fingerprint checks, per-annotation omissions, reviewed exclusive sealed saves and separately saved JSON receipt. Native runtime/security status is shown in Settings. Existing comment TXT/CSV/JSON snapshots remain separate. The XLSX sharedStrings undeclared-variable failure is fixed with an 8 MiB aggregate bound; current format/workspace/AI/privacy text reflects saved capabilities.

Final compilation passed: 224 Vite modules; index-BFhcaNJF.js / index-kVg5VJNm.css; pdf-job.worker-KFHKMFMu.js / document.worker-BXg1i3K9.js. Broker C# and fixed engine bundle compile; targeted JS/CJS syntax checks passed. Build output includes pinned node.exe, engine.cjs, broker manifests and runtime/dependency licenses. No app, broker, document engine, native worker, network/print or runtime tests were launched. Verifier code and compilation are not evidence of executed fidelity/OS isolation/Revu acceptance. User-requested runtime testing remains deferred; full master requirements and S00 remain open. Original master-list source is unchanged.


#### 📅 Integrated images, table grids, nested editing, containment and search — 2026-10-04

Three user-requested agents delivered inline document images, editable/preserved table column proportions, nested original PDF text/image changes with shared Form isolation, and contained-only Office/comment/takeoff/grid processing. Root integrated native source/lifecycle guards, local search across selected files, import cancellation and current capability/status text. The combined build passed: 231 modules, index-CRv3V24I.js / index-Cc33oWd9.css; Windows broker and fixed engine packaging compiled. Exact support, bounds, artifact identities and pending work: [coding checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md).

Source/compile milestone only; no app/native job/runtime tests were launched. Full master, S00, Word/PDF fidelity and Revu/release acceptance remain open. The original master-list file is unchanged. Current 65% coding / 35% remaining estimate is rough engineering judgment (about ±5 points), separate from runtime delivery and beta readiness.


#### 📅 Integrated headers, batch and XFDF import — 2026-10-04

Authored document header/footer exports, reviewed selected-PDF batch compression, supported XFDF import, contained structural security/cleanup and native API/lifecycle/privacy integration are saved. Combined compilation passed with 237 Vite modules and refreshed engine/broker pins. Runtime tests remain deferred; private-beta, full master-list, Security Sandbox and Revu interoperability acceptance remain open. [Exact implementation and compilation evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [batch limits](docs/BATCH-COMPRESSION-PROGRESS.md); [XFDF import limits](docs/PDF-XFDF-IMPORT-PROGRESS.md).


#### 📅 Band import, preserving page order and contained redaction — 2026-10-04

Plain DOCX/RTF header/footer import, exact original-page permutation retaining drawing comments/links/forms/bookmarks, and fixed contained redaction verification are integrated. Combined compilation passed with 240 modules and current engine/broker/source pins. Windows development packaging and per-user install/uninstall sources are saved; no installation or runtime testing occurred. [Current coding evidence](docs/CODING-CHECKPOINT-2026-10-04.md); [Windows package bounds and remaining gates](docs/WINDOWS-PACKAGING-PROGRESS.md). Full master targets and beta/release/security/Revu acceptance remain open.


#### 📅 Table extraction, scoped health report and selection geometry — 2026-10-04

Reviewed PDF-word/local-English-OCR table extraction with corrected-cell CSV save is integrated. A scoped health report adds visible geometry, permitted text, internal-link/URL-syntax, structure-presence and form-label observations with cancellation and JSON export. Rotated/non-unit text selection uses the source viewport's rotation and UserUnit across all three text-layer views. Source/compile evidence only; broader extraction/font/image/accessibility/fidelity/security/Revu and runtime acceptance remain open. [Latest checkpoint](docs/CODING-CHECKPOINT-2026-10-04.md); [table extraction](docs/TABLE-EXTRACTION-PROGRESS.md); [health scope](docs/PDF-HEALTH-REPORT-PROGRESS.md); [selection fix](docs/PDF-SELECTION-GEOMETRY-PROGRESS.md). Original master-list source and full acceptance checkboxes remain unchanged.


#### 📅 October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.



---


---

<a id="requirements-md"></a>
## 📄 `REQUIREMENTS.md`

---

### PDFix expanded requirements


**October 7 scope extension:** R41 adopts all ten categories of the supplied Acrobat comparison, with stable A01–A25 targets in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). Existing requirements remain; overlapping counts are not independent features. Previously excluded specialist capabilities covered by that addition are later planned work, subject to the stated engine/service/security and acceptance gates. Adoption adds no implementation or verification claim.

Added 2026-09-30 from the user's supplied gap checklist. The checklist is product input, not evidence of missing or completed code. This document defines targets; `FORMAT-SUPPORT.md` and `PHASE-LOG.md` record verified behavior. The existing original-safety and local-processing rules apply throughout.

#### Work protection and privacy

- **R01 Recovery and versions:** debounce autosave, preserve undo/redo during editing, recover after an interrupted process, and retain bounded local versions. Show timestamps and a preview before restoring. Restoring must checkpoint the current state first and must never rewrite the source file. Bind recovery to source fingerprints so externally changed files do not silently receive stale edits. Explain retention, size limits, unencrypted local content and how to clear it.
- **R02 Leaving unsaved work:** wait for pending recovery writes before closing or switching files. If recovery fails, keep the editor available with export/retry options; never silently discard unsaved edits. Offer a clear discard action only after a warning. Converted/edited outputs use a native location chooser and save as a new copy.
- **R03 Cleanup:** users can clear recent metadata, recovery/version content and temporary job files independently. Show what will be removed and what remains. Never delete original or exported documents. Diagnostic logs must exclude document text, passwords and secrets. Display online-transfer history when AI/cloud features exist.
- **R04 Recoverable operations:** retain recoverable inputs and staged outputs before risky changes. A failed or canceled conversion leaves the original intact, and users can review or discard its output. Clearly distinguish rotation of a view from rotation of saved pages.
- **R05 Output collisions:** explain duplicate output names and offer another name/folder or an explicit keep-both operation. Never overwrite an original or alias. Replacing an unrelated existing output, if later supported, requires a specific user choice and a recoverable backup; the current exclusive writer continues refusing replacements.

#### Reading, selection, comparison and printing

- **R06 Navigation and views:** show document outline/bookmarks, page labels and internal links; support personal bookmarks, single page, continuous scroll, two-page spread, fit width/page and temporary view rotation. Lazy loading, bounded canvases, progress and cancellation remain mandatory for large files.
- **R07 Complex selection:** show readable text with page references, preserve sensible row/column order where verified, and offer a bounded local region when automatic selection fails. Columns, tables, footnotes, captions and rotated text require corpus tests; never promise perfect reading order from arbitrary PDF content streams.
- **R08 Safe links and attachments:** identify the destination of external links and ask before opening a website. Do not execute PDF scripts. List embedded files with type/size warnings and save only to a user-chosen location; never auto-open or auto-run extracted content. ZIP traversal, bombs, device names and symlinks require safe handling before any extraction feature ships.
- **R09 Compare:** open two user-selected PDFs side by side with independent and linked navigation. Compare page count/order, extracted text and page artwork; scanned pages require visual comparison. Explain alignment and OCR uncertainty, highlight additions/removals, and avoid equating an OCR-only difference with a proven source change. Source/output comparison is available before accepting a lossy conversion.
- **R10 Printing:** preview exactly the prepared output, select page ranges, paper size, orientation and fit/actual-size scaling, and disclose raster resolution or annotation flattening. Detect invalid ranges, clipped content and unsupported print settings. OS cancellation must clean up temporary pages. Physical printer review remains a release gate.

#### Scans, forms, signatures and annotations

- **R11 OCR:** let users choose among actually bundled/installed languages, review and correct recognized text, locate uncertain words/lines on the scan, and see confidence as an engine estimate rather than accuracy. Warn about handwriting, poor scans and complex reading order. Only advertise tested languages. English recognition/review/searchable output is already scoped and verified; broad quality/language support is not.
- **R12 Scan cleanup:** offer viewable rotation, deskew, contrast cleanup and proposed blank-page removal before OCR. Preview every destructive change, allow undo, distinguish blank from faint content, and verify searchable output against reviewed text. Preserve the original.
- **R13 Forms:** support a verified subset of AcroForms with values, required-field guidance, usable tab order and supported calculations. Never execute arbitrary form JavaScript. Identify unsupported calculations/XFA clearly; preserve values and appearances when exporting. Scanned forms use user-positioned text/checkmarks first; automatic field detection remains an experimental proposal until tested.
- **R14 Signatures:** distinguish typed/drawn/stored visual signatures from cryptographic signatures. A pasted signature image is not certificate validation. Detect existing signature fields, show validity as unknown unless a reviewed validator actually checks it, and warn/refuse changes that may invalidate a signature. Certified signing is not a first-release promise.
- **R15 Annotations:** highlight, underline, drawing, text, notes/comments; preserve supported existing annotations when saving. Users can show/hide, include/exclude in print, flatten or export a separate annotation copy when those options are verified. Keep original artwork, annotation state and temporary reading marks distinct. Operations that cannot preserve structure must warn before conversion rather than silently drop it.

#### Editing, formats, fidelity and standards

- **R16 Explicit capabilities:** separately show Open, Preview, Edit and Convert per format and per operation. Explain imported text copies, unsupported features, size limits and lossy changes before processing. Permission to edit does not make a format supported or a conversion faithful.
- **R17 Format coverage:** evaluate PDF, DOCX/RTF/TXT/Markdown, JSON/XML/YAML/CSV, XLSX/PPTX, PNG/JPEG/WebP/BMP, multipage TIFF and HEIC/HEIF. Stage DOC/XLS/PPT and Apple Pages/Numbers/Keynote behind decoder/license/corpus gates. Unsupported types get realistic alternatives, never success-shaped placeholders.
- **R18 Conversion options:** expose only tested preservation choices for links, images, page size, outline/bookmarks, annotations and form fields. Show what survives, what is dropped, and preview page breaks/fonts/tables against the source. Do not label a byte-for-byte copy a conversion.
- **R19 Apple photos:** honor HEIC/HEIF orientation, color and metadata choices. Recognize whether a Live Photo's still and motion components were actually supplied; do not invent a missing motion file. Separate exports are explicit user actions with codec/distribution review.
- **R20 Archival/accessibility output:** evaluate PDF/A and tagged-PDF checks using reviewed engines and validators. A visually correct PDF or OCR layer is not a tagged accessible PDF. Report compliance as unknown until validated; no standards claim based only on file extension or appearance.

#### Jobs, sharing and accessibility

- **R21 Batch jobs:** selected-file convert/compress/rename/combine queues have per-file progress/results, cancellation, output locations, collision rules and bounded concurrency/resources. Failures do not silently skip files or report the whole batch successful. Distinguish completed outputs from canceled/unstarted work. Batch rename defaults to new-copy names rather than renaming originals.
- **R22 Sharing:** export a new copy and provide a reviewed Windows share handoff. Cloud links require a specifically chosen cloud account/service and explicit upload/share consent; local-only mode never fabricates a public link. Display the destination and resulting permissions.
- **R23 Accessibility:** complete keyboard workflows, shortcut help, meaningful screen-reader names/roles, visible focus, scalable UI text, readable contrast, reduced motion and announced job/error status. Verify editing, dialogs, comparison, selection, printing and cancellation at larger text scales and with assistive technology. Searchable/copyable text and tagged document structure are separate capabilities.

#### AI and agents

- **R24 Request scope and consent:** choose provider/model or agent plus exact files for every request. Show local/online data destination and obtain consent bound to endpoint, file fingerprints and the specific request. Local gateway addresses do not prove local processing. No unselected context or broad file access.
- **R25 Read-only AI:** document instructions are untrusted source content. Answers cite source pages/lines. AI cannot edit, export, overwrite or invoke file tools automatically; proposed changes require specific user approval and a reviewable diff/output. Connection accounts/API charges are separate from PDFix and must be disclosed during setup.
- **R26 Connection controls:** test, discover/select models, show endpoint and capabilities, remove connections and securely delete stored secrets. Windows-backed secure storage must fail closed if unavailable. Distinguish model providers from agent runtimes and disclose upstream/tool access.
- **R27 Layout context and uncertainty:** show whether the chosen model accepts images; let users deliberately include page images/charts only when supported and consented. Label OCR-derived context and weak recognition; citations identify exact pages or source lines and do not imply the model inspected the whole document.

#### Windows and release quality

- **R28 Windows integration:** reviewed installer/uninstaller, portable workflow, Open With, optional file associations/Explorer actions and a user-initiated default-reader path through Windows settings. No silent default changes, registry takeover or forced association. Test upgrade/uninstall without deleting documents or unintended user settings.
- **R29 Corpus and adversarial files:** actual varied files verify opening/saving, conversion, OCR, compression, annotations, forms, signatures, print preparation and output structure. Include damaged/encrypted/restricted/oversized files, large page counts, awkward reading order, ZIP bombs, Unicode filenames and stale sources. Redaction must remove original text/images/streams and survive search/copy/object inspection; a black overlay is insufficient.
- **R30 Brand assets:** preserve the supplied PDFix logo unchanged as the master. Prepare separate app-icon, light/dark-background and monochrome variants for packaging, inspect at small sizes, and retain transparent asset licensing/provenance. Do not replace the master with a generated derivative.

#### Everyday workspace controls

- **R31 Window and layout controls (user addition):** visible native fullscreen control plus F11/Escape; collapsible named sidebar navigation; focus mode with an easy way back; independently collapsible PDF thumbnails/search panels. Remember non-sensitive layout choices, make hidden search available with Ctrl F, and retain document content, recovery and selection behavior when resizing. Verify the minimum window size and keyboard access.

#### Later core inventory and visual audit

- **R32 Visual polish:** remove redundant header rows and artificial UI measurement graphics, tighten unnecessary container padding, keep document artwork/page margins intact, and make controls align and fit the window. Audit Home, Files, Workspaces, reading, editing, settings and workflow dialogs at normal/minimum sizes. No unintended body scroll, clipped bottom controls or overlapping interactive controls. Preserve keyboard names, usable focus and content/recovery while changing layouts.
- **R33 Complete everyday page tools:** add crop/resize and automatic split rules to the verified arrange/rotate/remove/extract/combine/insert-by-reorder workflow. Show the affected boundary/pages before output. Cropping hides artwork outside a page box; it must never be described as secure redaction.
- **R34 Useful PDF editing:** user-positioned text/image overlays and a verified subset of existing text/image object edits. Explain font, spacing and layout restrictions before accepting an edit. Do not equate an extracted text document with editing the original PDF objects. Source/output review and original preservation are required.
- **R35 PDF creation:** actual local PDF output from supported text/documents/images, with preview and tested page size/orientation/font/image behavior. Office layout conversions remain engine/corpus dependent.
- **R36 Guided form/signature assistance:** identify supported blank/required fields and offer likely signature/date/initial locations as proposals with uncertainty. Users confirm placement and values before writing. Scanned forms use explicit positioned overlays; no fabricated field certainty or automatic signing. Saved visual signatures are distinct from certificate validity and external signature-request workflows.

The later supplied inventory is planning input, not an independently verified report of another product. FEATURE-TRACKER.md maps its core targets, useful small/large additions, later candidates and first-release exclusions. Existing R13–R15, R18, R20 and R24–R29 cover the overlapping form/signature/annotation/conversion/standards/AI/release items.

#### Traceability to the supplied checklist

The first list is G01–G16; the deeper list is D01–D22. Every entry is covered below. Repeated ideas intentionally share requirements.

| Source entry | Requirements | Stage |
| --- | --- | --- |
| G01 Protect work | R01 | Existing editor slice/reliability |
| G02 Prevent loss | R02, R04, R05 | All writers/editors |
| G03 Compare PDFs | R09 | PDF fixes/fidelity |
| G04 Batch handling | R21 | PDF fixes, then format adapters |
| G05 Dependable printing | R10 | Reading/print polish |
| G06 Sharing | R22 | Windows polish; cloud only with consent |
| G07 Accessibility | R23 | Every workflow; release review |
| G08 Format clarity | R16, R18 | Existing matrix; every adapter |
| G09 Useful file types | R17, R19 | Documents/images/compatibility |
| G10 Trustworthy OCR | R11, R12 | PDF fixes |
| G11 Bad files | R29 | Every parser/writer |
| G12 Safe AI | R24, R25, R27 | AI phase |
| G13 Connection details | R26 | AI phase |
| G14 Windows fit | R28 | Packaging/polish |
| G15 Real-document testing | R29 | Every gate |
| G16 Logo preparation | R30 | Packaging/polish |
| D01 Outline/bookmarks | R06 | Reading improvements |
| D02 Page views/view rotation | R06, R04 | Reading improvements |
| D03 Links/attachments | R08 | Reading/security |
| D04 Complicated copying | R07 | Existing selection plus corpus |
| D05 Huge documents | R06, R21, R29 | Every job |
| D06 Scan cleanup | R12 | PDF fixes |
| D07 Uncertain OCR | R11 | PDF fixes |
| D08 Scanned forms | R13 | PDF fixes |
| D09 Form behavior | R13 | PDF fixes |
| D10 Signature kinds | R14 | PDF fixes/release scope |
| D11 Annotation preservation | R15, R18 | PDF fixes/fidelity |
| D12 Text/image/page comparison | R09 | PDF fixes/fidelity |
| D13 Preservation choices | R18 | Every conversion |
| D14 Apple photos/Live Photos | R19 | Decoder/compatibility gates |
| D15 PDF/A/tagging | R20, R23 | Compatibility/standards evaluation |
| D16 Safe extraction | R08, R29 | Parser/security gates |
| D17 Visual AI context | R27 | AI phase |
| D18 Document injection/read-only AI | R25 | AI phase |
| D19 Privacy cleanup/logs | R03, R24 | Existing local data; AI audit later |
| D20 Recoverable operations | R01, R04 | All editors/fixes |
| D21 Conversion recovery | R04, R09 | Every conversion |
| D22 Duplicate outputs | R05 | Safe-copy workflow |

Priority implementation: strengthen existing recovery with versions and cleanup; then PDF comparison and guided PDF fixes, with accessible/cancellable jobs. Batch behavior grows only as its underlying operations pass their gates. Windows integration, cloud/AI and additional formats retain their ordered dependencies. Planning these additions does not mark them implemented.

Current R29 redaction evidence: the clean-image mode replaces selected pixels before building a fresh image-only document, removes original text and hidden structures, rejects extra/trailing serialized payloads, checks every page independently and verifies saved disk bytes. Source-bound recovery retains only positions/settings; failed recovery blocks departure while allowing verified rescue export. This satisfies the scoped flattened-copy behavior, not the full vector-preserving/large-real-file/forensic corpus gate. Visible unmarked private artwork still requires user review.

Current password-copy evidence: AES-256 revision-6 output is verified against distinct user/owner roles and chosen permissions; existing encryption requires the supplied owner password before modification/removal. Native structure/stream checks and independent original/output text/geometry/pixel checks precede reviewed disk-verified copy saving. Passwords are not recovered or placed in process command lines; temporary unprotected-content files have bounded known-job cleanup. Broad legacy/public-key/normalization/real-file/resource/release review remains unfinished. Permission flags rely on receiving viewers; an opening password alone does not authorize removing owner restrictions.

#### Saved October master list and Security Sandbox

- **R37 Security Sandbox:** contain native PDF engines with Windows AppContainer and a bounded Job Object, grant only app-owned job inputs/output and pinned runtime binaries, omit network capabilities, scrub inherited environment, limit subprocesses/memory/time and fail closed if containment cannot start. Keep global Electron sandbox, renderer network/download/permission restrictions, active-content refusal and source-bound IPC. Worker threads provide resource limits only. Require a hidden Windows containment/security review before release claims.
- **R38 Complete saved master-list coverage:** all ten sections of PDFix-Missing-Features-Master-List.md are accepted planning requirements; MASTER-GAP-TRACKER.md preserves every item with stable IDs. These expand R06–R29 and R33–R36, including drawing/measurement/layers/print, sanitation, forms, OCR, format fidelity, batches, accessibility, Windows and AI. Later candidates retain their reviewed-engine/service gates and explicit initial-release boundaries. No item is complete merely because it is saved here.


#### 📅 Bluebeam drawing-review addition — 2026-10-03

- **R39 Bluebeam/Revu compatibility:** prioritize seeing existing comments/markups in Revu-produced PDFs, a searchable drawing-wide markup panel, sheet-location navigation, supported replies/states/locks and preservation when saving copies. The user confirmed drawing/comment review is their dad's main workflow. Add clouds/callouts, aligned revision review, sheet sets, reusable review tools, custom data and calibrated takeoffs in that order. Detailed open targets B01–B12, flattened-data limits, proprietary-format gates and separate Studio integration boundaries are saved in [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md). Existing annotation rendering/summaries do not prove Bluebeam compatibility.

#### 📅 PDF-only fullscreen and debugging inventory — user addition, 2026-10-04

- **R40 PDF-only fullscreen:** provide an explicit reader control that fills the screen with PDF artwork and hides the Windows frame, application sidebar/top bar/status bar, workspace tabs, reader toolbar, thumbnails, inspector, comments/review panels and other surrounding controls. Preserve the physical page, zoom, reading mode, scroll position and unsaved work. Provide an obvious temporary exit control and Escape; temporary controls disappear when not needed. Retain accessible keyboard page/zoom navigation, restore the previous layout on exit, respect open dialogs and leave this mode safely before switching files or leaving the reader. Test standard/rotated/cropped/non-unit PDFs, all supported reading views, minimum/large screens and multi-monitor/DPI changes. Existing F11 and focus mode do not satisfy this complete requirement.

The user reports that the preview looks good but needs substantial debugging. [PDFIX-COMPLETE-STATUS-2026-10-04.md](PDFIX-COMPLETE-STATUS-2026-10-04.md) separates historical runtime evidence, untested source implementation and remaining work across R01–R40, M01–M10, S00 and B01–B12. Individual unspecified problems require concrete reproduction before being called confirmed defects. Preparing this inventory does not run or authorize a new test campaign.

The user subsequently incorporated the complete [F01–F42 future list](PDFIX-FUTURE-FEATURES.md) into the product plan. Those expansions map to the existing requirements and retain their staged evaluation/exclusion boundaries. This establishes the saved scope to finish; additional speculative product features are not the current priority.


##### October 7 coding update

R40 artwork fullscreen, hand/pointer navigation (part of F04), and Compact/Comfortable spacing (part of F02) are implemented and compiled. Current runtime/visual/focus/DPI acceptance remains pending. [Exact scope and bounds](docs/PDF-READER-USABILITY-2026-10-07.md).


##### October 7 major-gap coding checkpoint

Seven feature families are now implemented and compiled: zoom-region/view history, portable table corrections, bookmark splitting, contained rich-document processing, reviewed drawing-page matching, cross-source page drag staging and single-PDF Bates numbering. [Exact scope and remaining acceptance](docs/MAJOR-GAP-CODING-2026-10-07.md). Current runtime/corpus/Windows acceptance and broader scope remain open; original acceptance checkboxes are unchanged.

##### October 7 biggest-gap continuation

[docs/BIGGEST-GAPS-CODING-2026-10-07.md](docs/BIGGEST-GAPS-CODING-2026-10-07.md) records literal XLSX table export, reviewed PDF copy/rename/supported TXT queues, and contained bookmark, decoration/Bates, attachment and URI inspection routes. Source/compilation evidence only; current runtime acceptance and remaining full-plan work are not marked complete.

#### 📅 R41 — Acrobat replacement expansion (October 7 user request)

Adopt every category from the supplied Acrobat gap comparison into the full PDFix plan. A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md) define certificate trust/signing/routing, prepress/color/standards, full accessibility remediation, XFA/contained form logic/barcodes/submissions, portfolios, 3D/GIS/media, managed enterprise policies, browser/mobile/platform clients and difficult-file reliability. Preserve the source, retain prior IDs and avoid double-counting overlaps. Expand historical specialist exclusions into explicitly staged later targets with engine, licensing, service, security and independent output/standards acceptance where applicable. Core reading/editing/comment reliability and S00 retain priority. This is adopted planned scope, not implemented feature parity or a blanket legal/compliance promise; current script and consent restrictions remain until a separately reviewed compatible design is accepted.


#### 📅 Reading, writing, virtual printing and free-app additions — 2026-10-09

- **R42 Virtual PDF printer (F43):** optional Windows PDFix print destination, bounded local print-job capture, review/import/exclusive copy save, cancellation/recovery and free signed installation/uninstallation. Existing PDF export/physical printing is separate.
- **R43 Read aloud (F44):** free local text-to-speech with play/pause/resume/stop, voice/language/speed, text/page/document scope and source highlighting; preserve permissions, disclose OCR/order uncertainty and process incrementally. Whisper recognizes speech rather than generating it.
- **R44 Word count (F45):** expand the basic editor counter to explicit selection/page/document word/character/paragraph/page statistics for supported editable and extracted PDF text, with language/scope/omission disclosures.
- **R45 Spell-checking (F46):** free local dictionaries, language choice, suggestions/replace/ignore/personal dictionary and Undo/recovery in supported editable text; read-only PDF findings cannot bypass edit/font permissions.
- **R46 Free app:** no required paid API/subscription, paid feature unlock or purchase/upgrade links. These additions work locally without uploading document data. Evaluate other adopted integrations under this rule and record incompatibilities honestly.

Detailed scope and current starting points: [reading/writing/print plan](READING-WRITING-PRINT-PLAN.md). These are planned additions; no new implementation or testing is claimed.


#### 📅 October 9 local text/printing coding update

See [current compiled checkpoint](docs/LOCAL-TEXT-PRINT-CODING-2026-10-09.md) for F43–F46 / R42–R46: local read aloud, spelling, scoped statistics, optional Windows PDFix printer and local-only AI are integrated coded subsets. Compilation passed; runtime/output/performance/beta acceptance remains pending. Preserve all remaining full-scope work. The [three release priorities](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md) govern integrity, large-file responsiveness and separate simple workspaces; none is certified passed.

#### 📅 October 11 user additions — free Acrobat tools and core workspaces

- **R47 Free Acrobat additions:** adopt all 20 priorities as F47–F66 in [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md): field detection, local autofill, labeling/tab suggestions, Windows context tools, Office shortcuts, Edge handoff, synchronized folders, EML conversion, clipboard PDF, local translation, bookmark suggestions, selected-folder PDF search, filename suggestions, approved watched folders, CSV form merge, signature handoff preparation, SHA-256 verification, production marks, five-box editing and thin-line inspection/repair. Preserve R46's free-app rule and all earlier scope. Existing overlapping subsets are not completion of these full additions.
- **R48 Explicit selected-folder grants:** expand individually selected-file search only after the user selects a folder and its purpose, recursive scope and persistence. Keep access within the granted tree, handle placeholders/links/changed files, provide revocation and index cleanup. Folder search permission does not authorize writing, watching or running jobs; watched recipes need their own approved operations and output destination. No unrestricted system/drive scans.
- **Current priority:** Workspaces, PDF viewing and PDF editing first, including clean room navigation, PDF-only fullscreen, collapsed panels, bounded large-file tools, usable selection and broader permitted original-content editing. The 20 additions are saved planned targets; no new code or runtime result is claimed.

#### 📅 October 11 final consolidation, drawing comments and digital pen

- **R49 Unified creation/editor/review UI:** after Workspaces/viewing/editing, finish a familiar Word/Google Docs/DocHub-inspired document/PDF creation toolbar, then Bluebeam comment viewing, adding and permitted editing with preservation and visible restrictions. Use clean grouped controls and actual integrated functionality. Perform the user's requested full UI/function debugging pass with documented coverage; no blanket working claim from compilation.
- **R50 Digital-pen PDF drawing (F67):** handwriting/ink directly on PDF pages using a digital pen, saved editable ink/appearance copies and recoverable drafts; pen/highlighter/color/width/opacity, pressure where supported, palm rejection, touch/navigation modes, stroke selection/erasing, Undo/Redo and coordinate-accurate zoom/rotation/page handling. Existing basic Ink is partial groundwork. The user clarified the Store-app reference by function; exact brand is not a dependency.

[FINAL-IMPLEMENTATION-PLAN.md](FINAL-IMPLEMENTATION-PLAN.md) consolidates the complete earlier scope without removing a requirement. The ordered workstreams and full scope ledger preserve original/master/future/Bluebeam/Acrobat/free-tool targets, including prior exclusions that remain exclusions and later specialist targets that were adopted. Every incomplete item stays open. The newly requested UI/function checks supersede earlier blanket testing deferral for this pass, while hidden-window and original-preservation preferences remain.




---


---

<a id="roadmap-md"></a>
## 📄 `ROADMAP.md`

---

### Ordered roadmap


**October 7 Acrobat expansion:** the full user comparison is adopted as R41/A01–A25 in [ACROBAT-COMPETITIVE-PLAN.md](ACROBAT-COMPETITIVE-PLAN.md). Core file reliability, selection/editing, drawing comments, recovery, accessibility and containment stay first. Certificate services, specialist print/standards/forms/containers, 3D/GIS/media, managed policies and platform clients follow their engine/service/security dependencies. Historical first-release exclusions do not remove these new later targets from the full plan. F01–F42 remain in scope, and this addition establishes no new completion percentage or release date.

**Current whole-scope status (October 4):** [complete feature/debug/testing inventory](PDFIX-COMPLETE-STATUS-2026-10-04.md) and [full future list](PDFIX-FUTURE-FEATURES.md). These distinguish older executed tests from newer untested code and unfinished acceptance; older entries below are historical checkpoints. New R40 requires PDF-only fullscreen.


Status is maintained in PHASE-LOG.md. No phase advances until its gate passes. Planned features are not advertised as working.

User-directed order adjustment: after the verified foundation/reader/page operations, the user explicitly prioritized a visible Word/Google Docs inspired editing workspace and robust selection. The subsequent common-image preview/PDF slice is also pulled forward, with its own preservation/recovery gates and remaining multi-image/codec work. Phase 4's basic editor/DOCX import/export and local recovery were pulled forward as a separate tested slice. Phase 3 remains incomplete; this does not mark Phase 4 or the product complete. Basic local English OCR, correction review and verified searchable output are now implemented; a broad quality corpus and remaining PDF fixes are next.

| Phase | Work | Depends on | Completion gate |
| --- | --- | --- | --- |
| 1 Foundation | Native shell; mockup-inspired home; picker/drop; bounded file opening; recent/favorites/filter; support matrix; new-copy safety | Product/architecture docs | Native launch, actual-file picker/drop/reopen tests, malicious/oversized/stale errors, original-preservation tests, build |
| 2 PDF reading | Pages/thumbnails; selection; page navigation; zoom/fit; text search; print; password and scan hints | Phase 1 | Multi-page actual PDF renders; text search/page refs; print preparation all pages; correct/incorrect password; damaged PDF; worker/resource checks |
| 3 PDF fixes | Page order/rotate/extract/combine/split; annotations/forms/signature; local OCR and correction; preview compression; verified redaction; password protection; copy save | Phase 2 | Reopen outputs; OCR expected terms/positions on scan corpus; redaction extraction/object/image tests; compression quality/size checks; no original writes; memory/cancellation |
| 4 Documents/images | TXT/MD/data preview/edit; familiar rich editor for suitable formats; PNG/JPEG/WebP; TIFF/HEIC evaluation; DOCX/RTF imports; office preview/conversion | Phase 3 | Real fixture corpus; round trips; explicit fidelity warnings; original hash unchanged; recovery |
| 5 AI connections | Separate model/agent setup; endpoint validation/test; discovery; Windows secure secrets; selected context/consent; cited answers; Hermes; generic adapter | Phase 4 | Mock local/remote endpoints exercise consent denial/approval, removal, secret persistence; no unselected content or arbitrary agent writes; real integration only with available user connection |
| 6 Compatibility/polish | Legacy/Apple format feasibility; accessibility; installer; recovery; usability | Phase 5 | Clean Windows install/uninstall; keyboard/screen-reader review; corpus-derived support matrix; no unsupported claims |
| 7 Release readiness | Security/licensing; signing; installation guide; verified matrix; performance regression checks | Phase 6 | Security review, notices/SBOM, clean-machine test, documented support; signing/publishing credentials supplied if distribution requested |

#### Expanded requirement sequencing

All additions and acceptance targets are defined in `REQUIREMENTS.md`; `FEATURE-TRACKER.md` reconciles their status and useful additions; they supplement existing gates rather than replacing them.

1. **Work protection now (R01–R05):** bounded local version history, preview/restore with a checkpoint of the current state, recovery after process termination, safe departure when autosave fails, and separate history/recovery cleanup. These are now implemented in the scoped editor; compare PHASE-LOG.md for verification and bounds. This strengthens the already user-prioritized editor slice and is a dependency for recoverable fixes.
2. **Reader improvements (R06–R10, R31–R32):** native window/pane controls and compact layouts; document outline/page labels, personal bookmarks/last-read position and fit-page/view rotation; scoped two-PDF/source-output comparison is implemented with manual alignment for arbitrary page reorders and automatic page-plan alignment for organizer output. Remaining: additional page layouts; safe link/attachment routing; broader comparison/alignment corpus; print ranges/paper/orientation/preview. Ship each tested slice without relabeling the entire phase.
3. **Finish PDF fixes (R11–R15, R21, R29, R33–R36):** broaden implemented crop/resize fixtures, broaden implemented every-N/custom-group splitting and add page-plan recovery, supported PDF text/image edits, broaden the implemented supported forms/confirmed visual-signature workflow (tab order/fonts/calculations/corpus), and add PDF creation; broaden the OCR corpus/languages and scan cleanup; then annotation-preserving edits, broader form/visual-signature verification, broader implemented compression corpus/native resource hardening, broader implemented clean-image redaction verification, vector-preserving redaction, broader implemented password-protection/removal compatibility and integration of authorized unprotected copies with other writers. PDF comparison supports review; batch jobs only queue verified operations.
4. **Documents/images/fidelity (R16–R20):** expand tested adapters to BMP/TIFF/HEIC/Office/RTF as feasible, preservation choices and source/output comparisons. Evaluate Live Photo components and PDF/A/tagged output behind explicit engine/validator gates. Do not promise difficult formats or standards before verification.
5. **AI (R24–R27):** per-request scoped consent, endpoint/upstream and billing disclosure, secure secrets/test/removal, citations, injection resistance, image capability/uncertainty and content-free transfer records. Proposed edits require separate approval.
6. **Polish/release (R22, R23, R28–R30):** accessibility review of every workflow, Windows sharing and opt-in integration/default-reader setup, installer/uninstaller/upgrade tests, separate logo derivatives, expanded real-file/security/licensing corpus. Cloud sharing remains explicit and optional.

#### 📅 Adopted future backlog — October 4, 2026

The user has added the entire [F01–F42 future list](PDFIX-FUTURE-FEATURES.md) to the product plan. Its placement is recorded in [PRODUCT-PLAN.md](PRODUCT-PLAN.md). Treat it and the existing requirements/master/Sandbox/Bluebeam scope as the baseline to complete; focus on implementation, debugging and acceptance rather than adding speculative features. Further product additions come from the user's direction. Necessary fixes and dependencies remain in scope.

Reader/fullscreen work comes first, followed by the existing drawing/comment priorities and unfinished feature/acceptance gates. Future service/standards evaluations retain their prerequisites and later staging; first-release exclusions remain unchanged. Exact current evidence is in the [complete status report](PDFIX-COMPLETE-STATUS-2026-10-04.md).

#### Format evaluation order

PDF -> text/data -> browser-native images -> DOCX/RTF -> XLSX/PPTX -> TIFF/HEIC -> legacy Office -> Apple iWork. Office/Apple containers must be inspected for bounded ZIP extraction, macros, external relationships, hidden content and compression bombs.

#### 📅 Exit/checkpoint policy

At a tool/session limit, finish verification of current changes, leave `npm start` runnable, and record an exact unfinished gate and next command. Missing a decoder/credential does not justify fake UI/results. Routine reversible choices need no approval. Paid services, destructive actions and owner-only credentials pause only the dependent work.

#### Security Sandbox priority and complete master-list intake

R37 is pulled forward: implement Windows AppContainer containment for qpdf compression/password jobs and renderer restrictions, then expose honest security status. OS containment requires later hidden runtime verification; a compile does not establish isolation. R38 and MASTER-GAP-TRACKER.md retain every master-list item, including later candidates and initial-release exclusions, within the existing ordered phases. The complete source is preserved as PDFix-Missing-Features-Master-List.md.


#### 📅 Bluebeam/Revu priority — 2026-10-03

R39 joins the existing review/drawing workstreams. First implement B01–B05: visible existing markups, searchable sheet-linked list, supported replies/states/locks, preservation and comment reports. Next B06–B10 add drawing-review tools, revisions and sheet sets. B11–B12 follow for custom data and takeoffs. Studio and proprietary BAX/BTX support need separate evaluation. See [BLUEBEAM-COMPATIBILITY-PLAN.md](BLUEBEAM-COMPATIBILITY-PLAN.md); existing reader annotation support is not full Bluebeam acceptance.


#### 📅 October 9 user additions — free printing and reading/writing tools

Adopt F43–F46 / R42–R45: virtual PDF printer, local read aloud, expanded word count and spell-checking. R46 requires PDFix to stay free, with no required paid APIs/subscriptions, feature unlocks or purchase/upgrade links. These features use free local components; Whisper is not a speech-synthesis engine. The existing basic editor word counter is only a starting point. See [detailed scope and dependencies](READING-WRITING-PRINT-PLAN.md). No new code, tests, installs or paid integrations are claimed. Prior adopted scope remains, with provider/engine choices subject to the free-app requirement.

#### 📅 Top release gates — reliability, scale, and clear workspaces (October 9, 2026)

Before beta, execute the [acceptance matrix](docs/RELIABILITY-PERFORMANCE-USABILITY-GATES.md): fail-closed, original-preserving save/sign/split/redact and blueprint outputs with independent reopen and validation; measured 500-page/300 MB navigation on realistic hardware with bounded visible-page work; and task studies for separate Drawing, Document, and Pages workspaces. Define numeric performance targets and drawing tolerances from measurements before claiming a pass. “Never corrupt” and “100% bug-free” are goals, not guarantees; compilation does not close runtime gates. All rows remain pending while the user-requested coding pass defers runtime testing. Existing full scope and the free-app rule remain unchanged.

#### 📅 October 11 priority and adopted free-tool scope

Put the Workspaces, PDF viewer and original-content editor gaps first. Integrate automatic field/outline suggestions and page geometry tools within those rooms without increasing persistent toolbar clutter.

Adopt all F47–F66 / R47 additions in [FREE-ACROBAT-ADDITIONS-PLAN.md](FREE-ACROBAT-ADDITIONS-PLAN.md). R48 introduces explicit selected-folder grants for folder search and separately approved watchers; earlier selected-file behavior remains the default until these routes are implemented. Follow the detailed work order, preserve original/Sandbox/recovery rules and keep features free. This is saved scope, not completed implementation or acceptance.



#### 📅 October 11 complete scope consolidation

[Final implementation plan](FINAL-IMPLEMENTATION-PLAN.md) sets the current order: Workspaces → PDF viewing → PDF editing → PDF creation/document toolbar → Bluebeam comments/review → remaining complete adopted scope → digital-pen drawing → full UI/function and release acceptance. The [complete remaining-work register](docs/FINAL-REMAINING-WORK-2026-10-11.md) and [source-preserving scope ledger](docs/FINAL-SCOPE-LEDGER-2026-10-11.json) retain R01–R50, S00, all 71 M rows, B01–B12, F01–F67, A01–A25 and G01–G16/D01–D22. Every earlier specification, dependency, preservation/security/free-app rule and applicable acceptance gate remains represented. Later adopted specialist targets supersede only their historical staging exclusions; unrelated excluded scope is retained as a boundary.

R49 records the familiar creation toolbar, comment viewing/adding/eligible editing and requested full UI/function pass. R50/F67 records digital-pen PDF handwriting and saved editable ink. Existing basic ink and newly coded toolbar/comment controls do not complete the broader targets. Current checks are scoped evidence; no blanket all-features/all-files or release-ready claim is made.



---


---

<a id="third-party-notices-md"></a>
## 📄 `THIRD-PARTY-NOTICES.md`

---

### Dependency review checkpoint


This development project uses Electron (MIT), PDF.js (Apache-2.0), pdf-lib (MIT), Vite (MIT) and Playwright (Apache-2.0). Exact versions and transitive dependencies are pinned in package-lock.json. Corresponding license files are supplied by their packages in node_modules; PDF.js and Electron also contain upstream notices. Copyright notices must be carried into any later distributed build.

PDF.js TextLayer styles in `src/text-layer.css` follow Mozilla's documented/source layout contract under Apache-2.0; no whole viewer stylesheet is shipped. pdf-lib includes MIT-licensed @pdf-lib font/encoding packages, pako's MIT/Zlib code and tslib's 0BSD runtime. Electron binaries contain Chromium/Node and additional notices that must accompany packaging. Full transitive SBOM, binary notices, fuses and signing are Phase 7 gates, not complete here.

The PDFix logo was supplied by the user and is preserved unchanged. The provided Forma HTML remains an internal design reference, not product state.

Local compression adds official Windows x64 qpdf **12.4.2** (Apache-2.0), pinned to the [official release](https://github.com/qpdf/qpdf/releases/tag/v12.4.2). The ZIP SHA-256 is db87077e683630c1217e0e8f9a20a9749d952ab676e881c3689187763a5de25d, verified against the release API digest before extraction/execution; this is checksum verification, not signature verification. The build carries manifest-selected executable/DLLs, qpdf LICENSE/NOTICE and upstream zlib, OpenSSL and libjpeg-turbo attribution texts in dist/native/qpdf. LICENSE-SOURCES.json records exact source URLs/checksums. The upstream library license tags identify the retrieved notice texts, not verified versions linked into the binary. The [pinned upstream build script](https://github.com/qpdf/qpdf/blob/v12.4.2/build-scripts/run-vcpkg) lists those libraries. This software is based in part on the work of the Independent JPEG Group. Full matching binary dependency notices/versions, Microsoft runtime redistribution terms, vulnerabilities, clean-machine loading and SBOM remain release gates. No system-wide installer or redistributable was run.

The editor adds Tiptap/StarterKit/ProseMirror (MIT), mammoth (BSD-2-Clause), docx (MIT) and DOMPurify (dual Apache-2.0/MPL-2.0; use Apache-2.0). Exact direct/transitive versions remain locked. These libraries' notices must be preserved in distribution. Dependency audit at installation reported 0 known vulnerabilities; this is not a complete security assessment.

Local OCR adds Tesseract.js/core 7.0.0 (Apache-2.0) and @tesseract.js-data/eng 1.0.0 (package declares MIT). The bundled model is `4.0.0_best_int/eng.traineddata.gz`; Tesseract's upstream language-data repositories use Apache-2.0. Preserve both package and upstream model attribution during release review. The build carries the worker's generated dependency notices plus Tesseract.js/core licenses in `dist/ocr-assets`. All selected assets are bundled and exact versions locked; recognition does not fetch a CDN or language model at runtime. See [Tesseract API/local options](https://github.com/naptha/tesseract.js/blob/master/docs/api.md) and [upstream language-data license](https://github.com/tesseract-ocr/tessdata_fast/blob/main/LICENSE). Full transitive/binary/model SBOM and attribution are still release gates.



---


---

<a id="workspace-contents-md"></a>
## 📄 `WORKSPACE-CONTENTS.md`

---

### What is saved in the PDFix project folder


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
