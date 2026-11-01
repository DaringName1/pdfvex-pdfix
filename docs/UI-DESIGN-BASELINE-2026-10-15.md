# PDFix approved UI design baseline — October 15, 2026

Status: user-approved design philosophy for future UI decisions. This records direction; it does not claim the UI is implemented or all listed features exist.

> PDFix is one clean, document-centered workspace with powerful, connected tools that appear when users need them—not a collection of complicated menus.

## Current sequencing clarification

The user explicitly confirmed: the workspace redesign is for later. Current work stays on the main app and its features. Eventually all workspaces must feel like one connected application, not four different apps. Their names describe future task emphasis, not four interfaces to implement now.

## Four connected workspaces

- **Documents & Publishing** — the default everyday document experience: reading, writing, PDF editing, pages, conversion, forms, signing and publishing.
- **Science & Data** — document-focused data, charts, statistics and scientific content.
- **Engineering** — technical documents, measurements and drawings.
- **Research** — sources, citations, linked notes and research organization.

These emphasize different tasks on the same files. They are not isolated applications or restrictions on what a document can contain. Reuse controls and components across them.

## Design principles

Keep the document central and leave a large canvas. Use a calm, familiar Windows-first interface with clear typography, spacing and plain-language actions. Common tasks should be easy to discover; advanced settings appear progressively when relevant. Contextual tools follow the current selection, document and task. Collapsible navigation and properties panels support the document instead of overwhelming it. Panels, tab states, selections, keyboard shortcuts, undo/save behavior and dialogs should be consistent and accessible. Advanced modules should load when needed so ordinary opening stays fast.

AI is optional; local document work remains useful without AI or a login. Avoid advertisements, upgrade prompts, promotional banners and intrusive assistant boxes. Show relevant actions that actually work for the supported file rather than implying unavailable capabilities exist. Preview consequential changes and make supported undo/recovery and output limitations clear.

## Placement is flexible

The user explicitly clarified that nothing is 100 percent locked to a location. Exact tool placement, grouping, panel arrangement, labels and detailed layouts are proposals, not immutable requirements. Improve them when there is a clear usability reason, especially evidence from actual user testing. Explain meaningful departures from the baseline and their benefit. Keep the philosophy stable while refining the interface; do not use flexibility as a reason for unrelated redesign or feature expansion.

The attached notes are a full reference of ideas, examples and eventual capabilities, not a fully specified screen layout or proof of implementation. Existing mint-palette and mockup references are design inputs; they do not fix every pixel. A shared mockup and task flows should make the next UI changes concrete for review.

## Scope and sequencing

This baseline guides future design and development. It does not authorize immediate replacement of shared app architecture, change agent ownership, or start every feature mentioned in the reference. Main-app reliability and human testing remain the current priority. Bluebeam-specific expansion/workspace work and the 30 first-update Add-ons retain their existing deferral. Science/Data/Research/Engineering examples retain their own feature plans and acceptance gates; a workspace name does not mark them built or bring them into the current release.

Current Drawing/Documents/Pages/More room names are the existing implementation, not the new product-level workspace taxonomy. The integrator should map existing tools into the four connected workspaces as part of a coordinated UI plan, preserving functionality and shared-file rules. Codex owns reader and assigned PDF tools; Claude owns shell/editor and integration until explicitly reassigned.

## Sources and next coordination

- [Full user-supplied UI reference](intake/UI-DESIGN-DIRECTION-USER-SUPPLIED-2026-10-15.md), preserved verbatim from the attachment.
- User approval in this conversation, October 15: the philosophy is the official baseline; change direction for good reasons, especially user-testing evidence; individual placements may improve.
- Earlier [UI integration record](UI-INTEGRATION-AND-FINAL-SCOPE-2026-10-11.md) and [reference mockup](reference/forma-document-workspace-mockup.html) remain historical/design inputs. This approval clarifies the future four-workspace direction without rewriting their historical claims.

Integrator request: link this baseline and full reference from the master plan, then prepare one coordinated UI mockup/task-flow plan before moving shared navigation. Do not claim Claude has read this until acknowledged. No app source or behavior changed in this documentation update.
