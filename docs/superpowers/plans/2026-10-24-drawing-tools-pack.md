# TradingView-like Drawing Tools Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Brush, Highlighter, Path, Polyline, Curve, Price Range, Date Range, Date & Price Range, Anchored Text, and Note as native, persistent OpenCharts drawings.

**Architecture:** Extend the pinned OpenCharts drawing model and one exported tool catalog, then add deterministic geometry, resolver, renderer, hit-test, and manager support inside the vendor engine. Deliver the changes through the existing patch/tarball workflow; the host keeps its current drawing store and active-cell routing unchanged.

**Tech Stack:** React 19, TypeScript, Vitest, Canvas 2D, Lightweight Charts 4.2.3, OpenCharts 0.3.0, Vite 8.

**Spec:** `docs/superpowers/specs/2026-10-24-drawing-tools-pack-design.md`

## Global Constraints

- Preserve every existing `opencharts-preview:` key and drawing shape.
- Keep the fixed 40 px global drawing rail and active-cell ownership.
- No backend, Replay clock, Live feed, market data, or session API changes.
- Use pinned OpenCharts revision `d3fc63cc002e6e651801be6e952e7514e58fa5fe` plus the current controlled patch.
- Deliver vendor tests, patch, tarball, provenance README, lockfile integrity, host tests, and browser evidence together.
- Do not commit without explicit user authorization.

## Review Focus

- A dense freehand gesture must not create unbounded stored data or visibly change after reload; Task 1 pins deterministic simplification and serialization.
- A multi-point preview cancelled by Escape, blur, or disposal must leave no drawing or listener; Task 3 covers every termination path.
- Range labels at missing bars or mixed timeframes must derive from available timestamps without inventing data; Task 2 covers gaps and timestamp mapping.
- Moving or duplicating point-array drawings must preserve all relative geometry and cell-scoped history; Task 3 covers body and anchor edits.
- Existing drawings without any new optional fields must render and edit identically; Tasks 1–4 retain the existing regression suite and Task 5 verifies host persistence.

---

### Task 1: Extend the drawing model, catalog, and pure geometry

**Files:**
- Modify in vendor clone: `src/pages/trading/constants.ts`
- Create in vendor clone: `src/pages/trading/drawingToolCatalog.tsx`
- Modify in vendor clone: `src/pages/trading/DrawingToolRail.tsx`
- Modify in vendor clone: `src/lib/chart-plugins/drawing-tools/types.ts`
- Modify in vendor clone: `src/lib/chart-plugins/drawing-tools/geometry.ts`
- Create in vendor clone: `src/__tests__/drawing-tools-pack-geometry.test.ts`

**Interfaces:**
- Produces stable new `DrawingTool`/`DrawingType` IDs and optional `DrawingLine.points`, `controlTime`, and `controlPrice`.
- Produces exported `DRAWING_TOOL_GROUPS` metadata used by the rail and later Favorites.
- Produces pure helpers `simplifyPath(points: Pt[], tolerance: number): Pt[]`, `quadraticPoint`, `distToPolyline`, `distToQuadratic`, `translateDataPoints`, and `rangeStats(startTime, endTime, startPrice, endPrice, barTimes)`.

- [ ] Write failing table-driven tests for all ten IDs, catalog uniqueness, deterministic pixel-path duplicate removal/simplification, Bezier points/distances, data-point translation, and literal range results with ordered, reversed, and missing bar timestamps.
- [ ] Run the focused Vitest file and confirm RED from missing types/helpers/catalog.
- [ ] Implement the optional model fields, catalog, rail consumption, and smallest pure geometry helpers that satisfy the tests.
- [ ] Run the focused tests, vendor typecheck, and existing drawing tests; expect PASS.

### Task 2: Resolve, render, and hit-test all ten tools

**Files:**
- Modify in vendor clone: `src/lib/chart-plugins/drawing-tools/types.ts`
- Modify in vendor clone: `src/lib/chart-plugins/drawing-tools/resolve.ts`
- Modify in vendor clone: `src/lib/chart-plugins/drawing-tools/renderers.ts`
- Modify in vendor clone: `src/lib/chart-plugins/drawing-tools/hit-test.ts`
- Modify in vendor clone: `src/lib/chart-plugins/drawing-tools/drawings-primitive.ts`
- Create in vendor clone: `src/__tests__/drawing-tools-pack-rendering.test.ts`

**Interfaces:**
- Consumes Task 1 model and geometry helpers.
- Extends `ResolvedEntry` with resolved point arrays, control point, measurement label and label bounds.
- Produces deterministic render and hit regions for each new type without changing existing type branches.

