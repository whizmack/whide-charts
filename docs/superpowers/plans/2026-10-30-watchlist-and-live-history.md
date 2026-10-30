# Live Watchlist Quotes and Live History Plan

> **Implementation:** inline in the current checkout; no commit or push.

**Goal:** Keep Watchlist quotes current during Replay and let Live charts fetch
older public Binance USD-M candles as the user scrolls left, with all fetched
Live history kept in memory.

**Architecture:** Subscribe to the existing shared `LiveFeed` pool for each
supported symbol at 1m while Watchlist is open, regardless of chart mode. Use
OpenCharts' existing 500-bar history-on-scroll callback to request older pages
through the loopback read-only Live proxy. The adapter returns no network data
unless the host is currently in Live mode; Replay's historical clock and
dataset remain isolated.

**Tech Stack:** React, strict TypeScript, FastAPI, Binance USD-M public REST and
WebSocket feeds, existing OpenCharts 0.3.0 adapter.

**Spec:** User-approved continuation in chat on 2026-10-30: realtime Watchlist
quotes in Replay and on-demand older Live history without disk persistence.

## Global Constraints

- Replay uses only versioned local history and its shared UTC `asOf` cutoff.
- Live data continues to use the public Binance USD-M trade-price feed.
- Live quote subscriptions exist only while Watchlist is open and share the existing `livePool`.
- Paged Live candles remain in chart memory and never enter Parquet or dataset manifests.
- Existing data, drawings, zoom, pan, selected assets, timeframes, and workspace layout stay intact.
- No new symbols or timeframe options are included in this change.

## Review Focus

- Replay mode must not cause OpenCharts' pan loader to disclose future Live data.
- The REST page endpoint must validate symbol, timeframe, range, and page size.
- Empty pages and gaps must not be filled, interpolated, or presented as candles.
- Closing Watchlist must release its feed subscribers without stopping feeds still used by visible charts.
- Live stream updates must continue after an older page is loaded; the chart's historical pages must not be persisted.

## Tasks

### Task 1: Expose bounded older Live pages

**Files:** `backend/app.py`, `tests/test_api.py`, `web/live.ts`, `web/live.test.ts`.

- Add optional `startTime`, `endTime`, and bounded `limit` to the read-only Live kline route while preserving its current latest-window request.
- Add a frontend page loader that converts OpenCharts' half-open millisecond range to Binance's inclusive range and validates returned bars.
- Test URL forwarding, invalid ranges, empty history, and malformed/gapped responses.

### Task 2: Connect OpenCharts pan paging only in Live

**Files:** `web/compare/adapter.ts`, `web/compare/adapter.test.ts`, `web/compare/Preview.tsx`.

- Allow the adapter to request a page only when the current host mode is Live and the request has an older bounded range.
- Keep Replay requests empty and preserve the existing local Replay loader.
- Test the Live and Replay adapter boundaries.

### Task 3: Make Watchlist prices realtime in both modes

**Files:** `web/compare/Preview.tsx`, `web/compare/preview.css`, focused Watchlist/feed tests.

- While Watchlist is open, subscribe to all three supported symbols through `subscribeLive(symbol, '1m', ...)`.
- Render each latest public 1m kline close as `Last`, independent of Replay `asOf`; expose connecting/reconnecting status and close subscriptions when the panel closes.
- Replace the Replay-snapshot wording with clear live-quote wording.

### Task 4: Verify and update architecture notes

**Files:** `AGENTS.md`, `README.md`, `docs/progress.md`.

- Run focused frontend/backend checks, typecheck, and build.
- Verify Watchlist in Replay and attempt older-page loading in a separate
  browser origin so the user's saved workspace remains untouched.
- Document the 1m live quote source, bounded on-demand REST pages, and
  memory-only persistence.

**Result:** Code checks passed, and Watchlist Live quotes were observed while
Replay was selected. The browser screenshot/accessibility snapshot timed out;
the older-page canvas interaction and screenshot-level visual comparison remain
open. See `docs/2026-10-30-live-watchlist-and-history-verification.md`.
