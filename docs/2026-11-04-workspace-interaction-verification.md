# Workspace interaction verification — 2026-11-04

## Browser preview

Started the current checkout with Vite at `http://127.0.0.1:5174/?desktop=1`.
The first captured browser frame was 1280 × 720 pixels; after the Codex browser
panel narrowed, subsequent interactions were checked in a roughly 450px-wide
frame. This is useful narrow-layout evidence, but it is not an exact 390px
check. The preview used a separate origin, so its localStorage did not share the
installed app's workspace preferences.

Observed in the preview:

- Favorites opened from the fixed rail; the picker opened below the bar, adding
  Trend Line did not select it, and Escape closed the picker and returned focus
  to its trigger.
- Selecting Trend Line from Favorites armed the same drawing tool as the fixed
  rail. A line could be drawn, selected, and deleted from the chart canvas.
- Dragging Favorites moved it by the pointer delta. Reload retained the moved
  position and selected tool.
- The two-chart layout opened at the narrow width. Activating chart 2 changed
  the active timeframe to 15m; a Favorites drawing appeared in chart 2 and was
  deleted there. The chart 1 canvas remained separate.
- With chart 2 active at 15m, Next advanced the shared Replay time from
  `2023-01-08T00:00` to `2023-01-08T00:15` and updated both visible charts. The
  time was restored to `2023-01-08T00:00` with Go. No test drawings remained.
- Continued Stage 5 at the narrow preview width: dragging the plot panned the
  visible candles; wheel input over the plot and a drag on the price scale
  changed the visible scale. These gestures changed only the Vite preview's
  chart viewport.
- With Crosshair sync enabled, clicking the 5m chart showed a vertical marker
  in the 15m chart at its corresponding candle boundary (23:35 on 5m and 23:30
  on 15m). Each pane displayed its own price marker.
- Switched both charts from Replay to Live. The UI first showed
  `Connecting to Binance Live…`, then displayed live BTCUSDT candles and a
  changing price with Live status. Returning to Replay restored
  `2023-01-08T00:00` and the historical bars.
- Opened the 2×2 layout at the same narrow width: four Replay charts rendered
  at 5m, 15m, 1h, and 4h. Next on the active 5m chart moved the shared time
  from `2023-01-08T00:00` to `2023-01-08T00:05`; all four charts updated. Go
  restored `2023-01-08T00:00` and the original bar values. No test drawings
  remained.
- Opened the indicator browser in the four-chart layout and added MACD to the
  active 5m chart. It rendered in a separate pane on that cell; the other three
  cells stayed unchanged. Removed MACD afterward, leaving the prior EMA and
  RSI setup intact.
- At the end, restored the two side-by-side chart layout and verified Replay
  remained at `2023-01-08T00:00`. Pan/scale testing changed viewport state only
  in the separate Vite preview origin; the installed desktop profile was not
  touched.

The Vite proxy used the already-running service on port 8765. Its data root and
dataset identity were not independently verified in this pass, so these checks
establish UI behavior only. No write request was made to the backend.

## Electron desktop

The installed Whide Charts window at `127.0.0.1:8765/?desktop=1` initially
returned a fresh accessibility tree and screenshot. It showed BTCUSDT 4h Live
with RSI, the drawing rail, utility rail, and range toolbar. No desktop control
was activated, so the installed profile was not changed.

The user-provided full report is for generic `com.github.Electron` 41.5.0,
with Codex listed as its responsible process. Thread 0 aborts in
`_RegisterApplication` while AppKit initializes its menu-bar/application
context; Thread 2 is in `LaunchServices::URLPropertyProvider::prepareValues`.
There are no Whide Charts frames or explicit Launch Services error text. Its
2026-11-05 14:17:27 timestamp matches the earlier sandboxed
`node_modules/.bin/electron --version` reproduction, so this pasted report is
the diagnostic Electron crash, not evidence that `Whide Charts.app` crashed.
The separate 2026-11-04 report has the same generic Electron/AppKit pattern.

