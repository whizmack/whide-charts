# Drawing toolbar pinned position

## Intent

Keep the contextual drawing toolbar as an independently movable object within
its chart cell. The selected drawing changes which controls the toolbar shows,
but drawing geometry does not control the toolbar's position.

## Goals

- Place the toolbar near the first selected drawing when it appears.
- Keep one chart-cell position across drawing moves, resizes, and selection
  changes.
- Move the toolbar only through its own drag grip.
- When the grip is focused, arrow keys move the toolbar; Shift uses a larger
  nudge. The grip provides accessible instructions and a visible focus ring.
- Keep it clamped inside the chart cell when the cell is resized or moved.
- Keep the same chart-local point when a layout change moves the chart without
  changing its dimensions, including oscillator-pane reordering.

## Non-goals

- Persist toolbar coordinates across reloads or sessions.
- Keep a separate toolbar position for each drawing.
- Change Keep drawing mode or drawing selection behavior.

## Approaches

1. **One position per chart cell (selected).** Initialize from the first
   selected drawing, then preserve the position while the selection or drawing
   geometry changes. This matches the requested independent floating object.
2. **One position per drawing.** Preserve the toolbar while editing one
   drawing, then reposition it when another drawing is selected. This keeps a
   hidden attachment to each drawing and was not chosen.
3. **Reposition on every selection.** Place the toolbar beside each newly
   selected drawing. This keeps the current coupling and was not chosen.

## Implementation direction

Store the toolbar's position in `ChartPanel`, initialize it only when the
toolbar first becomes visible, and update it only from the toolbar's own drag
grip. Continue updating chart-cell bounds for layout changes and clamp the
stored position to those bounds. Observe layout-tree changes as well as size
changes so position-only pane and cell moves refresh the viewport origin.
Remove drawing-drag preview updates whose only consumer is toolbar positioning.
Add regression coverage for drawing geometry and selection changes preserving
position, pointer and keyboard toolbar movement, and position-only layout
changes.
