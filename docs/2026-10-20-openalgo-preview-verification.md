# OpenAlgo preview verification — 2026-10-20

Preview: `http://127.0.0.1:8765/openalgo.html` (the local backend was left running).
The browser runner is `scripts/verify-openalgo.mjs`; evidence is under
`docs/2026-10-20-openalgo-evidence/`. It starts a fresh Playwright Chromium
context and does not alter the app's Vela session.

## Data and isolation

- Rendered the real BTCUSDT 5m backend projection pinned to dataset
  `6c2457c7739df1dd0f4b2eb794e9217a10e91010ad73a22e96138938ab7bf046`, with
  the 10:25 UTC cutoff. Confirmed the 1h bar uses exactly 25 minutes (10:00–10:24):
  high 26418.3, low 26348.6, close 26372.9, volume 5563.881.
- Held a rewind request open in the browser. The renderer showed 0 bars during
  loading, and the future Long Position was absent from Objects. This exercises
  the real `/api/bars` request and host request guard.
- Compared `/api/session` before and after. The response was byte-for-byte the
  same. Preview replay and drawings use `perp-openalgo:v1:` localStorage; no
  Vela session write or native OpenAlgo replay was involved.
- Returned to Replay after Live. It remained at the saved 12:00 UTC cutoff.
  The browser received a real LiveFeed window of 1,000 bars; this is a current
  network-dependent observation, not a guarantee of Binance availability.

## Browser interactions exercised

- Long Position created through native clicks; entry, target and stop handles
  each moved independently by pointer drag. Undo and redo restored the stop
  change. Created a Short Position too. Drawings and native chart settings
  survived reload.
- Pan and wheel zoom changed the visible time range. Indicator settings for
  RSI opened and accepted a length change. The separate Volume, RSI and MACD
  panes rendered. Two- and four-chart layouts, maximize, reload, mixed
  BTCUSDT/ETHUSDT timeframes and a common replay step worked. A replay pan
  synchronized the timestamp range across 5m and 15m charts. Moving the pointer
  over the upper chart visibly changed the lower chart capture with crosshair sync on.
- At 390px width there was no horizontal page overflow and a chart could be
  maximized. Chart settings in the lower-right cell fit inside a 1280×720 view.
- Persistent magnet modes cycled off/weak/strong/off. Releasing Control during
  a drawing gesture left the persistent mode off. This confirms mode/keyboard
  cleanup; snapped anchor accuracy itself was not measured in this run.
- No page errors or console errors remained in the final browser run.

## Side-by-side capture

`ab-openalgo.png` and `ab-opencharts.png` use the same 1280×720 viewport, BTCUSDT
5m, dataset, 10:25 UTC cutoff, identical 1,000-bar API payload and the same
visible epoch-second time range. The OpenCharts capture used a test-only 1258px
chart grid so its 80px price axis left a 1178px plotting area, matching the
OpenAlgo widget canvas width minus its 56px price axis. This grid adjustment was
made only in the isolated browser context; neither preview's stored appearance
was changed. Details are in `ab.json`.

The OpenAlgo renderer has the fuller native indicator/drawing environment and
its Long/Short position handles felt direct in pointer testing. OpenCharts
already has stronger host workspace controls: flexible row/column/three-chart
layouts, interactive splitters, and purpose-built separate indicator panes.
OpenAlgo pane settings rendered, but this browser pass did not confirm dragging
an indicator pane boundary changes its weight. This is a functional comparison,
not an FPS or latency benchmark; no performance numbers were collected.

## Scope and known limits

- Each cell currently asks the backend for a safe, bounded 1,000-bar prefix.
  It clears to an empty canvas while each new projection is loading, including
  forward steps, so the current preview can briefly flash empty.
- Drawings and viewport state are scoped by cell, mode, symbol and timeframe.
  Undo history is native and temporary; the host clears it across context
  changes/rewinds. Drawing group semantics and cross-timeframe drawing sharing
  are not added.
- The tested Cmd/Ctrl transient magnet released cleanly, but precise snap-to-OHLC
  anchor behavior, pane boundary resize, browser keyboard accessibility and
  measured frame/interaction latency remain unverified.
- The preview uses OpenAlgo Charts 2.6.4, Apache-2.0, pinned and attributed in
  `third-party/openalgo/README.md`. Its source's full upstream suite was not
  rerun in this implementation turn; the host's clean npm install, tests,
  typecheck and production build were run.
- No existing OpenCharts or Vela appearance, drawing or saved market data was
  migrated. Do not treat preview presence as a migration decision.
