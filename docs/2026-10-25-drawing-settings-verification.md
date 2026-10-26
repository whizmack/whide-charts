# Drawing settings verification — 2026-10-26

## Scope

This pass replaces the generic drawing editor with contextual TradingView-like
settings and a selected-object toolbar. The fixed 40 px workspace drawing rail
is unchanged. Favorites remains the next separate stage.

The settings model covers line, freehand, Fibonacci, shape, range, text/note
and Position families. Rectangle and Long Position were used as the browser
fidelity baselines.

## Packaging and deterministic checks

- The tracked patch applies to OpenCharts revision
  `d3fc63cc002e6e651801be6e952e7514e58fa5fe` in a fresh clone.
- Clean vendor install: `npm ci --ignore-scripts --no-audit --no-fund`.
- Vendor tests: 302 passed, 1 opt-in Binance live test skipped.
- Vendor `npm run typecheck`: passed.
- Vendor `npm run build:lib`: exited 0. Its existing declaration-generation
  diagnostics for `import.meta.env` and `import.meta.glob` remain visible;
  the independent strict typecheck above passed.
- The public `dist-lib/style.css` was checked for the contextual-toolbar rules.
  The library CSS builder now includes the drawing settings stylesheet rather
  than leaving it only in Vite's internal `opencharts.css` side output.
- A fresh `npm pack --ignore-scripts` produced the same tarball as the tracked
  artifact: SHA-256
  `07dec58422cffeb415de50197cd0024091a90146f43790bff22315f8f99082ce`.
- Host `npm ci --no-audit --no-fund`: passed; npm repeated the existing
  unapproved optional `fsevents@2.3.3` install-script notice.
- `uv run pytest -q`: 32 passed with the known Starlette/httpx deprecation
  warning.
- `npm test`: 55 passed, 2 opt-in tests skipped.
- `npm run typecheck`: passed.
- `npm run build`: passed; 1,818 modules transformed.
- `git diff --check -- . ':(exclude)third-party/opencharts/controlled-chart.patch'`:
  passed.

## Built-browser verification

The production build was served by `./scripts/start.sh` at
`http://127.0.0.1:8765/`. QA used an isolated incognito storage context; the
normal Brave profile and its three-chart Live workspace were not changed.

At 1280×800:

- Rectangle placement opened the final contextual toolbar at x=350–891,
  y=150–198.
  It computed as `position: fixed`, `display: flex`, background `rgb(17,18,20)`
  and remained fully inside the viewport with no document overflow.
- The final Rectangle toolbar exposed border colour/style/width, fill, text,
  visibility, bring-forward, clone, settings, lock, delete and overflow actions.
- Rectangle settings rendered as a native modal with a 440 px near-black
  panel and the contextual Style, Text, Coordinates and Visibility tabs.
- Cancel closed the dialog and left the persisted drawing JSON byte-for-byte
  unchanged.
- Changing Border width to 4 and pressing OK persisted one normalized drawing;
  width 4 remained present after a full reload.
- Long Position placement persisted side, entry, target and stop anchors.
  Its dialog rendered the title and accessible name `Long Position`, with
  Inputs, Style and Visibility tabs. Inputs exposed Account size, Lot size,
  Risk, Risk unit, Entry price, Leverage, Target price, Stop price and QTY
  precision.

An earlier built-browser run at 390×720, before the final review added the
visibility and ordering actions, confirmed the narrow-toolbar container
behaviour:

- the document measured 390 px client width and 390 px scroll width;
- the fixed drawing rail measured x=3–37;
- a newly selected Rectangle toolbar clamped to x=48–342, y=164–208;
- the toolbar remained `position: fixed`, fully visible and internally clipped
  rather than creating horizontal page scroll.

The final expanded toolbar control set and viewport-clamping geometry are also
covered together by automated tests. Automated family-matrix tests cover the remaining drawing families, optional
legacy-field defaults, finite coordinate validation, functional Fibonacci
level enable/value/colour editing, renderer semantics, toolbar control sets,
keyboard tab behaviour and viewport-clamping geometry. The collaborative
preview produced a final 1280×800 screenshot and accessibility snapshot with
no console entries. A later final-build 390×720 snapshot attempt timed out
twice with `Preview automation snapshot timed out after 15000ms.`; no new
narrow screenshot artifact is claimed. The prior successful narrow DOM
measurements and the final geometry tests are reported separately above.

The final review fix pass also verifies that Position line, price-label and
stats settings affect rendering; account-size metadata drives amounts without
a host trading account; z-index changes alter stable drawing order; legacy
Fibonacci and Fibonacci Extension defaults match the renderer; attached shape
and line text is rendered; and compact range labels change the readout.

## Remaining work

The movable Favorites drawing bar is intentionally not part of this pass. No
commit was created; the requested checkpoint remains Settings plus Favorites.
