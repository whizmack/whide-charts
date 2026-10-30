# Chart Settings Verification — 2026-10-27

## Automated checks

Host checks against the repackaged OpenCharts dependency:

| Command | Result |
| --- | --- |
| `npm test` | Passed: 12 files, 62 tests; 1 file and 2 tests skipped |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; Vite built `dist/` |
| `uv run pytest -q` | Passed: 32 tests; one existing Starlette/httpx deprecation warning |

Vendor artifact verification:

- A fresh clone at pinned OpenCharts revision
  `d3fc63cc002e6e651801be6e952e7514e58fa5fe` accepted the host patch and
  reproduced the updated package source.
- Vendor checks passed: typecheck, 324 tests passed / 1 skipped,
  `npm run check:package`, and `npm pack --ignore-scripts`.
- `npm run build:lib` exited 0 and produced the package; it prints the existing
  upstream Vite declaration diagnostics for `import.meta.env` and
  `import.meta.glob`.
- The rebuilt tarball SHA-256 is
  `e9e7b2accae49ad8ad1a2de5eca8f1a65ffd67be7f43c81b1cfb9fc0689f64db`.
- Host `npm ci --no-audit --no-fund` completed against the refreshed lockfile.
- `git diff --check -- . ':!third-party/opencharts/controlled-chart.patch'`
  passed. Unfiltered `git diff --check` reports whitespace-only added lines
  inside the generated vendor patch; these mirror the pinned upstream source
  and were kept to preserve exact patch-to-tarball reproduction.

## Installed Electron app

`npm run desktop:build` completed after the final vendor fix and installed the
updated `Whide Charts.app`. The current OpenCharts route opened with the saved
Replay workspace. Settings opened from the active chart in 1-, 2-, and 4-chart
layouts. The 4-tab order was Symbol, Status line, Scales and lines, Canvas.
The settings modal showed the compact dark two-column layout, left-side tab
navigation, close control, and persistent Template / Cancel / OK footer.

Behavior exercised in the app:

- With two charts visible, the previous-close-color setting changed in the
  modal draft and both chart cells remained rendered.
- In the four-chart layout, enabling Market state added the `REPLAY` status
  value to each chart's status line. Clicking OK committed it. After reloading
  the app, the preference was still enabled in all four chart cells.
- The preference was returned to its original disabled value and committed.
  The workspace was restored to one chart; Replay remained paused at
  `2023-01-13T08:00` UTC.
- Cancel discarded a temporary Market state change; reopening the dialog showed
  the stored value remained disabled. Escape also dismissed a draft without
  committing. Clicking the modal backdrop dismissed it and rolled back the
  draft after the backdrop event target was corrected in the vendor dialog.
- Reset current tab reverted a changed previous-close-color draft value.
- A temporary `Settings audit temp` template was saved, applied to revert a
  draft Market state change, and deleted. The menu returned to “No templates
  yet”; no test template was left in preferences.
- The current session's saved candle colors, Wicks, Candle borders, volume,
  scale, grid, and timezone values were inspected and retained. No drawing,
  zoom, or pan action was made. The original Replay timestamp and one-chart
  layout are visible after the checks.

## Reference and responsive limits

The installed TradingView app was available as `BTCUSDT.P / Main View`. Its
accessibility tree exposed the settings tabs, including the same four core tabs
plus Trading, Alerts, and Events. The screenshot capture continued to show the
chart without the Settings surface, and clicking an individual tab returned
`Computer Use server error -10005: elementHasNoFrame`. No settings were changed
in TradingView. Visual matching therefore relies on the supplied reference
screenshots in `docs/reference/tradingview/` and does not claim exact live
interaction parity.

The app window resize check at 1280×720 and 390×720 could not be completed:
CUA returned `Computer Use server error -10005: noWindowsAvailable` for a
window-coordinate drag. No responsive claim is made for those dimensions.
The exact preservation of chart zoom/pan was not measured pixel-by-pixel; the
settings changes did not interact with the chart viewport or drawings, and
Replay/layout restoration was confirmed.

## Vendor regression note

The Electron run found that clicking the visible backdrop did not dismiss the
modal. The original dialog handler compared the click target to the `<dialog>`
while the actual target was its `.chart-settings-screen` child. The handler was
moved to that backdrop element and now checks its own target. A focused vendor
regression test failed before the fix and passed after it; the complete vendor
suite passed afterward.

## Day-of-week axis label follow-up — 2026-10-28

- Added the reference-backed **Day of week on labels** setting to the existing
  shared preference and settings-template model. It defaults on and prefixes
  only day-of-month axis ticks using the selected display timezone. Numeric
  candle timestamps and the UTC Replay clock are unchanged.
- Vendor verification on the pinned OpenCharts source passed: 328 tests / 1
  skipped, typecheck, package check, and patch reproduction. `build:lib` and
  `npm pack` completed; the build printed the existing upstream declaration
  diagnostics for `import.meta.env` and `import.meta.glob`.
- Host `npm ci --no-audit --no-fund` exited 0; `npm test` passed with 78 tests
  / 2 skipped, and host typecheck and web build exited 0. `npm run desktop:build`
  exited 0 and installed the new app under `~/Applications`.
- CUA timed out after 60 seconds attaching to both the already-running Whide
  Charts app and the freshly built bundle. Therefore this follow-up has no live
  desktop confirmation of the checkbox or rendered tick labels. No chart
  settings were changed during those attempts. Earlier desktop evidence above
  covers the chart-settings dialog behavior before this follow-up.

## Price-scale inversion follow-up — 2026-10-28

- Added `priceScaleInverted` as a shared boolean preference and settings-template
  value. The price-axis menu exposes **Invert scale** and applies the real
  Lightweight Charts `invertScale` option to the selected left/right scale;
  the default remains off.
- The three new vendor tests for default/storage, selected-scale option mapping,
  and template persistence failed before implementation and passed afterward.
  Full vendor verification passed: 331 tests / 1 skipped, typecheck, package
  check, pinned patch reproduction, and byte-identical tarball rebuild.
- Host clean install passed; `npm test` passed with 78 tests / 2 skipped,
  typecheck, web build, backend tests (32 passed), and desktop packaging passed.
- The new menu state was not visually confirmed. CUA found the installed and
  build-output bundles share an identifier; an exact path to the installed app
  then timed out after 30 seconds. The app appeared running in the inventory,
  but no menu was inspected and no preference was toggled.

## Price-label overlap follow-up — 2026-10-28

- Added the Scales and lines checkbox **No overlapping labels**, default on,
  mapped to `alignLabels` for both price scales and persisted in named settings
  templates.
- New preference/storage, renderer-mapping and template tests failed before
  implementation and passed afterward. A dialog test covers the visible,
  initially checked checkbox and toggle interaction.
- Pinned vendor suite: 335 passed / 1 skipped; typecheck and package check
  passed. A newly cloned pinned revision accepted the patch and reproduced a
  byte-identical tarball; clean-clone tests passed (335 / 1 skipped), typecheck,
  package check and pack passed. `build:lib` exited 0 with the existing
  upstream declaration diagnostics for `ImportMeta.env` and `ImportMeta.glob`.
- `npm run desktop:build` completed and installed the rebuilt app. Computer Use
  timed out after 30 seconds binding `/Users/whiz/Applications/Whide Charts.app`,
  so the new checkbox and rendered label spacing still lack a live visual
  check. No chart setting was changed during the attempt.
