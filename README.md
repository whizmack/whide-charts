# Perp Replay

Lokální historický backtesting Binance USD-M perpetual futures pro BTCUSDT,
ETHUSDT a SOLUSDT. První etapa: bar replay, kreslení a indikátory. Journal a
Freqtrade integrace přijdou v dalších etapách.

## Spuštění na Macu

Vyžaduje bezplatné Node.js 22.12+ (doporučeno 24) a [uv](https://docs.astral.sh/uv/).
Python 3.12 uv automaticky připraví. V adresáři projektu spusťte:

```sh
./scripts/start.sh
```

Otevřete [lokální aplikaci](http://127.0.0.1:8765). Ukončení serveru: Ctrl+C.
První instalace závislostí a stažení historie potřebují internet; již stažená
historie a sessions fungují offline. Launcher nevytváří cloudový účet, neposílá
objednávky a nepřipojuje živý stream.

Data této vývojové verze jsou v `.data/` vedle kódu, mimo Git. Umístění lze
změnit přes `PERP_REPLAY_DATA_DIR=/absolutni/cesta ./scripts/start.sh`.
Backend při samostatném spuštění bez této proměnné používá macOS Application
Support/PerpReplay. Stávající data se při změně cesty automaticky nestěhují.

## Použití

- Vyberte pár a timeframe 1m, 5m, 15m, 1h nebo 4h.
- Zadejte čas v **UTC** a potvrďte **Přejít**. Čas označuje hranici odhalených dat;
  například 10:25 dovoluje použít svíčky 10:00–10:24, nikoliv hotovou celou hodinu.
- Play/pause, rychlost 0.25×–20×, další svíčka; mezerník a Alt+šipka doprava,
  pokud není aktivní formulář. Přepnutí timeframe ani páru nemění čas.
- Kreslení je vlevo a také přes tlačítko **Kreslení** v pravém panelu: trendline, horizontála, Fibonacci, zóna/obdélník, text,
  měření a **Measurements → Long/Short Position**. Dvojklik otevře nastavení
  kresby; position tool umožňuje změnu směru a přetahování entry, SL a TP.
  Text potvrďte kliknutím mimo něj nebo Ctrl/Cmd+Enter.
- Indikátory: Volume, SMA, EMA, RSI, MACD a Bollinger Bands. Parametry se mění
  v dialogu Indikátory nebo přes nastavení přímo v grafu. EMA 20 a Volume jsou výchozí.
- Sessions se automaticky ukládají do SQLite, tlačítko Uložit session ukládá
  okamžitě. Obnova je vždy pozastavená, s indikátory, kresbami a viewportem.
  Export session uloží JSON. Při návratu před vznik kresby se tato kresba skryje.
- Správa dat stáhne chybějící archivy vybraného období pro všechny tři páry.
  Pokrytí a chyby jsou viditelné. Nejnovější dostupný archiv může být včerejší.

Minutové OHLCV neurčuje pořadí ticků uvnitř minuty. První verze nevyhodnocuje
SL/TP jako uskutečněný obchod a nemá vlastní simulační engine.

## Data a reprodukovatelnost

Minutová historie je ve verzovaných Parquet souborech. SQLite obsahuje katalog,
neměnné manifesty datasetů a poslední session. Session odkazuje na konkrétní
verzi; novější import jí tiše nemění data. Správa dat po dokončení importu
přepne aplikaci na aktuální dataset. Archiv musí projít SHA-256, kontrolou
timestampů, úplnosti, duplicit a OHLCV. Mezery zastaví projekci.

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

- Graf [Vela 0.8.4](https://github.com/LuxAlgo/Vela): Apache-2.0 a NOTICE,
  viditelná atribuce v grafu a patičce. Používáme nativní renderer i kresby;
  placené TradingView není potřeba. Pine addon nepoužíváme.
- Data [Binance Vision](https://data.binance.vision/) mají vlastní
  [podmínky datasetu](https://github.com/binance/binance-public-data/blob/master/TERMS_AND_CONDITIONS.md),
  včetně CC BY-NC-SA 4.0 a osobního výzkumného použití. MIT licence pomocných
  stahovacích skriptů není licence samotného datasetu.
- React: MIT, Radix Icons: MIT, Geist: OFL. Kompletní uzamčené závislosti jsou
  v package-lock.json a uv.lock; jejich licence zůstávají v instalovaných balíčcích.

[Architektura](docs/2026-10-14-architecture-proposal.md) ·
[Technický audit](docs/2026-10-14-technical-audit.md) ·
[Implementační plán](docs/superpowers/plans/2026-10-14-replay.md)

## Live / Replay

Přepínač v horní liště mění datový režim stejného grafu. **Live** přijímá
skutečné obchody Binance USD-M perpů pro BTCUSDT, ETHUSDT a SOLUSDT přes veřejný
`wss://fstream.binance.com/market/ws/<symbol>@kline_<interval>` (1m/5m/15m/1h/4h).
Nejde o mark price. Účet, klíč ani objednávky nejsou potřeba. Počáteční a opravné
načtení používá veřejné `GET https://fapi.binance.com/fapi/v1/klines` přes lokální
read-only proxy. Endpointy jsou ověřené podle aktuální oficiální dokumentace.

- Live má samostatné kresby a viewport; indikátory a nativní dialog nastavení
  grafu fungují v obou režimech. Vzhled při přepnutí přechází do druhého režimu.
- Replay se při odchodu pozastaví. Jeho pár, timeframe, čas, kresby a dataset
  zůstávají zachované; návrat nezmění replay clock na aktuální čas.
- Live data jsou pouze v paměti. Nezapisují se do Parquet, manifestů ani replay
  session v SQLite. Live nastavení a kresby se ukládají samostatně v localStorage
  daného prohlížeče; lze je exportovat přes Exportovat session.
- Při uzavření/chybě spojení nebo 15 sekundách bez platné aktualizace se data
  označí **Neaktuální**. Reconnect opakuje pokus s prodlevou 1–30 s; před návratem
  do Live stáhne a zkontroluje celý aktuální souvislý výřez 1 000 svíček. Delší
  výpadek posune toto okno; Live neslouží jako trvalý archiv. Mezery se nefabrikují.
- Dostupnost závisí na internetu a dostupnosti Binance v dané síti/regionu;
  chyby nejsou maskované statickými cenami. Replay funguje bez externí sítě.

Nastavení vzhledu (svíčky, pozadí, mřížka, osy, crosshair, barvy, timezone)
otevírá ozubené kolečko vpravo. Redesign mění okolní lišty, nikoli váš zoom.

Volitelné testy proti skutečné burze (15 streamů a řízený reconnect):

```sh
RUN_BINANCE_LIVE=1 npm test -- integration/live.test.ts
```
