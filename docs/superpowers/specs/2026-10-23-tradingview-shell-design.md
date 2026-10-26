# TradingView-like workspace shell design

Date: 2026-10-23
Status: implemented and verified on 2026-10-23; see
`docs/2026-10-23-tradingview-shell-verification.md`.

## Goal

Bring the existing OpenCharts workspace shell materially closer to the supplied
TradingView desktop references without changing chart behavior, market data,
Replay semantics, drawings, indicators, viewport state, or persistence.

This is a structural UI pass over the top toolbar, drawing rail, right utility
rail, bottom controls, Replay transport, and watchlist boundary. It is not a
rewrite of the chart renderer or a pixel-for-pixel recreation of TradingView.

The canonical references are:

- `docs/reference/tradingview/01-chart-no-watchlist.png`
- `docs/reference/tradingview/02-chart-with-watchlist.png`
- `docs/reference/tradingview/08-replay-controls.png`
- `docs/reference/tradingview/09-drawing-tools-menu.png`
- `docs/reference/tradingview/10-floating-drawing-toolbar.png`

## Current differences

The chart surface, status values, drawing tools, and study panes already form a
usable terminal. The surrounding shell still reads as a custom web dashboard:

- the 44 px top toolbar has loose grouping and a prominent product label;
- layout, fullscreen, settings, and watchlist actions are grouped at the far
  right of the top toolbar instead of forming a distinct utility edge;
- the OpenCharts drawing rail floats inside the chart without a continuous
  workspace boundary;
- every chart has a separate 27 px caption that duplicates symbol and timeframe
  information already present in the chart status line;
- Replay occupies a full-width 44 px form row, followed by a separate footer;
- no persistent right utility rail visually balances the left drawing rail;
- the watchlist works, but its header and boundary do not yet match the compact
  docked composition in the reference.

## Shell structure

The application remains one full-height workspace. Its visible structure is:

1. a compact top chart toolbar;
2. a center workspace with the active chart grid, left drawing rail, optional
   watchlist, and right utility rail;
3. a Replay or Live transport row;
4. a compact bottom status bar.

The surrounding operating-system and TradingView application tab chrome shown
in the screenshots is not reproduced on the web route.

### Top toolbar

The top toolbar targets a height of about 40 px and uses flat control groups
separated by subtle vertical rules.

Left-to-right order:

1. a compact Perp Replay product mark;
2. active symbol selector;
3. timeframe group;
4. Indicators action;
5. Live and Replay mode control;
6. remaining horizontal space;
7. maximize or restore action for the active chart.

Layout, settings, watchlist, and export leave the top toolbar and move to the
right utility rail. All buttons retain accessible names, keyboard focus styles,
pressed state, and their current behavior. The toolbar does not change candle
spacing, browser zoom, or chart viewport state.

### Left drawing rail

The existing OpenCharts drawing implementation remains authoritative. The host
changes only its visual boundary and density:

- align the rail flush with the workspace's left edge;
- give it a consistent narrow width and continuous dark surface;
- use restrained separators and TradingView-like hover, pressed, and open
  states;
- preserve tool menus, drag behavior, magnet controls, stay-in-drawing mode,
  undo and redo, keyboard scope, and menu portal behavior;
- keep the rail attached only to the active visible cell in multi-chart mode.

No drawing type or drawing persistence format changes in this milestone.

### Chart cells

For a single visible chart, remove the separate cell caption from normal layout
and let the chart's own status line identify the instrument and timeframe. The
maximize control remains available in the top toolbar.

For two to four visible charts, retain a reduced cell header because users need
an explicit active-cell target and a per-cell maximize action. The reduced
header must not obscure the native chart status line. Active-cell indication
uses a subtle boundary rather than a bright card outline.

Splitters, active-cell routing, time and crosshair synchronization, and stable
hidden cell configurations remain unchanged.

### Right utility rail

Add a narrow workspace-level rail at the outer right edge. It contains only
implemented actions:

- toggle watchlist;
- open chart layout and synchronization controls;
- open shared chart appearance settings;
- export the existing workspace backup JSON.

The current action remains visibly selected or open. Buttons expose tooltips
and accessible names. No inert TradingView-like icons are added.

When the watchlist is open, it sits immediately to the left of the utility rail
and reduces the chart grid width. The rail itself remains visible. The watchlist
keeps its current symbol behavior and price source, while its header, rows,
separators, and width are tightened toward the reference.

### Replay and Live transport

Replay becomes a compact centered transport directly above the bottom status
bar. It keeps all existing capabilities:

