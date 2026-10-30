# TradingView-style Chart Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the four core Whide Charts chart-settings tabs match TradingView's supplied desktop references in their controls, chart effects, interactions, and compact dark presentation.

**Architecture:** Extend the pinned OpenCharts preference model and chart renderer so the native dialog remains the single source of truth shared by all workspace cells. Add a non-persistent preference preview for modal drafts, local named settings templates, and host legend wiring. Build and package the pinned vendor source through the existing patch/tarball workflow.

**Tech Stack:** React 19, strict TypeScript, OpenCharts 0.3.0, Lightweight Charts 4.2.3, Vitest, React Testing Library, Electron.

**Spec:** `docs/superpowers/specs/2026-10-27-tradingview-chart-settings-design.md`

## Global Constraints

- The supplied screenshots in `docs/reference/tradingview/README.md` are the source of truth for settings composition and density.
- Product UI labels remain English.
- Native chart appearance preferences stay shared across all workspace cells and use the existing preference storage namespace.
- UTC remains the replay/data time basis; chart timestamps remain epoch seconds only at the renderer boundary.
- Preserve saved chart zoom, pan, drawings, Replay state, and existing preferences; appearance changes must update chart options in place instead of recreating charts.
- The fixed left drawing rail remains 40 px and does not move or change.
- Do not add fake orders, broker connectivity, Pine, external alerts, or account-backed challenge controls.
- Vendor changes start from OpenCharts revision `d3fc63cc002e6e651801be6e952e7514e58fa5fe`; update source patch, built tarball, provenance README, and host lockfile together.
- Do not commit unless the user explicitly asks.

## Review Focus

1. Legacy stored `candleUpColor`, `candleDownColor`, and `showGrid` values must map safely to new controls. **Test:** `migrates legacy candle colors and combined grid settings` in `chart-settings-preferences.test.ts`.
2. A non-UTC display timezone must not move UTC Replay cutoffs or mutate candle timestamps. **Test:** `formats axis labels in the selected timezone without changing timestamps` in `chart-settings-options.test.ts`.
3. Updating colors, scale settings, or axis formatting must not recreate price/oscillator charts or reset their viewports. **Test:** `applies settings through chart options without rebuilding the chart` in `chart-settings-rendering.test.tsx`; confirm viewport in Electron.
4. Cancel, Escape, and backdrop dismissal must discard draft edits; OK must persist them once. **Test:** `discards chart settings draft on cancel and commits once on ok` in `chart-settings-dialog.test.tsx`.
5. The shared preferences must update legends and all visible price/oscillator panes in 1/2/4-cell workspace layouts. **Test:** `renders shared study legend visibility preferences` in `web/compare/StudyWorkspace.test.tsx`.

---

### Task 1: Extend preference compatibility and chart-option mapping

**Files:**
- Modify upstream `src/hooks/useChartPreferences.ts`
- Modify upstream `src/pages/trading/constants.ts`
- Create upstream `src/pages/trading/chartSettingsOptions.ts`
- Create upstream `src/__tests__/chart-settings-preferences.test.ts`
- Create upstream `src/__tests__/chart-settings-options.test.ts`

**Interfaces:**
- `ChartPreferences` remains the persisted workspace-wide settings model.
- Add typed values for independent bullish/bearish candle body, border, and wick colors; previous-close bar coloring; independent vertical/horizontal grid visibility and colors; status-line visibility; display timezone and price precision; price-scale mode/side and margins; time-scale formats and right offset; watermark mode; crosshair style; scale text size and scale border visibility.
- Export `buildChartSettingsOptions(prefs: ChartPreferences, colors: ChartColors, timeframe: Timeframe): DeepPartial<ChartOptions>` and `buildCandlestickSettingsOptions(prefs: ChartPreferences, colors: ChartColors, pipDigits: number, minMove: number): DeepPartial<CandlestickSeriesOptions>` from `chartSettingsOptions.ts`.
- New preference keys use existing safe defaults. If a new candle-color key is absent, use the existing up/down override as the fallback for body, border, and wick. If either independent grid key is absent, initialize it from legacy `showGrid`.

- [x] **Step 1: Write failing preference migration tests**

  Add `migrates legacy candle colors and combined grid settings`, asserting old candle colors populate each corresponding new candle control and old `showGrid: false` disables both new grid axes. Add `uses safe defaults for absent or malformed settings`, asserting all new values resolve to defined defaults.

- [x] **Step 2: Run the preference tests and confirm they fail for the missing settings model**

  Run from the pinned upstream clone: `npm test -- src/__tests__/chart-settings-preferences.test.ts`
  Expected: FAIL because the new preference fields and normalization do not exist.

