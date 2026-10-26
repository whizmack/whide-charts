# TradingView-like Workspace Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the existing OpenCharts host chrome into a compact TradingView-like top, left, right, and bottom workspace shell while preserving all current chart, Replay, Live, drawing, viewport, and persistence behavior.

**Architecture:** Keep `Preview.tsx` as the state owner and extract only stateless shell controls into `WorkspaceChrome.tsx`. The chart grid, `ChartCell`, OpenCharts provider, workspace model, and storage keys remain unchanged; CSS repositions the existing drawing rail and new host chrome around them. Automated server-render tests pin the accessible structure, while real-browser checks cover canvas layout, responsive behavior, persistence, and clipped overlays.

**Tech Stack:** React 19, strict TypeScript, Vite 8, Vitest 4, React DOM server rendering, Radix Icons, OpenCharts 0.3.0, vanilla CSS.

**Spec:** `docs/superpowers/specs/2026-10-23-tradingview-shell-design.md`

## Global Constraints

- Preserve the `opencharts-preview:` localStorage namespace and every existing stored shape.
- Do not modify Replay clock semantics, safe-prefix behavior, request generations, timestamp units, Live feed behavior, backend APIs, SQLite, Parquet, or market data.
- Do not modify the vendored OpenCharts tarball or patch for this host-shell pass.
- Preserve user zoom, pan, drawings, studies, appearance preferences, pane geometry, and chart viewports.
- Product UI copy remains English.
- Add only working utility actions; do not add inert TradingView-like controls.
- Keep the terminal flat, dark, compact, and low-motion; do not add marketing UI, gradients, large cards, or decorative animation.
- Verify at 1280x800 and approximately 390 CSS px without horizontal document overflow.
- Do not commit unless the user explicitly authorizes commits. The conditional commit steps below are skipped otherwise.

## Review Focus

- A previously saved workspace with watchlist, drawings, studies, split ratios, and viewports must reload without migration or reset; Task 4 includes a before/after localStorage browser test.
- Changing the active cell must make symbol, timeframe, indicators, maximize, and drawing keyboard scope target that cell; Task 2 adds a structural regression test and Task 4 exercises two- and four-chart browser scenarios.
- Maximizing and restoring must preserve the underlying layout and cell configurations while hiding redundant cell captions only in the one-visible-chart state; Task 2 pins the caption predicate and Task 4 verifies restore behavior.
- At approximately 390 px, top controls, right utilities, Replay controls, and maximize must remain reachable without document-level horizontal overflow; Task 4 includes an explicit narrow-browser measurement and interaction test.
- Popovers, drawing menus, and settings dialogs opened from right or bottom cells must not clip behind chart cells, watchlist, or utility rail; Task 4 exercises each overlay in the relevant cell positions.

---

### Task 1: Stateless workspace chrome components

**Files:**
- Create: `web/compare/WorkspaceChrome.tsx`
- Create: `web/compare/WorkspaceChrome.test.tsx`

**Interfaces:**
- Consumes: React event callbacks, `Symbol` and `Timeframe` from `web/replay.ts`, `Magnet` from `web/compare/studies.ts`, and Radix icon components already installed in `package.json`.
- Produces: `WorkspaceUtilityRail`, `ReplayTransport`, `LiveTransport`, `WorkspaceStatusBar`, `shouldShowCellCaption`, and `createWorkspaceBackup` for `Preview.tsx`.

Define `WorkspaceBackup` as the current five inputs (`workspace: Workspace`,
`liveWorkspace: CellConfig[]`, `drawings: DrawingStore`, `magnet: Magnet`, and
`stay: boolean`) and `WorkspaceBackupPayload` with the same values under the
existing downloaded JSON keys. Type Live health as `CellStatus['health']` and
component returns as `ReactElement` imported from React.

- [ ] **Step 1: Write failing server-render tests for accessible utility controls**

Create tests that render `WorkspaceUtilityRail` with no-op callbacks and assert markup contains buttons named `Watchlist`, `Chart layout`, `Chart settings`, and `Export workspace backup`; assert watchlist and layout expose their pressed or expanded state.

- [ ] **Step 2: Write failing server-render tests for Replay, Live, and status chrome**

Assert `ReplayTransport` renders the UTC input, `Go`, play or pause, next candle, speed selector, and `Paused · all charts · step 5m`. Assert `LiveTransport` renders live, stale, and connecting copy from its `health` prop. Assert `WorkspaceStatusBar` renders the mode/chart count, magnet state, storage error slot, UTC context, and OpenCharts attribution.

