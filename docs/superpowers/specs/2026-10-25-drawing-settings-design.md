# TradingView-like drawing settings design

Date: 2026-10-25
Status: approved direction, ready for implementation planning
Scope: native OpenCharts drawing settings and selected-drawing toolbar

## Goal

Replace the current compact, generic drawing editor with one coherent,
TradingView-like editing system for every supported drawing family. The result
must closely follow the supplied Rectangle and Long Position references in
composition, density, colour, icon treatment and control behaviour while
remaining native to the patched OpenCharts drawing engine.

This stage includes the selected-object floating toolbar and the modal settings
experience. The fixed primary drawing rail stays unchanged. The separate
movable Favorites toolbar remains the following stage.

## References

The user-supplied screenshots from 2026-10-24 are authoritative for:

- Rectangle floating toolbar;
- Rectangle Style, Text, Coordinates and Visibility tabs;
- Long Position floating toolbar;
- Long Position Inputs, Style and Visibility tabs;
- dark surfaces, compact desktop density, control shapes and visual hierarchy.

`docs/reference/tradingview/10-floating-drawing-toolbar.png` remains the
workspace-level reference for placement and general toolbar composition.

## Chosen approach

Implement a complete vendor-native settings system shared by all drawing
families. Do not merely reskin the current generic dialog, and do not limit the
redesign to Rectangle and Position. Each family gets contextual tabs and fields
backed by real `DrawingLine` properties. Unsupported controls are omitted rather
than displayed as inert replicas.

The implementation keeps the existing drawing manager authoritative for
geometry, selection and updates. The settings layer edits a working draft and
commits through the existing `onUpdate` callback only when the user confirms.

## Visual system

### Modal

- Render through a document-level portal so the dialog cannot be clipped by a
  chart cell, pane or multi-chart workspace.
- Use a native modal `<dialog>` with a dimmed backdrop, focus containment,
  Escape handling and focus restoration.
- Default desktop width is approximately 380–440 px depending on tab content;
  Position Inputs may be taller but must remain within the viewport and scroll
  internally.
- Surface is near-black with a restrained one-pixel border, 8 px outer radius,
  small shadow and no gradient.
- Header contains the human-readable tool name, a rename/pencil affordance and
  a 32 px close target.
- Tabs sit directly below the header. The active tab uses a short light
  underline on a muted full-width track, matching the screenshots.
- Content rows align to a consistent label column and control column. Related
  controls group with space; separators are reserved for the sticky footer.
- Footer remains visible while content scrolls and contains Template on the
  leading side, Cancel and OK on the trailing side.
- Cancel discards the complete draft. OK applies one final update and closes.
  Closing with Escape or the X behaves like Cancel.

### Controls

- Inputs and selects use the same 36 px height, dark surface, subtle grey
  border, 6 px radius and tabular numerals for prices and bar indices.
- Checkboxes use a native semantic input with a styled high-contrast checked
  state. Labels and boxes share one hit target.
- Colour controls open a custom compact palette/popover with opacity where the
  property supports alpha. The trigger previews colour and line/fill semantics.
- Line controls combine colour, width and dash style in one compact trigger.
- Icon buttons use one Lucide outline system with consistent optical size and
  `currentColor`; active state is visible without relying on colour alone.
- Keyboard focus uses an explicit two-pixel focus-visible ring. All popovers and
  tabs work with keyboard navigation and close with Escape.
- Motion is limited to short opacity/translate transitions and disabled under
  reduced-motion preferences.

### Selected-drawing toolbar

- Render above the selected object when space permits, clamped to the active
  chart viewport; fall back below the object near the top edge.
- The toolbar is compact, dark, horizontally grouped and draggable only by its
  leading grip. It must not become the future Favorites toolbar.
- Its controls are contextual. Rectangle exposes border, fill, text, width,
  line style, visibility/order, lock, delete and overflow actions. Position
  exposes text, target/stop colours, line style, settings, lock and delete.
- Simpler line, freehand, range and text tools expose only meaningful controls.
- The gear/overflow path opens the full modal. Inline changes remain immediate,
  as in TradingView, and continue using the existing drawing update pipeline.

## Drawing families and tabs

### Lines and freehand

Applies to Trend Line, Horizontal Line, Vertical Line, Ray, Extended Line,
Arrow, Brush, Highlighter, Path, Polyline and Curve.

- **Style:** line colour, opacity, width, dash style; extension and arrowhead
  options only where supported; attachable text controls when meaningful.
- **Text:** label content, colour, size, bold, italic, background and border.
- **Coordinates:** all anchors in deterministic order. Freehand paths show a
  read-only point count plus editable first/last anchors rather than hundreds of
  fields. Curve also exposes its control anchor.
- **Visibility:** all intervals or current interval, using the existing
  persistence semantics.

### Shapes

Applies to Rectangle, Ellipse, Triangle and Channel.

- **Style:** extension where meaningful; border line control; optional middle
  line for Channel; background colour and opacity.
- **Text:** full text editor, font formatting, inside/outside placement and
  horizontal alignment where the renderer supports them.
- **Coordinates:** numbered price/time anchors, including the third Channel
  anchor.
- **Visibility:** shared interval controls.

Rectangle is the fidelity baseline and must visually match the supplied
screenshots most closely.

### Fibonacci

Applies to Fibonacci Retracement and Fibonacci Extension.

- **Style:** baseline line styling, fill/label styling and an ordered levels
  editor with enable, value and colour per row.
