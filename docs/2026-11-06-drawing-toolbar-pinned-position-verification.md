# Drawing toolbar pinned-position verification — 2026-11-06

## Browser interaction

Checked the OpenCharts chart at a temporary Vite origin (`127.0.0.1:5191`) with
BTCUSDT 5m Replay data. This separate origin kept the user's normal browser
storage untouched.

- Placed and selected a rectangle; the contextual toolbar appeared near it at
  approximately `(63, 189)` in the page viewport.
- Dragged the rectangle body from about `(323, 315)` to `(373, 335)`. The
  rectangle moved, while the toolbar's DOM position remained `(63, 189)`.
- Dragged the toolbar grip from about `(79, 213)` to `(120, 240)`. The toolbar
  moved independently to `(104, 216)`.
- Reloaded the temporary origin. The drawing remained, the toolbar was hidden
  until a drawing was selected, then it initialized near that drawing at about
  `(171, 209)`. This confirms the toolbar position is not persisted.
- Browser console had no `error` or `warn` entries after reload.

The browser check covered drawing-body movement, toolbar-grip movement, and
reload behavior. The follow-up case where a cell narrows while the toolbar is
outside the new bounds is covered by the `starts a grip drag from the clamped
visible point after the cell shrinks` component regression test.

A fresh review identified a position-only pane-layout change: moving an
oscillator above the price pane changes its viewport top without resizing the
chart. The bounds observer now tracks chart-cell/layout-tree mutations;
`drawing-toolbar-layout-observer.test.ts` verifies this with identical chart
width and height. A direct live-browser pane reorder check was unavailable
because the review environment could not launch a browser under macOS sandbox
permissions.

## Automated verification

- Vendor focused tests: 69 passed.
- The toolbar grip supports arrow-key nudges (Shift for 32px) and exposes
  accessible instructions and a visible keyboard focus ring.
- Backend suite via `.venv/bin/python -m pytest -q`: 34 passed. The prescribed
  `uv run pytest -q` wrapper could not create a temporary file in the user
  cache, so the project's existing virtualenv ran the same pytest suite.
- Host `npm test`: 104 passed, 2 skipped.
- Host `npm run typecheck`: passed.
- Host `npm run build`: passed.
- The vendor package builds and passes `scripts/check-package.mjs`. The vendor
full test suite still has 10 unrelated existing failures across settings
dialogs/tabs, with 355 passing and 1 skipped. Vendor `npm run typecheck` still
reports 6 existing diagnostics in `chart-resize.test.ts`,
`chart-settings-options.test.ts`, and `workspace-overlays.test.tsx`; it reports
  no changed production-file diagnostics. `npm run build:lib` exits 0, though
  Vite prints existing `ImportMeta.env`/`ImportMeta.glob` typing diagnostics in
  `services/api/request.ts`, `services/demo/candles.ts`, and `services/store.tsx`.
- The packaged vendor tarball SHA-512 matches the host lockfile integrity, and
  a clean offline `npm ci` installed it successfully.
