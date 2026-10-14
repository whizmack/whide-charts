# OpenCharts preview verification — 2026-10-14

Preview: http://127.0.0.1:8765/compare.html. Original Vela app remains at `/`.

## Integration

Original OpenCharts revision d3fc63cc002e6e651801be6e952e7514e58fa5fe, local 0.3.0 tarball, pinned in package-lock.json. Its controlled ChartPanel and settings are exposed by the small patch in third-party/opencharts. License/NOTICE/provenance are retained. Package build, declarations and scoped CSS generation succeeded. Host production dependency audit reported zero vulnerabilities at installation.

Host supplies candles from the existing replay projection and LiveFeed. No upstream demo, simulated forward ticks, trading gateway, order panels or upstream replay are mounted. Historical pagination is restricted to the supplied 1,000-candle safe window, honoring exclusive `toMs`. All times convert from milliseconds to seconds at the renderer boundary. Rewind/symbol/timeframe/mode changes discard the old native chart; forward replay steps preserve the chart instance. The old frame is concealed while the selected prefix is loading.

Preview owns `opencharts-preview:*` storage, independent of the SQLite Vela session. Upstream chart appearance lives in its separate OpenCharts preference namespace. This is an evaluation page, not a migration of Vela drawings/preferences. Reload starts paused in Replay; the preview replay selection is retained. Only our three symbols and five timeframes are offered.

## Automated checks

- Host `npm test`: 28 passed; 2 opt-in real exchange tests skipped by default.
- Backend pytest: 32 passed (existing Starlette/httpx deprecation warning).
- Host `npm run build`: TypeScript and multi-page production build passed.
- Upstream selected components, indicators, utils and adapter tests: 98 passed.
- New host tests cover millisecond/second conversion, exclusive pagination ranges,
  wrong symbol/timeframe isolation, safe-prefix bounds and drawing creation-time filtering.

## Browser observations

- Real SOLUSDT historical replay rendered in OpenCharts, with native TradingView attribution.
- Long Position placed with entry 20.22137, target 20.45897 and initially symmetric stop.
  Dragged stop down to about 19.89138, then target up to about 20.538; native R readout
  changed from 1.00 to 0.72 and then 0.96, consistent with the displayed distances.
- Drawing remained after reload. Rewinding from 19:22 to 19:01 UTC hid the drawing;
  returning to 19:22 restored it. Native Object Tree also disappeared while no drawing
  was eligible, so hidden future objects were not exposed through that panel.
- Switching 5m to 1h at 2023-05-12 19:01 UTC preserved the cursor. The partial SOL candle
  showed O20.311/H20.315/L20.290/C20.291/V19868, using only the completed 19:00 minute.
- Native settings opened from gear; grid changed, survived reload, and was restored.
- Play advanced multiple bars and Pause stopped it. Current preview time was separate
  from the original Vela session.
- Native pan, wheel zoom, crosshair and EMA overlay worked during actual interaction.
- Actual BTCUSDT Live displayed changing Binance closes and update timestamps. The
  chart has no fabricated bid/ask; a small opt-in patch displays the actual candle close
  on the price axis. Historical mode suppresses a misleading wall-clock countdown.
- No browser console warning/error entries observed in the Live check.
- Reading `/api/session` after preview operations still returned the original Vela
  SOLUSDT/5m replay at 2023-05-12 19:22 UTC with its original immutable dataset version.

## Before permanent migration

This preview intentionally limits scroll-back to the loaded window. Persistent viewport,
Vela drawing conversion, configurable indicator parameters, a full import/export workflow,
accessibility of upstream popovers and sustained interaction/performance testing still need
work before replacing the existing app. Reconnect/backfill uses the unchanged tested LiveFeed;
a new forced network outage was not performed in this preview browser session.
