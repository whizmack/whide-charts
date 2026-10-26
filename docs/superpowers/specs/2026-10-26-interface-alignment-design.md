# Interface alignment design

## Goal

Polish vertical and optical alignment across the existing TradingView-like
workspace without changing its compact density, panel dimensions, chart zoom,
feature set or persistence semantics. Favorites remains out of scope until the
user reviews this pass.

## Visual rules

- Preserve the current heights of the top toolbar, fixed drawing rail, utility
  rail, replay/status bars, compact buttons and settings fields.
- Give icon-only controls one centered internal icon box. Use one visual icon
  size and stroke weight per surface, with at most a 1 px optical correction
  for asymmetric glyphs.
- Use explicit line-height and flex/grid centering for buttons, selects, inputs,
  tabs, swatches, checkboxes and numeric labels. Remove accidental centering
  caused by unequal padding or inherited browser line-height.
- Use tabular figures for market data, times, prices, numeric inputs and compact
  value controls. Text and numeric baselines within a row must align.
- Keep native controls accessible: visible focus, existing labels and hit areas,
  keyboard order and reduced-motion behavior remain intact.
- Match the canonical TradingView screenshots in
  `docs/reference/tradingview/README.md`; do not invent a new layout.

## Scope

The pass covers host workspace chrome in `web/compare/preview.css`, including
top toolbar, both fixed rails, popovers, watchlist, replay transport, status bar,
study legends and settings. It also covers packaged OpenCharts controls in
`src/styles/global.css`, `src/styles/app.css` and drawing settings
`settings.css`, including chart settings, indicator UI, drawing menus, drawing
toolbar and drawing dialogs.

Implementation should establish small shared alignment primitives/tokens inside
the existing CSS files, then migrate affected selectors to them. Component
markup changes are allowed only when CSS cannot provide a stable icon/text box.
No dependency or framework change is allowed.

## Verification

Use regression tests for required classes/accessibility names and built-browser
measurement for actual optical alignment. Verify the production app at
1280×800 and 390×720, plus 1/2/4-chart layouts, settings/dialog states,
watchlist, drawing rail/menu, selected-drawing toolbar, replay controls and
keyboard focus. Confirm no new page overflow and no movement of the fixed 40 px
drawing rail.
