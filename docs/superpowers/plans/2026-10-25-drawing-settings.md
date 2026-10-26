# TradingView-like Drawing Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic OpenCharts drawing editor and selected-object toolbar with a polished, contextual TradingView-like system for every supported drawing family.

**Architecture:** Keep drawing geometry and selection inside the patched OpenCharts vendor. Split the large overlay into focused settings model, control, tab-content, dialog and toolbar modules; use an isolated draft session for modal preview/rollback and the existing immediate update path for floating-toolbar actions. Rebuild the pinned vendor patch and tarball, then verify host persistence and real browser behaviour.

**Tech Stack:** React 19, strict TypeScript, Lucide React, native `<dialog>`, OpenCharts 0.3.0, Lightweight Charts 4.2.3, Vitest, Vite 8.

**Spec:** `docs/superpowers/specs/2026-10-25-drawing-settings-design.md`

## Global Constraints

- Product UI copy remains English.
- The fixed 40 px workspace-level drawing rail is unchanged; Favorites remains out of scope.
- All new `DrawingLine` fields are optional and existing persisted drawings remain valid.
- Position is drawing metadata only and never calls an order or trading API.
- Preserve Replay cutoff visibility, Live/Replay isolation, active-cell routing and scoped undo/redo.
- Dialogs and popovers render outside clipped chart cells and remain reachable at 1280×720 and about 390 px.
- Use the existing npm/uv lockfiles and locally patched OpenCharts package; add no UI framework.
- Do not commit during this plan. The user requested one later commit after Settings and Favorites.

## Review Focus

- Temporarily empty or malformed numeric input must never persist `NaN`/infinity; Task 2 validates and blocks OK.
- Selection change or external deletion while the dialog is open must discard the stale draft; Task 2 covers both paths.
- Long/short stop and target ordering must validate in the correct direction and derived metrics must stay finite; Task 1 covers boundary inputs.
- Dialog and toolbar must remain inside the viewport in bottom/right multi-chart cells and at 200% zoom; Tasks 2 and 4 include geometry tests and browser checks.
- Old drawings missing every new optional property must render, edit and export with current defaults; Tasks 1 and 5 cover backward compatibility.

---

### Task 1: Settings schema, normalization and position calculations

**Files:**
- Modify in patched vendor: `src/pages/trading/constants.ts`
- Modify in patched vendor: `src/pages/trading/drawingStyles.ts`
- Create in patched vendor: `src/pages/trading/drawingSettingsModel.ts`
- Test in patched vendor: `src/__tests__/drawing-settings-model.test.ts`

**Interfaces:**
- Consumes: existing `DrawingLine`, `DrawingType`, `StylePatch`, `pickStyle` and position geometry fields.
- Produces: `DrawingSettingsDraft`, `DrawingSettingsErrors`, `normalizeDrawingSettings(drawing)`, `validateDrawingSettings(draft)`, `positionMetrics(draft)`, `settingsTabsFor(type)` and expanded style template persistence.

- [ ] **Step 1: Write failing model tests**

  Cover default normalization for a legacy Rectangle and Position; tab sets for every drawing family; long and short position metrics; zero/negative/non-finite account, lot, leverage and risk inputs; stop/entry/target ordering; and `pickStyle` including all visual fields while excluding anchors, IDs, visibility and position account metadata.

- [ ] **Step 2: Run the focused test and confirm RED**

  Run: `npm test -- src/__tests__/drawing-settings-model.test.ts`

  Expected: failure because the model functions and optional settings fields do not exist.

- [ ] **Step 3: Extend `DrawingLine` with optional presentation and position metadata**

  Add exact optional properties from the spec for opacity, secondary/range colours, text alignment/placement, compact/full labels, position account/lot/leverage/risk unit/quantity precision/stats and optional Fibonacci level presentation. Keep every old field and serialized shape compatible.

- [ ] **Step 4: Implement pure normalization, validation, tabs and derived metrics**

  Keep calculations deterministic and independent of React. Derived values must use drawing anchors as the source of truth and return finite values or explicit validation errors.

- [ ] **Step 5: Expand template/default style selection**

  Include visual-only fields and preserve the current local preference keys. Exclude geometry, visibility, alert state, identity and account/risk inputs.

- [ ] **Step 6: Run focused tests and vendor typecheck**

  Run: `npm test -- src/__tests__/drawing-settings-model.test.ts && npm run typecheck`

  Expected: all focused tests pass and TypeScript exits 0.

### Task 2: Portal modal and atomic draft lifecycle

**Files:**
- Create in patched vendor: `src/pages/trading/drawing-settings/DrawingSettingsDialog.tsx`
- Create in patched vendor: `src/pages/trading/drawing-settings/useDrawingSettingsDraft.ts`
- Create in patched vendor: `src/pages/trading/drawing-settings/settings.css`
- Modify in patched vendor: `src/pages/trading/DrawingToolsOverlay.tsx`
- Modify in patched vendor: `src/pages/trading/ChartPanel.tsx`
- Test in patched vendor: `src/__tests__/drawing-settings-dialog.test.tsx`