- [ ] **Step 3: Write failing pure tests for captions and backup payload compatibility**

Pin these results:

```ts
expect(shouldShowCellCaption(1, false)).toBe(false)
expect(shouldShowCellCaption(2, false)).toBe(true)
expect(shouldShowCellCaption(1, true)).toBe(false)
expect(createWorkspaceBackup(input)).toEqual({
  workspace: input.workspace,
  liveWorkspace: input.liveWorkspace,
  drawings: input.drawings,
  magnet: input.magnet,
  stay: input.stay,
})
```

- [ ] **Step 4: Run the focused tests and verify the missing module failure**

Run: `npm test -- web/compare/WorkspaceChrome.test.tsx`

Expected: FAIL because `./WorkspaceChrome` does not exist.

- [ ] **Step 5: Implement the stateless exports**

Create these exact exports in `WorkspaceChrome.tsx`:

```ts
export function shouldShowCellCaption(visibleCount: number, maximized: boolean): boolean
export function createWorkspaceBackup(input: WorkspaceBackup): WorkspaceBackupPayload
export function WorkspaceUtilityRail(props: WorkspaceUtilityRailProps): ReactElement
export function ReplayTransport(props: ReplayTransportProps): ReactElement
export function LiveTransport(props: LiveTransportProps): ReactElement
export function WorkspaceStatusBar(props: WorkspaceStatusBarProps): ReactElement
```

Keep them controlled and stateless. Use semantic buttons, form labels,
`aria-pressed`, `aria-expanded`, `title`, and existing English terminology.
`createWorkspaceBackup` must preserve the current downloaded JSON keys exactly.

- [ ] **Step 6: Run the focused tests**

Run: `npm test -- web/compare/WorkspaceChrome.test.tsx`

Expected: all tests PASS.

- [ ] **Step 7: Conditionally commit Task 1**

Only with explicit user authorization:

```sh
git add web/compare/WorkspaceChrome.tsx web/compare/WorkspaceChrome.test.tsx
git commit -m "test: define workspace shell controls"
```

### Task 2: Integrate the shell without changing state ownership

**Files:**
- Modify: `web/compare/Preview.tsx:1-78`
- Modify: `web/compare/WorkspaceChrome.test.tsx`

**Interfaces:**
- Consumes: all Task 1 exports; existing `Preview` state, `patchCell`, `changeMode`, `setLayout`, `seek`, `step`, and localStorage effects remain authoritative.
- Produces: top toolbar limited to market controls plus active-chart maximize, a center shell containing grid/watchlist/utility rail, conditional cell captions, and extracted bottom transport/status controls.

- [ ] **Step 1: Add a failing structure test for single- and multi-chart caption markup**

Add a small exported `CellCaption` presentational component to
`WorkspaceChrome.tsx`. Server-render it only when `shouldShowCellCaption`
returns true and assert its active-cell button and maximize button have unique
accessible names. Assert one visible chart returns no caption markup.

- [ ] **Step 2: Run the focused test and confirm the missing export failure**

Run: `npm test -- web/compare/WorkspaceChrome.test.tsx`

Expected: FAIL because `CellCaption` is not exported.

- [ ] **Step 3: Implement `CellCaption` and wire the new chrome into `Preview`**

Implement:

```ts
export function CellCaption(props: CellCaptionProps): ReactElement
```

Then update `Preview.tsx` to:

- keep the product mark, pair, timeframes, Indicators, Live/Replay, spacer, and active-chart maximize in `.compare-toolbar`;
- move watchlist, layout, settings, and export callbacks into `WorkspaceUtilityRail`;
- render the utility rail after the optional watchlist so the rail is always the outermost right edge;
- render `CellCaption` only when `shouldShowCellCaption(ids.length, Boolean(maximized))` is true;
- replace inline Replay, Live, footer, and backup construction with Task 1 components;
- keep all state setters, readiness rules, seek clamping, `step`, mode changes, storage writes, and active-cell handlers unchanged;
- keep layout and indicator popovers owned by `Preview`, changing only classes or anchors needed by the new shell.

- [ ] **Step 4: Run component and existing workspace tests**

Run: `npm test -- web/compare/WorkspaceChrome.test.tsx web/compare/workspace.test.ts`

Expected: all tests PASS.

- [ ] **Step 5: Run typecheck before styling**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Conditionally commit Task 2**

