# OpenAlgo Charts vendor package

The application consumes the locally packed `openalgo-charts` **2.6.4** package
from `openalgo-charts-2.6.4.tgz`; it does not load the upstream demo or broker
runtime. The package is Apache-2.0. Its upstream `LICENSE` and `NOTICE` are
kept beside the archive.

Source: [marketcalls/openalgo-charts](https://github.com/marketcalls/openalgo-charts),
revision `e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33`. The archive was packed
from that clean pinned checkout without source changes. SHA-256:
`2e98abe4ef43ef9ba74fc973c05c61c7025e660af53b77f97057c95e4982ec06`.

The upstream build writes JavaScript bundles and declaration files, but on
macOS its CLI process can stay alive after writing them. `build.mjs` runs the
same upstream Rollup configuration, awaits every write and bundle close, and
exits successfully only after all outputs are complete. To reproduce from a
clean checkout with its dependencies installed:

```sh
node third-party/openalgo/build.mjs /absolute/path/to/openalgo-charts
cd /absolute/path/to/openalgo-charts
npm pack --ignore-scripts
```

The preview integrates the widget API directly. Its feed/replay controller is
not enabled; Perp Replay supplies projected bars or its existing LiveFeed.
