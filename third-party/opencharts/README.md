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

The 2026-10-27 chart-settings pass adds Symbol, Status line, Scales and lines,
and Canvas tabs with real renderer effects for candle colors, price precision,
display timezone, scale modes and placement, axis formatting, background,
independent grid lines, crosshair, watermark, scale typography, chart margins,
navigation and volume visibility. Drafts preview through an in-memory shared
preference layer; Cancel, Escape, close and backdrop restore stored settings,
while OK writes supported settings once. Named settings templates are stored
under `chartSettingsTemplates` in the existing scoped `trader_prefs` value and
exclude workspace layout, drawings and Replay state. The chart options update
in place to preserve chart instances and their viewports. The public stylesheet
build now includes `src/pages/trading/chart-settings/settings.css`. Regression
coverage is included in the chart-settings preferences, option mapping,
rendering, preview, template and dialog test files.

The 2026-10-27 axis-menu follow-up exports the existing
`updateChartPreferences` store writer so host axis menus can update the same
shared, persistent scale preferences as the native settings dialog. No new
preference store or preference keys are introduced.

The 2026-10-28 time-scale follow-up adds the reference's `Day of week on
labels` checkbox. It defaults on, persists with the shared appearance
preferences and named templates, and formats only day-of-month axis ticks in
the selected display timezone. Candle timestamps and Replay time remain UTC.

The 2026-10-28 price-scale follow-up adds `priceScaleInverted` to the shared
preference and template keys. The host axis menu applies Lightweight Charts'
`invertScale` option to whichever of the left/right scales is selected; it
defaults off and updates the existing chart in place.

The 2026-10-28 price-label follow-up adds the Scales and lines checkbox `No
overlapping labels`. It defaults on, persists with chart preferences and named
templates, and maps to Lightweight Charts' `alignLabels` on both built-in
price scales.

The 2026-10-29 color and axis-label pass exports a shared `TradingViewColorPicker`
used by every user-facing color control in chart settings, indicator settings,
drawing settings, floating drawing tools and the legacy drawing overlay. Its
eight-row palette includes grayscale, hue tints/shades, recent colors, custom
color entry and an opacity slider with percentage input. Chart/indicator
opacity is preserved as `#RRGGBBAA`; drawings continue to use their existing
separate opacity fields. Crosshair axis badges now use the selected crosshair
color, and oscillator scale labels use the same monospace family as the main
price axis. The color-picker source and styling are included in the vendor patch
and public package export.

The EMA Style follow-up adds optional `popoverFooter` content to the shared
color picker so study-specific line controls can live inside its color popover
without adding those controls to unrelated color fields. The host uses this for
line thickness and style. A visual alignment follow-up matches the supplied
TradingView palette's eight-row matrix; the regression test also checks its row
count and the optional line controls.

The 2026-10-29 visual settings follow-up aligns the main chart-settings dialog
with the supplied desktop reference: an 880px centered surface, wider left
navigation, larger field rows and controls, and the reference's rounded dark
surfaces. Drawing settings reuse the compact 380px dialog scale with matching
tab underline, field density and footer treatment. This pass changes visual
presentation only and adds no preference fields or settings behavior.

The 2026-10-30 host typography follow-up replaces the earlier monospace axis
choice with TradingView's `-apple-system, BlinkMacSystemFont, Trebuchet MS,
Roboto, Ubuntu, sans-serif` stack for workspace UI, main and oscillator axes,
price badges, and picker text. The chart-font override lives in the host and is
reapplied after native chart preference updates; no vendor artifact changed.

The 2026-10-30 status-line audit also removes the vendor `font-mono` override
from the active chart header and applies the same TradingView stack to the
vendor chart's scale options. Text annotations, position/range readouts,
Fibonacci labels and drawing-stat boxes use that stack in their canvas
renderers. The host stylesheet overrides remaining vendor utility classes
(`font-mono`, `font-serif`, `mono`, `stat-value`, and code-like elements) within
the mounted OpenCharts surface.

OHLC and bar-change values in the chart header now use the exact body color of
the displayed candle. Historical bars are assigned their body color from the
same bullish/bearish choice and Symbol-tab preferences as the renderer, and
Live updates use that same rule. The legend reads the color from the displayed
series datum, so Live, Replay and crosshair inspection stay aligned even when
custom candle colors or “Color bars based on previous close” are enabled.
Regression coverage is in `src/__tests__/chart-status-line.test.tsx`; drawing
canvas font coverage is in `src/__tests__/drawing-settings-rendering.test.ts`.
