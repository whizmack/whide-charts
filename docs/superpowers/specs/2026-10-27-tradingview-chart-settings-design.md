# TradingView-style chart settings design

Date: 2026-10-27
Status: approved for implementation
Scope: first settings-parity stage for the OpenCharts workspace

## Goal

Make Whide Charts' chart settings match the supplied TradingView desktop
references in the settings that are available, how users change them, and how
the dialog and controls look. This stage establishes the common chart-settings
surface before the indicator browser, workspace controls, and Favorites drawing
toolbar are handled in the agreed order.

The TradingView screenshots in
`docs/reference/tradingview/README.md` are the visual source of truth. They
describe UI composition and density, not market values, chart zoom, or candle
spacing. Preserve the user's current chart view, drawings, Replay clock, and
stored preferences.

## Current state

- The desktop app uses the OpenCharts workspace at `/`.
- The host mounts the vendor `ChartSettingsDialog` and calls
  `useChartPreferences()` in `web/compare/Preview.tsx`.
- The current vendor dialog has Appearance, Colors, Trading, Events, and
  Challenge tabs. Its fields write preferences as soon as they change.
- Native chart appearance preferences are shared across all workspace cells.
  Keep that scope and the current preference storage namespace.
- Current chart rendering is controlled by the pinned OpenCharts 0.3.0 vendor
  package. Any vendor change must follow
  `third-party/opencharts/README.md`: update the pinned upstream source, patch,
  tarball, provenance, and host lockfile together.

## Chosen approach

Extend the existing vendor-native settings dialog, preference model, and chart
renderer. Do not create a second host-owned settings system or a visual-only
facsimile. This keeps the visible controls connected to the same preferences
that drive every chart cell, while allowing settings that need renderer support
to become real settings rather than inert controls.

## Scope

### Dialog structure and visual treatment

- Use the TradingView-style left navigation and the four core tabs, in this
  order: **Symbol**, **Status line**, **Scales and lines**, **Canvas**.
- Match the references' dark surfaces, compact rows, muted section labels,
  aligned label/control columns, restrained selected-tab treatment, header,
  dividers, and persistent footer with **Template**, **Cancel**, and **OK**.
- Use the existing application font and icon system. Keep numeric values
  tabular, controls keyboard reachable, focus visible, and motion restrained.
- Keep the dialog centered relative to the workspace, outside clipped chart
  cells. Bound its size to the viewport and allow its content to scroll without
  hiding the footer.
- Keep real Whide-specific controls in a product-specific section. Do not
  expose inert order, alert, account, or news controls merely to copy
  TradingView capabilities that Whide does not provide. Retain any existing
  stored preference keys when retiring controls that have no current effect.

### Symbol

- Provide separate up/down candle color controls for body, borders, and wick,
  plus the previous-close bar-color option where the chart renderer can apply
  it.
- Provide price precision and chart display timezone controls. UTC remains the
  data/replay time basis; display formatting must not change candle timestamps
  or Replay boundaries.
- Existing Wicks and Candle borders visibility preferences move into this
  section and remain effective.

### Status line

- Group instrument and indicator display choices in the same hierarchy as the
  reference: symbol/title, market state, OHLC/bar changes, volume, and
  indicator title/input/value/background visibility.
- Bind each exposed control to the actual host/vendor status-line or legend
  rendering. Omit buy/sell controls because Whide Charts does not place orders.
- Preserve the application's real Binance Live/Replay state and never infer
  or fabricate market-status values.

### Scales and lines

- Group price-scale display, scale mode/placement, label overlap and price-line
  visibility with time-scale label/date/time formatting controls.
- Preserve a single UTC Replay clock and the renderer's seconds boundary.
  Display timezone and axis-label formatting remain presentation choices only.
- Expose a field only when it has a defined effect on the current chart. Add
  renderer support in this vendor change where required; do not leave controls
  disconnected from chart behavior.

### Canvas

- Support background mode/color; independent vertical and horizontal grid
  visibility/color; crosshair color/style; symbol/timeframe watermark content;
  scale text color/size and scale lines; supported chart navigation/pane
  visibility; and top, bottom, and right margins.
- Map the current background, grid, scale text, crosshair, grid visibility,
  watermark, volume, countdown, and OHLC preferences into the appropriate
  sections without losing their current values.

## Interaction and persistence

- Opening the dialog snapshots the shared preferences into an editable draft.
- Edits preview on the chart but do not create a separate preference system.
- **OK** commits the draft once to the existing native preference store.
- **Cancel**, Escape, close button, or backdrop dismissal discards the draft
  and restores the opening values.
- Reset affects the active tab's draft values and can be dismissed without
  persisting them.
- The Template menu loads, saves, replaces, and removes named snapshots of the
  supported appearance preferences. Applying a template edits the current
  draft; Cancel leaves both current preferences and the active template
  unchanged.
- All four chart cells continue to read the same committed chart preferences.
  Existing stored keys remain valid; new keys receive safe defaults and do not
  require changes to market data, SQLite, Parquet, or workspace drawings.

## Out of scope

- Indicator browser and per-indicator settings; handled in the next UI stage.
- Shell menus, watchlist, range controls, and Replay transport; handled after
  the core settings stage.
- Favorites drawing toolbar; remains after the core UI stages. The fixed 40 px
  drawing rail must not move or change.
- Real orders, broker connectivity, Pine, external alerts, or account-backed
  challenge calculations.
- Changes to candle spacing, chart zoom, Replay projection, market data, or
  persistence identity.

## Verification evidence

- Compare the final Symbol, Status line, Scales and lines, and Canvas screens
  against reference images 03–06 in
  `docs/reference/tradingview/README.md`.
- In the installed Electron app, check tab switching, every enabled control,
  chart preview, OK commit, Cancel/Escape rollback, reload persistence, and
  settings opened while each of 1-, 2-, and 4-chart layouts is active.
- Check dialog sizing and content reachability at 1280×720 and 390×720; verify
  that chart zoom, viewport, drawings, Replay state, and the fixed drawing rail
  are unchanged by settings work.
- TradingView desktop was reattached for the implementation check and exposed
  its Settings tabs through accessibility, including Symbol, Status line,
  Scales and lines, Canvas, Trading, Alerts, and Events. Computer Use screenshots
  did not render that Settings surface, and selecting an individual tab failed
  with `elementHasNoFrame`. The supplied screenshots verify appearance and
  field labels; live interaction detail not visible there remains unverified.
