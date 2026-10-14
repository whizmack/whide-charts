# OpenCharts comparison build

Upstream: https://github.com/dylanpersonguy/OpenCharts
Pinned revision: d3fc63cc002e6e651801be6e952e7514e58fa5fe (package 0.3.0).
MIT; underlying Lightweight Charts Apache-2.0 with its own attribution.

The local patch exports the controlled chart panel, settings and related types, hides the live countdown during replay, offsets the legend clear of the tool rail, and adds optional controls to hide the unused calendar and display the actual last traded close without invented bid/ask quotes.
The prototype does not mount the upstream terminal, demo feed or trading gateway.

Rebuild: clone the pinned revision; apply controlled-chart.patch; run
`npm ci --ignore-scripts`, `npm run build:lib`, then `npm pack --ignore-scripts`.
Copy the resulting tarball into this folder. Install with npm ci from the host lockfile.
