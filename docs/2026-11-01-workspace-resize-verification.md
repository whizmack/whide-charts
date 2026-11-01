# Multi-chart resize — verification, 2026-11-01

## Investigation and change

In an isolated desktop-mode Vite preview, changing chart layout repeatedly reproduced `ResizeObserver loop completed with undelivered notifications`. Temporary diagnostic instrumentation recorded observer construction sites and targets. The price chart's OpenCharts observer called `chart.applyOptions` during notification delivery, while the oscillator's Lightweight Charts 4.2 `autoSize` observer resized its chart synchronously. Deferring only the price-chart callback still produced the notification on startup; deferring both callbacks in the experiment did not. The diagnostic wrapper was removed.

The vendor patch now uses an exported `observeChartSize` helper for the price chart, and the host uses it instead of oscillator `autoSize`. It observes each chart container, coalesces size changes within a frame, applies the latest dimensions in `requestAnimationFrame`, and disconnects/cancels pending work on disposal. The vendor test verifies asynchronous delivery, coalescing, latest size and disposal. The vendor patch, tarball, lockfile integrity and host installation were updated together.

## Observed checks

- The vendor regression and existing drawing-pane regression passed in a clean local clone at the pinned upstream revision with the patch applied. `npm ci --ignore-scripts`, `npm run build:lib` and `npm pack --ignore-scripts` were run there. During declaration generation the upstream build printed TypeScript diagnostics about `ImportMeta.env`/`glob` declarations; a separate clone with the pre-change patch emitted the same diagnostics. The library build completed and the host typecheck passed. Packing required a writable temporary npm cache.
- In the actual host preview at `/?desktop=1`, after reinstalling the new tarball, four Replay charts and RSI rendered. Switching four → one → four charts, dragging the column divider (50% → 56.75%), and dragging the RSI divider (170 → 146 px) worked. A Replay step advanced the cutoff from 00:00 to 00:05. The Vite server logged no ResizeObserver-loop message during those checks. This is evidence for those scenarios, not proof the browser warning is impossible in all layouts.
- No installed Electron application or production localStorage was modified. The preview used the existing local backend and its own browser origin. The installed application must be rebuilt separately before this change is available there.
