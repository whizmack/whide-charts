# OpenCharts application build

Upstream: https://github.com/dylanpersonguy/OpenCharts
Pinned revision: d3fc63cc002e6e651801be6e952e7514e58fa5fe (package 0.3.0).
MIT; underlying Lightweight Charts Apache-2.0 with its own attribution.

The local patch exports the controlled chart panel, settings and related types, hides the live countdown during replay, offsets the legend clear of the tool rail, and adds optional controls to hide the unused calendar and display the actual last traded close without invented bid/ask quotes.
The prototype does not mount the upstream terminal, demo feed or trading gateway.

Rebuild: clone the pinned revision; apply controlled-chart.patch; run
`npm ci --ignore-scripts`, `npm run build:lib`, then `npm pack --ignore-scripts`.
Copy the resulting tarball into this folder. Install with npm ci from the host lockfile.

The workspace patch also exports native indicator calculations and chart-ready
handles, adds active-chart keyboard gating, persistent magnet/stay-mode rail
controls, and lets the host place the drawing rail outside the price subpane.
Rail menus render in a portal to stay reachable in compact layouts. The chart
uses neutral dark defaults, still editable through native appearance settings.
The drawing manager handles the zero-width time-axis widget reported by
Lightweight Charts when its time labels are hidden. The patch includes its
regression test (`src/__tests__/drawing-pane.test.ts`).

The production host is `web/compare/main.tsx`, served from the application's
root route `/`. It keeps one provider/adapter runtime, owns data windows and
uses separate oscillator chart instances with shared timestamps. The four-cell
workspace, indicator settings, drawing histories and synchronization live in
`web/compare/`.

Magnet preview uses the drawing manager's own OHLC/object/angle resolver to move
the active chart crosshair before placement. It reacts to modifier changes and
live-series updates, with pointer/blur/disposal cleanup. Regression tests are
included in the patch as `src/__tests__/drawing-magnet.test.ts`.