The sandboxed `electron --version` reproduction aborted before loading
`desktop/main.cjs`; `ELECTRON_RUN_AS_NODE=1` succeeded, with a separate
`task_name_for_pid` permission warning. This localizes the reproduced failure
to Electron's GUI/AppKit startup path, before app or renderer code, but the
reports do not identify the exact Launch Services failure. The stack matches
the pattern in [Electron issue #52815](https://github.com/electron/electron/issues/52815),
which describes an AppKit abort when Electron cannot reach Launch Services.
That report covers Electron 43.1.0 on macOS 26.6; this machine reports
Electron 41.5.0 on macOS 27.0.1, so it is a matching pattern rather than proof
of the same underlying OS cause. The default command sandbox also denied
process inspection (`ps` returned `operation not permitted`).

To test the launch-context hypothesis, the current checkout was then launched
outside the command sandbox with a temporary Electron user-data directory at
`/private/tmp/whide-charts-electron-probe.VHiNpy/user-data`. I accidentally
omitted `PERP_REPLAY_DATA_DIR` from that launch. Since `.data/` exists,
`desktop/main.cjs` selected the checkout's `.data/` for the sidecar instead of
the empty temporary `data/` directory. The backend startup ran `Store.__init__`,
which sets WAL mode, ensures the existing tables, and sets `user_version=1`.
The database file's observed modification time is 14:23; no pre-launch mtime was
recorded, so the precise metadata delta cannot be established.

The Electron process stayed running and the backend health endpoint returned
`{"app":"perp-replay","status":"ok"}`. No API write request or import was
made. A subsequent read-only SQLite check reported `integrity_check=ok`,
`user_version=1`, 174 imports, 174 datasets, and 1 session. The market Parquet
files retain their 2026-10-14 modification times. The separate temporary data
directory remained empty. The read-only check created an empty WAL and SHM
sidecar; after confirming no open handles, I removed only those sidecars.

I repeated the launch with both paths explicitly isolated:
`PERP_REPLAY_DATA_DIR=/private/tmp/whide-charts-electron-isolated.bX9lia/data`
and `--user-data-dir=/private/tmp/whide-charts-electron-isolated.bX9lia/user-data`.
The current-checkout process stayed running, its health endpoint returned
`{"app":"perp-replay","status":"ok"}`, and its SQLite database was created
under the temporary data directory. No project `.data/` files were used.

For a renderer check with real historical bars, I made a SQLite backup into a
second temporary data directory using a read-only source connection and linked
its `market/` path to the existing Parquet folder. The Electron profile,
catalog, and backend writes were under `/private/tmp`; no import or market-file
write was run. Opening `.data/app.sqlite3` as the read-only backup source again
created an empty WAL and a 32 KB SHM sidecar. `lsof` showed no open handles, so
I removed only those generated sidecars; at final inspection the main database
was 6,377,472 bytes with a 14:23 modification time (no pre-launch mtime was
captured). The isolated Electron window loaded
the current checkout at 1440×920 CSS pixels (device scale factor 2). Chromium
DevTools Protocol reported title `Whide Charts`, `readyState=complete`, and 14
chart canvases.
The captured renderer screenshot is
[`docs/2026-11-05-electron-workspace.png`](2026-11-05-electron-workspace.png).
It shows the BTCUSDT 5m Replay workspace, EMA and volume, RSI pane, drawing and
utility rails, Replay controls, and range toolbar.

CDP mouse input opened Favorites and its picker, added `Horizontal Line`, and
confirmed the selected tool reported `aria-pressed=true`. An Escape key event
closed the picker and returned focus to `Choose favorite tools`. This changed
only the temporary profile's `opencharts-preview:drawing-favorites` value.
After reload, the Favorites bar and tool were restored. A pointer drag moved
the bar from `(672, 186)` to `(744, 230)` CSS pixels; that position survived a
second reload. Selecting `Horizontal Line` and clicking the price chart created
a drawing record in the temporary `opencharts-preview:workspace-drawings`
store, keyed to `chart-1:replay:BTCUSDT` and the current Replay cutoff. I then
cleared that temporary drawing record and reloaded; the store was `{}`.

I emulated a 1280×720 renderer viewport through CDP in the same Electron
window. The single-chart layout rendered, the two-column layout rendered two
cells at 600×567 and 599×567 CSS pixels, and the four-chart layout showed all
four cells. Replay's datetime input remained inside the viewport at y=649–680.
The four-chart capture is
[`docs/2026-11-05-electron-four-chart-viewport.png`](2026-11-05-electron-four-chart-viewport.png).
The renderer viewport was emulated; this does not verify native window resizing.
The temporary workspace was returned to one chart before shutdown.

Chart settings opened as a modal dialog; the Symbol, Status line, Scales and
lines, and Canvas tabs all rendered. Cancel closed it without saving a change.
The Indicator browser also opened and closed, listing eight supported studies
with the existing EMA and RSI marked for removal and the other studies available
to add. The Canvas-tab capture is
[`docs/2026-11-05-electron-settings.png`](2026-11-05-electron-settings.png).
At the 1440×920 CSS viewport, the Navigation section begins near the fixed
settings footer and the remaining Canvas options require scrolling. A matched
viewport comparison and compact-layout follow-up are recorded below.

The Replay request in that window used `asOf=1673136000000` (2023-01-08
00:00 UTC); its 1,000 returned 5m bars ended at `1673135700000`, and the last
bar ended exactly at the cutoff. This confirms the tested renderer request did
not include a future bar.

CUA's `getApp("Electron")` still fails while starting a ScreenCaptureKit
stream, but CDP provided a renderer capture and discrete input path. The
Electron process was stopped with SIGINT; fresh checks found no listener on
ports 8765 or 9223. The installed Whide Charts app was not launched, rebuilt,
replaced, or modified. The full desktop interaction pass remains open: native
window resizing, maximize/restore, transactional settings changes, magnet and
axis gestures, more drawing-tool families, and the exact narrow-width check
still need verification.
The CUA capture failure does not establish an application rendering defect.
The long CDP/viewport session logged Chromium `SharedImageManager` and
`GL_INVALID_VALUE` GPU mailbox warnings on SIGINT shutdown. A separate isolated
launch and shutdown without CDP or viewport emulation emitted none. No visible
render failure occurred before shutdown; the warning's precise trigger was
not isolated.

## 2026-11-05 matched Canvas settings follow-up

I compared Canvas settings in the same isolated Electron checkout at a CDP
emulated 1000×650 CSS viewport and device scale factor 2. The renderer capture
is 2000×1300 pixels, one pixel shorter than the 2000×1301 TradingView
reference. This is a renderer viewport emulation, not a native window resize.

Before the change, the dialog measured 880×602 CSS pixels; its content was
1110px tall inside a 454px viewport, so the five sections and 18 control rows
required scrolling. I added host CSS in `web/compare/preview.css` to keep the
desktop dialog at 44% of the viewport width (bounded to 420–880px) and compact
its header, section spacing, rows, and controls only for shorter desktop
viewports. The final dialog measured 440×552 CSS pixels. Its content measured
480px tall and all five sections and 18 control rows were visible without
scrolling; select controls measured 20px high and checkboxes 13px.

The final screenshot is
[`docs/2026-11-05-electron-settings-canvas-matched.png`](2026-11-05-electron-settings-canvas-matched.png).
I repeated the layout check at 1280×720 CSS pixels / DPR 2: the dialog measured
563×552 CSS pixels, content remained 480/480px, and all 18 rows were visible.
That capture is
[`docs/2026-11-05-electron-settings-canvas-laptop.png`](2026-11-05-electron-settings-canvas-laptop.png).
CDP mouse input selected Canvas and confirmed focus moved to that tab. Cancel
closed the dialog; a before/after localStorage snapshot in the temporary
Electron profile was unchanged. No chart settings were changed. The
current-checkout `npm run build` passed. The installed application and its
profile were not opened or modified.

The matched-viewport review now also covers the Symbol, Status line, Scales and
lines, and Canvas tabs, plus the Indicator browser; the native window resize
check remains open. The reference includes Trading, Alerts and Events tabs
that this workspace does not implement; no inactive placeholders were added.

## 2026-11-05 settings and Indicator browser polish

I reviewed all four Chart Settings tabs in the isolated Electron checkout at
1000×650 CSS pixels / DPR 2. Symbol measured 440×290 CSS pixels with 8 rows;
Status line 440×310 with 9; Scales and lines 440×390 with 12; Canvas
440×552 with 18. Every row stayed inside its content area. The setting-tab
icons measured 16×16 CSS pixels; labels and controls did not overlap or clip.
The Canvas tab at 1280×720 had already been checked in the preceding section.

The Indicator browser initially measured 880×586 CSS pixels at 1000×650
(88% of the viewport width and 90% of its height); its supported-category
labels wrapped. I adjusted its desktop sizing and control density in the host
stylesheet. It now measures 500×325 CSS pixels at 1000×650 and 640×360 at
1280×720. At both emulated viewports, all eight supported indicators fit
without scrolling; category labels stay on one line, the counts remain clear
of the labels, and the active-study settings buttons fit inside their rows.
The list retains ellipses for long names instead of colliding with placement
text.

CDP interaction checks showed the Oscillators category returns four entries,
searching `MACD` returns one, and the close button and Escape both close the
dialog and return focus to the Indicators toolbar button. At a fixed viewport,
opening, searching, changing category, and closing left the temporary profile's
`opencharts-preview:` localStorage unchanged. The screenshots are
[`docs/2026-11-05-electron-indicator-browser-matched.png`](2026-11-05-electron-indicator-browser-matched.png)
and
[`docs/2026-11-05-electron-indicator-browser-laptop.png`](2026-11-05-electron-indicator-browser-laptop.png).
Both Electron viewports were emulated through CDP; neither capture verifies a
native window resize. The installed app and its profile were not opened or
modified.

The current checkout's `npm run build` passed and `npm test` passed with 100
tests; two optional Binance tests were skipped. These checks and screenshots
cover this settings-polish slice, not the remaining Stage 4/5 desktop work.

## Automated checks

- `npm test`: 100 passed, 2 optional Binance tests skipped.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `UV_CACHE_DIR=/private/tmp/whide-charts-uv-cache uv run --no-sync pytest -q`:
  34 passed, with the existing Starlette/httpx deprecation warning.

The initial Vite launch found the checkout's `node_modules` incomplete (`vite`
was missing). `npm ci --no-audit --no-fund` restored the lockfile dependencies;
the tracked package files remained unchanged. The Vite preview remains available
Earlier runs left the Vite preview at `127.0.0.1:5174` for follow-up. On
2026-11-06 the CUA inventory did not expose the ambient tab; a newly created
hidden CUA tab returned `ERR_CONNECTION_REFUSED`. That bridge result does not
establish whether the user's existing preview tab or Vite server is available.