- **Coordinates:** two or three anchors according to tool type.
- **Visibility:** shared interval controls.

Existing custom level arrays remain backward compatible. New per-level styling
is optional and must not invalidate older stored drawings.

### Range tools

Applies to Measure, Price Range, Date Range and Date & Price Range.

- **Style:** positive/negative colours, fill opacity, line styling, label text
  colour and compact/full label mode.
- **Coordinates:** start and end anchors; Date Range emphasises time/bar values,
  Price Range emphasises price values, combined range exposes both.
- **Visibility:** shared interval controls.

### Text and notes

Applies to Text, Anchored Text and Note.

- **Text:** content, colour, font size, bold, italic, background and border.
- **Style:** marker/background/border styling appropriate to the selected type.
- **Coordinates:** anchor price and time.
- **Visibility:** shared interval controls.

### Long and short position

Position remains a drawing of a trade setup, not an executed order.

- **Inputs:** account size, lot size, risk value and risk unit, entry price,
  leverage, target price/ticks, stop price/ticks and quantity precision.
- **Style:** line style, stop/target colours and opacity, label text colour and
  size, price-label toggle, stats selection, compact stats and always-show
  stats.
- **Visibility:** shared interval controls.

Changing entry, stop or target in the dialog updates the same geometry used by
drag handles. Derived ticks, percentages, amount, quantity and risk/reward are
computed from the draft. Account size, lot size, leverage and risk settings are
drawing metadata only; they never place an order or call a trading API.

## Data model and compatibility

Extend `DrawingLine` only with optional fields. Existing drawings must render
unchanged using current defaults. New settings include:

- text alignment and placement;
- line/fill opacity and optional secondary line styling;
- range positive/negative colours and label preferences;
- position account, lot, leverage, risk unit, quantity precision and stats
  preferences;
- optional per-level Fibonacci presentation.

The host `DrawingStore` remains JSON-compatible and keeps the existing
`opencharts-preview:` namespace. No backend, SQLite or Parquet schema changes
are involved. Copy, duplicate, workspace export and reload must preserve every
new optional field.

Per-type defaults and named templates expand to include every style-only field
but never anchors, position account values, visibility, alerts or object IDs.

## State and interaction flow

1. Opening settings snapshots the selected drawing into an immutable original
   and a mutable dialog draft.
2. Tab changes and field edits update only the draft and preview the drawing on
   the chart without writing persistence history for every keystroke.
3. OK commits the draft as one logical drawing update and closes.
4. Cancel, Escape and X restore the immutable original and close.
5. External deletion or selection change closes the dialog safely without
   applying a stale draft.
6. Inline floating-toolbar edits remain immediate and each action is one undo
   step.

The implementation must preserve scoped undo/redo, active-cell routing,
Replay cutoff visibility, Live/Replay drawing isolation and current timeframe
visibility behaviour.

## Responsive and multi-chart behaviour

- The modal is workspace-level and centered in the browser viewport, not the
  active cell.
- At narrow widths it uses `calc(100vw - 24px)` and a bounded height; the footer
  stays reachable without horizontal scrolling.
- Tabs may scroll horizontally with an obvious edge affordance rather than
  compressing labels into illegibility.
- The selected toolbar clamps inside its chart cell and never covers the fixed
  drawing rail or right utility rail.
- Switching the active chart never moves the primary rail. Settings continue
  targeting the drawing that opened the modal until confirmation or dismissal.

## Error handling

- Numeric fields may be temporarily empty while editing. Invalid values show a
  local message and block OK; they never write `NaN` or infinity.
- Stop/entry/target ordering is validated according to long or short direction.
- Malformed optional stored fields fall back to safe defaults without removing
  the drawing.
- A failed preference write reports through the existing workspace storage
  status while keeping the in-memory drawing usable.

## Verification

### Deterministic tests

- tab availability and control visibility for every drawing family;
- draft preview, OK commit, Cancel/Escape/X rollback and one-step undo grouping;
- coordinate edits for two-, three-, multi-point and Curve geometry;
- position calculations for long and short directions;
- optional-field normalization and old drawing compatibility;
- templates/defaults include style fields but exclude geometry and trading
  metadata;
- duplicate and JSON workspace backup preserve all supported metadata;
- keyboard tab semantics, accessible names and modal focus restoration.

### Browser verification

- compare Rectangle toolbar and all four tabs against the supplied references;
- compare Long and Short Position toolbar, Inputs and Style tabs;
- edit each drawing family, cancel once, confirm once, undo and redo;
- verify drag/resize after coordinate edits and coordinate values after drag;
- test one, two and four charts, active-cell switching, maximize/restore and
  modal clipping;
- test approximately 1280×720 and 390 px widths, keyboard-only operation,
  200% zoom and reduced motion;
- reload and confirm persistence while preserving the user's original browser
  state after the test.

## Out of scope

- Favorites toolbar and Favorites persistence;
- new drawing types beyond the current tool catalog;
- order execution, P&L journal entries or a trading simulator;
- chart appearance and indicator settings redesign;
- backend or market-data changes.

## Acceptance criteria

- Drawing settings visually read as the same product family as the supplied
  TradingView references, without copying branding or removing attribution.
- Every visible control changes a real drawing property or derived readout.
- Rectangle and Position match the reference structure and density closely.
- Cancel is lossless, OK is atomic and keyboard/focus behaviour is complete.
- Existing drawings and stored workspace data remain backward compatible.
- The fixed left drawing rail, replay invariants and multi-chart routing remain
  unchanged.
