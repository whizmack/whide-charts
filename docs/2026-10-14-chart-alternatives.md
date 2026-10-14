# Chart alternatives — 2026-10-14

Research only; the running app has not been migrated.

## Recommendation

Evaluate original dylanpersonguy/OpenCharts first as a chart/UI donor over TradingView Lightweight Charts. Current original package.json identifies version 0.3.0 and library exports/adapter entrypoints. Source inspection confirms the drawing manager creates position tools with entry, targetPrice, stopPrice and riskPct, plus text/line/shape tools; ChartPanel imports createChart from lightweight-charts. Own code is MIT, underlying Lightweight Charts Apache-2.0 with attribution. This is a promising candidate, not yet a verified replacement for our replay/live bridge.

The original README's public demo https://dylanpersonguy.github.io/OpenCharts/ returned GitHub Pages 404 in the browser during this investigation. An upstream screenshot is available at docs/screenshot.png (also present in the inspected cklawkc fork). No claim of interactive/runtime superiority is made. The demo's generated forward ticks and paper-trading engine must not replace our real Binance live feed or quant engine. The current original README explicitly distinguishes simulated data from real historical seeds.

Sources:
- https://github.com/dylanpersonguy/OpenCharts
- https://raw.githubusercontent.com/dylanpersonguy/OpenCharts/main/package.json
- https://raw.githubusercontent.com/dylanpersonguy/OpenCharts/main/LICENSE
- https://github.com/dylanpersonguy/OpenCharts/blob/main/src/lib/chart-plugins/drawing-tools/manager.ts
- https://github.com/dylanpersonguy/OpenCharts/blob/main/src/pages/trading/ChartPanel.tsx

## terminal-rs

Cloned and inspected revision 97c96dd. Its tr-chart crate is a custom Rust GPU renderer with egui 0.36 / egui-wgpu 0.36, not a web chart library. The drawing Tool enum contains Trendline, Horizontal, Vertical and Fib only. No project LICENSE/COPYING file or package license declaration was found in the inspected tree/manifests. Do not copy code without clarified permission. A native rewrite/port would be substantial and would still need our missing annotation/position/replay functionality. Visual inspiration is useful; it is not the recommended integration base.

Sources:
- https://github.com/michaelshimeles/terminal-rs
- https://github.com/michaelshimeles/terminal-rs/blob/master/crates/chart/Cargo.toml
- https://github.com/michaelshimeles/terminal-rs/blob/master/crates/chart/src/drawings.rs

## KLineChart / Pro

Apache-2.0. A viable ready-made web chart family, with built-in indicators/drawing support. The SiMahfud fork has longPosition/shortPosition overlay implementations and a TradingView-inspired shell. Fresh clone is still revision 2e73227 (same as our earlier audit), with file:pine-to-kline dependency and imports of ../pine-to-kline/src. The required directory is absent. Prior audited build failure is therefore still relevant; this turn rechecked the source, not a new build. Prefer evaluating official klinecharts/pro and selectively adapting licensed overlay code rather than accepting the fork as a working drop-in.

Sources:
- https://github.com/klinecharts/pro
- https://github.com/SiMahfud/klinechartpro
- https://github.com/SiMahfud/klinechartpro/blob/main/package.json

## CandleKit

MIT wrapper on Lightweight Charts. Current README still lists text tools and indicator-settings UI in the roadmap. Existing local audit found a partial-bar replay fallback requiring protection and no built-in position/text tools at that audited revision. It would require more custom work for this app than OpenCharts appears to need. Do not reuse any alternative native replay until our no-future invariants are verified against it.

Source: https://github.com/rohanbeingsocial/candlekit-charts

## Official TradingView boundary

Lightweight Charts is a free Apache-2.0 renderer, not the full TradingView application. Official docs state that built-in indicators, drawing tools and surrounding UI are not supplied by the base library. Advanced Charts has those features but is proprietary; current FAQ excludes personal/hobby/study/testing licenses and limits access to companies' public projects/apps. It does not fit this private local project's stated constraints.

Sources:
- https://tradingview.github.io/lightweight-charts/docs/product-comparison
- https://www.tradingview.com/free-charting-libraries/

## Next validation before migration

Run an isolated OpenCharts prototype against our existing projected candles and real LiveFeed. Compare pan/zoom, axis scaling, crosshair, drawing hit targets and settings to Vela using the same data/window. Test position entry/SL/TP drag, drawing export/restore, backward replay seeks, partial higher-timeframe candles, mode switching and reconnect. Keep our backend and canonical replay clock. Migration also needs a deliberate conversion/retention path for existing Vela drawings and appearance preferences.
