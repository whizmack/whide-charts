# Whide Charts

Lokální charting a historický replay Binance USD-M perpetual futures pro
BTCUSDT, ETHUSDT a SOLUSDT. OpenCharts je hlavní aplikace. Journal, ruční
vyhodnocení obchodů a Freqtrade integrace jsou další etapy.

## Spuštění na Macu

Vyžaduje bezplatné Node.js 22.12+ (doporučeno 24) a [uv](https://docs.astral.sh/uv/).
Python 3.12 uv automaticky připraví. V adresáři projektu spusťte:

```sh
./scripts/start.sh
```

Otevřete [lokální aplikaci](http://127.0.0.1:8765). Ukončení serveru: Ctrl+C.
Historický replay funguje offline po stažení historie. Live používá veřejný
Binance feed a potřebuje internet. Aplikace nevyžaduje účet ani API klíče a
neodesílá objednávky.

### Desktop app

Na Apple Silicon Macu lze vytvořit běžnou `Whide Charts.app`, kterou otevřete
z Finderu nebo připnete do Docku:

```sh
uv sync --frozen
npm ci --no-audit --no-fund
npm run desktop:build
```

Build vytvoří arm64 Electron appku v `~/Applications/Whide Charts.app`. Otevřete
ji z Applications a v Docku zvolte **Options → Keep in Dock**. Ukončení přes
**Whide Charts → Quit Whide Charts** nebo `⌘Q` zavře backend spuštěný appkou.
Electron používá současný OpenCharts root `/` a stejné FastAPI API; běžný
prohlížeč a `scripts/start.sh` zůstávají dostupné.

Při prvním buildu appka použije existující projektové `.data/` jako svou datovou
cestu, pokud je přítomná. Nic se nekopíruje ani nepřesouvá. Jestli projektová
složka později nebude dostupná, backend použije
`~/Library/Application Support/PerpReplay`. Desktopová localStorage je oddělená
od prohlížeče a Vite originu. Lokální app je ad-hoc podepsaná pro tento Mac;
instalační balíček a notarizace pro distribuci na jiné Macy zatím nejsou součástí.

Data této vývojové verze jsou v `.data/` vedle kódu, mimo Git. Umístění lze
změnit přes `PERP_REPLAY_DATA_DIR=/absolutni/cesta ./scripts/start.sh`.
Backend při samostatném spuštění bez této proměnné používá macOS Application
Support/PerpReplay. Stávající data se při změně cesty automaticky nestěhují.

## Použití

- Vyberte pár BTCUSDT, ETHUSDT nebo SOLUSDT a timeframe 1m, 5m, 15m, 1h nebo 4h.
- V režimu Replay nastavte čas v **UTC**. Je to hranice známých dat: například
  10:25 dovoluje použít minuty 10:00–10:24. Transport nabízí play/pause, další
  svíčku a rychlost 0.5×–10×. Všechny viditelné grafy sdílí Replay cutoff.
- Live zobrazuje skutečné veřejné Binance USD-M svíčky. Při výpadku ukáže stav
  spojení nebo zastaralých dat; ceny nenahrazuje demo feedem.
- Rozložení podporuje jeden až čtyři grafy, maximalizaci, nastavitelný split,
  volitelný watchlist a synchronizaci času nebo crosshairu.
- Indikátory: SMA, EMA, Bollinger Bands, VWAP, RSI, MACD, ATR a Stochastic.
  Oscilátory mají oddělené panely; vstupy, zdroje a styl lze upravit.
- Kresby zahrnují čáry, Fibonacci, tvary, text a position nástroje. Position
  tool popisuje plánovaný setup; neznamená vyplněný obchod ani výpočet P&L.
- Rozložení, výběr párů/timeframů, indikátory, Replay čas, viewporty a kresby se
  ukládají do localStorage prohlížeče pod prefixem `opencharts-preview:`.
  Vzhled grafu má samostatné nativní preference OpenCharts. Jiný origin nebo
  profil prohlížeče má vlastní úložiště.

## Data a reprodukovatelnost

Minutová historie je ve verzovaných Parquet souborech. SQLite obsahuje katalog
a neměnné manifesty datasetů. OpenCharts načte aktuální dataset version přes
`/api/markets`; grafová nastavení a kresby neukládá do SQLite session. Backend
import API a Vela session endpoint zůstávají zachovány, ale hlavní UI je
nepoužívá. Binance archiv musí projít SHA-256, kontrolou timestampů, úplnosti,
duplicit a OHLCV. Mezery zastaví projekci.

V tomto workspace byla ověřena celá historie 2023-01-01 až 2026-10-13:
1 990 080 minutových svíček na každý pár. Počet a rozsah aktuální instalace
ukazuje Správa dat; data nejsou součástí Git repozitáře.

## Ověření a vývoj

```sh
uv run pytest -q
npm test
npm run typecheck
npm run build
```

Pro oddělený vývoj spusťte backend s `PERP_REPLAY_DATA_DIR="$PWD/.data"` a
`uv run uvicorn backend.app:application --factory --host 127.0.0.1 --port 8765`;
`npm run dev` má proxy `/api` na tento backend.

## Licence a původ

- Graf [OpenCharts 0.3.0](https://github.com/dylanpersonguy/OpenCharts): MIT;
  používá [Lightweight Charts](https://github.com/tradingview/lightweight-charts)
  pod Apache-2.0 s požadovanou atribucí. OpenCharts je samostatný projekt;
  TradingView placené služby ani Pine addon nepoužíváme.
- Data [Binance Vision](https://data.binance.vision/) mají vlastní
  [podmínky datasetu](https://github.com/binance/binance-public-data/blob/master/TERMS_AND_CONDITIONS.md),
  včetně CC BY-NC-SA 4.0 a osobního výzkumného použití. MIT licence pomocných
  stahovacích skriptů není licence samotného datasetu.
- React: MIT, Radix Icons: MIT, Geist: OFL. Kompletní uzamčené závislosti jsou
  v package-lock.json a uv.lock; jejich licence zůstávají v instalovaných balíčcích.

[Architektura](docs/2026-10-14-architecture-proposal.md) ·
[Technický audit](docs/2026-10-14-technical-audit.md) ·
[Implementační plán](docs/superpowers/plans/2026-10-14-replay.md) ·
[TradingView UI reference screenshots](docs/reference/tradingview/README.md)

## Live / Replay

The main chart toolbar switches between historical Replay and a real public
Binance USD-M Live feed. Live uses Binance WebSocket klines plus REST hydration
and recovery through the local read-only API. It is trade-price data, not mark
price. Live bars stay in memory and never enter Parquet or Replay history.

Replay uses the local, versioned 1m dataset and one UTC cutoff shared by visible
charts. It cannot reveal bars after that cutoff. Leaving Replay pauses it and
keeps its selection and time; changing symbol or timeframe does not move the
shared cutoff. Replay remains usable offline after history has been downloaded.

Live needs internet access. The UI shows stale/connection states during a feed
outage and never substitutes demo prices. Optional integration checks against
the live exchange are:

```sh
RUN_BINANCE_LIVE=1 npm test -- integration/live.test.ts
```

## OpenCharts workspace

OpenCharts is served from `/` and uses the same shared FastAPI bars and Live
services. Its current chart workspace supports one, two, three or four charts,
maximize/restore, resizable splitters, and a watchlist. Pair and timeframe are
per chart; visible Replay charts share a cutoff. Optional time/scroll and
crosshair sync map by timestamps.

RSI, MACD, ATR and Stochastic use separate resizable panes; EMA, SMA, Bollinger
Bands and VWAP render over price. Study settings use Inputs, Style and Visibility
tabs; line appearance, price-scale labels, status-line values and supported
timeframe visibility are editable per study.
VWAP is calculated over loaded bars and labels its UTC reset boundary. Drawings
and viewport controls include weak/strong magnet, temporary Cmd/Ctrl snap,
stay-in-drawing mode and scoped undo/redo. Native chart appearance preferences
are shared across the workspace. Chart Settings now has Symbol, Status line,
Scales and lines, and Canvas sections, with live chart preview, Cancel/Escape
rollback, and a single persistent write on OK. Named appearance templates live
in the existing scoped chart preference store and exclude Replay state, chart
layout and drawings. Right-click price/time axis menus expose supported scale
modes, side placement, price-scale inversion, label/line visibility, timezone,
and reset behavior. Chart Settings also includes TradingView's **No overlapping
labels** option, applied to both price scales and stored in named templates.

Workspace configuration, Replay/Live selections, viewports and drawings persist
locally under `opencharts-preview:`. **Export backup** downloads a JSON snapshot
of workspace settings and drawings; it is not a backup of the market database
or a verified restore workflow. Vela and OpenAlgo chart settings are not
migrated. Historical browser verification is recorded in
[`docs/2026-10-15-workspace-verification.md`](docs/2026-10-15-workspace-verification.md).
