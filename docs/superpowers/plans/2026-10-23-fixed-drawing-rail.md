# Fixed Global Drawing Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the per-cell draggable drawing panel with one always-positioned global left rail that controls the active chart without moving across one, two, three, or four-chart layouts.

**Architecture:** `Preview` owns one shared drawing-rail portal host as a sibling immediately before the chart grid. The host is passed through `ChartCell` and `StudyWorkspace`; only the active cell gives it to `ChartPanel`, preserving existing drawing state and callbacks while moving only the rendered controls. Host CSS reserves a fixed 40 px workspace column, neutralizes vendor drag transforms, and removes drag and hide/show affordances without changing the vendor tarball.

**Tech Stack:** React 19, strict TypeScript, Vite 8, Vitest 4, OpenCharts 0.3.0, vanilla CSS.

**Spec:** `docs/superpowers/specs/2026-10-23-fixed-drawing-rail-design.md`

## Global Constraints

- Render exactly one global drawing-rail host outside `.workspace-grid` and every `.workspace-cell`.
- The rail stays at the same workspace-left position for layouts one, columns, rows, three, and four, through active-cell changes and maximize/restore.
- Only the active chart receives drawing-tool commands, keyboard scope, magnet state, stay mode, undo, and redo.
- Remove primary-rail drag and hide/show affordances; Favorites remain deferred.
- Keep every `opencharts-preview:` key and stored shape unchanged.
- Do not modify the OpenCharts vendor patch, tarball, lockfile, backend, Replay clock, Live feed, market data, drawings schema, pane geometry, or viewport persistence.
- Preserve the current uncommitted TradingView-shell work and do not commit without explicit user authorization.

## Review Focus

- During an active-cell change, the old cell must stop controlling the shared host before the new cell uses it; Task 1 tests active/inactive host selection and Task 2 verifies browser routing.
- During data loading or a chart remount, the fixed 40 px column must not collapse or move even if its portaled controls briefly remount; Task 1 pins the host outside data-dependent cells and Task 2 measures it during a symbol change.
- In rows layout, the global rail must span both rows rather than attach to the top cell; Task 2 verifies its bounds against `.workspace-main`.
- In four-chart layout, drawing menus from the fixed rail must target the active bottom-right chart and remain unclipped; Task 2 exercises that exact case.
- At 390 px, the added 40 px column must not cause document-level overflow or hide the right utility rail; Task 2 measures both edges and reachability.

---

### Task 1: Route one global rail host to the active chart

**Files:**
- Modify: `web/compare/WorkspaceChrome.tsx`
- Modify: `web/compare/WorkspaceChrome.test.tsx`
- Modify: `web/compare/Preview.tsx`
- Modify: `web/compare/ChartCell.tsx`
- Modify: `web/compare/StudyWorkspace.tsx`

**Interfaces:**
- Produces: `WorkspaceDrawingRailHost({setHost}: {setHost: (host: HTMLDivElement | null) => void}): ReactElement`.
- Produces: `activeDrawingRailHost(active: boolean, host: HTMLDivElement | null): HTMLDivElement | null`.
- `ChartCell` consumes `drawingRailHost: HTMLDivElement | null` and passes `activeDrawingRailHost(active, drawingRailHost)` to `StudyWorkspace`.
- `StudyWorkspace` consumes `drawingRailHost: HTMLDivElement | null` and passes it directly to `ChartPanel`; it no longer creates a per-cell host.

- [ ] **Step 1: Write failing host and routing tests**

Add tests to `WorkspaceChrome.test.tsx` that assert:

```ts
const host={} as HTMLDivElement
expect(renderToStaticMarkup(<WorkspaceDrawingRailHost setHost={()=>{}}/>)).toContain('class="drawing-rail-host"')
expect(renderToStaticMarkup(<WorkspaceDrawingRailHost setHost={()=>{}}/>)).toContain('aria-label="Drawing tools"')
expect(activeDrawingRailHost(false,host)).toBeNull()
expect(activeDrawingRailHost(true,host)).toBe(host)
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm test -- web/compare/WorkspaceChrome.test.tsx`

Expected: FAIL because both exports are missing.

- [ ] **Step 3: Implement the shared-host exports**

Add the two exact exports to `WorkspaceChrome.tsx`. Keep the host component stateless; its callback ref is owned by `Preview`.

- [ ] **Step 4: Move host ownership to `Preview`**

Add `const [drawingRailHost,setDrawingRailHost]=useState<HTMLDivElement|null>(null)` and render `WorkspaceDrawingRailHost` as the first child of `.workspace-main`, immediately before `.workspace-grid`. Pass the host to every `ChartCell`.

- [ ] **Step 5: Remove per-cell hosts and route only the active chart**

Extend `ChartCell` and `StudyWorkspace` props with the interface above. Remove `railHost`, `setRailHost`, and `<div className="drawing-rail-host"/>` from `StudyWorkspace`. Preserve all current `ChartPanel` drawing callbacks and set `drawingRailHost` from the new prop.

- [ ] **Step 6: Run focused tests and typecheck**

Run:

