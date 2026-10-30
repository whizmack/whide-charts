# Live Watchlist and older Live history verification

Date: 2026-10-30

## Implemented

- The open Watchlist subscribes to BTCUSDT, ETHUSDT, and SOLUSDT at 1m through
  the existing shared `livePool`, in both Replay and Live chart modes. It shows
  the latest close and a connection state. Closing the panel releases its
  subscriptions.
- In Live mode, OpenCharts' existing 500-bar history-on-scroll callback can
  request a bounded older range from the read-only `/api/live/klines` proxy.
  The half-open millisecond range is converted to Binance's inclusive `endTime`.
  Returned candles are validated and are not written to local history or
  localStorage. Replay cannot use this external history path.

## Verified

- In an incognito preview at the separate Vite origin
  `http://127.0.0.1:5191/`, Replay remained selected while the Watchlist showed
  `Live` and a last price for BTCUSDT, ETHUSDT, and SOLUSDT. The displayed
  prices changed during the check. The browser recorded 1m Live REST hydration
  requests for all three symbols. Clicking ETHUSDT selected ETH in the active
  chart and loaded its Replay bars without changing the Replay `asOf`. The
  origin used an isolated storage profile.
- In Live, clicking `All chart range` requested older 500-bar pages through
  `/api/live/klines`. Non-empty responses were recorded for BTCUSDT 5m
  (136,919 bytes), ETHUSDT 5m (135,491 bytes), and ETHUSDT 15m (137,726 bytes).
  The request bounds were before each chart's loaded range. This verifies the
  Live history request path for more than one symbol and timeframe; the trigger
  was `All chart range`, not a successful manual canvas pan.
- After returning to Replay and clicking `All chart range`, the number of
  ranged `/api/live/klines` requests stayed at five. Replay issued `/api/bars`
  requests for ETHUSDT instead, confirming the Live history gate.
- A native Chrome Incognito screenshot and accessibility tree at the isolated
  `:5192` origin showed live BTCUSDT candles, the `Live · Binance USD-M` status,
  and the bottom status row. This was a visual check of the Live chart/status,
  not a matched-size comparison or a screenshot of the Watchlist panel.
- Some requests were repeated or nearly overlapping: the same BTCUSDT 5m
  range appeared twice, and two ETHUSDT 5m ranges started one 5m bar apart.
  Their trigger was not isolated; request deduplication and overlap remain to
  be checked.
- Frontend tests: 88 passed, 2 skipped. Backend tests: 34 passed.
- `npm run typecheck` and `npm run build` passed. `uv run pytest -q` emitted
  the existing Starlette/httpx deprecation warning.
- Focused tests cover bounded proxy forwarding, invalid bounds and limits,
  half-open range conversion, empty pages, malformed/gapped pages, the adapter's
  Live-only gate, and Watchlist quote/status selection.

## Open verification

- A manual horizontal pan that reaches the loaded-history boundary and prepends
  older bars is still unverified. A horizontal wheel action moved the viewport
  toward newer data by two 5m bars and did not request an older page; the preview
  drag action rejected its selector. T3 preview snapshots timed out. The CUA
  browser provider was unavailable, and native Chrome coordinate drag/click
  returned `noWindowsAvailable`; AX and screenshots did work. The successful
  `All chart range` request proves the range-loading path, not the canvas pan
  gesture or visible prepend behavior.
- Screenshot-level visual comparison of the updated Watchlist header/status
  remains open for the same reason.
- While the isolated preview was being torn down, Vite logged one
  `ResizeObserver loop completed with undelivered notifications` diagnostic.
  It was not investigated in the installed desktop app.

No chart interaction was performed on the saved desktop workspace. The test
browser used a distinct Vite port and origin; only read-only market endpoints
were requested. No repository source files changed during this browser test;
the host suites, typecheck, and production build were rerun afterward.