- [ ] Write failing resolver/hit-test tests and canvas-command fixtures for every new type, including reversed anchors, missing bar indices, locked drawings, empty/one-point arrays, and selected handles.
- [ ] Run focused tests and confirm RED on unsupported types.
- [ ] Implement resolution, render branches, labels, hit regions, and handles one family at a time: freehand, multi-point, measurement, annotation.
- [ ] Run focused tests after each family, then the complete vendor suite and typecheck; expect PASS.

### Task 3: Implement placement and editing lifecycles

**Files:**
- Modify in vendor clone: `src/lib/chart-plugins/drawing-tools/manager.ts`
- Modify in vendor clone: `src/lib/chart-plugins/drawing-tools/types.ts`
- Create in vendor clone: `src/__tests__/drawing-tools-pack-manager.test.ts`

**Interfaces:**
- Consumes Task 1 catalog/model and Task 2 resolved geometry.
- Produces pointer/click/keyboard placement, preview, completion, cancellation, selection, per-point edit, and body translation for all ten tools.

- [ ] Write failing manager tests for each gesture, Polyline Enter/double-click, Curve three anchors, freehand simplification, annotation text callback, Escape/blur/dispose cleanup, magnet first/last anchor behavior, point edits, and body translation.
- [ ] Run the focused manager tests and confirm RED.
- [ ] Implement one family at a time without changing existing tool semantics; use data-space deltas for translation and keep freehand sampling bounded.
- [ ] Run focused tests after each family, then vendor drawing, magnet, pane, typecheck, and lint checks; expect PASS.

### Task 4: Integrate tool menus, annotations, and exported metadata

**Files:**
- Modify in vendor clone: `src/pages/trading/ChartPanel.tsx`
- Modify in vendor clone: `src/pages/trading/DrawingToolsOverlay.tsx`
- Modify in vendor clone: `src/index.ts`
- Create or modify in vendor clone: `src/__tests__/workspace-overlays.test.tsx`

**Interfaces:**
- Consumes manager-created Anchored Text/Note drawings and `DRAWING_TOOL_GROUPS`.
- Produces accessible grouped rail entries, existing-settings compatibility for the default `Text`/`Note` content, and exports the catalog/types for later settings/Favorites work.

- [ ] Write failing UI tests for all new labels and group menus, default `Text`/`Note` content reaching the existing settings path, catalog exports, and no change to existing settings/context overlays.
- [ ] Run focused overlay tests and confirm RED.
- [ ] Implement menu wiring, annotation defaults/settings compatibility, and exports, reusing existing portal/clipping patterns without adding the final settings redesign.
- [ ] Run focused tests, full vendor suite, typecheck, lint, and library build; expect PASS.

### Task 5: Package vendor changes and verify the host

**Files:**
- Modify: `third-party/opencharts/controlled-chart.patch`
- Modify: `third-party/opencharts/dylanpersonguy-opencharts-0.3.0.tgz`
- Modify: `third-party/opencharts/README.md`
- Modify: `package-lock.json`
- Modify if type compatibility requires it: `web/compare/ChartCell.tsx`
- Modify: `web/compare/data.test.ts`

**Interfaces:**
- Consumes the verified vendor clone from Tasks 1–4.
- Produces the installed 0.3.0 package and host-level persistence compatibility.

- [ ] Generate the complete patch from pinned revision, confirm it contains every new source and test, run `npm ci --ignore-scripts`, `npm run build:lib`, and `npm pack --ignore-scripts` in the clone.
- [ ] Replace the tarball, refresh host installation/lockfile integrity, and verify a clean host `npm ci --no-audit --no-fund` without changing unrelated dependencies.
- [ ] Add failing host tests that round-trip the new optional point/control/text fields and keep cell/mode/symbol drawing scope unchanged; confirm RED if the installed package/types omit them.
- [ ] Make only required host type adaptations, then run focused host tests, `npm test`, `npm run typecheck`, `npm run build`, `uv run pytest -q`, and `git diff --check`; expect PASS with only opt-in Binance tests skipped.

### Task 6: Browser verification and durable documentation

**Files:**
- Create: `docs/2026-10-24-drawing-tools-pack-verification.md`
- Modify: `docs/progress.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes the built host and verified vendor package.
- Produces reproducible browser evidence and repository guidance for the following settings/Favorites stages.

- [ ] Snapshot all original `opencharts-preview:` values before destructive QA.
- [ ] Create every new drawing at 1280×800; verify selection, edits, undo/redo, lock, duplicate, delete, pan/zoom, active-cell switching, layouts, maximize/restore, Replay rewind, and reload.
- [ ] Verify freehand density bounds, Polyline/Curve termination, range labels, annotation editing, menu clipping, console diagnostics, and 390px reachability.
- [ ] Restore and compare every original storage value, record exact automated/browser evidence and limitations, and update durable docs without claiming settings redesign or Favorites are complete.
- [ ] Request one fresh read-only review of the complete uncommitted worktree; fix Critical/Important findings with RED→GREEN tests and record deferred Minors.
