# TradingView-like drawing tools pack

Date: 2026-10-24
Status: approved for implementation

## Goal and sequence

Add ten missing drawing tools as native OpenCharts drawings before redesigning
the shared drawing settings UI and before implementing Favorites. The sequence
is intentionally:

1. native tools and their complete chart interactions;
2. TradingView-like drawing rendering, floating toolbar, and settings dialogs;
3. movable Favorites toolbar.

This stage must leave metadata reusable by the later settings and Favorites
stages without prematurely recreating those interfaces.

## Tools

### Freehand

- **Brush** records a pointer-drag path in chart data coordinates and renders a
  normal opaque stroke.
- **Highlighter** uses the same gesture and geometry with a wider translucent
  stroke.
- **Path** records a pointer-drag path, smooths the sampled input, and renders a
  clean continuous stroke with editable start/end handles.

Freehand sampling must be deterministic, discard adjacent duplicate points,
and simplify dense pointer input in pixel space before converting retained
points to chart data coordinates, without changing the visible shape at normal
chart scale.

### Multi-point

- **Polyline** adds anchors on click, previews the next segment, and completes
  on double-click or Enter. Escape cancels the unfinished drawing.
- **Curve** uses three click anchors: start, control, and end. It renders a
  quadratic Bezier curve and exposes all three anchors when selected.

### Measurement

- **Price Range** uses two anchors and displays absolute price change and
  percentage change.
- **Date Range** uses two time anchors, spans the pane vertically, and displays
  elapsed bars and duration.
- **Date & Price Range** uses two corners and displays price change, percentage,
  elapsed bars, and duration.

Measurement labels derive from the loaded chart bars and renderer timestamps.
They do not query future data or change Replay `asOf`.

### Annotation

- **Anchored Text** places editable text at one chart anchor.
- **Note** places a compact note marker at one chart anchor. Selecting or
  activating it reveals its text without permanently covering the chart.

Anchored Text starts with `Text` and Note starts with `Note`; both remain
editable through the existing selected-drawing settings path. The following
settings milestone replaces that interface with the approved TradingView-like
dialog system.

## Data model and compatibility

Extend `DrawingTool` and `DrawingType` with stable lowercase IDs:

`brush`, `highlighter`, `path`, `polyline`, `curve`, `price-range`,
`date-range`, `date-price-range`, `anchored-text`, and `note`.

Extend `DrawingLine` only with optional fields:

- `points?: Array<{time:number; price:number}>` for freehand and multi-point
  drawings;
- `controlTime?: number` and `controlPrice?: number` for Curve;
- existing `text`, `fontSize`, color, width, fill, visibility, lock, hidden,
  z-index, and alert fields remain compatible.

Existing stored drawings must load byte-for-byte through the same
`opencharts-preview:workspace-drawings` key. No migration, backend schema, or
session API change is allowed.

## Interaction rules

- All tools operate only on the active chart cell and use the existing scoped
  undo/redo history.
- Pan, zoom, timeframe changes, layout changes, maximize/restore, Replay rewind,
  and Live/Replay separation retain current behavior.
- Magnet applies to discrete anchors. Brush, Highlighter, and Path may snap the
  first and last points but never distort every sampled point.
- Selected drawings render hit targets and editable anchors appropriate to
  their geometry. Locked drawings remain selectable but cannot move or resize.
- Moving a drawing body translates every anchor/point by the same data-space
  delta. Moving a point changes only that point or named anchor.
- Delete, duplicate, hide, visibility, ordering, templates/default styles, and
  context-menu behavior continue to use the existing drawing lifecycle.
- Escape cancels an unfinished tool. Enter completes Polyline. Pointer blur or
  disposal must not leave a preview or global listener behind.

## Rail and metadata

The existing fixed global rail does not move or widen. Add tools to coherent
groups with TradingView-like Lucide icons and English labels. Tool definitions
must come from one exported catalog consumed by the rail so the later Favorites
toolbar can reuse IDs, labels, icons, groups, and defaults without duplicating
the list.

## Rendering defaults

- Brush: 2 px solid current drawing color.
- Highlighter: 12 px round stroke at 30% opacity.
- Path and Polyline: 2 px solid current drawing color.
- Curve: 2 px solid current drawing color.
- Range tools: subtle translucent fill, one-pixel border, compact contrast-safe
  label derived from the measured values.
- Anchored Text: 14 px text without a box by default.
- Note: compact note marker using the current drawing color.

These are functional defaults, not the final visual redesign. The following
settings stage will match the supplied TradingView references for toolbars,
handles, labels, colors, fields, tabs, templates, and dialogs.

## Vendor delivery

Implement the engine changes in a temporary clone of pinned OpenCharts revision
`d3fc63cc002e6e651801be6e952e7514e58fa5fe` with the current controlled patch
applied. Add upstream regression tests, rebuild `controlled-chart.patch`, pack
the 0.3.0 tarball, refresh the host lockfile integrity, and verify a clean
`npm ci --ignore-scripts` in the clone and `npm ci` in the host as documented.
No direct `node_modules`-only change is deliverable.

## Verification

- Pure geometry tests cover path simplification, segment/curve hit-testing,
  range statistics, translation, and incomplete gestures.
- Manager tests cover each placement lifecycle, Enter/double-click completion,
  Escape, selection handles, body translation, magnet boundaries, cleanup, and
  callbacks.
- Renderer tests or deterministic canvas-command fixtures cover all ten types.
- Host tests confirm new DrawingTool IDs persist through existing drawing
  storage and remain scoped by cell/mode/symbol.
- Browser QA creates every new type, pans/zooms, reloads, switches layouts and
  active cells, rewinds Replay, checks context actions, and restores the user's
  original localStorage snapshot.

## Out of scope

- Final TradingView-like settings and floating-toolbar redesign;
- Favorites selection, persistence, or movable Favorites toolbar;
- Pitchfork, Gann, forecasting, pattern, or other tools outside this ten-tool
  pack;
- order execution, paper trading, Pine, or a custom trade engine.
