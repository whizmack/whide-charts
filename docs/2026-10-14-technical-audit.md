# Technické ověření — 14. října 2026

Tento dokument zaznamenává ověření kandidátů. Nejde o potvrzení hotové aplikace.
Pracovní adresář projektu byl prázdný a neměl Git. Kandidáti, závislosti a vzorky
dat byly staženy do `/private/tmp/backtesting-audit`, mimo budoucí aplikaci.

## Ověřené revize a licence

| Projekt | Ověřená revize | Licence / poznámka |
| --- | --- | --- |
| [Vela](https://github.com/LuxAlgo/Vela) | `850fa1f431e2065e9b0074c4b0555a48a2999eaf`, package 0.8.4 | Apache-2.0; NOTICE požaduje viditelné označení Vela na obrazovce s grafem |
| [KLineChart Pro fork](https://github.com/SiMahfud/klinechartpro) | `2e73227320088714279e736c6cb6df7abfde5f52`, package 1.2.1 | Apache-2.0 |
| [Candlekit](https://github.com/rohanbeingsocial/candlekit-charts) | `29891a41fb534136bcb2078b84b791bcc55c1f41`, package 0.2.0 | MIT; Lightweight Charts má vlastní Apache-2.0 a atribuci |
| [Freqtrade](https://github.com/freqtrade/freqtrade) | zdroj `183351d57b26b006659bc9ed390a046bd47809fc`; lokálně spuštěná vydaná verze 2026.9 z PyPI | GPLv3; pro integraci použít samostatný proces, zachovat licence a zdroje při případné distribuci |
| [Binance public data](https://github.com/binance/binance-public-data) | `f446ce3812bd4e5521f21faecd4ae3c6460e49fc` | Skripty MIT, dataset má samostatné podmínky |

Pine addon Vela je oddělený a AGPL-3.0. Pro tento software není potřebný.
REA není nutné pro architekturu ani ověření replaye a nebylo instalováno.

## Vela

Lokálně proběhlo `npm ci --ignore-scripts`, následně:

```sh
npm test -- test/replay.test.ts test/workspace-replay.test.ts test/binance-provider.test.ts test/drawings-measure.test.ts test/drawings-interaction.test.ts test/workspace-persist.test.ts test/state-persistence.test.ts
npm run typecheck
npm run build
```

Výsledek: 7 testovacích souborů, 161 testů prošlo; typecheck i build prošly.
Lokální workspace playground na portu 5190 se vykreslil ve skutečném prohlížeči.
To potvrzuje základní renderování, nikoliv kompletní ergonomii a všechny drag interakce.
Playground ve velmi úzkém panelu prohlížeče opakovaně logoval
`ResizeObserver loop completed with undelivered notifications`. Graf se zobrazil,
ale chování resize musí integrační zkouška prověřit na cílové velikosti okna
a v našem jedno-grafovém layoutu. Příčina tohoto problému zatím nebyla izolována.

Ve zdroji je PositionTool s entry, stopem, targetem, R:R, procenty a velikostí
pozice; kresby se serializují. Binance provider rozlišuje perpetual suffixem `.P`.
Samotný `BTCUSDT` u tohoto provideru znamená spot, nikoliv USD-M perpetual.

### Doplňkový test odhalil ztrátu času

Nativní replay bere `from` jako **open time poslední celé odhalené svíčky**.
Pro přenos na jiný timeframe odvodí čas jako `lastBar.time + timeframe`.
Při přenosu na vyšší timeframe schová ještě neuzavřený bar, což brání úniku
jeho konečného OHLC, ale při dalším přepnutí odvozuje čas z posledního zobrazeného
vyššího baru. Ztrácí původní přesný čas.

Reprodukce s datovým feedem, který skutečně vrací 5m a 1h série:

1. Replay 5m, poslední odhalený bar otevřen v `2023-01-01T10:20:00Z`.
2. Skutečný čas známých dat je `10:25:00Z`.
3. Přepnutí na 1h zobrazí jako poslední bar otevřený v `09:00:00Z`.
4. Přepnutí zpět na 5m zobrazí jako poslední bar `09:55:00Z`.
5. Aserce zachování původního cursorTime selhala: očekáváno `1672568400000`,
   skutečnost `1672566900000`.

Původních 161 zelených testů proto není dostatečný důkaz pro náš požadavek.
Vzorek v upstream timeframe testech vrací stejnou hodinovou sérii i po změně
timeframe. Naše aplikace musí vlastnit nezávislé `asOf` a bezpečně tvořit neuzavřený
vyšší bar z dokončených nižších barů. Nejde o nový simulační obchodní engine.

Dále: změna symbolu nativní replay ukončuje; dokončení replaye může vracet plnou
historii. Vlastní kontrola musí řešit obojí. Nativní persistence workspace
nenahrazuje ukládání aplikačního `asOf` a verze datasetu.

## Alternativní grafy

KLineChart Pro: `npm ci --ignore-scripts` prošlo, `npm run build` selhalo se třemi
TS2307 chybami kolem `@simahfud/pine-to-kline` a relativního `pine-to-kline/src`.
Požadovaný adresář není v klonu. Replay ve zdroji pracuje s indexem pole a slicem;
přenos společného času by bylo nutné doplnit. Pro první etapu jej nedoporučuji.

Candlekit: 16 upstream replay testů, typecheck i build prošly. Umí tvořit vyšší
bar z minutových driverů. V `getBarsUpToCursor` však vrací původní vyšší bary,
pokud driver chybí nebo `foldPartial` nedokáže sestavit partial bar. To je podle
kontroly zdroje cesta k odhalení konečného OHLC. Tento konkrétní fallback nebyl
ověřen samostatným runtime testem. V zabudovaném seznamu nástrojů nejsou position
tool ani textové anotace; integrace by vyžadovala více vlastního kreslicího kódu.

## Historická data

Staženy USD-M monthly klines pro leden 2023 pro BTCUSDT, ETHUSDT a SOLUSDT,
v intervalech 1m, 5m, 15m a 1h. SHA-256 odpovídá publikovaným `.CHECKSUM`.

| Interval | Počet svíček na pár | Ověření |
| --- | ---: | --- |
| 1m | 44 640 | Bez duplicit, přesný krok 60 000 ms, bez mezer |
| 5m | 8 928 | OHLCV přesně odpovídá agregaci 1m |
| 15m | 2 976 | OHLCV přesně odpovídá agregaci 1m |
| 1h | 744 | OHLCV přesně odpovídá agregaci 1m |

Agregace byla porovnána pomocí Decimal, včetně volume; všech 9 kombinací páru
a vyššího timeframe má nula rozdílů. Futures timestamps ve vzorku jsou ms.
Import musí rozlišovat header a datové řádky; tyto archivy header obsahují.

HEAD požadavky na lednové 2023 fundingRate a 1h markPriceKlines archivy pro
všechny tři páry vrátily HTTP 200. Jejich obsah, úplnost a převod do Freqtrade
zatím ověřeny nebyly. Kompletní období 2023–2026 také ještě staženo ani ověřeno
nebylo; dostupnost jednoho měsíce nelze zaměnit za úplnost historie.

### Podmínky dat

[Binance Vision Dataset Terms](https://github.com/binance/binance-public-data/blob/master/TERMS_AND_CONDITIONS.md)
mají datum 26. srpna 2026. Uvádějí bezplatný přístup, CC BY-NC-SA 4.0 a osobní
neprodukční výzkumný backtesting mezi povolenými použitími. Nejde o neomezenou
MIT licenci datasetu. Návrh předpokládá lokální osobní výzkum, data nepřibaluje
do distribuovaného instalátoru a uchovává původ i podmínky importu.
Budoucí komerční použití by vyžadovalo nové posouzení podmínek.

## Freqtrade

Izolovaná instalace přes uv: Python 3.12.13, Freqtrade 2026.9, CCXT 4.5.88,
na macOS arm64. `freqtrade --version` i `freqtrade backtesting --help` proběhly.
Instalace nepotřebovala placenou službu ani obchodní účet.

Bez API klíče prošlo i načtení aktuálních Binance futures metadat pomocí
`freqtrade list-pairs --exchange binance --trading-mode futures --quote USDT --base BTC ETH SOL --print-json`
s dočasným `--userdir`. Výsledek: `BTC/USDT:USDT`, `ETH/USDT:USDT`,
`SOL/USDT:USDT`. Z tohoto Macu byl tedy veřejný přístup potřebný pro metadata
enginu funkční; to stále není důkaz správnosti samotné simulace.

Aktuální kód obsahuje futures long/short, načtení funding a mark price dat
a jejich použití při výpočtu funding fees. CLI podporuje 1m detail timeframe,
explicitní fees a export obchodů. Dokumentace uvádí omezení intrabar simulace,
například plnění bez slippage a pořadí SL/ROI. Liquidation fee není kompletně
modelováno. Tyto předpoklady budou součástí popisu každého běhu.

Referenční futures backtest s kontrolou konkrétních long/short obchodů a funding
zatím neproběhl. Quant engine je použitelný kandidát, nikoli již validovaná
integrace. Výběr finálně uzavře quant etapa po numerickém ověření.

Zdroje: [leverage](https://www.freqtrade.io/en/stable/leverage/),
[backtesting](https://www.freqtrade.io/en/stable/backtesting/),
[data downloading](https://www.freqtrade.io/en/stable/data-download/).
