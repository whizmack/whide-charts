# Interface alignment verification — 2026-10-26

## Scope

This pass corrected internal and optical centering without changing the compact
workspace dimensions. It covers host toolbar/rails/replay/status controls and
the packaged OpenCharts settings, drawing menus, selected-drawing toolbar and
drawing-settings controls. Favorites remains out of scope.

## Deterministic verification

- Backend: `uv run pytest -q` — 32 passed, with the existing Starlette/httpx
  deprecation warning.
- Host: `npm test` — 56 passed, 2 opt-in Live tests skipped.
- Host: `npm run typecheck` and `npm run build` — passed.
- Vendor: 303 passed, 1 network test skipped; focused alignment coverage adds
  host icon/numeric hooks, drawing dialog value controls, selected-drawing
  toolbar alignment, the Chart Settings close icon and selection of a newly
  completed drawing while stay-in-drawing-mode remains active.
- Clean pinned OpenCharts clone applied the tracked patch, built the library and
  produced the tracked tarball. Final SHA-256 after the drawing-dialog
  alignment follow-up:
  `50f2736842d2c3abf5e7b07f3c7fcb612021997d3e8c29649faba2145e6ca99b`.

## Drawing dialog alignment follow-up

- Rectangle and Trend Line settings use stable drawing-type and active-tab
  hooks covered by the vendor component suite.
- The production Rectangle dialog measured 380 CSS px wide with 20 px inner
  gutters, a 112 px label column, a 16 px gap and a 210 px control column.
  Inputs, selects and swatches use a common 34 px control height.
- Rectangle Text uses one TradingView-like Text alignment row with two equal
  101 px selects; the textarea spans the full 338 px content width.
- At a 390 px viewport the dialog measured 366 px and had no horizontal
  overflow. Close, footer and OK remained inside the viewport.
- The line-control group measured the same width as its control column and had
  equal client/scroll widths, so its color, opacity, width, style and preview
  controls do not clip or introduce a horizontal slider.
- The compiled vendor stylesheet was checked for effective single scoping:
  no `.opencharts .opencharts` selectors remain and the alignment selectors
  are present in the packaged `style.css`.
- Scoped host and touched-vendor `git diff --check` checks passed. The generated
  aggregate vendor patch retains older whitespace already present in unrelated
  patched source, so it is not used as the scoped source-quality signal.

## Built-browser measurements

The production build was served from `http://127.0.0.1:8765/` and exercised in
headless Google Chrome after the collaborative preview timed out twice.

- At 1280×800, chart data, the fixed 40 px drawing rail, 40 px utility rail,
  40 px top toolbar, 42 px replay transport and 26 px status bar rendered with
  unchanged outer dimensions.
- At an emulated 390×720 viewport, document scroll width remained exactly
  390 px. Drawing rail x stayed 0 and utility rail x stayed 350.
- Single, two-chart and four-chart layouts all kept the drawing rail at x=0,
  utility rail at x=350 and document scroll width at 390 px.
- Host utility/replay icon centers measured at zero x/y delta inside their
  control boxes. A 200% CSS-zoom stress proxy kept that delta and introduced no
  page-level horizontal overflow; this was not a native browser-zoom test.
- Chart Settings remained portaled to `body`. Its dedicated close-button hook
  is covered by packaged component tests and by the corrected singly scoped
  production CSS. The earlier desktop measurement is not treated as proof of
  the narrow 44 px touch-target state.
- The native pair `<select>` was replaced with a compact anchored menu. At the
  359 px collaborative-preview viewport it opened directly below its trigger,
  kept all three pair rows inside a 176 px menu and produced zero horizontal
  page overflow.
- Completed drawings now remain selected in both normal and stay-in-drawing
  modes, which restores immediate access to the floating style/settings bar.
- A package-level regression check now fails unless the exported `style.css`
  contains the drawing toolbar and settings-dialog selectors. This caught and
  fixed the missing component-CSS aggregation that previously left the toolbar
  below the workspace and showed only a dark modal backdrop on double-click.
- Drawing dialog/tab/checkbox/value alignment and selected-toolbar alignment
  were rechecked through the packaged vendor component tests. The collaborative
  preview was unavailable for a fresh screenshot of every open dialog state;
  the previous drawing-settings interaction evidence remains in
  `docs/2026-10-25-drawing-settings-verification.md`.

## Result and handoff

The production server is left running for user visual review. No Favorites work
and no commit were started.
