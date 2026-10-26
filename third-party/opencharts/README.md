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

The 2026-10-24 drawing pack adds native Brush, Highlighter, Path, Polyline,
Curve, Price Range, Date Range, Date & Price Range, Anchored Text and Note
objects. Their shared catalog is exported for the fixed rail and future
Favorites bar; native geometry, rendering, hit-testing, placement, persistence
and editing remain inside OpenCharts. Regression coverage lives in the three
`drawing-tools-pack-*.test.ts` files included in the patch.

The 2026-10-25 settings pass replaces the generic drawing editor with native,
family-aware Style, Text, Coordinates, Visibility and Position Inputs tabs.
Dialog edits preview transactionally and commit once; Cancel, Escape and close
restore the original drawing. A clamped contextual toolbar follows the selected
drawing while the fixed workspace rail remains stationary. The patch includes
model, renderer, dialog, tab and floating-toolbar regression coverage. Position
line/label/stat preferences, stable z-ordering, family-specific Fibonacci
defaults, attached text and compact range labels are applied by the renderer,
not only persisted by the settings UI.

The 2026-10-26 alignment follow-up keeps a completed drawing selected even when
stay-in-drawing-mode leaves the tool armed, so the contextual style/settings
toolbar remains immediately reachable. The packaged stylesheet is generated
from unscoped source selectors and scoped exactly once by `build-lib-css.mjs`.
The drawing settings follow-up also fixes the desktop dialog to the compact
380px TradingView-like grid, aligns labels and controls across tabs, and
collapses cleanly below that width without horizontal overflow.
