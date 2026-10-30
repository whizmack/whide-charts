# TradingView Workspace Parity Audit — 2026-10-27

## Goal and evidence

The goal is to match the TradingView desktop chart workspace's surrounding
interface and behavior as closely as Whide Charts' product scope allows. This
audit covers shell composition, controls, menus, settings, axes, panels, colors,
and density. Candle appearance is deliberately excluded: it is a user
preference and is not part of this shell comparison.

Evidence reviewed:

- The user-supplied desktop references indexed in
  `docs/reference/tradingview/README.md` (screens 01–10).
- TradingView desktop's live accessibility tree and screenshot: top command
  toolbar, drawing rail, chart heading, price scale, right utility rail, quick
  ranges, timezone, floating drawing toolbar, settings dialog, interval menu,
  chart-style menu, symbol search and **Go to** dialog. The interval menu groups
  tick/second/minute/hour/day/range options, marks favorites, and offers
  **Add custom interval**. The chart-style menu lists 21 styles with favorite
  toggles. Symbol search has a query field, asset-category tabs, and results
  grouped by exchange and instrument type.
  The settings dialog has seven tabs. Its Canvas view shows background, grid,
  crosshair, watermark, scale text, navigation/pane visibility and chart
  margins. The Symbol and Status line control lists were also read from the
  accessibility tree. The live Go to dialog exposes **Date** and **Custom
  range** tabs, a date field, time selector, month calendar, and Cancel/Go.
- Whide Charts' live desktop workspace: rendered shell, chart heading, scales,
  indicator legend, right utility rail, layout menu and bottom status strip. At
  inspection time the user's existing view was one-chart Live, BTCUSDT, 4h.
  The packaged build now includes the current Go to dialog and date-range
  toolbar; the Go to dialog still needs a fresh desktop visual check.
- Whide's live accessibility tree for its pair selector (three supported
  markets), layout menu (five workspace layouts and two sync settings),
  indicator popover (eight supported studies), and the earlier Go to form (one
  UTC date/time field and Go action).
- The settings parity implementation and evidence in
  `docs/2026-10-27-chart-settings-verification.md`.

Whide's symbol, timeframe, Live/Replay mode, viewport, drawings and preferences
were not changed. TradingView's temporary symbol search, interval/style menus
and chart settings were closed without submitting a symbol, timeframe, style
or settings value. The current TV chart remains BTCUSDT, 1h.

## Surface-by-surface findings

