# Workspace visual pass — 2026-11-02

Compared the supplied desktop screenshots and the open TradingView desktop UI.
The TradingView trend-tools flyout was inspected without selecting a tool or
changing its settings. It uses a crosshair cursor icon, endpoint-based line and
Fibonacci icons, a white active magnet, grouped tool rows and favorite controls.
Whide's catalog and Favorites behavior are smaller; unsupported TradingView
controls must not be represented as functional Whide actions.

This pass changes the desktop title region, symbol selector, chart symbol
header, instrument marks, and existing Indicators, Watchlist and drawing-rail
icons. The chart's saved appearance and viewport are not changed. The fixed
rail continues to use the vendor buttons and their existing actions. For an
active drawing tool the vendor's tool-specific icon remains visible. Supported
drawing groups are reordered in the vendor component itself, preserving their
visual and keyboard order together.

The follow-up adjusts the drawing-menu width and row styling and formats OHLC
and price-axis values with grouped digits. Price precision and minMove remain
derived from the existing preference and instrument; the volume series retains
its separate formatter. Locale day ticks use a compact day label, retaining the
selected timezone and weekday option. Explicit date formats remain available;
`yyyy-MM-dd` was corrected to use a numeric month.

The next pass adds a group heading to drawing flyouts and keyboard access:
Arrow Down opens a group, arrow keys and Home/End navigate it, and Escape or
selection returns focus to the rail. The watchlist groups the three available
USD-M perpetuals and retains a clear indication that its prices remain live
while a chart is in Replay. Line, ray, horizontal/vertical line and channel
entries have dedicated icons based on the supplied reference.

The toolbar also has a direct Chart settings action. The desktop title shows
the active symbol and its current chart-frame close, not a separate quote.
It hides the price when the frame no longer matches the active symbol,
timeframe, mode or Replay cutoff, and while Live is not connected.

Checks performed on the current checkout:

- An isolated Electron process used the checkout's desktop main process with
  only its port changed to the Vite development server, and a separate user
  data directory. Its window rendered the new title row, chart header and rail;
  after the vendor reinstall, its accessibility tree showed the updated rail
  order and a loaded chart.
  This is a development Electron check, not a packaged application build.
- In the isolated Vite origin, four charts and the layout menu rendered; the
  menu remained below the new title and toolbar rows. Switching to one chart,
  opening the drawing Lines menu, opening the indicator browser, opening the
  watchlist and selecting ETH were observed. After the existing backend went
  away, a local backend from this checkout was started and the ETH chart loaded
  on reload. Watchlist subsequently displayed real Live quotes. No production
  Electron localStorage was used for these checks.
- At 390 × 720 CSS pixels the watchlist remained reachable and the compact
  layout menu opened below both top rows, within the viewport. The browser
  viewport override was then reset.
- `npm test`: 94 passed, 2 optional Binance tests skipped; `npm run typecheck`
  and `npm run build` passed. `uv run --no-sync pytest -q`: 34 passed, with
  one Starlette deprecation warning.
- The patched vendor `workspace-overlays.test.tsx` passed four tests, including
  the drawing-group order. Its library build completed with existing unrelated
  `ImportMeta.env`/`glob` declaration diagnostics; the tarball was repacked and
  installed using a clean host `npm ci`.
- After the price-format follow-up, three vendor test files passed 15 tests;
  clean host `npm ci`, `npm test` (94 passed / 2 skipped), typecheck, build,
  and backend pytest (34 passed, one existing warning) passed. In a fresh Vite
  origin BTC displayed grouped prices on the axis, while SOL retained three
  decimals and the volume badge retained its compact `K` suffix. An isolated
  Electron window from the same checkout also rendered the grouped BTC axis
  and crosshair label. Drawing-menu rows were visually checked in Vite.
- A fresh Vite preview with 4h Replay showed compact `Wed 4` and `Sat 7`
  ticks under the selected weekday preference. Focused vendor tests check
  timezone boundaries, weekday on/off, month labels and explicit date format.
