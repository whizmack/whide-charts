# Chart workspace verification — 2026-10-15

Implemented in `/compare.html`; the original Vela application remains at `/`.

## Automated checks

- Host typecheck/build: passed.
- Host unit suite: 41 tests passed; two exchange integration tests are opt-in in the ordinary run.
- Backend suite: 32 passed. Existing Starlette/httpx deprecation warning remains.
- Opt-in real exchange suite: 2 passed, covering all 15 symbol/timeframe combinations and a real public-feed reconnect/backfill (28.37 seconds).
- Patched vendor checks: 49 native indicator tests and one new drawing-pane regression test passed. The new test reproduced rejected drawing points when the time-axis widget width was zero before the geometry fix.
- Read-only review found partial-day VWAP labeling and batched multi-drawing callback issues. The first is disclosed in the legend, the second uses synchronous latest drawing snapshots and grouped undo entries.

## Browser checks

At a 1280×720 viewport:

- Four independently controlled cells displayed BTC 5m/15m/1h/4h; the second replay cell was changed to ETH 15m without changing the others.
- Four live charts updated actual public Binance prices. Observed BTC close changed from 81,052.80 to 81,085.80 during verification; no simulated price source was used.
- Live's second cell changed to SOL; returning to Replay restored ETH 15m and the original 2023-05-12 19:22 UTC cutoff.
- Seeking to 19:23 and taking a 5m step advanced every cell's DOM cutoff to 1683919500000 (19:25). The 1h and 4h candle closes updated with the known prefix. Rewinding restored 19:22. Backend tests separately enforce clipping before higher-timeframe aggregation.
- Grid time synchronization aligned different timeframes by timestamp. Crosshair used local instrument prices; oscillator legends followed the cursor.
- Maximizing/restoring retained the other cells. Reload restored the four-cell layout and indicator settings. Column splitters and pane height could be changed from the keyboard.
- RSI length changed 14→21, width 1→2, and position below→above. All applied visibly; settings were subsequently restored to RSI 14 below price.
- RSI has its own scale, shaded band and yellow SMA. MACD has blue/orange traces and a signed histogram. Only the bottom pane exposes the time axis.
- Horizontal drawing placement succeeded with the main time axis hidden. Cmd+Z removed it. Temporary Cmd snapping did not leave the magnet on after release. Persistent strong/off selection updated the rail state. Portal drawing menus remained reachable.
- Final browser console inspection showed no app errors or warnings.

## Explicit scope

The current data window is 1,000 bars. The first loaded UTC day of VWAP can be incomplete and is labeled `UTC · loaded bars`; this is not a full-history VWAP guarantee. Appearance preferences are shared across the workspace, while indicator inputs, pane heights/placement and drawings are per cell. Very small cells compress indicator panes; maximizing gives them more working room. Hidden cells unsubscribe from live data; identical visible live markets share a feed. No orders, credentials, trading account or paid service were added.

A read-only request confirmed the original SQLite session still selects SOLUSDT 5m at 1683919320000 with dataset version 6c2457c7739df1dd0f4b2eb794e9217a10e91010ad73a22e96138938ab7bf046. The vendor patch passes reverse-apply checking against the built source.

Preview state uses localStorage separately from the original Vela session. The backup exports workspace configuration/drawings; it does not export the historical Parquet dataset or migrate Vela drawings.


## Overlay bug fixes

User screenshots exposed two missed paint issues. The vendor `.opencharts, .opencharts #root` rule gave portaled drawing menus 100% viewport dimensions. Explicit intrinsic menu sizing now overrides it. Chart settings and the right-click menu were trapped in each cell's overflow/stacking context; the context menu now uses a viewport portal and settings use a native modal dialog in the browser top layer. Escape closes settings and the dialog handles focus/inert background behavior through the browser.

Three regression tests reproduce menu sizing, modal placement and context-action placement. Browser checks at 1014×894 confirmed a 180×202 drawing menu inside the viewport, successful right-click → Chart Settings from both upper-right and lower-right cells, a native `:modal` dialog attached to body outside all cells, Escape dismissal, and no console errors. Screenshots: `2026-10-15-drawing-menu-fixed.jpg`, `2026-10-15-chart-settings-fixed.jpg`.


## Magnet crosshair preview

The active chart now positions its crosshair using the same `pointFor` resolver as drawing placement and anchor edits. It previews OHLC weak/strong magnet targets before placement, responds to temporary Cmd/Ctrl changes without pointer movement, restores the free cursor on release, and refreshes against live candle changes. Pointer leave/blur and inactive-chart guards prevent stale previews overriding other charts. Mouse-up reapplies the snap after Lightweight Charts processes a click.

Seven vendor regression tests cover preview/committed-anchor equality, weak threshold, stationary modifier changes/release, inactive and stale pointers, growing candle data, blur cleanup and mouse-up behavior. Browser checks verified strong preview against a BTC 1h OHLC target and temporary Cmd snapping with a trendline armed before the first point, then release back to magnet off. No drawings were committed by that preview check. Original appearance preferences, replay time and layout were retained; the temporary maximization was restored. Proof: `2026-10-15-magnet-preview.jpg`.
