# Live / Replay verification — 2026-10-14

## Implemented behavior

The current terminal redesign adds a real Live / Replay selector, compact toolbar,
chart readout and right utility rail. The chart's native settings dialog controls
its appearance; cosmetic changes now trigger persistence without a pan.

Live has an ephemeral, validated 1,000-candle buffer. Each connection subscribes
to the current official Binance USD-M market kline stream and hydrates via the
public futures klines REST endpoint. Updates replace the current OHLCV candle;
a new timestamp appends a candle. Socket-close/error, silent timeout and failed
hydration mark the view stale. Retry backs off from 1 to 30 seconds and refreshes
the entire window, checking continuity before accepting updates. No account API,
order endpoints or keys were added.

Replay still reads immutable local data with its own selection/asOf and dataset
version. The chart is remounted at mode boundaries. Drawings and viewports are
isolated; renderer appearance transfers between modes. Live drawings are not
subject to replay's creation-time filter. Switching away checkpoints the replay
selection even while a historical request is pending.

## Evidence

- `npm run build`: TypeScript and production build passed.
- `npm test`: 25 deterministic frontend tests passed; 2 network tests skipped by default.
- `.venv/bin/python -m pytest -q`: 32 passed; existing Starlette/httpx deprecation warning.
- `RUN_BINANCE_LIVE=1 npm test -- integration/live.test.ts --reporter=verbose`:
  2 real-network tests passed. All 15 pair/timeframe streams returned real klines.
  A real BTC feed produced distinct closes (81627.4, 81627.5, 81625), then a forced
  socket close caused stale status, a second REST hydration, and resumed live data.
- Deterministic tests cover hydration buffering, current-candle replacement,
  missed candles after reconnect, malformed/wrong-market data, silent connection,
  stalled hydration, failed REST retry, and ignoring late events after disposal.
- Backend tests verify the fixed REST destination, allowlisted markets/timeframes,
  no-store response, explicit exchange outage and unchanged immutable dataset version.
- Session/bridge tests verify copied appearance and indicators, isolated drawings,
  no mutation of replay state, native cosmetic change saving and live drawing visibility.

## Browser verification

- BTCUSDT live candles and prices visibly updated; ETHUSDT 1h and SOLUSDT 4h
  displayed exchange prices with changing last-update UTC timestamps.
- BTCUSDT 5m replay at 2023-05-12 19:22 UTC survived Live mode and reload.
- A temporary ETH Live horizontal line persisted across mode changes/reload and
  was absent from replay. It was removed using the eraser after verification.
- Native Canvas settings: toggled vertical grid, confirmed saved value in SQLite,
  reloaded and confirmed the switch remained off; restored the original on setting.
- Rewound replay to 2023-05-12 19:01 UTC, selected 1h: only the known 19:00 minute
  formed the partial hourly candle (close 26267.60). Restored original replay selection.
- Compact desktop and 390px layouts checked. No browser warning/error logs during
  live UI verification. Temporary viewport override reset after the check.

## Practical limits

Live displays a rolling 1,000-bar window, not a durable tick archive. On an outage
longer than that window it loads the latest complete window instead of inventing
intermediate candles. Internet and exchange availability are required for Live.
Replay remains usable offline. Live preferences/drawings reside separately in
this browser's localStorage; replay sessions remain in SQLite.

Official endpoint documentation verified at implementation:
https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/ws-streams/market
https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/rest-api/market-data
