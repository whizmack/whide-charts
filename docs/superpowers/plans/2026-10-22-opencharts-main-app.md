# OpenCharts Main Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the existing OpenCharts workspace as the primary application at `/` and remove Vela/OpenAlgo from the shipped frontend after verifying the cutover.

**Architecture:** Keep the shared FastAPI history and Live services. The OpenCharts workspace becomes the only frontend entry and initializes from `/api/markets` plus its own localStorage state; legacy chart UI modules and package dependencies are removed after the root page works.

**Tech Stack:** React 19, strict TypeScript, Vite 8, OpenCharts 0.3.0, Lightweight Charts 4.2.3, FastAPI, SQLite and Parquet.

**Spec:** `docs/superpowers/specs/2026-10-22-opencharts-main-app-design.md`

**Visual direction:** The user's ten TradingView desktop screenshots from
2026-10-22 define the target for subsequent UI work. Match the workspace's left,
top, bottom and right tool rails, chart-only/watchlist layouts, settings and
indicator dialogs, drawing flyouts, compact typography and Replay transport as
closely as OpenCharts allows. The root-route cutover below does not redesign
those controls; keep it as a separate, visible follow-up milestone. No extra
reference is needed to start the route cutover. Before reproducing the exact
appearance of indicator-on-chart controls/settings, obtain a screenshot of an
indicator actually applied and its settings dialog because the supplied set
only shows the indicator browser and general status-line preferences.

## Global Constraints

- Keep the existing shared FastAPI services for historical bars, market metadata and the real Binance Live feed.
- Preserve local Parquet history, dataset manifests and the SQLite market catalog.
- Do not migrate Vela or OpenAlgo chart settings or drawings.
- OpenCharts' own localStorage workspace and drawings continue to work at the same origin when `/compare.html` becomes `/`.
- Do not delete user market history or change its data path.
- Keep unrelated pending workspace changes intact; do not commit unless explicitly asked.

## Review Focus

- Existing OpenCharts localStorage on the same origin → layout, chart selections, drawings and settings remain after the route changes and reload. Pin with a browser reload using the existing origin.
- Empty or malformed OpenCharts state → validated workspace defaults load and Replay uses a cutoff covered by the selected dataset. Pin with a fresh browser context and a malformed localStorage value.
- `/api/markets` metadata unavailable or changed → show a clear loading/error state and use the dataset version returned by that endpoint; never fall back to the Vela session. Pin by checking the browser request log and `tests/test_api.py::test_unknown_dataset_version_does_not_fall_back`.
- Local historical data unavailable or outside coverage → do not show future bars or silently fabricate data. Pin with `tests/test_api.py::test_future_and_wrong_market_are_rejected`, `tests/test_replay.py::test_future_data_mutation_does_not_change_any_visible_bar`, and the browser bars response.
- Binance Live unavailable → show the existing connection/stale state and never substitute demo prices. Pin with `tests/test_api.py::test_live_proxy_exchange_outage_is_not_a_success` and `web/live.test.ts`; if Binance itself is unavailable, report that separately.

---

### Task 1: Cut OpenCharts over to `/`

**Files:**
- Modify: `index.html`
- Modify: `web/compare/Preview.tsx`
- Keep temporarily: `compare.html`, `web/compare/main.tsx`

**Interfaces:**
- Consumes: `GET /api/markets` (`Markets.datasetVersion`, market ranges), `web/compare/workspace.ts` (`loadWorkspace`, `initialWorkspace`), and the existing `opencharts-preview:` localStorage namespace.
- Produces: the same OpenCharts workspace served from `/`, with no Vela session bootstrap request.

- [x] **Step 1: Point the root HTML entry at the OpenCharts entry module**

  Set `index.html`'s module script to `/web/compare/main.tsx`. Keep the existing product title and viewport metadata unless the current values prevent the workspace from rendering.

- [x] **Step 2: Remove the Vela session dependency from OpenCharts initialization**

  In `web/compare/Preview.tsx`, remove the `Session` type import and the `/session` request. Fetch only `/markets`, set `version` from `Markets.datasetVersion`, and keep initialization based on the saved OpenCharts workspace or its existing default/replay state. Preserve the `opencharts-preview:` namespace so the existing same-origin workspace remains available.

- [x] **Step 3: Remove the preview-only link back to Vela**

  Replace the `PR / Workspace` anchor that opens `/` in a new tab with a non-navigating product label. The root page must not link users to itself as a legacy preview.

- [x] **Step 4: Build and inspect the root page in the collaborative browser**

  Run `npm run build`, open `/`, and inspect the network log. Confirm the page requests `/api/markets` and `/api/bars`, never `/api/session`, and renders the saved OpenCharts workspace or a valid default in a fresh context.

- [x] **Step 5: Exercise the root route before removing legacy pages**

  In the real browser, check Replay seek/step, switch to Live and back, reload the workspace, and inspect the console. Confirm saved OpenCharts layout and drawings survive the route change and reload. Report Binance availability separately from app errors.

### Task 2: Remove legacy chart frontends and dependencies

**Files:**
- Modify: `vite.config.ts`, `package.json`, `package-lock.json`
- Delete: `compare.html`, `openalgo.html`
- Delete Vela-only frontend modules: `web/main.tsx`, `web/App.tsx`, `web/Chart.tsx`, `web/DataPanel.tsx`, `web/DrawingTools.tsx`, `web/Indicators.tsx`, `web/chartBridge.ts`, `web/chartBridge.test.ts`, `web/sessions.ts`, `web/sessions.test.ts`, `web/styles.css`, `web/terminal.css`
- Move shared native dialog from `web/Dialog.tsx` to `web/compare/Dialog.tsx` for OpenCharts study settings.
- Delete OpenAlgo-only frontend modules: `web/openalgo/`
- Keep: shared `web/api.ts`, `web/live.ts`, `web/replay.ts`, `web/compare/`, backend APIs/session tables, historical verification scripts/evidence and vendored provenance files.

