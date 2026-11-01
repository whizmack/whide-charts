# Workspace second pass — verification, 2026-11-01

## Changes and findings

The desktop chart-layout button now sits beside Indicators, as in the reference. Its menu is positioned beside the trigger and remains inside the viewport; below 650 CSS pixels the existing rail control and compact menu remain available. The status line and study legends now reserve space for the price scale in small cells, with the inset following its selected side.

Switching scale placement to Left with an RSI pane and four charts reproduced an application-wide `Value is null` error. The stack traced to `OscillatorPane` reading the width of the new axis before Lightweight Charts 4.2 had created its widget. Separately, `ChartBus` only aligned the right-hand scale. The host now tolerates that transient missing axis, retries the RSI band geometry after chart layout, and aligns whichever side is visible. Tests cover a temporarily unavailable axis and left-side pane alignment.

The previously reported ResizeObserver notification was reproduced again on a four-chart transition. Temporarily disabling the host's workspace-height ResizeObserver and, separately, its scale-alignment calls did not eliminate the notification. Both diagnostic edits were reverted. This narrows the investigation but does not establish the cause or fix; do not suppress it.

## Browser checks

Using current Vite source, `?desktop=1`, the existing local backend and isolated preview storage:

- At 1280 × 720, the toolbar layout menu opened immediately under its button. While open, resizing to 390 × 720 moved the trigger to the rail and kept the menu usable.
- With four Replay charts at 1280 × 720, OHLC text no longer painted over the price-axis labels. The same check showed RSI and price legends placed outside the left price scale.
- With four charts and RSI, changing Scale placement Right → Left previously crashed. After the change, Left preview rendered and Cancel restored Right. Repeating the change and confirming Left also rendered the charts and RSI without the prior error. These settings were changed only in the isolated browser origin.
- With Left selected, hiding Price scale in the settings preview and cancelling also left the workspace usable.
- After changing the scale side in the running preview, resizing the viewport initially exposed a stale RSI-band callback: the band lost its scale inset. After updating the callback, switching Right → Left and resizing retained `left: 80px; right: 0px`, matching the visible left scale. This is a browser observation, not an automated browser regression test.
- `npm test`: 94 passed, 2 exchange integration tests skipped. `npm run typecheck` and `npm run build` passed. `UV_CACHE_DIR=/private/tmp/whide-codex-uv-cache uv run --no-sync pytest -q`: 34 passed with one existing Starlette/httpx deprecation warning.

## Limits

The development preview does not test native Electron window behavior or a rebuilt installed application. Multi-chart resize still emitted the ResizeObserver notification. This pass did not verify drawing interactions, all scale modes, actual canvas pan/zoom, or full persistence across application restarts.
