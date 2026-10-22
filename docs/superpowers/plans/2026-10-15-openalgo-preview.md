# OpenAlgo isolated preview implementation plan

**Goal:** Add `/openalgo.html` for practical comparison with the existing OpenCharts and Vela routes, without migrating either store.
**Architecture:** Imperative OpenAlgo widget inside React cells. No native feed or replay controller: only host-supplied backend projections or existing LiveFeed bars. Host owns shared cutoff, selections, generations and temporal drawings. Native widget owns rendering, studies, drawing gestures and history within a data context.
**Tech stack:** Existing React/Vite/FastAPI plus pinned Apache-2.0 OpenAlgo Charts 2.6.4, revision e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33.
**Spec:** User task dated 2026-10-15 and AGENTS.md replay invariants.

## Constraints and decisions

- Preserve all pre-existing changes; no commits, migration or session writes.
- New storage prefix `perp-openalgo:v1:`. Widget persistence disabled; only explicit host snapshots, no market bars stored.
- `/api/bars` remains the only historical aggregator. Adapter converts ms to seconds; no native replay, broker or simulated feed.
- Synchronously clear stale renderer data on selection/rewind before browser paint, cancel old requests with generation guards.
- Keep drawings by cell/mode/symbol with creation cutoff; do not give future drawings to the widget or object inventory. Clear undo history across rewind/context changes to prevent restoring future objects.
- Compact English shell; native rail/settings/panes; 1/2/4 cells with optional timestamp synchronization.

## Tasks

- [x] Vendor: verify local clean source pin, rerun build and check exit, package reproducibly with LICENSE/NOTICE and provenance.
- [x] Adapter tests first: partial backend projection preserved verbatim in seconds; old/aborted requests cannot paint; rewind clears synchronously; temporal drawings preserve manually hidden flag; timestamp mapping across TF.
- [x] Implement `web/openalgo/data.ts` for data ownership and temporal helpers, and `data.test.ts` regression tests.
- [x] Implement `web/openalgo/Cell.tsx`, `Preview.tsx`, `state.ts`, `preview.css` and entrypoint. Register `/openalgo.html` in multi-page build. Persist independent state; native candlesticks, volume, EMA/Bollinger/RSI/MACD, position tools, magnet/history/settings.
- [x] Browser: actual backend candles, position entry/SL/TP drag, undo/redo, magnet, pan/zoom, panes, 1/2/4 layout, sync different TF, rewind, reload, Live isolation, small viewport and console. Use isolated browser state and record exact evidence, not FPS claims.
- [x] Run backend and host suites/typecheck/build; update README, AGENTS map, vendor README and fresh verification report. Review final diff against initial working tree.

## Review focus

Delayed responses after rewind or symbol switch; future drawings resurrected by history; empty/error projections retaining canvas prices; saved view restoring before data; linked charts bouncing range events; hidden cells retaining Live subscriptions; menus clipped in small cells. Tests cover pure data gates and mapping; browser checks cover native lifecycle and interaction.


Implementation completed 2026-10-20. See `docs/2026-10-20-openalgo-preview-verification.md` for exact browser evidence and remaining unverified interactions. Pane boundary drag, precise magnet anchor snapping, were not claimed as verified. Synchronized crosshair visibility was verified in the final browser runner.
