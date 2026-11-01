# Workspace first pass — verification, 2026-11-01

## Scope

The chart-layout action moves from the right utility rail to the top toolbar at desktop widths, matching the reference's placement more closely. At widths up to 650 CSS pixels it remains in the right rail so it does not disappear inside the horizontally scrolling toolbar. Replay no longer displays the wall-clock candle countdown; its native last-price label remains visible when the corresponding preference is enabled. Live retains the countdown.

## Checks performed

- Compared reference `01-chart-no-watchlist.png` and `08-replay-controls.png` with a Vite preview of the current checkout using `/?desktop=1`. The preview used its own localStorage and the existing local backend on port 8765. The installed app's recorded data directory is this checkout's `.data/`.
- At 1280 × 720 CSS pixels, the layout button appeared in the toolbar; its menu opened and selected four, two and one chart. Switching to actual Binance Live showed an updating price and countdown; switching back displayed the saved Replay time and a price label without a countdown.
- At 390 × 720, the layout button appeared on the right rail, its menu remained visible, and Escape closed it and restored focus to the button.
- `npm test`: 91 passed, 2 exchange integration tests skipped. `npm run typecheck` and `npm run build` passed. `UV_CACHE_DIR=/private/tmp/whide-codex-uv-cache uv run --no-sync pytest -q`: 34 passed; one existing Starlette/httpx deprecation warning.

## Limits

This is an initial slice, not a claim of 1:1 parity. The Vite preview uses the same React source and desktop styling flag but does not reproduce Electron's native window chrome or prove a newly packaged desktop build. The installed desktop application was running and was not rebuilt or closed. Its backend was reused for the browser checks, so those checks do not prove that a backend built from the current checkout is running. During the four/two/one chart interaction the Vite client logged `ResizeObserver loop completed with undelivered notifications` more than once; its cause and effect require separate investigation. No drawing, pan/zoom, splitter resize, refresh-persistence or settings-interaction audit was completed in this pass.