- [x] **Step 3: Write failing chart-option mapping tests**

  Add `maps independent candle colors to body, border, and wick options`, `maps vertical and horizontal grid preferences independently`, `maps scale, margins, crosshair, watermark, and time formatting options`, and `formats axis labels in the selected timezone without changing timestamps`.

- [x] **Step 4: Implement preference defaults and option builders**

  Update `ChartPreferences`, its persisted-key lists, and storage normalization. Keep existing keys for backward compatibility. Implement the two option builders and a pure formatter for display-only time labels. The formatter may change labels only; it must pass the numeric candle time through unchanged.

- [x] **Step 5: Run focused vendor tests**

  Run: `npm test -- src/__tests__/chart-settings-preferences.test.ts src/__tests__/chart-settings-options.test.ts`
  Expected: PASS, including legacy-key fallback and independent grid/candle options.

### Task 2: Apply settings in place across price and indicator charts

**Files:**
- Modify upstream `src/pages/trading/ChartPanel.tsx`
- Modify host `web/compare/StudyWorkspace.tsx`
- Create upstream `src/__tests__/chart-settings-rendering.test.tsx`
- Create host `web/compare/StudyWorkspace.test.tsx`

**Interfaces:**
- `ChartPanel` consumes the option builders from Task 1 and retains its existing chart instance when chart preferences change.
- `StudyWorkspace` continues to read shared settings through the exported `useChartPreferences()` hook and applies them to price and oscillator legends/panes.
- `StudyLegend` receives explicit display flags for title, inputs, values, and background.

- [x] **Step 1: Write failing rendering tests**

  Add `applies settings through chart options without rebuilding the chart`, using a mocked Lightweight Charts API to assert `applyOptions` updates the existing instance and `createChart` is not called again when a visual preference changes. Add `renders shared study legend visibility preferences`, asserting titles, inputs, values, and background are each controlled independently.

- [x] **Step 2: Run both new tests and confirm they fail**

  Run vendor: `npm test -- src/__tests__/chart-settings-rendering.test.tsx`
  Run host: `npm test -- web/compare/StudyWorkspace.test.tsx`
  Expected: FAIL because live option application and the settings-controlled legend fields do not exist yet.

- [x] **Step 3: Apply settings to the vendor price chart without chart recreation**

  Use `buildChartSettingsOptions` and `buildCandlestickSettingsOptions` for initial options and live `chart.applyOptions` / `series.applyOptions` updates. Remove preference-only color and display values from the chart-creation effect dependencies. Apply previous-close candle colors only to the already-safe candle array supplied to the renderer.

- [x] **Step 4: Apply shared settings to host legends and oscillator panes**

  In `StudyWorkspace.tsx`, apply chart appearance changes in place to existing oscillator chart instances. Render title, input, value, and background portions according to shared settings. Preserve the existing pane timestamps, geometry, and viewport while preferences change.

- [x] **Step 5: Run focused rendering tests**

  Run: `npm test -- src/__tests__/chart-settings-rendering.test.tsx` from the vendor clone and `npm test -- web/compare/StudyWorkspace.test.tsx` from the host.
  Expected: both PASS; the viewport-preservation behavior remains covered by the later Electron check.

### Task 3: Add transactional settings preview and local templates

**Files:**
- Modify upstream `src/hooks/useChartPreferences.ts`
- Create upstream `src/pages/trading/chartSettingsModel.ts`
- Create upstream `src/pages/trading/chartSettingsTemplates.ts`
- Create upstream `src/__tests__/chart-settings-preview.test.ts`
- Create upstream `src/__tests__/chart-settings-templates.test.ts`

**Interfaces:**
- Export `setChartPreferencesPreview(prefs: ChartPreferences | null): void`, `commitChartPreferencesPreview(prefs: ChartPreferences): void`, and `discardChartPreferencesPreview(): void`.
- `useChartPreferences()` returns persistent preferences merged with the in-memory preview when one exists. Preview state is process-local and is never written to storage.
- Export `ChartSettingsTemplate` with `{ id: string; name: string; preferences: Partial<ChartPreferences> }`, `readChartSettingsTemplates(): ChartSettingsTemplate[]`, `saveChartSettingsTemplate(name: string, prefs: ChartPreferences): ChartSettingsTemplate[]`, and `deleteChartSettingsTemplate(id: string): ChartSettingsTemplate[]`.
- Named templates persist inside the existing scoped `trader_prefs` value under `chartSettingsTemplates`; templates contain only supported chart-appearance preferences, never drawings, Replay state, or workspace layout.