```sh
npm test -- web/compare/WorkspaceChrome.test.tsx web/compare/workspace.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Conditionally commit Task 1**

Only with explicit user authorization:

```sh
git add web/compare/WorkspaceChrome.tsx web/compare/WorkspaceChrome.test.tsx web/compare/Preview.tsx web/compare/ChartCell.tsx web/compare/StudyWorkspace.tsx
git commit -m "refactor: route one global drawing rail"
```

### Task 2: Fix the rail column and verify interactions

**Files:**
- Modify: `web/compare/preview.css`
- Modify if browser evidence requires an accessibility correction: `web/compare/WorkspaceChrome.tsx`
- Test: `web/compare/WorkspaceChrome.test.tsx`

**Interfaces:**
- Consumes: the single `.drawing-rail-host` emitted by Task 1.
- Produces: a fixed 40 px workspace-left column whose child toolbar cannot drag or hide.

- [ ] **Step 1: Capture the current floating-panel browser failure**

At 1280 x 800, record the current rail and grid bounds and confirm the rail overlays the first chart and exposes `Drag to move`. This is the behavioral RED for geometry that Vitest cannot compute.

- [ ] **Step 2: Implement the fixed host-column CSS**

Replace the existing absolute full-cell host rules with:

- `.drawing-rail-host` as `position:relative`, `flex:0 0 40px`, `width:40px`, full `.workspace-main` height, overflow-y auto, and a right divider;
- `.drawing-rail-host > div` pinned to the host with zero drag transform, no floating border/radius/shadow, and column-aligned controls;
- `[title="Drag to move"]`, `[title="Hide toolbar"]`, and a defensive `[title="Show drawing tools"]` hidden inside the host;
- menu portal styling unchanged.

Use host-scoped selectors strong enough to override OpenCharts mobile touch-target and positioning utilities. Do not use hashed vendor classes.

- [ ] **Step 3: Run focused tests, typecheck, and build**

Run:

```sh
npm test -- web/compare/WorkspaceChrome.test.tsx web/compare/workspace.test.ts
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 4: Verify fixed geometry at 1280 x 800**

In the built browser app, assert:

- exactly one `.drawing-rail-host` exists;
- its left edge equals `.workspace-main` left edge and its height equals `.workspace-main` height;
- `.workspace-grid` begins at the host's right edge;
- no visible `Drag to move`, `Hide toolbar`, or `Show drawing tools` action exists;
- attempted pointer movement over the former grip area does not change rail bounds.

- [ ] **Step 5: Verify active-chart routing for one, rows, and four charts**

Create a drawing in chart 1, switch active cell, choose a different drawing tool from the unchanged rail location, and create a drawing in the new active cell. Confirm drawings remain scoped. In rows and four-chart layouts, verify the rail bounds never move; open a group menu for the active bottom-right chart and confirm it is not clipped. Maximize and restore without moving the rail.

- [ ] **Step 6: Verify 390 px and persistence**

Confirm `scrollWidth === clientWidth`, the rail remains at x=0, the grid begins at x=40, and the right utility rail remains reachable. Reload after changing layout, active cell, drawing, magnet, and study; confirm the same storage keys and values return, then restore the original snapshot.

- [ ] **Step 7: Run the full deterministic suite**

Run:

```sh
uv run pytest -q
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: backend and frontend tests PASS; only the existing opt-in Binance tests remain skipped.

- [ ] **Step 8: Conditionally commit Task 2**

Only with explicit user authorization:

```sh
git add web/compare/preview.css web/compare/WorkspaceChrome.test.tsx web/compare/WorkspaceChrome.tsx
git commit -m "fix: pin drawing tools to workspace left edge"
```

### Task 3: Record the corrected shell behavior

**Files:**
- Modify: `docs/2026-10-23-tradingview-shell-verification.md`
- Modify: `docs/progress.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/2026-10-23-fixed-drawing-rail-design.md`

**Interfaces:**
- Consumes: fresh command output and browser measurements from Task 2.
- Produces: durable repository guidance that the primary rail is global and fixed, while movable Favorites are deferred.

- [ ] **Step 1: Update verification evidence**

Add exact automated counts, desktop and narrow rail bounds, active-chart routing evidence, clipping results, storage restoration, and any unverified limitation. Do not describe Favorites as implemented.

- [ ] **Step 2: Update durable guidance**

Update `docs/progress.md` and `AGENTS.md` to state that the primary drawing rail is one fixed workspace-level column and only a future Favorites toolbar may move. Mark the design status implemented only after verification succeeds.

- [ ] **Step 3: Inspect the complete worktree**

Run:

```sh
git status --short
git diff --check
git diff -- AGENTS.md docs web/compare
```

Expected: no generated files, vendor artifacts, storage data, or unrelated changes; the earlier uncommitted shell work remains intact.

- [ ] **Step 4: Request one final read-only review**

Review the complete uncommitted worktree against both the original shell spec and the fixed-rail spec. Resolve Critical and Important findings with tests; record Minor findings and limitations.

- [ ] **Step 5: Conditionally commit documentation**

Only with explicit user authorization:

```sh
git add AGENTS.md docs/2026-10-23-tradingview-shell-verification.md docs/progress.md docs/superpowers/specs/2026-10-23-fixed-drawing-rail-design.md docs/superpowers/plans/2026-10-23-fixed-drawing-rail.md
git commit -m "docs: record fixed global drawing rail"
```
