# OpenCharts comparison prototype

Goal: Separate, usable OpenCharts preview using safe replay and real LiveFeed, retaining Vela and its sessions.

Architecture: Pinned locally built OpenCharts library with controlled ChartPanel exports. Host owns candles, asOf, mode and drawings. Upstream Terminal, demo replay and trading gateway are not mounted. Adapter pagination clips requests to the canonical replay cutoff. Rewinds remount to discard cached future candles; late requests are canceled/ignored.

- [x] Build pinned upstream library and retain license/source provenance.
- [x] Test timestamp conversion, history clipping and mode/drawing isolation.
- [x] Implement standalone comparison page, native tools/settings and live/replay controls.
- [x] Verify interactions and safety in the browser, run tests/build, record findings.