**Interfaces:**
- Consumes: Task 1 normalization/validation, selected `DrawingLine`, current timeframe and existing update/remove callbacks.
- Produces: `DrawingSettingsDialog({drawing,currentTf,onPreview,onCommit,onClose})` and `useDrawingSettingsDraft`; Cancel/X/Escape restore the original, OK emits one committed drawing.

- [ ] **Step 1: Write failing dialog lifecycle and accessibility tests**

  Assert document-level portal rendering, native dialog semantics, title and tab accessible names, initial focus, Tab containment, Escape/X/Cancel rollback, OK validation/commit, focus restoration, selection-change dismissal and deletion-safe dismissal. Assert invalid numeric drafts disable confirmation with an announced field error.

- [ ] **Step 2: Run the focused test and confirm RED**

  Run: `npm test -- src/__tests__/drawing-settings-dialog.test.tsx`

  Expected: failure because the portal dialog and draft hook do not exist.

- [ ] **Step 3: Implement the draft hook**

  Signature: `useDrawingSettingsDraft(drawing: DrawingLine, onPreview: (drawing: DrawingLine) => void, onCommit: (drawing: DrawingLine) => void, onClose: () => void)`. Maintain immutable original and editable draft; coalesce preview updates; rollback on dismissal; commit exactly once.

- [ ] **Step 4: Implement the native portal dialog shell**

  Use `createPortal` and `<dialog>`, a draggable bounded panel, scrollable body, sticky footer and `Template / Cancel / OK` actions. Clamp width/height with CSS, preserve focus, and support reduced motion and forced-colours focus indication.

- [ ] **Step 5: Adapt `ChartPanel` callbacks for preview versus commit**

  Preview updates the renderer without appending undo/persistence history; commit produces one normal drawing update. Closing on selection change restores the correct object and cannot overwrite a newly selected drawing.

- [ ] **Step 6: Run focused tests and vendor typecheck**

  Run: `npm test -- src/__tests__/drawing-settings-dialog.test.tsx && npm run typecheck`

  Expected: focused tests and typecheck pass.

### Task 3: Contextual tabs and polished controls

**Files:**
- Create in patched vendor: `src/pages/trading/drawing-settings/SettingsControls.tsx`
- Create in patched vendor: `src/pages/trading/drawing-settings/StyleTab.tsx`
- Create in patched vendor: `src/pages/trading/drawing-settings/TextTab.tsx`
- Create in patched vendor: `src/pages/trading/drawing-settings/CoordinatesTab.tsx`
- Create in patched vendor: `src/pages/trading/drawing-settings/VisibilityTab.tsx`
- Create in patched vendor: `src/pages/trading/drawing-settings/PositionInputsTab.tsx`
- Modify in patched vendor: `src/pages/trading/drawing-settings/DrawingSettingsDialog.tsx`
- Modify in patched vendor: `src/lib/chart-plugins/drawing-tools/renderers.ts`
- Modify in patched vendor: `src/lib/chart-plugins/drawing-tools/resolve.ts`
- Test in patched vendor: `src/__tests__/drawing-settings-tabs.test.tsx`
- Test in patched vendor: `src/__tests__/drawing-settings-rendering.test.ts`

**Interfaces:**
- Consumes: Task 1 draft/model functions and Task 2 dialog shell.
- Produces: shared `SettingsField`, `LineControl`, `ColorControl`, `CheckboxField`, `NumberField`, `SelectField`, `TabList`; family-specific tab content that updates `DrawingSettingsDraft`.

- [ ] **Step 1: Write failing family matrix tests**

  Assert exact tabs and representative fields for line/freehand, Rectangle/shape, Fibonacci, range, text/note and long/short Position. Assert every icon-only control has a name, labels target inputs, tabs use roving keyboard focus, and irrelevant fields are absent.

- [ ] **Step 2: Write failing rendering tests for new visual fields**

  Assert Rectangle background/border opacity and text alignment, range positive/negative colours and labels, Position stop/target colours and stat preferences, and legacy fallbacks.

- [ ] **Step 3: Run both focused suites and confirm RED**

  Run: `npm test -- src/__tests__/drawing-settings-tabs.test.tsx src/__tests__/drawing-settings-rendering.test.ts`

- [ ] **Step 4: Build shared controls and tab navigation**

  Match the reference density: 36 px fields, consistent label/control columns, contextual colour/opacity popovers, line preview triggers, 32 px icon controls and 2 px focus-visible treatment. Use native inputs/selects/buttons and no second styling framework.

- [ ] **Step 5: Implement family-specific Style, Text, Coordinates, Visibility and Inputs content**

  Rectangle and Position are fidelity baselines. Coordinate rows follow deterministic anchor order; freehand exposes count plus first/last points; Curve exposes its control anchor; Position exposes functional inputs and derived readouts.

- [ ] **Step 6: Update renderer and readout semantics**

  Apply new optional visual properties with old defaults. Keep draw/hit-test geometry unchanged unless the visible setting explicitly affects it.