## Remaining work

- Continue Electron checks through the working CDP path for native window
  resize, maximize/restore, transactional settings changes, Cmd/Ctrl temporary
  snap hold/release, axis scale gestures, and more drawing families, active-cell
  routing and undo. A single Trend Line creation/delete and Weak/Off menu
  selection were verified on 2026-11-06. CUA accessibility and screenshots
  worked, but native coordinate clicks returned `-10005`; CDP exercised the
  renderer inside the isolated Electron process. The 1280×720 layout check was
  emulated rather than a native window resize.
- Capture an exact 390px browser viewport and recheck the picker and workspace
  controls there.
- Continue Stage 5 with indicator input/style settings and remaining axis
  gestures at a desktop-sized viewport. The current browser pass covers adding
  and removing MACD, pan, zoom, price-axis scaling, crosshair sync, Live/Replay
  and one/two/four charts at about 450px; it does not complete the stage. No
  renderer migration decision is supported by this pass.

## 2026-11-05 Electron menu and spacing audit

I reviewed the main workspace toolbar, symbol and timeframe menus, chart layout
popover, drawing rail flyouts, Favorites picker, Watchlist, Replay controls,
workspace Settings/About, indicator settings, date range dialog, magnet menu,
and both chart-axis context menus in the isolated Electron app built from this
checkout. The checked drawing flyouts were Lines (8 rows), Fibonacci (2), Trade
(2), Brushes (3), Shapes (4), Text & Notes (3), and Measure (4); their labels
and favorite stars fit their rows. The Favorites picker showed 26 supported
tools with internal scrolling. The Watchlist fit its three supported pairs.
Symbol/timeframe selection and all opened dialogs were legible without clipped
labels, colliding icons, or overlapping controls. Earlier sections in this
report record the four settings tabs and Indicator browser bounds.