| Surface | TradingView reference | Whide Charts now | Finding |
| --- | --- | --- | --- |
| Main dark surfaces | Near-black workspace, `#0F0F0F` chart surface, `#1A1A1A` grid, subtle `#2B2B2B` dividers. | Host chrome is `#0F0F10`; chart cells/panes are `#101011`; grid and dividers are around `#2A2B2E`–`#2B2C2F`. | Close palette match. The chart surface is a touch lighter; the small difference should be tuned against the supplied screenshots at the same viewport. |
| Focus and selection | Restrained neutral selected-tool surface; blue focus accent in the Go to date control. | Drawing selection uses `#292A2D`, hover `#34363A`; keyboard focus uses `#76A6F5`. | The active drawing tool was moved from a teal/bright highlight to a neutral gray. Focus is still lighter than TradingView's blue. |
| Top command toolbar | Symbol and compare, interval, chart type, indicators, alert, replay, undo/redo, layout/save, search, settings, fullscreen, snapshot, and product actions. | Pair, five supported timeframes, Indicators, Live/Replay, maximize. | Correct compact height and dark treatment, but fewer chart commands and no TradingView-style grouped menus for the available actions. Preserve Whide's five supported intervals and avoid controls with no real behavior. |
| Pair and interval menus | Symbol search has categories and exchange-specific instruments; interval menu groups options by unit, includes a custom-interval entry and favorite stars. | Pair menu supports BTCUSDT, ETHUSDT, SOLUSDT; five supported interval buttons. | Source/market breadth cannot be copied because Whide intentionally supports three Binance USD-M instruments and five intervals. The anchored menu styling, hierarchy and selected/favorite states remain parity work; do not expose unsupported choices. |
| Chart type | TradingView exposes a chart-style picker from the toolbar. | No equivalent chart-style picker in the current host toolbar. | Visible parity gap; assess only styles the renderer can genuinely support. |
| Drawing rail | Fixed left rail with categorized flyouts, more individual tools, and a toggle for a floating Favorites toolbar. | Fixed 40 px host rail with tool groups, magnet, and stay-in-drawing-mode controls. | The fixed rail placement is correct and must stay fixed. Group menus and the optional floating Favorites toolbar remain incomplete. |
| Chart heading/status line | Symbol, interval, exchange, market status, OHLC/change/volume and indicator controls in a tight row. | Symbol, interval, OHLC/change/volume and indicator legends render in the chart. The approved native settings now control supported visibility. | Functional foundation is present. Compare exact spacing, field order, typography, hover-only actions and the menu behind the heading's More controls. |
| Price and time scales | Numeric price labels, unit/currency selector, axis controls and time labels. Right-clicking the price scale opens Auto, Lock price to bar ratio, Scale price chart only, Invert, Regular/Percent/Indexed to 100/Logarithmic, Move scale to left, Labels, Lines, Plus button and More settings. Right-clicking the time scale opens Reset time scale, Time zone, Session breaks and More settings. | Right-clicking either axis opens its own menu at the pointer. Price has Auto, Invert scale, four scale modes, side, Labels, Lines and More settings. Scales and lines has No overlapping labels. Time has Reset time scale, a scrollable named-timezone list and More settings. | The anchored menu surface, compact rows, dividers, checks and submenu arrows closely match. Whide still lacks Lock price to bar ratio, chart-only scaling, Plus button, session breaks and Exchange alias because those behaviors are not implemented. The timezone list includes Chongqing. |
| Chart settings | Large centered dark dialog with left navigation, aligned compact controls, section dividers, and fixed footer. Live TradingView lists Symbol, Status line, Scales and lines, Canvas, Trading, Alerts, Events. | Native dialog now has the four approved core tabs, real shared preferences/rendering, templates, and Cancel/OK behavior. Live TradingView's AX tree also exposes the other three tabs. | Trading contains order, position, P&L, and execution controls; Alerts contains alert-line/toast behavior; Events contains ideas, session breaks, economic events, and news. These functions are not implemented in Whide, so copying those controls would be misleading. The visual capture remained on Scales and lines while AX reported other tabs, so their control lists are structural evidence only. |
| Indicator browser | Dedicated search/category/list surface with saved/favorite areas. | Centered native browser with search, supported-study categories, compact results and settings for active studies. | The visual structure and real-study search/categories are implemented. Whide has no user scripts, purchased/community studies, or saved favorites to show. |
| Watchlist | Right panel with tabs/actions, dense symbol rows, instrument details and more list management. | Narrow panel lists the three supported pairs and last prices from visible charts. | Placement is similar; density, row hierarchy, panel actions and market details need work. The instrument universe remains constrained by Whide's data support. |
| Right utility rail | Multiple vertical workspaces: watchlist, alerts, object tree/data window, screeners, editor, calendars, news, chat and help. | Watchlist, chart layout, chart settings, workspace export. | Rail geometry is present but the icon set/panel navigation differs. Only add true Whide capabilities; alerts, broker trading, Pine, news and account panels are not available. |
| Chart layout menu | Black, compact icon grid grouped by chart count from 1 to 16; selected layout is a white tile. Sync section has Symbol, Interval, Crosshair, Time and Date range switches. | Dark compact icon grid grouped by chart count from 1 to 4; five layouts the workspace actually supports, a white selected tile, and Crosshair plus Time & scrolling switches. | Live desktop comparison now matches panel width, row density, icon size, separators, selected surface and neutral switch styling closely. TradingView offers many additional pane templates and three extra sync types that Whide does not implement. The shorter Whide panel reflects that smaller real feature set. |
| Quick ranges | `1D`, `5D`, `1M`, `3M`, `6M`, `YTD`, `1Y`, `5Y`, `All`, plus Go to and timezone clock. | Same nine labels, functional loaded-data windowing, calendar trigger, and UTC clock. | Labels/order and location now match. Range selection is bounded to the loaded chart window and does not silently change timeframe, per the local data and replay invariants. |
| Go to date | Centered dialog with Date/Custom range tabs, date/time inputs, a month calendar, Cancel and Go. | The packaged app shows the current structure, UTC fields, bounded calendar and Cancel/Go actions. | The packaged dialog was opened and cancelled without submitting a date. TradingView's live accessibility tree exposed both tabs and its selected Custom range fields, but its screenshot remained on the indicator browser; exact side-by-side dimensions, colors, native field rendering and focus treatment remain unverified. |
| Replay transport | Replay controls appear as a compact chart workflow when Replay is active. | Separate 42 px row with UTC time input, Go, play, next-candle, speed and state. | Functional; needs a composition pass against reference 08 so it sits with the other chart controls at TradingView density. Do not change the Replay clock or data semantics. |
| Bottom status/attribution | Quick ranges and UTC clock sit on the chart's lower edge. | Range/clock row plus a separate status/attribution strip. | Whide currently uses one extra row for mode, magnet, timestamp, storage state and required OpenCharts attribution. Reduce visual weight or consolidate where possible without hiding attribution or useful state. |
| Drawing object menus | Tool flyouts, object settings, lock/hide/remove and floating favorite tools. | Drawing flyouts and contextual drawing settings are implemented; fixed rail is verified. | Settings and core interactions exist. A floating Favorites toolbar is still a separate planned stage and must not move the fixed rail. |
| Keyboard, hover, and persistence | Hover-revealed actions, tool shortcuts, selection/lock/hide states, persistent layouts and templates. | Accessible labels, local workspace persistence, scoped undo/redo, drawings and settings persistence. | Core state behavior exists. Audit exact menu shortcuts, hover density, focus/focus-return and reload behavior as each surface is rebuilt. |