- [x] **Step 1: Write failing preview-state tests**

  Add `previews settings without writing persistent storage`, `commits the preview once`, and `discards the preview without changing stored settings`.

- [x] **Step 2: Run the preview tests and confirm they fail**

  Run: `npm test -- src/__tests__/chart-settings-preview.test.ts`
  Expected: FAIL because preview state and commit/discard APIs do not exist.

- [x] **Step 3: Implement in-memory preview and preference hook refresh**

  Add a preview-update event. `useChartPreferences()` refreshes on preview changes as well as persistent preference changes. Commit writes only supported chart-setting keys once, then clears the preview; discard only clears the preview.

- [x] **Step 4: Write failing local-template tests**

  Add `saves and lists named chart settings templates`, `replaces a same-name template without duplicates`, `loads only supported chart preference keys`, and `deletes a template without changing the active preferences`.

- [x] **Step 5: Run the template tests and confirm they fail**

  Run: `npm test -- src/__tests__/chart-settings-templates.test.ts`
  Expected: FAIL because template storage functions do not exist.

- [x] **Step 6: Implement local template storage and model helpers**

  Read and write templates using the existing scoped trader-preferences helpers; tolerate malformed stored JSON by returning an empty list. Applying a template updates only the current modal draft.

- [x] **Step 7: Run the focused preview and template tests**

  Run: `npm test -- src/__tests__/chart-settings-preview.test.ts src/__tests__/chart-settings-templates.test.ts`
  Expected: PASS; storage remains unchanged until commit.

### Task 4: Build TradingView-style settings tabs and modal interactions

**Files:**
- Modify upstream `src/pages/trading/ChartSettingsDialog.tsx`
- Create upstream `src/pages/trading/chart-settings/SettingsControls.tsx`
- Create upstream `src/pages/trading/chart-settings/SymbolTab.tsx`
- Create upstream `src/pages/trading/chart-settings/StatusLineTab.tsx`
- Create upstream `src/pages/trading/chart-settings/ScalesAndLinesTab.tsx`
- Create upstream `src/pages/trading/chart-settings/CanvasTab.tsx`
- Create upstream `src/pages/trading/chart-settings/settings.css`
- Modify upstream `scripts/build-lib-css.mjs`
- Create upstream `src/__tests__/chart-settings-dialog.test.tsx`

**Interfaces:**
- Each tab receives `{ prefs: ChartPreferences; onChange: (patch: Partial<ChartPreferences>) => void }`.
- Reusable controls expose labeled checkbox/switch, select, numeric input, color swatch, and line-style controls; all have semantic labels and visible keyboard focus.
- The dialog owns `{ original, draft }`, sends draft changes to `setChartPreferencesPreview`, commits through `commitChartPreferencesPreview`, and discards through `discardChartPreferencesPreview`.
- The template menu uses Task 3 functions. Loading a template changes the draft; Cancel leaves the stored preferences and template selection unchanged.

- [x] **Step 1: Write failing modal interaction tests**

  Add `renders the four TradingView settings tabs in reference order`, `discards chart settings draft on cancel and commits once on ok`, `discards the draft on escape and backdrop dismissal`, `reset affects only the active tab draft`, and `applies, saves, replaces, and removes templates through the footer menu`.

- [x] **Step 2: Run the dialog tests and confirm they fail**

  Run: `npm test -- src/__tests__/chart-settings-dialog.test.tsx`
  Expected: FAIL because the current dialog has different tabs and immediate writes.

- [x] **Step 3: Implement the four tab forms**

  Group Symbol, Status line, Scales and lines, and Canvas fields in the order and hierarchy from reference images 03–06. Keep product UI labels English. Do not add unsupported order, broker, Pine, external alert, or account controls.

- [x] **Step 4: Implement the modal shell and draft flow**

  Match the reference's dark compact modal, left tab navigation, selected state, aligned fields, scrollable content, and sticky footer. Footer contains Template, Cancel, and OK. Reset is available from the settings/template controls but applies only to the active draft. X, Escape, and backdrop dismissal discard and restore focus to the opener.

- [x] **Step 5: Include settings CSS in the packaged public stylesheet**

  Add `chart-settings/settings.css` to the input list in `scripts/build-lib-css.mjs`. Keep selectors scoped under `.opencharts`; do not rely on the host application's CSS build.

- [x] **Step 6: Run dialog tests**

  Run: `npm test -- src/__tests__/chart-settings-dialog.test.tsx`
  Expected: PASS for field grouping, focusable tabs, draft, reset, template, commit, and rollback behavior.

### Task 5: Rebuild and publish the pinned vendor artifact to the host