The layout popover had a 430px CSS width despite only needing a short layout
icon list and two sync rows. I reduced it to 360px on desktop. In the native
1440×920 Electron window it measured 360×315.5 CSS pixels with no horizontal
overflow; at an emulated 390×720 CSS viewport it measured 338×315.5 with both
labels and switches inside the panel. The screenshot is
[`docs/2026-11-05-electron-layout-popover.png`](2026-11-05-electron-layout-popover.png).

The audit reproduced a real axis-menu bug: right-clicking the visible RSI time
axis did nothing because the context-menu listener belonged only to the main
price chart. The indicator pane is a separate Lightweight Charts instance. I
now route the axis resolver through the clicked chart and register the listener
for each oscillator chart. A focused test covers recognition of the visible
time axis in that separate chart. In Electron, right-click opened Time scale
options (224×124 CSS) and its scrollable Time zone list (264×908); the RSI price
axis opened Price scale options (264×375) and the Price labels submenu
(224×74). Esc closed the menus. The evidence captures are
[`docs/2026-11-05-electron-axis-menu.png`](2026-11-05-electron-axis-menu.png)
and
[`docs/2026-11-05-electron-axis-timezone-menu.png`](2026-11-05-electron-axis-timezone-menu.png).

The Electron session used a temporary profile and a temporary data directory;
the installed application and its profile were not opened. Its initial reload
updated viewport keys in that temporary profile while charts rehydrated, so I
compared storage only around the menu interactions after the frame stabilized;
those menu interactions left it unchanged. CUA mouse input still returned
`-10005`, but CDP delivered renderer pointer events and the resulting menus
were inspected in the Electron frame. This verifies the renderer in an actual
Electron window, not native resize/maximize behavior. Remaining drawing work is
to exercise each tool's canvas gesture, snapping, undo, and active-cell routing;
axis scale dragging and settings changes also remain open.