Only with explicit user authorization:

```sh
git add web/compare/Preview.tsx web/compare/WorkspaceChrome.tsx web/compare/WorkspaceChrome.test.tsx
git commit -m "refactor: structure TradingView-like workspace chrome"
```

### Task 3: Desktop visual composition

**Files:**
- Modify: `web/compare/preview.css:1-11`
- Test: `web/compare/WorkspaceChrome.test.tsx`

**Interfaces:**
- Consumes: the class names emitted by Task 2.
- Produces: the 1280x800 desktop composition for top toolbar, drawing rail boundary, grid, watchlist, utility rail, transport, footer, popovers, and reduced multi-cell captions.

- [ ] **Step 1: Extend the markup test with stable shell class assertions**

Assert the rendered components expose `.workspace-utility-rail`,
`.workspace-transport`, `.workspace-statusbar`, and `.cell-caption` classes.
These classes are the styling contract; do not test literal CSS values in
Vitest.

- [ ] **Step 2: Run the focused test and verify it fails for missing classes**

Run: `npm test -- web/compare/WorkspaceChrome.test.tsx`

Expected: FAIL on at least one missing shell class before the markup contract is completed.

- [ ] **Step 3: Implement desktop shell styling in existing CSS**

Update `preview.css` with these concrete targets:

- top toolbar approximately 40 px high with flat grouped controls and subtle
  dividers;
- utility rail 40 px wide at the outer right, with full-height dark surface,
  32 px icon buttons, active/open state, and a boundary on its left;
- watchlist approximately 240-260 px wide immediately left of the utility rail,
  with compact header and rows;
- Replay/Live transport approximately 40-44 px high and visually centered;
- status bar 24-28 px high;
- multi-chart captions 22-24 px high; no caption space for a single visible
  chart;
- drawing rail flush to the left workspace boundary with consistent surface,
  separators, hover, pressed, and menu states;
- neutral off-black surfaces, low-contrast dividers, tabular numeric text, and
  no gradients or decorative animation;
- popovers anchored clear of the utility rail and above chart cells.

Do not style through hashed vendor class names. Reuse the existing stable
`.drawing-rail-host` and host wrapper selectors.

- [ ] **Step 4: Run focused tests, typecheck, and build**

Run:

```sh
npm test -- web/compare/WorkspaceChrome.test.tsx web/compare/workspace.test.ts
npm run typecheck
npm run build
```

Expected: all commands PASS.

- [ ] **Step 5: Perform the first 1280x800 browser comparison**

Open `/` at 1280x800 and compare directly with reference screenshots 01, 02,
08, 09, and 10. Verify the top toolbar, left rail, right rail, closed/open
watchlist, Replay transport, and status bar form one aligned shell. Record any
remaining concrete spacing or clipping differences before Task 4.

- [ ] **Step 6: Conditionally commit Task 3**

Only with explicit user authorization:

```sh
git add web/compare/preview.css web/compare/WorkspaceChrome.test.tsx
git commit -m "feat: style compact TradingView-like workspace shell"
```

### Task 4: Responsive and interaction verification

**Files:**
- Modify: `web/compare/preview.css:7-11`
- Modify if a verified interaction defect requires it: `web/compare/Preview.tsx`
- Modify if a verified accessibility defect requires it: `web/compare/WorkspaceChrome.tsx`
- Test: `web/compare/WorkspaceChrome.test.tsx`

**Interfaces:**
- Consumes: the Task 2 DOM contract and Task 3 desktop styles.
- Produces: reachable controls and preserved interactions at desktop, multi-chart, watchlist, and approximately 390 px layouts.

- [ ] **Step 1: Add a failing accessible-name regression test for every icon-only action**

Render the top maximize action, utility rail, Replay icon controls, and cell
caption. Assert every icon-only button has an `aria-label` and `title`, and no
button renders with an empty accessible name.

- [ ] **Step 2: Run the focused test and verify any missing label or title fails**

Run: `npm test -- web/compare/WorkspaceChrome.test.tsx`

Expected: FAIL if any icon-only control lacks either attribute; otherwise make
the test fail first by asserting the exact approved label set before completing
the markup.

- [ ] **Step 3: Implement responsive CSS and accessibility corrections**

At widths below 900 px, collapse text labels before controls and reduce
watchlist width. At widths below 650 px, keep the right rail visible, make the
watchlist an overlay to its left, allow the Replay transport to wrap compactly,
and keep the timeframe group reachable without document overflow. Preserve
visible focus rings and minimum practical hit targets.

