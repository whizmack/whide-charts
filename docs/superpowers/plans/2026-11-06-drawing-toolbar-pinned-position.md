# Drawing Toolbar Pinned Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep one independently movable drawing toolbar position per chart cell, regardless of drawing geometry or selection changes.

**Architecture:** `ChartPanel` owns the toolbar's chart-local top-left position. It initializes that position from the first selected drawing, then preserves it across geometry and selection changes. `DrawingFloatingToolbar` receives that position, clamps it to the current cell, and reports movement from its own grip.

**Tech Stack:** React, TypeScript, OpenCharts 0.3.0 vendor patch, Vitest, Vite.

**Spec:** `docs/superpowers/specs/2026-11-06-drawing-toolbar-pinned-position.md`

## Global Constraints

- Keep one chart-cell position across drawing moves, resizes, and selection changes.
- Move the toolbar only through its own drag grip.
- Keep it clamped inside the chart cell when the cell is resized or moved.
- Do not persist toolbar coordinates across reloads or sessions.
- Keep the existing OpenCharts vendor source pinned at revision `d3fc63cc002e6e651801be6e952e7514e58fa5fe` and version `0.3.0`.
- Keep the selected drawing's contextual controls and drawing update behavior intact.
- Do not change Keep drawing mode or rectangle resize hit-testing.

## Review Focus

- Dragging or resizing any drawing leaves the toolbar at the same chart-local point; assert the toolbar `left` and `top` remain unchanged.
- Selecting a different drawing updates toolbar controls while preserving its point; rerender with a different drawing id and type in the component test.
- Dragging from the toolbar grip moves it; assert the callback receives the chart-local point plus pointer delta.
- A keyboard-focused grip moves with arrow keys, uses a larger Shift step, and exposes its instructions to assistive technology.
- Moving or resizing the chart cell keeps the toolbar inside the new bounds; test top-left clamping at both chart edges.
- Moving a pane above or below the price chart can change `bounds.top` without resizing the chart; assert layout observation refreshes the viewport origin.
- A wider contextual toolbar remains clamped in a narrow cell; cover a 390px cell with the existing wide-toolbar fixture.

---

### Task 1: Pin and move the contextual toolbar independently

**Files:**
- Modify vendor source in the pinned OpenCharts clone: `src/pages/trading/ChartPanel.tsx`
- Modify vendor source in the pinned OpenCharts clone: `src/pages/trading/drawing-settings/DrawingFloatingToolbar.tsx`
- Modify vendor source in the pinned OpenCharts clone: `src/pages/trading/drawing-settings/toolbarModel.ts`
- Modify vendor source in the pinned OpenCharts clone: `src/pages/trading/drawing-settings/toolbarLayoutObserver.ts`
- Modify vendor tests: `src/__tests__/drawing-floating-toolbar.test.tsx`, `src/__tests__/drawing-settings-model.test.ts`, `src/__tests__/drawing-tools-pack-placement.test.ts`, and `src/__tests__/drawing-toolbar-layout-observer.test.ts`
- Modify repo artifact: `third-party/opencharts/controlled-chart.patch`
- Modify repo artifact: `third-party/opencharts/dylanpersonguy-opencharts-0.3.0.tgz`
- Modify repo metadata: `package-lock.json` and `third-party/opencharts/README.md`

**Interfaces:**
- `DrawingFloatingToolbar` consumes `position: ToolbarPoint` in chart-local coordinates, `bounds: ToolbarBounds`, and `onPositionChange(position: ToolbarPoint): void`.
- `ChartPanel` initializes the chart-local position from the selected drawing only while no toolbar position exists for that chart cell.
- `preserveDrawingToolbarPosition(current: ToolbarPoint | null, initial: ToolbarPoint | null): ToolbarPoint | null` returns `current` when present and otherwise returns `initial`.
- `clampDrawingToolbarPosition(position, bounds, size): ToolbarPoint` returns the clamped chart-local top-left position.

- [x] **Step 1: Add failing tests** in `drawing-settings-model.test.ts` for `preserveDrawingToolbarPosition` keeping the current point when selection supplies a new initial candidate. In `drawing-floating-toolbar.test.tsx`, assert that the controlled position stays fixed when drawing controls change, pointer and keyboard grip movement, and a drag after cell clamping starts from the visible point. Add `clampDrawingToolbarPosition` tests for the left/top and right/bottom cell edges. Test that a pane reorder updates bounds with unchanged chart dimensions.
- [x] **Step 2: Run focused tests** with `npm test -- src/__tests__/drawing-floating-toolbar.test.tsx src/__tests__/drawing-tools-pack-placement.test.ts`; confirm the new tests fail because the current API follows the drawing anchor.
- [x] **Step 3: Implement chart-local toolbar position** in `ChartPanel.tsx` and `DrawingFloatingToolbar.tsx`. Use `preserveDrawingToolbarPosition` to initialize from the drawing once, preserve through drawing/selection changes, update only from the toolbar grip, and reproject the local point through current cell bounds. Observe pane/cell layout mutations so position-only moves update those bounds.
- [x] **Step 4: Implement local clamping** in `toolbarModel.ts`; keep the toolbar visible inside the cell after cell movement/resizing and contextual control width changes.
- [x] **Step 5: Remove geometry-driven toolbar updates** from `DrawingToolsManager` callbacks and the prior transient-preview test, since the toolbar no longer follows drawing geometry.
- [x] **Step 6: Run vendor focused tests and package checks**: `npm test -- src/__tests__/drawing-floating-toolbar.test.tsx src/__tests__/drawing-tools-pack-placement.test.ts`, `npm run build:lib`, `npm pack --ignore-scripts`, and `node scripts/check-package.mjs`.
- [x] **Step 7: Regenerate the controlled patch and tarball**, update the OpenCharts README, calculate the tarball's SHA-512 integrity in `package-lock.json`, then run clean `npm ci`.
- [x] **Step 8: Verify the host and browser** with `npm test`, `npm run typecheck`, and `npm run build`; confirm the installed vendor bundle contains the position-based toolbar API. On a temporary origin, move a drawing body and confirm the toolbar stays put, move the toolbar by its grip, and reload to confirm its position is intentionally not persisted. Record observed results in `docs/2026-11-06-drawing-toolbar-pinned-position-verification.md`.