Current host checks after the code and CSS changes: `npm test` passed with 101
tests and 2 optional Binance tests skipped; `npm run typecheck` and
`npm run build` passed. `git diff --check` passed after the report update.

## 2026-11-05 workspace color-state pass

I consolidated interactive workspace colors around neutral gray states, with
muted green reserved for Live feed/status and amber for stale/reconnecting
status. The selected Live mode button uses the same neutral treatment as
selected Replay.
This covers shared focus rings, selected/hovered toolbar controls, the active
chart outline, pair and indicator search, layout and axis menus, Favorites,
the Replay date/time and custom-range calendar, and drawing menus/settings.
The date/time segments now use a neutral focused state; the selected date and
range endpoints remain distinguishable from the range interior. Candles,
volume, EMA/oscillator lines, symbol marks, and the user's drawing colors keep
their data or user-selected colors.

I reviewed the date calendar, custom range, Live mode, and drawing flyout in the
Electron renderer. The earlier menu audit in this report also covers the pair
selector, timeframes, layout, Settings/About, EMA settings, magnet, Favorites,
Watchlist, Replay controls, and chart axes. The screenshots from this color
pass are
[`docs/2026-11-05-electron-colors-date-calendar.png`](2026-11-05-electron-colors-date-calendar.png),
[`docs/2026-11-05-electron-colors-range-calendar.png`](2026-11-05-electron-colors-range-calendar.png),
[`docs/2026-11-05-electron-colors-live-mode.png`](2026-11-05-electron-colors-live-mode.png),
and
[`docs/2026-11-05-electron-colors-drawing-menu.png`](2026-11-05-electron-colors-drawing-menu.png).
The `electron-colors-live-mode.png` capture predates the follow-up below and
shows the superseded green selected-button style.

The Electron renderer used the current checkout at 1440×920 CSS pixels / DPR 2
with a temporary profile and temporary SQLite catalog. A CDP style-state probe
in that renderer confirmed selected drawing controls and drawing-menu rows use
`rgb(52, 54, 58)` with `rgb(241, 241, 243)` text. A keyboard-focused drawing
checkbox has a single 2px `rgb(184, 187, 194)` outline and no extra shadow. Live
uses `rgb(97, 203, 178)` on `rgb(25, 51, 45)`. The probe used temporary DOM
elements to represent vendor active/focus classes; it did not save a drawing or
toggle an application setting. The temporary profile's `opencharts-preview:`
storage was unchanged. The installed app and its profile were not opened or
updated.

The default sandboxed Electron launch still aborts during AppKit startup before
Whide Charts code runs. The isolated Electron instance outside that sandbox
rendered and accepted CDP input. This pass addresses color-state consistency;
it does not complete the remaining native resize, maximize, canvas gesture, or
all-tool drawing interaction checks.

After the final CSS changes, `npm run build` passed, `npm test` passed with 101
tests and 2 optional Binance tests skipped, and `git diff --check` passed.

