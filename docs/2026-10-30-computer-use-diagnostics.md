# Computer Use diagnostics — 2026-10-30

## Summary

macOS Computer Use could capture native application screenshots and
accessibility trees, but coordinate clicks in both Whide Charts and Chrome
returned `Computer Use server error -10005: noWindowsAvailable`. This matches
open reports for the same CUA error. It does not establish the underlying
platform cause or a permanent fix.

## Observed in this session

- `cua.getState()` listed Google Chrome, TradingView, and Whide Charts as
  running. Its `browsers` list was empty.
- `cua.getBrowser({ url: "https://www.tradingview.com" })` returned
  `No browser is available`. Native Chrome access showed one `New Tab` window;
  the browser-tab bridge was not available to this session.
- Native app capture succeeded for TradingView and Whide Charts, including
  screenshots and accessibility trees.
- Coordinate clicks in Whide Charts and Chrome returned
  `-10005: noWindowsAvailable`. In Whide, the Settings popover visibly closed
  after a click call returned that error. Treat the action result as unknown
  until a fresh screenshot confirms whether it took effect; never retry blindly.
- Reacquiring and raising the Whide window did not resolve coordinate input.
- One stale accessibility index briefly changed the chart from 5m to 15m. It
  was restored to BTCUSDT 5m and visually verified. Replay time remained
  `2023-01-20 20:00`; no zoom, pan, or drawings were changed. This confirms the
  need to refresh the tree before every index-based action.
- Screenshots and accessibility inspection are currently usable for static
  visual comparison. Coordinate-dependent actions such as canvas dragging,
  drawing, and pan/zoom are not reliably verified by this session.

## Guidance for later threads

1. Probe the current session again; do not assume this dated state still holds.
2. Check native app access and `browsers` separately. A running Chrome process
   does not imply an attached browser-tab bridge.
3. Refresh the accessibility tree immediately before each index-based action.
4. After any CUA error or timeout, capture the current tree and screenshot
   before deciding whether to retry.
5. Claim visual verification only for states visible in a fresh screenshot.

## Related public reports

These reports describe similar symptoms, but are not a confirmed diagnosis for
this machine:

- [Coordinate clicks fail with `noWindowsAvailable` in Safari, Chrome, and
  Krita](https://github.com/openai/codex/issues/43119)
- [Intermittent Computer Use stalls and `noWindowsAvailable`](https://github.com/openai/codex/issues/45387)
- [Mixed results from reacquiring and raising the target window](https://github.com/openai/codex/issues/55043)