## Current implementation in this increment

- Added TradingView's nine quick-range labels, range-to-visible-time mapping,
  Go to loaded timestamp, calendar affordance, and live UTC clock on the
  workspace's lower chart row.
- Replaced the single native Go to input in the working tree with a centered
  Date/Custom range dialog, month calendar, UTC fields and loaded-data-bounded
  submit behavior. Custom-range calendar days show the selected span.
- Unified host/vendor chart-bus IDs so the new controls target the active chart
  in both Live and Replay.
- Tuned the selected drawing tool surface to TradingView's neutral dark gray.
- Added separate pointer-anchored price-scale and time-scale context menus.
  Price-scale mode, side and inversion choices, label/line visibility,
  time-scale reset, timezone selection and More settings map to current
  preferences and chart APIs. Keyboard navigation and focus return are
  supported.
- Grouped and styled the menus with compact dark rows, separators, checkmarks,
  submenu arrows and a scrollable timezone list. Added TradingView's Chongqing
  timezone alias after confirming the runtime supports `Asia/Chongqing`.
- Rebuilt the chart layout chooser as TradingView's icon-first rows grouped by
  chart count, with a white selected tile, dividers and neutral switches. Kept
  the five supported workspace layouts and its two real sync behaviors; no
  layout or sync preference was changed during inspection.
- Rebuilt and opened the installed desktop after these menu changes. The live
  view remained Live BTCUSDT/4h with UTC selected; the timezone submenu rendered
  beside the time menu, and neither chart settings nor candle preferences were
  changed during inspection.
- Rebuilt and opened the desktop again for a direct layout-menu comparison.
  TradingView remained BTCUSDT/1h and Whide remained Live BTCUSDT/4h with the
  Binance USD-M feed updating. Both layout menus were opened without selecting
  a layout or changing synchronization.

The range implementation deliberately operates within the bars loaded for the
current symbol/timeframe. A request outside those bars is rejected rather than
inventing history or violating the bounded replay window.

## Live desktop comparison follow-up

- Rechecked TradingView's live timezone accessibility tree: UTC, Exchange and
  the named city list are present. Whide has the same named timezone choices
  except Exchange; UTC remains the selected value in both apps. Added Chongqing
  to Whide's list. Exchange needs an explicit preference model before it can be
  represented as a selectable value without lying about persistence.
