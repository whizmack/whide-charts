# TradingView-style indicator panes and drawing controls

Goal: Improve the OpenCharts preview with dedicated oscillator panes, settings and familiar drawing controls. Existing Vela sessions and canonical replay projection remain unchanged.

Architecture: Keep Lightweight Charts 4.2. Controlled ChartPanel exposes its chart/series to a small host synchronization layer. Separate oscillator charts share identical bar timestamps, logical viewport and crosshair. Host persists pane placement, heights, indicator inputs/styles and drawing controls. Main renderer receives only price overlays. Native indicator math is reused. Drawing rail gains persisted magnet/stay-mode controls; host keyboard hook temporarily enables snap while Cmd/Ctrl is held, clearing on blur.

Screenshot analysis and the requested extension to up to four independent chart cells are recorded in [chart-workspace-reference](2026-10-15-chart-workspace-reference.md). Complete the reusable single-chart foundation first; cross-cell synchronization must use timestamps when timeframes differ, whereas the indicator subpanes within one cell share identical bar indices.

- [x] Add regression tests for placement, settings, synchronization and temporary magnet state.
- [x] Extend controlled vendor exports/options and overlay styling; build pinned tarball.
- [x] Add resizable/movable synchronized oscillator panels and indicator settings/legend.
- [x] Add native rail toggles, modifier magnet and scoped undo/redo.
- [x] Verify panels, geometry/sync, replay safety, keyboard cleanup and persistence in actual UI; run build/tests.

## Execution ledger

- Reused the existing branch and comparison route; original Vela app/session untouched.
- Added typed workspace state, validated persistence and timestamp interpolation tests; four retained cell configurations, independent replay/live selections.
- Added indicator input/style settings, native math exports, RSI smoothing and background band, MACD histogram, aligned oscillator charts, keyboard/pointer pane resizing and above/below placement.
- One runtime provider is shared because upstream's adapter registry is global. Controlled pagination returns no extra data; each cell gets its independently clipped bars from the host.
- Drawing callbacks keep a synchronous latest-data reference so batched multi-selection updates cannot overwrite each other. Undo grouping uses a short operation window.
- Ruling: appearance preferences are shared across the workspace in this version, matching the existing native preferences store. Inputs, pane layout and drawings remain per chart. No duplicate provider/preferences framework introduced.
- Ruling: VWAP is labeled `UTC · loaded bars`, disclosing that the first loaded day can be partial. It is not represented as a full-session VWAP when midnight history is absent.
- Code review identified the VWAP labeling and batched drawing-update issues; both addressed.
- Initial verification: frontend 41 passed / 2 opt-in integration tests skipped; backend 32 passed (one upstream deprecation warning); build passed. Browser verified four live charts with changing real prices and Replay restoring the original timestamp/pairs. Final geometry regression reproduced and fixed: Lightweight Charts reports zero time-axis widget width when labels are hidden; drawing hit bounds now fall back to actual plot width. Regression test failed before the fix and passed after it. Browser verified placement, Cmd+Z, temporary Cmd magnet release, input/style changes, pane relocation/resizing, synchronized four-chart stepping and restoration after rewinding.
