# Chart workspace: screenshot reference and multi-chart design

Status: implemented in the OpenCharts comparison workspace; see ../../2026-10-15-workspace-verification.md for verification and explicit limits. Appearance is currently shared across the workspace. Pair/timeframe remain independent; synchronization toggles cover time/scroll and crosshair.

## Reference observations

The two supplied TradingView screenshots show one consistent workspace, first with RSI and then with RSI plus MACD. Both use a compact, nearly black shell, flat surfaces and fine structural dividers. The chart is the dominant content; there are no padded dashboard cards. The top toolbar groups symbol, intervals, indicators and replay. A narrow left rail holds drawing tools. The watchlist occupies roughly one fifth of the width and has a separate narrow utility rail. It should be collapsible to recover chart space.

The instrument/OHLC/volume legend sits inside the chart at its upper leading edge. Price labels sit on the right axis, including a colored latest-price label. The grid is restrained and text is muted, with teal/red used for market direction. Screenshot widths are not a candle-width target: browser zoom and the user's own appearance preferences take precedence.

Oscillators belong to aligned subpanes, not to alternate scales on the price plot. The second reference reallocates height from price to accommodate MACD. All plots share a horizontal timeline, with time labels at the bottom. RSI uses a purple trace, a translucent purple band between dashed boundaries and a yellow smoothing trace. MACD uses blue/orange traces and a histogram with positive and negative color families. Each indicator needs its own readable values and scale. Settings must permit changing these defaults.

Screenshots establish visual composition, not hidden interactions. Pane movement, resizing, drawing shortcuts and magnet behavior come from the user's explicit requests and must be exercised in the application.

## Proposed multi-chart workspace

Use the current renderer in up to four chart cells. Do not replace the chart engine merely to add layout. Each cell contains its own price plot plus its indicator subpanes; indicator subpanes do not count toward the four-chart limit.

Offer one chart, two side by side, two stacked, three with one large cell plus two smaller cells, and four in a 2x2 grid. Use a compact layout picker in the top toolbar. Allow adjustable dividers and temporary maximization of the active cell. Restoring the grid preserves every cell. At narrow sizes, keep maximization and all layout controls reachable rather than squeezing four unreadable cells.

Each cell owns a stable identifier, symbol, timeframe, indicator instances/settings/pane geometry, drawings and appearance settings. The shared toolbar and drawing commands target the active cell, indicated by a subtle outline and instrument label. Selecting a different cell must not reset the previous one. Reducing the visible layout retains hidden cells in saved workspace state and suspends their live subscriptions.

Symbol and timeframe remain independent by default, enabling BTC 5m/15m/1h/4h or several instruments at once. Provide explicit optional synchronization of symbol, timeframe, time viewport and crosshair. Coordinate different timeframes by timestamps, not logical bar indices. A crosshair on another instrument shares time only; its price ordinate is local to that instrument. Missing bars clear the destination marker rather than leaving an old marker visible.

## Live / replay isolation

Keep one clearly labeled workspace mode. All visible replay cells share the canonical replay timestamp, even when their instruments or timeframes differ. Every cell obtains its independently clipped projection at that timestamp; higher-timeframe candles use only the elapsed source bars. The active cell's timeframe determines the next replay step, and all cells then advance to that new common time. Loading cells must never display a later prefix left over from an earlier selection.

Live uses separate subscriptions/data caches. Returning to Replay restores its timestamp and saved cell selections. Changing the number of charts must not change the replay time or bring live data into replay caches. Drawings and workspace persistence remain separate from the existing Vela session storage while this is a comparison preview.

## Implementation order and acceptance

1. Complete the single-chart foundation: indicator subpanes, settings, viewport/crosshair synchronization, pane resizing/movement, drawing magnet and keyboard cleanup.
2. Match the compact shell to the reference: toolbar grouping, legends, axes, muted grid, collapsible instrument sidebar, contextual drawing controls. Preserve editable chart appearance.
3. Add the layout container and per-cell state, active-cell targeting, resizing/maximization and persistence. Reuse the single-chart foundation for each cell.
4. Add optional cross-cell synchronization with timestamp mapping and guarded broadcasts. Share identical live streams rather than opening duplicate subscriptions.
5. Verify one/two/four charts; different pairs/timeframes; changing layouts and maximizing; restoration after reload; switching Live/Replay; replay rewinds during pending fetches; partial higher candles; crosshair over missing bars; resize at the user's browser zoom; modifier release and window blur. Verify observed update latency and responsiveness with four live charts before claiming the layout is ready.

Keep these as incremental changes. This document records the requested direction; none of the multi-chart behavior above should be described as delivered until implemented and verified.
