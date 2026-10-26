# TradingView-like workspace shell — verification

Date: 2026-10-23

## Scope

The OpenCharts application on `/` now uses one compact workspace shell based on
the supplied TradingView desktop references:

- 40 px market toolbar with pair, timeframe, Indicators, Live/Replay, and
  active-chart maximize;
- one fixed 40 px OpenCharts drawing rail at the left edge of the complete
  workspace, outside all chart cells;
- a persistent 40 px workspace utility rail on the right, with working
  watchlist, layout, settings, and backup actions;
- a 42 px Replay/Live transport and 26 px status bar;
- 23 px cell captions only when more than one chart is visible;
- a docked desktop watchlist and narrow-screen watchlist overlay.

`Preview.tsx` remains the state owner. The shell controls are stateless and live
in `web/compare/WorkspaceChrome.tsx`. No backend, replay clock, request
generation, timestamp conversion, Live feed, market-data persistence, storage
namespace, OpenCharts vendor artifact, or chart-renderer geometry was changed.

## Reference comparison

Compared with screenshots 01, 02, 08, 09, and 10 from
`docs/reference/tradingview/README.md`, the previous host mixed workspace
actions into a taller top bar, lacked a permanent outer utility rail, used a
looser bottom transport, and spent 27 px on every multi-chart caption. The new
composition separates market controls, chart canvas, workspace utilities,
transport, and status into aligned flat bands while retaining only actions that
already work in Perp Replay.

This pass deliberately does not reproduce TradingView account, publishing,
alerts, order-entry, or other unavailable product controls.

## Automated verification

Fresh results from 2026-10-24 after the fixed-rail correction:

| Command | Result |
| --- | --- |
| `uv run pytest -q` | 32 passed; 1 existing Starlette/httpx deprecation warning |
| `npm test` | 10 files passed, 1 skipped; 53 tests passed, 2 skipped |
| `npm run typecheck` | passed |
| `npm run build` | passed; Vite transformed 1,818 modules |

The two skipped frontend tests are the opt-in real-Binance integration tests.
They were not enabled for this host-shell-only change.

## Browser verification

Verified against the built application served at `http://127.0.0.1:8765/`:

- The primary drawing toolbar now renders into exactly one workspace-level
  host. At 1280 x 800, `.workspace-main` measured x=0, width=1280 and
  height=692; the rail measured x=0, width=40 and height=692; the chart grid
  began at x=40 and the right utility rail occupied x=1240–1280.
- Before the correction, the same host measured 1280 px wide, overlaid the
  grid, and exposed both `Drag to move` and `Hide toolbar`. After the correction
  those actions have zero visible instances, the toolbar transform computes to
  `none`, and a synthetic pointer move over the old grip left rail bounds
  unchanged.
- In rows layout the single rail spanned the complete 692 px workspace height.
  In four-chart layout, activating the bottom-right cell did not move it. A
  Lines menu opened at x=40.5 in a `body` portal and remained unclipped.
- Active-cell routing was exercised with real canvas drawings: a trend line was
  stored under `chart-2:replay:BTCUSDT` and a horizontal line under
  `chart-4:replay:BTCUSDT`. Maximize and restore kept the rail at x=0 and the
  grid at x=40.

- At 1280 x 800, the toolbar, grid, docked 252 px watchlist, 40 px utility
  rail, Replay transport, and status bar form a continuous shell. Opening the
  watchlist resizes the chart area and closing it restores the chart area.
- In two columns, activating the right cell and changing it to ETHUSDT 1h with
  EMA left the first BTCUSDT 5m cell unchanged. Maximizing and restoring the
  right cell preserved the two-column layout and both configurations.
- In the four-chart layout, a bottom-right drawing menu and RSI settings dialog
  opened above sibling cells and bottom chrome without clipping. Drawing scope
  and weak magnet state stayed on the active bottom-right cell.
- Replay seek, play, pause, next candle, and 0.5x, 1x, 2x, 5x, and 10x speed
  selections were exercised. A next-candle action from the active 4h cell
  advanced `asOf` by exactly 14,400,000 ms. Play advanced time; pause kept it
  stable.
- Switching Replay to Live connected to the public Binance USD-M feed and
  displayed an updated timestamp. Returning to Replay retained the Replay
  cutoff.
- Chart settings, layout, indicator, drawing, and watchlist overlays opened
  without unexpected browser console errors or warnings.
- A trend line, RSI study, four-chart layout, magnet setting, and existing
  viewport data survived reload. The same seven `opencharts-preview:` keys were
  present before and after; no replacement storage namespace was introduced.
  The original seven values were restored and reloaded after QA. The final
  restored state was the user's one-chart BTCUSDT 5m layout, closed watchlist,
  original Replay time, and original drawings.
- At 390 x 800, document width remained 390 px with no document-level
  horizontal overflow. The market toolbar scrolls internally so maximize stays
  reachable; pair, timeframes, Indicators, Live/Replay, all utility actions,
  Replay seek/play/step/speed, and chart maximize remained operable. The
  watchlist opened as an overlay to the left of the visible utility rail. The
  narrow layout popover remained fully inside the viewport.
- The fixed-rail narrow measurement used an isolated Chrome DevTools 390 x 800
  viewport because the collaborative preview reported a 390 px setting while
  continuing to render at `innerWidth=1280`. It measured the rail at x=0–40,
  grid at x=40–350, and utility rail at x=350–390, with both document and client
  width equal to 390.
- Fixed-rail persistence QA changed the layout to four charts, activated chart
  4, added scoped drawings, set weak magnet, and enabled ATR. All values and the
  same seven storage keys survived reload. Every original storage string was
  then restored and compared per key; all seven matched byte-for-byte after the
  final reload.
- The browser check found that OpenCharts' mobile touch-target rule was
  overriding the right-rail button width to 44 px. A scoped host rule now keeps
  those controls at 32 px inside the 40 px rail; their measured bounds are
  354.5–386.5 px in the 390 px viewport.

## Limitations

- The opt-in `RUN_BINANCE_LIVE=1` integration suite was not run. The browser did
  establish a real Live connection, but that is not a full reconnect/backfill
  regression run.
- Existing viewport state was confirmed to survive reload, but a new canvas pan
  gesture and oscillator pane resize could not be driven reliably by the
  available browser automation in this pass. No viewport, pane geometry, or
  persistence code was changed.
- The shell intentionally uses horizontal scrolling inside the 390 px market
  toolbar; it does not squeeze every top-bar control into simultaneous view.