**Files:**
- Modify host `third-party/opencharts/controlled-chart.patch`
- Replace host `third-party/opencharts/dylanpersonguy-opencharts-0.3.0.tgz`
- Modify host `third-party/opencharts/README.md`
- Modify host `package-lock.json`
- Modify host `web/compare/StudyWorkspace.tsx` tests from Task 2 as needed

- [x] **Step 1: Reproduce the exact package from the pinned upstream clone**

  Apply the updated patch to a clean clone at revision `d3fc63cc002e6e651801be6e952e7514e58fa5fe`. Run from that clone: `npm ci --ignore-scripts`, `npm run typecheck`, `npm test`, `npm run build:lib`, `npm run check:package`, and `npm pack --ignore-scripts`.

- [x] **Step 2: Refresh patch, tarball, and provenance together**

  Update `controlled-chart.patch` from the pinned source diff, copy the produced tarball into `third-party/opencharts/`, and document the new chart-settings behavior and included regression tests in `third-party/opencharts/README.md`. Confirm the patch reproduces the packaged source and tests.

- [x] **Step 3: Refresh and install the host lockfile**

  Update the file-dependency lock entry for the new tarball, then run `npm ci --no-audit --no-fund` from the host project. Confirm the installed package contains the new dialog and settings fields.

- [x] **Step 4: Run host verification**

  Run: `npm test`, `npm run typecheck`, and `npm run build`.
  Expected: PASS; host tests include legend visibility, and the Vite build consumes the rebuilt vendor tarball rather than stale `node_modules` output.

### Task 6: Verify the installed app and document evidence

**Files:**
- Create host `docs/2026-10-27-chart-settings-verification.md`
- Modify host `README.md` only if the supported settings list or persistence behavior changes

- [x] **Step 1: Build and inspect the installed Electron app**

  Run `npm run desktop:build`, then inspect the installed `Whide Charts.app` with Computer Use. Compare Symbol, Status line, Scales and lines, and Canvas with screenshots 03–06. Open the modal from a chart in 1-, 2-, and 4-chart layouts.

- [ ] **Step 2: Verify settings behavior and preservation**

  Change one field in each tab, confirm the chart preview updates in every visible cell, then test OK, Cancel, Escape, backdrop, reset, template save/load/delete, and reload persistence. Record the initial settings before UI checks and restore them afterward. Verify that price and oscillator chart zoom/pan, Replay state, drawings, and the fixed drawing rail remain unchanged.

- [ ] **Step 3: Check responsive access and live reference behavior**

  Check content and footer reachability at 1280×720 and a 390×720 browser viewport. Reattempt Computer Use on TradingView desktop to compare any interaction detail not shown in screenshots; record a timeout as a limitation instead of claiming unobserved behavior.

- [x] **Step 4: Write fresh verification evidence**

  Record exact commands, pass/fail outputs, app states, and limitations in `docs/2026-10-27-chart-settings-verification.md`. Do not describe unit tests or a build as proof of native canvas interactions.

**Task 6 evidence and remaining limit:** Electron settings were opened in the
1-, 2-, and 4-chart workspace. Draft/commit/rollback, reset, template
save/apply/delete, and reload persistence were exercised; the original paused
Replay timestamp and single-chart layout were restored. The responsive check
could not be completed because CUA window-coordinate input returned
`Computer Use server error -10005: noWindowsAvailable`. TradingView desktop
was reattached and its Settings tab tree was visible, but its screenshot did
not show the settings surface and clicking a tab returned
`Computer Use server error -10005: elementHasNoFrame`; live interaction parity
is therefore still unverified. The in-app field preview was exercised in
Symbol and Status line, while Scales and lines / Canvas renderer mapping is
covered by vendor option tests; manual preview of one field in each of those
tabs and pixel-level chart viewport/drawing comparison remain unverified. See
the verification report.

---

## Self-review

- **Spec coverage:** The four core tabs, chart effects, shared preferences, modal visuals, templates, preview/commit/cancel, old preference compatibility, zoom/pan preservation, responsive access, vendor provenance, and Electron evidence all have an owning task.
- **Step scan:** Each task separates a test-first behavior, implementation action, and focused check. Vendor packaging and host installation occur only after the source artifact is verified.
- **Type consistency:** The option builders use `ChartPreferences`, `ChartColors`, and the pinned Lightweight Charts 4.2.3 option types. Tab props and template functions have one signature across tasks.
- **Review focus:** All five high-risk cases in the Review Focus section have a named automated or Electron check in their owning task.
- **Proportion:** The plan keeps implementation details at file, interface, behavior, and verification level; it does not prescribe renderer algorithms beyond the constraints in the spec.

No commits are planned because the repository instructions require an explicit user request before committing.