- [ ] **Step 4: Verify active-cell routing at two and four charts**

In a real browser:

1. select two columns, activate the right cell, then change symbol, timeframe,
   and indicator; confirm only that cell changes;
2. maximize the right cell and restore; confirm both cell configurations and
   the original split layout return;
3. select four charts, activate a bottom cell, open its drawing menu and study
   settings, and confirm neither clips behind siblings or the bottom chrome;
4. confirm drawing keyboard commands and magnet state affect only the active
   cell.

- [ ] **Step 5: Verify Replay, Live, watchlist, and overlay interactions**

At 1280x800, exercise Replay UTC seek, play, pause, next candle, each speed,
and switch Replay -> Live -> Replay. Open and close watchlist, layout, settings,
indicator menu, and drawing flyout. Confirm the right rail stays visible, the
chart resizes with the docked watchlist, Replay time is retained, and the
console has no unexpected error or warning.

- [ ] **Step 6: Verify persistence without changing the storage contract**

Before interaction, capture every `opencharts-preview:` localStorage value.
Change layout, watchlist, a drawing, a study, pane size, and viewport; reload and
confirm they return. Confirm no renamed or replacement storage keys were added.
Restore the original captured values and reload before finishing browser QA.

- [ ] **Step 7: Verify the approximately 390 px layout**

Measure `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
Confirm pair, timeframes, Indicators, Live/Replay, maximize, all four utility
actions, Replay seek/play/step/speed, and chart maximize remain reachable by
keyboard or pointer. Open the watchlist overlay and close it again.

- [ ] **Step 8: Run the full frontend suite**

Run:

```sh
npm test
npm run typecheck
npm run build
```

Expected: deterministic tests PASS; the two opt-in Binance tests remain skipped
unless separately requested.

- [ ] **Step 9: Conditionally commit Task 4**

Only with explicit user authorization:

```sh
git add web/compare/Preview.tsx web/compare/WorkspaceChrome.tsx web/compare/WorkspaceChrome.test.tsx web/compare/preview.css
git commit -m "fix: preserve workspace controls across responsive layouts"
```

### Task 5: Verification record and repository guidance

**Files:**
- Create: `docs/2026-10-23-tradingview-shell-verification.md`
- Modify: `docs/progress.md`
- Modify: `AGENTS.md:28-36`

**Interfaces:**
- Consumes: actual command output and browser observations from Tasks 3 and 4.
- Produces: current verification evidence and removal or replacement of the completed “next UI step” instruction.

- [ ] **Step 1: Run backend regression tests**

Run: `uv run pytest -q`

Expected: all backend tests PASS. Record the exact count and warnings rather
than copying an older report.

- [ ] **Step 2: Re-run final frontend verification**

Run:

```sh
npm test
npm run typecheck
npm run build
```

Expected: all deterministic checks PASS. Record exact counts and skipped tests.

- [ ] **Step 3: Write the verification report from fresh evidence**

Create `docs/2026-10-23-tradingview-shell-verification.md` with:

- changed shell areas and explicit non-changes;
- exact automated command results;
- desktop, multi-chart, watchlist, Replay/Live, drawing, settings, persistence,
  narrow-width, and console observations;
- any limitation that remains, including anything not exercised against the
  real exchange.

- [ ] **Step 4: Update progress and the completed AGENTS instruction**

Append a concise 2026-10-23 entry to `docs/progress.md`. Replace the stale
“Nejbližší UI krok (zatím nezačatý)” block in `AGENTS.md` with a short completed
state and a link to the new verification report, or remove it if the surrounding
guidance already states the durable rule.

- [ ] **Step 5: Inspect the final diff and preserve unrelated work**

Run:

```sh
git status --short
git diff --check
git diff -- AGENTS.md docs web/compare
```

Expected: no whitespace errors, no generated `dist/` or dependency changes,
and no unrelated user changes overwritten. The pre-existing uncommitted
`AGENTS.md` guidance must be intentionally updated, not discarded.

- [ ] **Step 6: Conditionally commit documentation**

Only with explicit user authorization:

```sh
git add AGENTS.md docs/2026-10-23-tradingview-shell-verification.md docs/progress.md docs/superpowers/specs/2026-10-23-tradingview-shell-design.md docs/superpowers/plans/2026-10-23-tradingview-shell.md
git commit -m "docs: record TradingView shell verification"
```
