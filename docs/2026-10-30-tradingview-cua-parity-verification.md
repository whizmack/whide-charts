# TradingView parity comparison — Computer Use, 2026-10-30

## Scope and method

Compared the installed Whide Charts Electron app directly with the already
open TradingView desktop browser using Computer Use. This was a live visual
and control-surface comparison, not a source-only review. The supplied
references inspected for this pass were 02 (watchlist), 05 (scales and lines),
and 08 (Replay controls).

The apps were at their current desktop window sizes, not a matched 1280×720
viewport. No screenshots were added to the repository. The Whide chart stayed
on BTCUSDT/4h at its existing Replay cursor; TradingView was returned to its
existing BTCUSDT/1h Live view. Dialogs and menus were closed without submitting
or toggling settings. No symbol, interval, candle appearance, viewport, drawing,
workspace, or stored preference was intentionally changed.

## Findings

| Surface | Directly verified | Differences and decision |
| --- | --- | --- |
| Go to | Both apps expose Date and Custom range, calendar/date controls, and Cancel/Go actions. Whide's centered dialog and dark styling are close to the TradingView composition. Both dialogs were opened and cancelled. | TradingView can select a custom date range across its chart history. Whide constrains UTC seeking to the loaded dataset and shows the OS-native date input format. These are real data and platform differences; preserve the UTC/data bounds and native input behavior. Submitting a seek was not tested because it would change the user's chart cursor. |
| Price-axis menu | TradingView showed Auto, Lock price to bar ratio, Scale price chart only, Invert scale, Regular/Percent/Indexed to 100/Logarithmic, Move scale to left, Labels, Lines, Plus button, and More settings. Whide showed Auto, Invert scale, the four scale modes, Move scale to left, Labels, Lines, and More settings. Both menus are compact, pointer-anchored dark menus. | Lock price to bar ratio, chart-only scaling, and the Plus button have no Whide behavior and remain absent. Whide's Labels submenu exposes Price scale and Last value label; Lines exposes Current price line. TradingView also has symbol/previous-close/indicator/high-low/bid-ask labels and lines, Countdown to bar close, and No overlapping labels. Whide's No overlapping labels behavior exists in Scales and lines settings, but not in this submenu; Countdown and the other rows have no Whide behavior. Keep the existing preference real and do not add controls until their behavior exists. |
| Time-axis menu | Both expose Reset time scale, Time zone, and More settings. Whide's timezone list includes UTC and named zones; UTC was selected. | TradingView also shows Session breaks and an Exchange timezone alias. Whide keeps explicit UTC semantics for Binance data and has no session-break feature, so neither option was added. No timezone was changed. |
| Watchlist | Whide's panel opened from the right rail and showed Watchlist, Replay snapshot, Symbol/Last columns, and BTCUSDT, ETHUSDT, and SOLUSDT. Rows are 32px high in a 252px panel. It explains that values come from visible charts; unavailable pairs show `—`. The panel closed from its rail control. | TradingView's actual list contains user-specific groups, more instruments, and Last/Chg/Chg% values. Whide intentionally supports only three USD-M pairs and currently sources prices from visible charts. Do not copy account-specific symbols or display unsupported/stale metrics. A source-backed watchlist feed and additional real list management remain open product work. No row was selected. |
| Right utility rail | Whide's fixed 40px rail exposes Watchlist, Chart layout, Chart settings, and Export workspace backup. Its geometry is close to the reference. | TradingView has more workspaces and services. Alerts, screeners, Pine, news, community, and account panels have no Whide implementation, so they remain absent rather than inert. The left drawing rail stays fixed at 40px. |
| Replay controls | TradingView's Bar Replay control was opened and closed without selecting a start point. It offered a chart start-point selector, playback speed, interval, step, and close controls. Whide visibly provides a UTC date/time field, Go, play/pause, next candle, speed, and an explicit paused/playing, all-charts, timeframe status. | The control models differ: TradingView selects a chart bar, while Whide seeks the app's shared UTC `asOf` within available history. Keep Whide's bounded shared-clock behavior; do not add a nonfunctional start-point selector. Playback, stepping, and seeking were not activated in this pass. |
| Time/range row | Whide displays the same `1D`, `5D`, `1M`, `3M`, `6M`, `YTD`, `1Y`, `5Y`, `All` quick ranges, a calendar action, and a UTC clock. The range row remained visible under Replay. | Its values and actions reflect Whide's loaded window and UTC clock. TradingView's row is tied to its chart history and exchange context. No range or clock action was submitted. |
| Bottom status bar | Whide shows mode/chart count, the snap hint, magnet state, Replay timestamp when available, storage error state, and OpenCharts MIT attribution. | TradingView's lower area combines different Replay/trading-panel controls and status. Whide's extra app state and required attribution remain visible. Consolidation or spacing changes need a matched-viewport review; no status controls were changed. |

