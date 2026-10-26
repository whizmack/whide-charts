# Drawing tools pack verification — 2026-10-25

## Scope

Native OpenCharts support for Brush, Highlighter, Path, Polyline, Curve,
Price Range, Date Range, Date & Price Range, Anchored Text and Note. This stage
does not include the later TradingView-like settings redesign or Favorites bar.

## Deterministic verification

- Temporary upstream clone at pinned revision
  `d3fc63cc002e6e651801be6e952e7514e58fa5fe`, with the complete host patch
  applied and extended.
- Vendor `npm test`: 228 passed, 1 opt-in live test skipped.
- Vendor `npm run typecheck`: passed.
- Vendor `npm run build:lib`: emitted the library and declarations. The upstream
  DTS plugin printed its pre-existing `ImportMeta.env/glob` diagnostics but the
  command completed successfully and produced the package.
- Vendor `npm pack --ignore-scripts`: produced the checked-in 0.3.0 tarball.
- Clean host `npm ci --ignore-scripts --no-audit --no-fund`: passed after lockfile
  integrity was updated to the new tarball.
- Host `npm test`: 54 passed, 2 opt-in tests skipped, including JSON backup
  roundtrips for freehand points and Curve control anchors.
- Host `npm run typecheck`: passed.
- Host `npm run build`: passed.
- Backend `uv run pytest -q`: 32 passed, one Starlette deprecation warning.
- A clean second checkout of the pinned revision accepted the checked-in patch,
  built successfully and produced a byte-identical tarball (SHA-256
  `49c3fe4a1696abd1e5f87d54e55d2841b17da444a73ab93afdf4066c35596a12`).

The final regression pass also covers bounded/simplified freehand sampling,
magnet-safe intermediate samples, cancel-on-blur, touch placement for multi-click
tools, complete duplicate geometry, compact Note rendering, full-height Date
Range hit-testing, and invariant data-space dragging on nonlinear scales.

## Browser verification

Built application served at `http://127.0.0.1:8765/`, viewport 1280×720.

- The fixed rail exposed the new grouped menus. Brushes contained Brush,
  Highlighter and Path; Measure contained Measure, Price Range, Date Range and
  Date & Price Range; Text & Notes contained Text, Anchored Text and Note.
- Brush was drawn through real chart pointer events. Persistence contained three
  sampled data-space points and restored the drawing after a full navigation.
- Date & Price Range completed after two clicks and persisted as
  `date-price-range`.
- Note completed after one click with `text: "Note"` and `textBg: true`; its
  selected floating toolbar opened the native settings UI with the Note textarea.
- In four-chart layout the DOM contained exactly one Lines rail button at x=4.
  Activating the bottom-right cell changed the workspace active id to `chart-4`;
  selecting Note from the same global rail persisted it only under the
  `chart-4:replay:BTCUSDT` drawing key.
- The agent browser state was restored to one chart with no test drawings.

T3's full accessibility-tree/image snapshot timed out twice with
`Preview automation snapshot timed out after 15000ms`. Focused browser clicks,
page evaluation, navigation, storage inspection and chart interaction remained
available and were used for the checks above. No screenshot artifact was saved.

## Packaging evidence

- `third-party/opencharts/controlled-chart.patch` contains the implementation
  and three new `drawing-tools-pack-*.test.ts` regression suites.
- `third-party/opencharts/dylanpersonguy-opencharts-0.3.0.tgz` is rebuilt from
  the patched pinned clone.
- `package-lock.json` uses the rebuilt tarball's SHA-512 integrity.
- `third-party/opencharts/README.md` records the new native drawing pack.
