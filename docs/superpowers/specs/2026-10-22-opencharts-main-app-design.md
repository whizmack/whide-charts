# OpenCharts main application design

Date: 2026-10-22
Status: implementation underway; user confirmed plan on 2026-10-22.

## Goal

Make the existing OpenCharts workspace the primary application at `/`. The goal
is to continue developing this workspace toward a compact TradingView-like
replay and charting experience.

## Visual reference supplied by the user

The ten TradingView desktop screenshots attached on 2026-10-22 are the primary
visual reference for future OpenCharts UI work. The target is a close, 1:1
recreation of the application workspace composition and interaction patterns:

- A thin top chart toolbar; a narrow left drawing rail; a narrow right utility
  rail; and a compact bottom range/drawing toolbar.
- A large, dark chart canvas with subtle grid lines, compact market/status
  information, legible price and time scales, and restrained separators.
- Both chart-only and chart-plus-watchlist layouts, with the watchlist docked on
  the right and the chart resized to fit it.
- TradingView-like drawing-tool flyouts, a centered searchable indicator picker,
  and chart settings organized into a left navigation and a focused settings
  panel.
- Replay mode with its dedicated transport row at the bottom of the chart.
- Compact typography, icon sizes, spacing, control shapes, colors, and hover or
  open states consistent with the supplied references.

Treat the supplied screenshots as the source for these visual decisions rather
than filling gaps with invented layouts. Reproduce the chart workspace itself;
the surrounding operating-system window chrome is not part of the web root
route. This visual direction informs subsequent UI implementation, while the
first root-route cutover remains a routing and bootstrap milestone. Keep the
product's own identity and required third-party attribution.

## First milestone

1. Serve the current OpenCharts workspace from the root route `/`.
2. Make its bootstrap independent of the Vela `/api/session` endpoint. Use
   `/api/markets` for market metadata and dataset version; use OpenCharts' own
   workspace persistence for its chart state and replay cutoff.
3. Keep the existing shared FastAPI services for historical bars, market
   metadata and the real Binance Live feed. Preserve local Parquet history,
   dataset manifests and the SQLite market catalog.
4. Remove Vela and OpenAlgo from the user-facing build after the OpenCharts root
   route is verified. Remove their unused frontend entries and dependencies as
   part of that cleanup. Do not migrate their chart settings or drawings.
5. Verify the root route in a real browser for Replay, Live, workspace reload,
   drawings, and the existing bounded data window. Also confirm that the
   historical market data remains available.

## State and data boundaries

- Vela's saved chart session is not imported. The user confirmed that its
  drawings and settings have no value to retain.
- OpenAlgo preview state is not imported. It uses a separate localStorage
  namespace and is not a dependency of the OpenCharts workspace.
- OpenCharts' own localStorage workspace and drawings continue to work at the
  same origin when `/compare.html` becomes `/`.
- Historical market files and their catalog are retained because Replay needs
  them. They are separate from chart-specific saved state.
- The shared Live and historical bars APIs remain in place.

## Rollout

Switch the root entry to OpenCharts and remove the Vela session bootstrap first.
Verify it at `/`. Then remove the legacy Vela and OpenAlgo pages and their
frontend dependencies from the shipped build. Keep unrelated pending workspace
changes intact. Do not delete user market history or change its data path.

## Acceptance criteria

- `/` loads the OpenCharts workspace and does not mount Vela.
- OpenCharts no longer requests `/api/session` to initialize.
- Replay loads from the local dataset and remains bounded by the selected
  cutoff; Live continues to use the actual Binance feed.
- Workspace layout, chart selections, drawings and indicator settings persist
  through reload under the existing OpenCharts origin namespace.
- Vela and OpenAlgo are absent from the shipped application routes/build after
  the verification phase.
- Existing Parquet history, dataset versions and market catalog remain intact.
- The existing `/api/bars` and Live behavior do not regress.

## Out of scope

- Electron packaging.
- Journal or trade evaluation engine.
- Migration or deletion of market history.
- New TradingView-like drawing tools, indicators or settings; those are later
  OpenCharts milestones guided by the screenshots above.
- Removal of backend APIs or database tables that are not required for this
  first UI cutover.