## Verified and still open

Direct visual comparison is now verified for Go to, both axis menus and their
submenus, the watchlist, the utility rail, Replay controls, the range/clock
row, and the bottom status bar. Menu/panel open and close behavior was observed
in the apps. No preference toggle, seek submission, watchlist selection, range
change, Replay step, or playback was exercised because those actions alter the
user's active chart state.

Open work:

- Repeat the visual review at matched 1280×720 and narrow 390px widths without
  changing chart zoom, pan, or saved workspace state.
- Decide whether the watchlist should acquire source-backed prices for
  non-visible pairs and real list-management behavior before adding columns or
  actions.
- Add axis options only alongside supported renderer behavior; session breaks,
  Exchange alias, and the other absent controls remain unsupported.
- If a behavioral Replay check is needed, snapshot and restore the existing
  cursor and workspace around the check; this pass verified the live controls
  and their labels, not playback progression.
- The floating Favorites drawing toolbar is outside this pass. Keep the
  existing left drawing rail fixed at 40px.

No code or user data was changed in this comparison. Host tests and builds were
not rerun because this pass changed documentation only.

## Follow-up: status row and magnet menu

The direct comparison above records the UI as it looked before the subsequent
user-requested cleanup. The cleanup now removes the separate bottom status row;
the Replay transport and time/range row remain. The fixed 40px left rail opens
an Off / Weak / Strong magnet menu, and its existing persisted magnet value and
temporary Cmd/Ctrl snap remain intact. The OpenCharts and Lightweight Charts
license links are under Settings → About & licenses. The visible TradingView
chart attribution remains in the chart.

Host `npm test` passed with 90 tests and 2 skipped; `npm run build` passed,
including TypeScript checking. Computer Use inventory detected Chrome, but
`getApp("Google Chrome")` and the bundle-ID retry both timed out with
`-10005: timeoutReached`. Therefore the current menu placement, selections,
Settings/About dialog, and removed bottom row are not visually verified. A
fresh Computer Use pass remains open; the prior visual comparison does not
count as evidence for the edited build.

## Follow-up: isolated visual check of the cleanup

Computer Use later attached to Chrome and opened the Vite build at
`127.0.0.1:5193` in an Incognito window, isolated from the saved workspace.
The screenshot confirms that the separate bottom status row is gone, while the
Replay transport, time/range row, chart TradingView attribution, and left/right
utility rails remain. The left Magnet control visibly opens a compact Off /
Weak / Strong menu with Weak selected. No saved chart or workspace was opened.

The Settings menu exposed `Chart settings` and `About & licenses` in the
accessibility tree, but Computer Use could not select the transient menu item
or display the About dialog. Its final visual placement and license links are
therefore still open. Magnet selection changes to Off and Strong were not
verified; the screenshot only confirms the menu and its current Weak state.
The Incognito preview and temporary Vite server were closed afterward.

## Follow-up: final pre-commit checks

On 2026-10-30, the host checks passed against the combined worktree: backend
`uv run pytest -q` (34 passed, with one Starlette deprecation warning),
`npm test` (90 passed, 2 skipped), `npm run typecheck`, and `npm run build`.
`git diff --check` also passed. A fresh Computer Use attempt timed out while
reconnecting to Chrome and found no available browser provider, so it added no
new visual evidence for About & licenses or Off/Strong magnet selection.
