# TradingView-like workspace roadmap

**Goal:** Make the existing personal chart workspace feel as close as practical to the supplied TradingView desktop references before adding journal or AI features.

**Architecture:** Keep the React/Electron host, patched OpenCharts 0.3.0 and Lightweight Charts 4.2.3 unless a repeatable interaction exposes a concrete blocker. The host owns workspace layout, Replay and data; vendor changes follow the documented patch and packaging workflow. Assess visual and interaction fidelity against the supplied screenshots and observable behavior, not assumed pixel parity.

**Constraints:** Preserve market data, dataset versions, localStorage, drawings, chart viewports, fixed 40px drawing rail, Replay safe cutoff and real Live feed. Do not change user zoom to match a screenshot, add unsupported placeholders, migrate settings or introduce trading execution. No commits without request.

**Desktop parity:** The desktop and development preview share `index.html` and `web/compare/main.tsx`. Use `?desktop=1` in Vite when comparing desktop layout, and verify final changes inside a build of the Electron application as well: a browser does not reproduce native window chrome, its localStorage is separate, and the installed app can lag the checkout. Electron reuses any healthy Whide backend already on port 8765; verify which backend and dataset it is using before drawing conclusions from API behavior or starting another instance.

## Stages

1. **Baseline and correctness:** Review the reference images and the current desktop workspace, record limitations of the comparison, and fix the wall-clock countdown shown during Replay. Add a regression test for Live versus Replay and price-label preferences.
2. **Workspace shell:** Compare the same viewport and comparable chart state; adjust toolbar groups, fixed rails, chart header and bottom transport as a coherent whole. Preserve working actions and verify one/two/four charts, compact sizes and reload.
3. **Drawings and Favorites:** Compare the fixed rail and flyouts to references 09–10. Add a separate movable Favorites bar, with persistent selected tools and position; keep the fixed rail stationary. Exercise selection, drag, editing, snapping, undo, reload and active-cell routing.
4. **Chart and settings:** Align symbol, status line, scales, canvas and indicator browser with references 03–07; preserve transactional settings and user appearance. Compare candle/axis rendering without changing saved viewport.
5. **Interaction parity:** Exercise pan, zoom, crosshair, axis gestures, indicators, Replay transitions and multi-chart layouts on comparable data. Record reproducible mismatches and distinguish host, OpenCharts and Lightweight Charts limitations.
6. **Decision gate:** Only if a repeatable renderer limitation or maintenance cost warrants it, prototype Lightweight Charts 5 separately. Compare pane synchronization, scale behavior, drawing compatibility and safe Replay before deciding on migration.

## Verification

For each behavioral change add focused regression coverage; for visual work capture and inspect real browser/desktop evidence at laptop and narrow widths without altering the user's saved workspace. Run `uv run pytest -q`, `npm test`, `npm run typecheck` and `npm run build` for code changes. Record actual checks and any Computer Use or network limitations; do not present mocks or prior reports as current interaction evidence.

## Current execution

- [x] Inspect references and current workspace; reproduce the Replay countdown.
- [x] Correct the Replay countdown; check Live countdown and the last price after returning to Replay in an isolated desktop-mode browser preview. Focused tests also cover the Live countdown and price-label preference combinations.
- [x] Start an isolated desktop-mode visual comparison. Move the layout control into the desktop toolbar and keep it on the utility rail at narrow widths; check its menu at 1280 and 390 CSS pixels.
- [x] Place the desktop layout button beside Indicators and anchor its menu to the button; clip the chart status line before the price scale in small cells.
- [x] Reproduce and correct the RSI/price-scale crash when changing scale placement. Align visible left and right pane scales and retry oscillator geometry after the axis is created.
- [x] Investigate the separately reproducible ResizeObserver loop notification during multi-chart changes. Diagnostics identified synchronous chart resizing in the OpenCharts price chart and Lightweight Charts oscillator autoSize callback. The vendor and host now coalesce and defer those writes, with disposal covered by a vendor test; the observed four-chart transition and splitter drags no longer logged the notification in the isolated preview.
- [ ] Continue the workspace shell comparison and verify all remaining interactions and settings in the actual Electron build; the Vite preview is not a substitute for that check.
- [ ] The 2026-11-02 visual pass adds the desktop title region and aligns several symbol and toolbar icons. See `docs/2026-11-02-workspace-visual-pass.md` for the isolated Electron and browser checks and outstanding differences. A packaged desktop build and full interaction pass remain open.
- [ ] Favorites: a separate draggable bar, catalog picker, drawing-menu stars and local persistence are implemented; browser checks cover selection, active-chart drawing, drag and reload. Desktop interaction verification remains open; see the 2026-11-04 follow-up in the visual-pass report.
- [ ] Continue the stages above in small verified slices; update this list with evidence rather than marking the overall goal complete prematurely.