- UTC cutoff editing and bounds;
- Go action;
- play and pause;
- next active-timeframe boundary;
- 0.5x, 1x, 2x, 5x, and 10x speed;
- paused or playing state and shared-chart scope.

The date-time input may be visually condensed but remains directly accessible
without a new modal. Controls use icon-first presentation with tooltips and
accessible names. Existing readiness disabling and end-of-history behavior do
not change.

Live uses the same row height and shows its existing connection, stale, and
updated states. It does not gain simulated prices or historical persistence.

### Bottom status bar

The bottom bar remains approximately 24-28 px tall. It carries compact,
non-duplicated workspace information:

- current mode and visible chart count;
- persistent or temporary magnet state and stay-in-drawing state;
- storage errors when present;
- UTC clock or Replay context;
- OpenCharts and TradingView attribution required by the existing renderer.

Workspace export moves to the utility rail. Magnet selection remains reachable
from the bottom bar and the drawing rail.

## Responsive behavior

The target desktop verification viewport is 1280x800. At narrower widths,
labels collapse before controls disappear:

- icon actions retain accessible names and tooltips;
- the timeframe group may scroll or tighten but remains reachable;
- the right utility rail remains available;
- the watchlist becomes an overlay at narrow widths as it does today;
- Replay controls may wrap into two compact lines when one line cannot fit;
- chart cells preserve a usable maximize action;
- no shell element introduces horizontal document overflow.

The narrow verification target is approximately 390 CSS px. It is an
accessibility and reachability target, not a request to reproduce the full
desktop composition at phone scale.

## State and behavior boundaries

This milestone keeps the existing `opencharts-preview:` localStorage namespace
and all stored shapes. It must not reset or migrate:

- workspace layout and split ratios;
- active and hidden cell configurations;
- Replay cutoff, symbol, or timeframe;
- Live cell selections;
- drawings and drawing visibility;
- chart viewports;
- study selection, inputs, styles, or pane geometry;
- shared native OpenCharts appearance preferences;
- watchlist visibility, magnet mode, or stay-in-drawing mode.

No backend, API, SQLite, Parquet, dataset, or Live feed change is part of this
work. Existing generation guards, safe Replay prefix behavior, and timestamp
unit boundaries remain untouched.

## Accessibility and interaction

- All moved controls retain semantic buttons, labels, pressed states, and
  visible keyboard focus.
- Icon-only actions require an accessible name and visible tooltip.
- Menus and dialogs must remain usable in right and bottom chart cells and must
  not regress the existing portal and native-dialog clipping fixes.
- The active drawing rail and keyboard commands remain scoped to the active
  cell.
- Reduced-motion behavior stays effectively static; no decorative animation is
  introduced.

## Verification

Automated checks cover behavior that can regress through restructuring:

- toolbar and utility actions still target the active cell or workspace;
- single-chart and multi-chart caption behavior;
- watchlist, layout, settings, and export remain reachable;
- Replay seek, play or pause, step, speed, and mode switching preserve their
  current state transitions;
- existing workspace and drawing persistence tests continue to pass.

Run the project checks:

```sh
uv run pytest -q
npm test
npm run typecheck
npm run build
```

Verify in a real browser on `/`:

- one, two, and four charts;
- maximize and restore;
- watchlist open and closed;
- Replay seek, play, pause, next candle, speed, and switch to or from Live;
- drawing rail, drawing flyout, magnet, stay mode, undo, and redo;
- settings, layout, and indicator menus without clipping;
- reload with the original workspace, viewport, studies, drawings, and
  appearance preserved;
- 1280x800 and approximately 390 px wide viewports;
- no unexpected console errors or warnings.

## Out of scope

- Electron packaging;
- backend, data, Replay clock, or Live feed changes;
- a new trading or P&L engine;
- new drawing tools or indicators;
- full redesign of the indicator browser, chart settings dialog, or drawing
  flyout content;
- fake utility actions copied from TradingView;
- changing candle width, browser zoom, or a saved chart viewport to imitate a
  screenshot.

## Acceptance criteria

- The root workspace has a cohesive TradingView-like top, left, right, and
  bottom shell at 1280x800.
- The right utility rail exposes only working controls and remains available
  with the watchlist open.
- Single-chart mode no longer spends a separate row on duplicated cell caption
  content; multi-chart mode remains operable.
- Replay and Live controls remain fully functional in their compact bottom row.
- Existing workspace, drawings, studies, appearance, and viewport state survive
  reload without migration or reset.
- The shell remains usable at approximately 390 px without horizontal document
  overflow.
- Automated checks and the stated real-browser scenarios pass.
