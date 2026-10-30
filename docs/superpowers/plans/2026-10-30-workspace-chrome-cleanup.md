# Workspace chrome cleanup plan

> **Implementation:** inline in the current checkout; no commit or push.

**Goal:** Remove the redundant bottom status row, make the fixed left-rail
magnet open Off / Weak / Strong choices, and move the OpenCharts license link
into the Settings menu.

**Constraints:** Keep the drawing rail fixed at 40px. Preserve the current
magnet value in workspace storage and backup, temporary Cmd/Ctrl snapping,
drawings, chart viewports, Replay state, and all other workspace data. Keep the
TradingView attribution in the chart. Do not add unsupported actions or touch
the floating Favorites toolbar.

## Tasks

1. Add focused tests for magnet menu choices and keyboard navigation, the
   Settings menu, and the tucked-away license details.
2. Replace the rail's magnet toggle with an anchored, keyboard-accessible
   Off / Weak / Strong menu; keep mode changes persisted through the existing
   magnet preference.
3. Add About & licenses under Settings, remove the bottom status component and
   its styling, and show local-storage failures only when they occur.
4. Run host tests, typecheck, and build; use Computer Use to inspect the new
   controls without changing saved workspace state.