## 2026-11-05 Live mode selection follow-up

The user clarified that the selected Live button must look exactly like selected
Replay. I removed the dedicated green surface, label, and border from the Live
mode selector; both modes now use the same shared selected-state rule. Green
remains on Live feed/status text. The earlier Live screenshot above is
historical and is not evidence of the corrected selected state.

## 2026-11-06 Indicator browser readability follow-up

The user noted that the Indicator browser's text looked much smaller than the
rest of the workspace. The desktop media query had reduced the title to
12.5px, indicator names to 10.5px, category labels to 10px, and rows to 24px
while keeping a fixed, half-viewport dialog. I raised desktop text to 13–17px,
indicator rows to 34px, and changed the dialog sizing to a 480px maximum height
with width capped at 880px. This keeps the list dense while bringing its labels
closer to the workspace's regular UI scale.

`npm run build` passed after this CSS change. The isolated browser preview
rendered the full supported-indicator list, but its 604px CSS viewport used the
mobile breakpoint; it did not exercise the updated desktop rules. The new CSS
resolves to 640×480px at 1000×650 and about 819×480px at 1280×720; these are
formula-derived targets for the first desktop sizing pass, not fresh visual
measurements. The dialog was briefly expanded afterward, then restored to this
compact geometry when the user clarified the goal. A full-width Electron check
was still open at that point; the desktop follow-up below records the final
result. The user data backend was read for the earlier preview; only the browser
dialog was opened, and the installed app was not updated.

## 2026-11-06 Indicator browser typography follow-up

The user clarified that the dialog itself should stay compact; the target is
larger, more legible text inside it. I reverted the temporary proportional
resize to the prior desktop bounds: `width:min(880px,max(560px,64vw))` and
`height:min(480px,calc(100dvh - 40px))`. At the checked 1440×920 CSS viewport,
the dialog remains 880×480 CSS pixels.

I raised the title to 19px, search and indicator names to 16px, category and
placement text to 14px, section labels to 11px, and code badges to 12px. Rows
are 38px tall to give the larger type enough breathing room. This puts indicator
names above the 14px Chart Settings labels and category/placement text at the
same size, while common chart popover actions use 13px.

In isolated Electron 41.5.0 at 1440×920 CSS / DPR 2, the unchanged 880×480 dialog
showed all eight studies, category labels and counts. Long names remained
readable, placement text did not collide with add/check or settings buttons, and
the current EMA and RSI selections remained visible. The updated capture is
[`docs/2026-11-06-electron-indicator-browser-matched.png`](2026-11-06-electron-indicator-browser-matched.png).

The isolated profile uses an empty temporary data directory, so the underlying
chart reports that its saved dataset version is unavailable. This is expected
for the UI-only check and is not a result from the user's market data or
installed application. No project market files, user profile, or installed app
were opened or changed. `npm run build` and `git diff --check` passed.

## 2026-11-06 Electron magnet and Trend Line interaction follow-up

I used the current-checkout Electron renderer at
`http://127.0.0.1:8765/?desktop=1` in the isolated temporary profile. The
existing backend supplied chart bars through the read path; this scenario made
no API writes or imports. The installed app and its profile were not opened.

CUA accessibility showed the Magnet mode menu with Off, Weak and Strong. I
selected Weak and confirmed it became the active mode, opened Lines and selected
Trend Line. CUA screenshots worked, but every coordinate click on the chart
returned `-10005: noWindowsAvailable`; state and screenshot checks showed no
chart point was placed. I used the connected CDP scenario for this same
isolated Electron target after confirming its title, origin and target ID.

The CDP scenario selected Weak, then selected Off explicitly. Clicking the
active Magnet button reopens its mode menu; it does not turn snapping off by
itself. The scenario selected Trend Line, clicked the centers of the price pane
and its parent workspace, and observed the `Delete drawing` control appear.
It clicked Delete drawing, confirmed that control disappeared, and confirmed
Cursor was active. Every declared action completed. No drawing remains in the
temporary profile. This verifies one renderer drawing path and its cleanup; it
does not verify Cmd/Ctrl hold-release snapping, other drawing families,
active-cell routing, or native pointer input. The CDP scenario did not request
event capture or a screenshot, so its evidence is the completed action and
wait sequence rather than a saved image.