**Interfaces:**
- Consumes: Task 1's verified root entry and the shared `web/api.ts`, `web/live.ts`, and `web/replay.ts` modules.
- Produces: one Vite production page at `/`, with OpenCharts and Lightweight Charts as the chart dependencies.

- [x] **Step 1: Reduce Vite's build inputs to the root page**

  In `vite.config.ts`, remove the `compare.html` and `openalgo.html` inputs. Keep `index.html` as the sole production HTML entry.

- [x] **Step 2: Remove the unused Vela and OpenAlgo package dependencies**

  Remove `@luxalgo/vela` and `openalgo-charts` from `package.json` and refresh the lockfile while preserving the OpenCharts tarball dependency and the direct Lightweight Charts dependency used by `web/compare`.

- [x] **Step 3: Remove legacy frontend modules that prevent a clean typecheck**

  Delete the Vela-only and OpenAlgo-only source/test files listed above. Keep shared replay, API, and Live modules, and keep backend session storage/API code out of this UI cutover.

- [x] **Step 4: Install from the updated lockfile and run project checks**

  Run `npm ci --no-audit --no-fund`, `uv run pytest -q`, `npm test`, `npm run typecheck`, and `npm run build`. Expected: backend tests pass, remaining host tests pass, TypeScript passes, and Vite emits only the root OpenCharts page.

- [x] **Step 5: Confirm removed routes are absent from the production output**

  Inspect `dist/` and confirm it no longer contains `compare.html` or `openalgo.html`. Open `/` again and confirm Replay, Live, chart drawings, local workspace persistence and the browser console remain healthy.

### Task 3: Update product and architecture documentation

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/progress.md`
- Modify: `third-party/opencharts/README.md`
- Keep historical reports: `docs/2026-10-14-opencharts-preview-verification.md`, `docs/2026-10-15-workspace-verification.md`, and OpenAlgo research/evidence.

**Interfaces:**
- Consumes: the verified route, persistence and dependency structure from Tasks 1 and 2.
- Produces: current documentation that describes OpenCharts as the main application and clearly distinguishes retained backend/data history from retired chart frontends.

- [x] **Step 1: Update the README's main application instructions**

  Describe `/` as OpenCharts, document its Replay/Live and workspace persistence, retain the local launch and dataset instructions, remove Vela/OpenAlgo preview navigation claims, and preserve chart/data licensing notices that still apply.

- [x] **Step 2: Update AGENTS.md's code map and invariants**

  Reclassify `web/compare/` as the primary OpenCharts workspace, remove Vela/OpenAlgo from the production entrypoint map, and retain the shared backend data/Live/session boundaries. Keep the rule that historical `.data/` is not disposable.

- [x] **Step 3: Update the OpenCharts vendor README's host description**

  Change comparison-only host references to describe OpenCharts as the main host at `/`. Retain the pinned revision, patch/tarball rebuild instructions, licenses and provenance.

- [x] **Step 4: Record the cutover and evidence in docs/progress.md**

  Add the actual implementation and verification results with their date. Do not rewrite earlier verification reports as if they tested the new root route.

- [x] **Step 5: Review documentation and the complete diff**

  Run `git diff --check`, verify every README route and command matches the implementation, and confirm no unrelated pending files or local market data were removed or overwritten.

## Execution Notes

- Work task-by-task in the current checkout; the workspace contains unrelated uncommitted changes that must remain intact.
- Do not commit unless the user explicitly asks.
- The root route is not considered complete on build success alone; Task 1 and Task 2 require real browser checks.

## Execution ledger

- Task 1: complete. Baseline browser showed Vela at `/` and requests to `/api/session`. After cutover, `/` rendered OpenCharts, requested `/api/markets` and `/api/bars`, and did not request `/api/session`. Browser verified Replay next-candle step, Live connection to Binance USD-M, return to Replay, and persisted cutoff after reload. Original `opencharts-preview:` localStorage snapshot restored after the interaction check.
- Ruling: `web/Dialog.tsx` is a generic native modal also used by OpenCharts `StudySettings.tsx`; move it into `web/compare/` instead of deleting this shared behavior with Vela UI. Why: root `/` uses study settings and needs that dialog. Cost if wrong: one small dialog component could be duplicated and require future consolidation.
- Task 2: complete. `npm ci --no-audit --no-fund`, `npm test` (40 passed, 2 skipped; one suite 9 passed, 1 skipped), `npm run typecheck`, and `npm run build` passed. `uv run pytest -q` passed 32 tests after repairing the ignored local `.venv` pytest shim with `uv sync --frozen --reinstall-package pytest`. Production `dist/` contains only root `index.html` and assets; `/compare.html` and `/openalgo.html` return 404. A fresh isolated browser context loaded valid default state, malformed workspace state normalized to defaults, and the prior localStorage value was restored.
- Task 3: complete. README, repository instructions, vendor host notes, and progress record the OpenCharts root app and retained shared data services. Changed-file whitespace checks passed. Whole-tree `git diff --check` still reports 17 trailing-whitespace lines in the pre-existing `third-party/opencharts/controlled-chart.patch`; that vendor patch is outside this route-cutover edit and was left untouched.
- Browser limitation: chart rendering and Replay/Live/drawing/settings interactions were exercised in the collaborative browser. `preview_snapshot` timed out on the page, so a full console snapshot was not obtained; no claim of a clean browser console is made.
