# Whide Charts desktop verification · 2026-10-27

## Delivered artifact

- `npm run desktop:build` creates and installs
  `~/Applications/Whide Charts.app` for Apple Silicon.
- Bundle identifier: `com.whiz.whidecharts`; Electron 41.5.0; Python 3.12.13
  sidecar built with PyInstaller 6.22.3 in onedir mode.
- The packaged app includes the current `dist/` UI and the backend executable.
  The backend binds to `127.0.0.1:8765` and uses the existing `.data/` path
  recorded at build time when that path exists.
- `codesign --verify --deep --strict "$HOME/Applications/Whide Charts.app"`
  succeeds. The bundle is ad-hoc signed for this Mac and is not notarized for
  distribution to other Macs.

## Observed behavior

- Launched the installed `.app` with macOS and inspected its native window.
  The window title and workspace label are **Whide Charts**.
- The main OpenCharts `/` workspace rendered BTCUSDT 5m replay candles, EMA 20,
  RSI 14, drawing rail and replay transport from the local dataset.
- `GET /api/health` returned `{"app":"perp-replay","status":"ok"}`;
  `GET /api/markets` returned BTCUSDT, ETHUSDT and SOLUSDT with 1,990,080
  one-minute rows each. `GET /api/bars` returned HTTP 200 with 1,000 projected
  bars for BTCUSDT 5m.
- Clicking **Next candle** advanced replay from `2023-01-08T00:00` to
  `2023-01-08T00:05` and updated chart values.
- Quitting with `⌘Q` stopped the backend owned by the app; `/api/health` then
  refused connections on port 8765.
- The packaged sidecar was also launched on port 8766; health, root HTML title
  and `/api/markets` all responded successfully.
- The final rebuild after the Electron startup error-handling change completed;
  the installed bundle identifier and arm64 backend were inspected and strict
  deep signature verification succeeded.

## Integrated macOS window controls · 2026-10-27

- The desktop window hides the separate native title bar and positions native
  macOS traffic lights over the left side of the OpenCharts toolbar.
- In the desktop-only `?desktop=1` view, the redundant **Whide Charts** toolbar
  label is removed, space is reserved for the native controls, and the empty
  toolbar spacer is a window-drag region. Browser `/` keeps its existing label
  and layout.
- Rebuilt and launched the installed app. Its window showed the chart toolbar
  flush at the top with native red/yellow/green controls; the accessibility tree
  reported the desktop URL and no duplicate product label.
- The first drag region collapsed to zero height because the toolbar centers its
  flex children. The spacer now stretches to a 32px hit area and declares both
  current `app-region: drag` and the WebKit-prefixed property.

## Boundaries

- This is a local arm64 app bundle, not a DMG/PKG installer. Developer ID
  signing, notarization, Intel builds and auto-update are not included.
- Desktop localStorage belongs to Electron's profile and is separate from the
  browser/Vite profile. The browser's existing saved workspace remains intact.
- The app is in `~/Applications`. macOS shows its Dock icon while it is open;
  use **Options → Keep in Dock** on that icon to pin it after quitting.
- Live mode was not verified in the desktop pass; an attempted switch showed
  the feed reconnecting, so this evidence only confirms Replay operation.
- The app references the existing `.data/` directory without copying it. If
  that directory is later unavailable, the backend falls back to
  `~/Library/Application Support/PerpReplay` without moving history.