- Opened Whide's installed price menu, time menu and timezone submenu. The price
  menu is anchored to the right scale; the time menu sits by the clicked axis,
  with the tall timezone list opening beside it. The Live BTCUSDT/4h chart and
  UTC preference remained unchanged.
- During the earlier layout inspection, TradingView's screenshot stayed on the
  Events settings view while its accessibility tree reported the layout menu.
  A later fresh capture rendered the menu correctly, enabling direct visual
  comparison; neither app's layout selection was changed.
- Opened the Go to dialog in the installed Whide app. It showed the centered
  Date/Custom range tabs, UTC date/time fields, bounded month calendar and
  Cancel/Go footer; Cancel returned to Live BTCUSDT/4h without submitting a
  date. TradingView's accessibility tree showed the same tab structure and a
  selected Custom range, but its screenshot stayed on the indicator browser
  after the tree changed. The side-by-side visual comparison therefore remains
  open; no symbol, interval, candle setting, viewport or chart preference was
  submitted.
- Whide was kept at Live BTCUSDT/4h; TradingView remained BTCUSDT/1h. No symbol,
  interval, candle setting, workspace preference or viewport was submitted.

## Indicator browser follow-up — 2026-10-28

- Replaced the small anchored indicator list with a centered native dialog,
  matching TradingView's search-first composition, dark surface, left category
  rail, compact result rows, selected-category treatment and close control.
  The row density was tightened after direct screenshot comparison.
- The catalog contains only Whide's eight implemented studies. Search covers
  their names and real chart placement; categories separate price overlays and
  oscillators. Toggling an entry changes the active chart, and settings are
  exposed only for an active study. No community, purchased or custom-script
  entries are represented as if Whide supported them.
- In the installed Electron app, `moving average` returned SMA, EMA and MACD;
  selecting Oscillators with that query left MACD, and clearing the query showed
  RSI, MACD, ATR and Stochastic. The live result count announced 8 then 3
  results, the selected category retained a visible keyboard-focus ring, and
  Escape closed the dialog and restored focus to Indicators. No study was added
  or removed.
- TradingView's browser remained open at BTCUSDT/1h. Whide was BTCUSDT/4h; after
  packaging it was returned to Live and the Binance USD-M status showed an
  updated feed. Candle appearance, chart settings and layout were not changed.
- Visual comparison used the apps' current desktop sizes. A matched 1280×720
  and narrow 390×720 check remains outstanding. Full build and interaction
  evidence is in `docs/2026-10-28-indicator-browser-verification.md`.

## Time-scale labels follow-up — 2026-10-28

- Reference 05 has **Day of week on labels** enabled. Added the same checkbox
  to Whide's Scales and lines tab, defaulted it on, and wired it to the existing
  time-scale formatter. It prefixes only day-of-month ticks using the selected
  display timezone; chart timestamps and the UTC Replay clock are unchanged.
  The value is included in shared preferences and saved settings templates.
- Opened Whide's live axis submenus without toggling anything. Labels exposes
  checked Price scale and Last value label rows; Lines exposes checked Current
  price line. TradingView reported that the user had changed its app while the
  live price-scale menu was being opened, so the fresh submenu contents remain
  unverified against the desktop app. No settings were changed.
- Reference 05 also shows Currency and Unit, Lock price to bar ratio, No
  overlapping labels, Plus button, and Symbol/Indicators/High and low/Bid and
  ask rows. Whide does not expose these as inert controls; each needs a real
  renderer behavior before it can be added.
- The follow-up vendor package passed 328 tests / 1 skipped and package checks;
  host `npm ci`, 78 tests / 2 skipped, typecheck, web build, and desktop build
  also completed. The desktop build installed under `~/Applications`, but CUA
  timed out after 60 seconds attaching to the running app and fresh bundle, so
  the new checkbox and tick rendering still need a visual desktop check.

## Price-scale inversion follow-up — 2026-10-28

- Added TradingView's **Invert scale** checkbox to Whide's price-axis menu.
  The preference defaults off, persists with the shared chart appearance and
  settings templates, and maps to Lightweight Charts' `invertScale` on only the
  selected left or right price scale.
