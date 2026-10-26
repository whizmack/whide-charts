# Fixed drawing rail design

Date: 2026-10-23
Status: implemented and verified on 2026-10-24

## Centered tool geometry correction — approved 2026-10-24

The fixed 40 px rail remains unchanged. Its portaled toolbar root is centered
inside the rail as a 34 px column with no inline padding. Horizontal overflow
is explicitly hidden; only vertical overflow may scroll when the workspace is
too short for all tools.

Every visible tool button is a fixed 32 px square alignment box using centered
grid placement and zero padding. Each SVG is therefore centered on the same
20 px rail axis. The toolbar must have `scrollWidth <= clientWidth`, expose no
horizontal scrollbar, and keep the existing active, hover, focus, menu, magnet,
stay-mode, and drawing behavior.

This correction is host CSS only. It does not widen the rail, change icon
artwork, alter tool order, modify vendor files, or add Favorites behavior.

## Goal

Make the primary OpenCharts drawing toolbar one fixed vertical rail at the left
edge of the entire workspace, matching the supplied TradingView reference. The
rail must occupy layout space instead of floating over chart content and must
never move when the active chart changes.

The separate movable Favorites toolbar shown in the second reference is a later
milestone and is not implemented here.

## Current defect

OpenCharts renders its primary drawing toolbar as an absolutely positioned,
draggable panel inside `.drawing-rail-host`. It includes a `Drag to move` grip
and may overlap the price chart. Styling the panel to look flatter did not
change this behavior, so the result does not match TradingView's fixed primary
rail.

## Chosen approach

Keep the installed OpenCharts drawing implementation and its existing portal
support, but move the single portal host out of individual chart cells and into
the workspace shell.

- Render one `.drawing-rail-host` in `Preview`, immediately left of the complete
  chart grid and outside every `.workspace-cell`.
- Reserve a fixed column of approximately 40 px for that host at every layout,
  including one, two, three, and four charts.
- Pass the shared host through `ChartCell` and `StudyWorkspace`; only the active
  chart's `ChartPanel` portals its drawing controls into it.
- Changing the active chart updates which chart the controls target, but never
  relocates or recreates the host column.
- Make the portaled drawing toolbar fill and align to the global host column.
- Hide the primary toolbar's `Drag to move` grip and neutralize any inline drag
  transform so the rail cannot move.
- Remove the primary rail's hide/show affordance so the global rail is always
  present.
- Keep drawing group menus portaled to `document.body`, opening to the right of
  their source button without clipping.

This is a host integration correction. It does not modify or repack the vendor
tarball because no drawing logic or public OpenCharts API needs to change.

## Behavior

- The fixed host column is always present, including while the active chart is
  loading or when a different chart becomes active.
- The rail spans the complete workspace-main height beside all chart cells and
  their price and oscillator panes.
- The entire chart grid begins to the right of the rail; the rail never overlays
  candles, legends, cell captions, or time axes.
- The cursor, grouped drawing tools, magnet, stay-in-drawing mode, undo/redo
  behavior, scoped keyboard handling, and stored drawings keep their existing
  ownership and behavior. Only the primary rail's hide/show action is removed.
- Opening a group menu must not move the rail or clip behind chart cells.
- Multi-chart cells each preserve their configuration. The one global rail
  operates on the active cell, which keeps its existing subtle active boundary.
- Switching active cells, maximizing/restoring, changing layout, and resizing
  panes must not alter the fixed rail position.

## Responsive behavior

The rail keeps the same global fixed column at desktop and narrow widths. It
may scroll vertically inside its own column when the available height cannot
contain every tool. It must not introduce document-level horizontal overflow
or push the right utility rail outside the viewport.

## State and compatibility

No localStorage keys or stored shapes change. Existing drawings, visibility,
magnet, stay mode, studies, pane geometry, chart viewport, Replay state, and
Live state must survive unchanged. No backend, data, clock, feed, or vendor
artifact changes are in scope.

## Verification

- Add structural tests that pin one global rail host outside the grid and verify
  that active-cell chart controls receive that shared host without testing
  literal CSS values.
- Run the existing frontend suite, typecheck, build, and backend tests.
- In the browser at 1280 x 800, confirm the rail stays flush left and the grid
  starts to its right; try dragging where the grip previously existed and
  confirm the rail does not move.
- Verify drawing menus, tool selection, magnet, stay mode, one/two/four charts,
  maximize/restore, and oscillator panes.
- Verify approximately 390 px with no document-level overflow and with the
  right utility rail still reachable.
- Preserve and restore the user's original `opencharts-preview:` state during
  destructive browser QA.

## Out of scope

- Favorites selection, persistence, or the movable horizontal Favorites
  toolbar;
- new drawing tools or changed drawing semantics;
- redesigning drawing group menu contents;
- changing the OpenCharts vendor tarball;
- changing chart zoom, pan, candle width, or browser zoom.

## Acceptance criteria

- The primary drawing toolbar is one non-draggable, always-present global left
  rail that reserves its own width.
- Candles and study panes never render underneath it.
- Changing the active chart changes the rail's target without moving the rail.
- Existing drawing interactions and persistence still work.
- The toolbar remains fixed through layout, active-cell, maximize, and
  responsive changes.
- Favorites remain explicitly deferred.
