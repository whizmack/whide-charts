# Interface Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct vertical, baseline and optical centering across the complete compact workspace while preserving every existing control height and layout dimension.

**Architecture:** Introduce a small set of alignment tokens/primitives in the existing host and vendor stylesheets, then apply them to each existing control family. Keep host chrome and patched OpenCharts ownership separate; package vendor changes through the pinned patch/tarball workflow.

**Tech Stack:** React 19, strict TypeScript, vanilla CSS, Vite 8, patched OpenCharts 0.3.0, Vitest, FastAPI.

**Spec:** `docs/superpowers/specs/2026-10-26-interface-alignment-design.md`

## Global Constraints

- Preserve current compact control and bar heights; alignment changes happen inside existing boxes.
- Preserve the fixed 40 px drawing rail, chart zoom/pan, layouts, persistence and all drawing behavior.
- Use the canonical screenshots in `docs/reference/tradingview/README.md` as the visual reference.
- Do not add dependencies, animations, Favorites, unrelated redesigns or a desktop wrapper.
- Product UI remains English.
- Do not commit: the agreed checkpoint remains Settings plus Favorites.

## Review Focus

- Asymmetric icons must look centered without moving their hit boxes.
- Numbers, units and select text must share a stable baseline at default and 200% zoom.
- Native input/select rendering must not reintroduce unequal vertical padding across browsers.
- 390 px width must not create page-level horizontal overflow or displace the fixed drawing rail.
- 1/2/4-chart layouts and modal portals must retain the same alignment and clipping behavior.

---

### Task 1: Host workspace alignment primitives

**Files:**
- Modify: `web/compare/preview.css`
- Modify only if required: `web/compare/WorkspaceChrome.tsx`
- Modify: `web/compare/WorkspaceChrome.test.tsx`

**Interfaces:**
- Consumes: existing workspace classes and the fixed 40 px rail invariant.
- Produces: consistent host control/icon/numeric alignment used by top toolbar, rails, popovers, watchlist, replay transport, status bar and study legends.

- [ ] **Step 1: Add failing structural tests**
  Extend `WorkspaceChrome.test.tsx` to assert the stable icon wrappers/accessibility names and numeric/time control classes needed by the alignment CSS, including top toolbar, both rails, replay controls and status bar.

- [ ] **Step 2: Run the focused test and confirm RED**
  Run: `npm test -- web/compare/WorkspaceChrome.test.tsx`
  Expected: FAIL because the shared alignment hooks are absent.

- [ ] **Step 3: Implement host alignment primitives**
  In `preview.css`, define explicit control line-height, icon box, SVG display, tabular-number and text-baseline rules. Apply them to existing selectors without changing bar/control dimensions. Add minimal semantic wrapper classes in `WorkspaceChrome.tsx` only where CSS cannot distinguish icon and text content reliably.

- [ ] **Step 4: Verify host controls**
  Run: `npm test -- web/compare/WorkspaceChrome.test.tsx && npm run typecheck`
  Expected: focused tests and typecheck pass.

### Task 2: OpenCharts and drawing-settings alignment

**Files:**
- Modify in pinned vendor source: `src/styles/global.css`
- Modify in pinned vendor source: `src/styles/app.css`
- Modify in pinned vendor source: `src/pages/trading/drawing-settings/settings.css`
- Modify only if required: drawing settings/control components and their existing tests
- Regenerate: `third-party/opencharts/controlled-chart.patch`
- Regenerate: `third-party/opencharts/dylanpersonguy-opencharts-0.3.0.tgz`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: existing OpenCharts control markup and drawing-settings component classes.
- Produces: centered icon/text/value boxes for chart settings, indicators, drawing menus, drawing toolbar and all drawing dialog controls.

- [ ] **Step 1: Add failing vendor tests**
  Extend existing component/settings tests with the minimum stable class/markup assertions for icon boxes, numeric values, line controls, checkbox rows and dialog actions. Preserve accessible names and keyboard semantics.

- [ ] **Step 2: Run focused vendor tests and confirm RED**
  Run the affected `src/__tests__/*.test.tsx` files in the pinned vendor clone.
  Expected: FAIL because the shared alignment hooks are absent.

- [ ] **Step 3: Implement vendor alignment rules**
  Add explicit line-height, centered internal boxes, consistent SVG sizing/stroke, select/input appearance and tabular numeric rules. Use at most 1 px optical offsets for documented asymmetric icons. Keep all current external dimensions.

- [ ] **Step 4: Verify and package vendor**
  Run vendor tests, `npm run typecheck`, `npm run build:lib`, `npm pack --ignore-scripts`, then regenerate the tracked patch/tarball and lockfile integrity. A clean pinned clone must apply the patch and reproduce the tarball byte-for-byte.

### Task 3: Production-browser visual matrix and handoff

**Files:**
- Create: `docs/2026-10-26-interface-alignment-verification.md`
- Modify: `docs/progress.md`

**Interfaces:**
- Consumes: the packaged host and vendor alignment rules from Tasks 1–2.
- Produces: current visual evidence for the user's review before Favorites.

- [ ] **Step 1: Run the complete deterministic suite**
  Run: `uv run pytest -q`, `npm test`, `npm run typecheck`, `npm run build`, and both host/vendor `git diff --check` checks.
  Expected: all deterministic checks pass; opt-in live tests may remain skipped.

- [ ] **Step 2: Exercise the built app**
  Start `./scripts/start.sh` and verify 1280×800 plus 390×720. Cover 1/2/4 charts, top toolbar, fixed rails, watchlist, chart settings, indicator UI, drawing menu, Rectangle and Position settings, selected-drawing toolbar, replay controls, status bar, keyboard focus and 200% zoom.

- [ ] **Step 3: Record measurable evidence**
  Record unchanged outer heights, centered icon/value boxes, zero page-level horizontal overflow, fixed rail x-position, modal reachability and console status in the verification document. Save representative screenshots when the preview supports it.

- [ ] **Step 4: Stop for user visual review**
  Leave the production build running at `http://127.0.0.1:8765/`. Do not start Favorites and do not commit until the user approves the alignment pass.