- In the pinned OpenCharts clone, the new preference, rendering, and template
  tests failed first for the missing field/mapping, then passed. The full suite
  passed with 331 tests / 1 skipped; typecheck, package check and clean-patch
  reproduction passed. The clean clone's packed tarball was byte-identical to
  the source clone. `build:lib` and pack exited 0 with the existing upstream
  `ImportMeta.env`/`glob` declaration diagnostics.
- Host `npm ci` exited 0; 78 tests / 2 skipped, typecheck, web build and 32
  backend tests passed. `desktop:build` exited 0 and installed the app.
- CUA could not retrieve the app window: the bundle ID resolved to both the
  installed and build-output copies, and the explicit installed path timed out
  after 30 seconds. The app appeared as running afterward, but the new menu
  item was not visually confirmed. No preference was toggled.

## Price-label overlap follow-up — 2026-10-28

- Added Reference 05's **No overlapping labels** checkbox to Scales and lines.
  It defaults on, persists with shared appearance preferences and named
  templates, and maps to Lightweight Charts' `alignLabels` for both built-in
  price scales. This does not alter chart data or candle appearance.
- The preference, renderer mapping and template tests failed before the change
  and passed after it. The complete pinned vendor suite passed: 335 passed / 1
  skipped. A fresh checkout of the pinned revision accepted the generated patch;
  its library test suite, typecheck, package check and pack passed. Its tarball
  matched the source-clone pack byte-for-byte. `build:lib` exited 0 with the
  existing upstream `ImportMeta.env`/`glob` declaration diagnostics.
- Currency and Unit, Lock price to bar ratio, Plus button and additional
  Symbol/Indicators/High and low/Bid and ask labels remain unsupported controls
  until their renderer behavior exists.
- `npm run desktop:build` completed and installed the rebuilt app. Computer Use
  timed out after 30 seconds when binding its exact installed path, so the new
  checkbox and rendered label spacing still lack a live visual check. No chart
  setting was changed.

## Remaining implementation order

1. Finish the top-toolbar pass for pair, interval, chart style where supported,
   Replay, layout, and the search/settings actions Whide actually provides.
   Pair search, grouped supported intervals, layout, and the indicator browser
   are implemented; the full matched-viewport review remains.
2. Finish the Go to date/calendar visual comparison in the packaged desktop
   app; Whide's dialog has been opened and cancelled, but TradingView's live
   screenshot did not update from its indicator browser. Keep UTC and
   loaded-data bounds intact.
3. Finish supported axis-menu parity, including a fresh visual comparison of
   Labels and Lines submenus. Whide's checked states are recorded above, but
   TradingView's price-scale menu could not be reopened while its app was being
   changed by the user. Keep unsupported actions unavailable until Whide has
   real chart behavior for them; add Exchange only with explicit Binance-to-UTC
   semantics and persistence.
4. Tighten the watchlist panel and right-rail navigation against the reference.
5. Recompose Replay, the range/clock row, and the bottom status line against
   reference 08 while preserving licensing attribution and status information.
6. Finish with the floating Favorites drawing toolbar. The existing left rail
   remains fixed at 40 px.
7. Recheck each opened/closed menu and settings tab at a matched 1280×720
   viewport, then at the narrow viewport. Record screenshots and interaction
   evidence before calling the broad parity audit complete.

## Limits of this audit

This is a live surface inventory and prioritized parity baseline, not a claim
that every TradingView menu has been exercised or that Whide Charts is already
one-to-one. The current TradingView interval menu, layout menu, price/time scale
menus, indicator browser and Scales and lines view were visually captured;
style, symbol-search, Trading, Alerts and Events controls were read live from
accessibility state. During an earlier follow-up, TradingView's screenshot
stayed on the Events settings view while its accessibility tree reported the
chart and timezone menu; those earlier interactions are recorded as AX evidence
only. Whide's packaged Go to dialog was opened and cancelled, but TradingView's
screen capture stayed on the indicator browser while its accessibility tree
reported the Go to dialog, so direct visual comparison is still pending. Recent layout and
indicator dialog screenshots used the apps' current desktop sizes, not a
matched 1280×720 viewport. Product-specific panels with no Whide equivalent
remain unavailable instead of being represented by inert controls.