- [ ] **Step 7: Run focused tests, full vendor tests and typecheck**

  Run: `npm test -- src/__tests__/drawing-settings-tabs.test.tsx src/__tests__/drawing-settings-rendering.test.ts && npm test && npm run typecheck`

  Expected: all deterministic vendor tests pass; only the existing opt-in live test is skipped.

### Task 4: Contextual selected-drawing toolbar

**Files:**
- Create in patched vendor: `src/pages/trading/drawing-settings/DrawingFloatingToolbar.tsx`
- Create in patched vendor: `src/pages/trading/drawing-settings/toolbarModel.ts`
- Modify in patched vendor: `src/pages/trading/DrawingToolsOverlay.tsx`
- Modify in patched vendor: `src/pages/trading/ChartPanel.tsx`
- Test in patched vendor: `src/__tests__/drawing-floating-toolbar.test.tsx`

**Interfaces:**
- Consumes: selected drawing, chart-cell bounds and existing update/clone/remove/settings callbacks.
- Produces: `toolbarControlsFor(drawing)`, `clampDrawingToolbar(anchor,bounds,size)`, and a portaled/draggable contextual toolbar whose inline edits remain immediate one-step changes.

- [ ] **Step 1: Write failing toolbar model and component tests**

  Assert contextual control sets for Rectangle, Position, line, freehand, range and text; top/bottom fallback and horizontal clamping; 390 px overflow behaviour; accessible button names; drag only from the grip; lock/delete/settings behaviour.

- [ ] **Step 2: Run the focused test and confirm RED**

  Run: `npm test -- src/__tests__/drawing-floating-toolbar.test.tsx`

- [ ] **Step 3: Implement pure toolbar control and placement models**

  Return stable control IDs and geometry independent of React. Never place the toolbar outside the active chart bounds or over the fixed workspace rails.

- [ ] **Step 4: Implement the contextual toolbar UI**

  Match the reference near-black surface, compact groups, grip, line/fill/text triggers, settings/lock/delete and overflow. Use one Lucide outline weight and explicit active states.

- [ ] **Step 5: Integrate selection-anchor positioning in `ChartPanel`**

  Resolve a screen anchor from selected drawing geometry and update on pan, zoom, resize and multi-chart layout change. Preserve current inline update history semantics.

- [ ] **Step 6: Run focused tests, full vendor tests and typecheck**

  Run: `npm test -- src/__tests__/drawing-floating-toolbar.test.tsx && npm test && npm run typecheck`

### Task 5: Packaging, host persistence and end-to-end verification

**Files:**
- Modify: `third-party/opencharts/controlled-chart.patch`
- Modify: `third-party/opencharts/dylanpersonguy-opencharts-0.3.0.tgz`
- Modify: `third-party/opencharts/README.md`
- Modify: `package-lock.json`
- Modify: `web/compare/WorkspaceChrome.test.tsx`
- Create: `docs/2026-10-25-drawing-settings-verification.md`
- Modify: `docs/progress.md`

**Interfaces:**
- Consumes: complete patched vendor source from Tasks 1–4.
- Produces: reproducible checked-in patch/tarball, matching lockfile integrity, host persistence coverage and browser evidence.

- [ ] **Step 1: Add failing host JSON roundtrip tests**

  Extend the workspace backup fixture with legacy drawings and all new style/Position metadata. Assert stringify/parse preserves every optional field and does not change existing entries.

- [ ] **Step 2: Run the focused host test and confirm expected coverage gap**

  Run: `npm test -- web/compare/WorkspaceChrome.test.tsx`

- [ ] **Step 3: Run vendor build and rebuild controlled artifacts**

  Run vendor `npm test`, `npm run typecheck`, `npm run build:lib`, `npm pack --ignore-scripts`; regenerate the complete binary patch and tarball, update provenance and SHA-512 lockfile integrity.

- [ ] **Step 4: Prove reproducibility from the pinned revision**

  In a fresh temporary clone at `d3fc63cc002e6e651801be6e952e7514e58fa5fe`, apply the tracked patch, run clean `npm ci`, build and pack. Require the rebuilt tarball SHA-256 to equal the tracked tarball.

- [ ] **Step 5: Run the complete host verification suite**

  Run: `uv run pytest -q && npm test && npm run typecheck && npm run build`

  Expected: 32 backend tests pass with only the known Starlette warning; all deterministic frontend tests pass; build exits 0.

- [ ] **Step 6: Restart and verify the built application in the collaborative browser**

  Run `./scripts/start.sh`, open `http://127.0.0.1:8765/`, and exercise Rectangle and Position reference flows plus one representative of every other family. Verify Cancel/OK/undo/redo, 1/2/4 charts, maximize, 1280×720, ~390 px, keyboard-only focus, 200% zoom, reload persistence and no horizontal page overflow.

- [ ] **Step 7: Restore browser state and record evidence**

  Restore the user's original localStorage snapshot and chart layout. Record commands, observed counts, screenshots/limitations and the remaining Favorites scope in the verification document. Run `git diff --check` excluding only literal whitespace inside the generated patch.