- Following the drawing-menu pass, 18 targeted vendor tests passed. The host
  was cleanly installed and `npm test` passed 94 tests with two optional
  exchange tests skipped; typecheck, build and 34 backend tests passed (one
  existing Starlette warning). In the isolated browser preview, Lines opened
  with its heading, End moved focus to Curve, Escape returned it to Lines,
  and Enter selected Trend Line. The watchlist showed all three real Live
  quotes. An isolated Electron window using this checkout also opened Lines,
  moved focus with End and restored focus on Escape. This is not a packaged
  application or an exhaustive canvas interaction test.
- After the icon follow-up, the current menu was inspected in Vite and an
  isolated Electron window. In the isolated browser origin, selecting Trend
  Line and clicking two points created a visible line and contextual toolbar;
  the test drawing was then removed. A 390px check showed the menu above the
  watchlist without clipping. The vendor's three focused test files passed
  18 tests; clean host install, 94 frontend tests (2 skipped), typecheck,
  build and 34 backend tests passed.
- In a fresh isolated preview, the title displayed the current Replay close,
  updated after Next, and the new toolbar settings button opened the existing
  dialog; Cancel restored focus. The same action was opened and cancelled in
  an isolated Electron window. Focused tests cover title-frame matching and
  stale Live status. The user profile and installed app were not modified.
- In the isolated preview, changing price precision from Default to 3 kept the
  EMA line visible and showed the same grouped three-decimal value in its
  legend and price-axis label. Oscillator values remained at two decimals.
  The latest host checks passed: 97 frontend tests (2 optional exchange tests
  skipped), typecheck, build, and 34 backend tests (one Starlette warning).

The screenshot goal is not yet complete. Remaining differences include the
organization of drawing menus and Favorites, missing
TradingView-only utility actions, time-axis labels and chart defaults, and
desktop interaction and narrow-width verification. The screenshots do not use
the same viewport, mode, studies, or saved chart scale, so no pixel-parity
claim is supported. The installed app was not replaced.

## 2026-11-04 Favorites follow-up

The fixed rail now has a star that toggles a separate floating Favorites bar.
Its picker uses the exported OpenCharts drawing catalog; favorite selection,
visibility, and position are stored under `opencharts-preview:drawing-favorites`.
The handle supports pointer dragging and arrow keys and its position is clamped
to the available workspace. The JSON workspace export includes these
preferences. A later follow-up added independent star controls to each
supported tool in the drawing flyouts as well as the floating bar picker.

In an isolated browser origin, adding Trend Line, closing the picker with
Escape, activating the second of two charts and drawing a line worked. The
line appeared only in that chart, its contextual toolbar opened, and the test
drawing was deleted. Dragging the Favorites bar and reloading retained its
position and tool. At 390 × 720 CSS pixels the bar and its scrollable picker
remained visible, and the viewport was reset afterward. A separate Electron
window loaded the same checkout, but
its captured frame stopped updating and its accessibility tree was out of
step after interaction; this does not establish desktop interaction parity.
Desktop drag, reload and compact-window checks remain open. No installed app
or user Electron profile was changed.

Host checks: 99 frontend tests passed, 2 optional exchange tests skipped;
typecheck and build passed; 34 backend tests passed with one Starlette
deprecation warning. Position clamping and invalid stored preferences have
focused unit coverage.

The drawing-menu stars were checked in a fresh browser origin: adding Trend
Line left the menu open and Cursor active, Escape returned focus to Lines,
and opening the floating Favorites bar showed Trend Line. Nineteen focused
vendor tests passed, including the new toggle and focus regression. The vendor
library build exited successfully but emitted its existing `ImportMeta.env` and
`glob` declaration diagnostics. A new isolated Electron window loaded the same
checkout on Vite port 5185; its frame again stopped updating reliably after
input, so native interaction is still unverified.

The next Favorites follow-up reproduced the picker being clipped when its
bar was dragged to the left edge. The picker now fits horizontally inside the
workspace and chooses the larger vertical side. In the isolated browser it
was visible at the far left, at the bottom right (opening upward), and after
resizing to 390 × 720; the viewport override was reset. A focused test covers
both edges and a small workspace. The current host checks passed 100 tests
(2 optional exchange tests skipped), typecheck, build, and 34 backend tests
(one Starlette warning). Another isolated Electron attempt again exposed an
accessibility state without a reliably updated window frame, so the native
interaction check remains unresolved.
