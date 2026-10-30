# Indicator browser desktop verification — 2026-10-28

## Comparison setup

- TradingView desktop stayed on BTCUSDT/1h with its “Indicators, metrics, and
  strategies” browser open.
- Whide Charts was rebuilt and installed at
  `/Users/whiz/Applications/Whide Charts.app`. Its comparison view used
  BTCUSDT/4h. Reopening the app returned it to paused Replay; after inspection
  it was restored to Live and the Binance USD-M feed updated.
- The dialogs were inspected at the current desktop sizes, not at a matched
  1280×720 window. Chart settings, candle appearance, symbol, timeframe,
  workspace layout and indicators were not changed during inspection.

## Observed behavior and appearance

- The installed Whide app showed a centered 880×640 CSS-pixel native dialog,
  with a dimmed chart behind it, title/close row, full-width search, left
  category rail and compact result table. Its proportions, dark surfaces,
  borders, spacing and search focus color were visually close to TradingView's
  live indicator browser.
- The catalog showed only the eight studies Whide can render: SMA, EMA, BOLL,
  VWAP, RSI, MACD, ATR and Stochastic. “Price overlay” and “Separate pane” are
  shown once in the placement column, aligned with the result rows. Categories
  show four price overlays and four oscillators.
- Searching `moving average` returned SMA, EMA and MACD. Selecting
  “Oscillators” while that query was active left MACD; clearing the query showed
  RSI, MACD, ATR and Stochastic. The polite result status announced “8
  indicators found” and updated to “3 indicators found” with the search.
- Tabbing from Search showed the visible blue keyboard-focus ring on the
  selected category. On a narrow viewport, the placement heading is hidden
  together with the placement values to avoid an empty table column.
- Escape dismissed the modal and returned keyboard focus to the Indicators
  toolbar button. No study row was selected, so adding/removing a study and
  opening its per-study settings were not manually triggered in the user's
  workspace.
- TradingView-only script, purchased, community and favorites categories are
  omitted because Whide has no backing data or behavior for them.

## Checks

- `npm test -- web/compare/WorkspaceChrome.test.tsx`: the new placement-column
  regression failed before the markup change, then passed with the updated row
  layout.
- `npm test`: 78 passed, 2 skipped; one test file was skipped.
- `npm run typecheck`: passed.
- `npm run desktop:build`: passed and installed the Electron app; the build's
  embedded Vite production build also passed.
- `git diff --check -- web/compare`: passed. The repository-wide diff check
  still reports trailing spaces in the already-modified generated
  `third-party/opencharts/controlled-chart.patch`; that vendor artifact was not
  changed during this indicator-browser pass.

## Remaining limits

- The dialog has not been checked at matched 1280×720 or narrow 390×720 sizes.
- Study add/remove, study-settings handoff, and per-study active-row appearance
  remain unverified in the installed app so the user's chart configuration was
  left untouched.
- This completes the indicator-browser item in the parity audit, not the full
  TradingView workspace audit. See
  `docs/2026-10-27-tradingview-parity-audit.md` for the remaining order.
