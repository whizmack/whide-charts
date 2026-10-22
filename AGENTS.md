# AGENTS.md · Whide Charts

Instrukce pro všechny agenty pracující v tomto repozitáři. Platí pro celý strom;
případný vnořený `AGENTS.md` upřesňuje pravidla své složky. Mapa kódu byla
ověřena 2026-10-22. Při změně architektury aktualizuj i tento dokument.

## 1. Co stavíme a co chce uživatel

Perp Replay je lokální osobní nástroj pro historický replay a analýzu Binance
USD-M perpetual futures. Podporuje BTCUSDT, ETHUSDT a SOLUSDT, timeframes
1m, 5m, 15m, 1h a 4h. Má také skutečný veřejný Live feed. Neodesílá objednávky,
nepotřebuje účet ani API klíče a zatím nemá engine vyhodnocující obchody.

- Preferuj bezplatná a open-source řešení. Zachovej lokální provoz a offline
  replay po stažení historie. Cloud ani Docker nejsou provozní podmínkou.
  Desktopový wrapper zatím také ne; plánovaný shell je Electron, viz
  `docs/superpowers/plans/2026-10-20-desktop-electron.md`. Neimplementuj ho
  bez výslovného zadání.
- Graf OpenCharts na `/` je hlavní aplikace a pracovní plocha. Uživatel chce
  vizuální kompozici co nejbližší dodaným TradingView desktop screenshotům:
  horní lištu, kreslicí nástroje vlevo, utility vpravo, spodní lištu, tmavý graf,
  watchlist, nastavení, indikátory, kreslicí menu a Replay ovládání.
  Kanonické screenshoty jsou v `docs/reference/tradingview/README.md`; před
  vizuální změnou otevři příslušné obrázky z tohoto indexu.
  Nevymýšlej vizuální rozložení tam, kde screenshoty dávají referenci.
  Zachovej kompaktní TradingView-like
  terminál: tmavé ploché rozhraní, úzké lišty, jemné dělicí čáry, čitelná čísla,
  minimum animací. Nepřidávej marketingové sekce ani rozměrné dashboard karty.
- Zachovej uživatelův zoom, pan, vzhled, kresby a uložená nastavení. Screenshot
  je reference kompozice, nikoli příkaz změnit šířku svíček nebo browser zoom.
- **OpenCharts je hlavní rozhraní na `/`.** Uživatel výslovně zvolil cutover
  2026-10-22. Neimportuj Vela ani OpenAlgo nastavení/kresby; uživatel potvrdil,
  že nemá žádné, které chce zachovat. Historii trhu, její cestu, SQLite katalog,
  manifesty a Parquet soubory zachovej.
- Journal, ruční výsledky/P&L a následná Freqtrade integrace jsou další etapy,
  nikoli hotové funkce. Position tool je kresba setupu, ne uskutečněný obchod.
  Nepřidávej vlastní simulační engine, Pine ani trading gateway bez zadání.

## 2. Jak spolupracovat

- Odpovídej jazykem poslední zprávy uživatele. Technické termíny nech přirozeně
  anglicky. Piš přímo, stručně a konkrétně, bez výplňových úvodů.
- Produktové UI je nyní **anglicky**, i když část dokumentace a komunikace je
  česky. Nové popisky, hlášky a dialogy piš anglicky a drž místní terminologii.
- Akční zadání dotáhni v povoleném rozsahu včetně ověření. Čistý dotaz na názor
  není pokyn implementovat. U nejasností se ptej na rozhodnutí s dopadem na
  výsledek a pokračuj v nezávislé práci; běžné vratné kroky znovu neschvaluj.
- Před úpravami zjisti `git status --short` a relevantní diff. Rozpracované
  tracked i untracked soubory jsou existující práce, kterou musíš zachovat.
  Nepřepisuj je při instalaci, refaktoru ani úklidu.
- Drž rozsah zadání. Preferuj malé změny existujících vrstev před novými
  frameworky a abstrakcemi. Komentáře vysvětlují nejasné důvody a invarianty.
- Commituj jen na explicitní žádost. Bez souhlasu žádný force-push, hard reset,
  destruktivní cleanup ani změna datové identity. Při stagingu vybírej jen
  soubory úkolu. Nepřidávej co-author trailers.
- Při předání uveď co se změnilo, co jsi skutečně ověřil a konkrétní omezení.
  Starý verification report není důkaz dnešního stavu. Nezaměňuj build za
  browser test ani mock feed za připojení ke skutečné burze.

## 3. Nejdřív čti správné zdroje

Začni [README.md](README.md), příslušným kódem a testy. Pro OpenCharts pokračuj
[vendor README](third-party/opencharts/README.md) a
[workspace verification](docs/2026-10-15-workspace-verification.md).

Dokumentace zachycuje vývoj v čase. Aktuální zadání určuje požadované chování;
kód a čerstvé ověření ukazují, co je skutečně implementováno. Rozpor pojmenuj.
Neuváděj návrh jako hotovou funkci ani nevracej novější práci podle starého plánu.

| Zdroj | K čemu slouží |
| --- | --- |
| `docs/2026-10-14-architecture-proposal.md` | Základní replay/datové invarianty, schválený směr journalu a quant etapy. Část původního rozsahu už neplatí. |
| `docs/2026-10-14-technical-audit.md`, `docs/2026-10-14-chart-alternatives.md` | Historický průzkum knihoven, jejich omezení a původu. Verze a externí závěry nejsou automaticky aktuální. |
| `docs/*verification.md` | Pozorované výsledky, testovací scénáře a omezení konkrétní etapy. Čti nejnovější relevantní report. |
| `docs/reference/tradingview/README.md` | Uživatelem dodané TradingView desktop reference z 2026-10-22; index jednotlivých screenshotů a oblastí UI, kterým odpovídají. |
| `docs/superpowers/plans/` | Implementační plány replaye, Live, OpenCharts, multi-chart/indicator workspace a Electron desktop shellu. Nejsou automatickým zadáním další práce. |
| `docs/superpowers/plans/2026-10-20-desktop-electron.md` | Rozhodnutí: macOS `.app` jako Electron + Python sidecar, TV-like cíl, Tauri odloženo. Zatím jen záznam, ne implementace. |
| `docs/progress.md`, `docs/*.jpg` | Historie rozhodnutí a obrazové důkazy. Neúplný průběžný záznam, nikoli aktuální test runner. |

Původní návrh říká „žádný live stream“, „jeden graf“ a SQLite jako hlavní
persistence. Později přibyl Live a OpenCharts multi-chart workspace s
localStorage. Neruš je kvůli těmto historickým formulacím. Historické preview
reporty popisují dřívější route; současná hlavní aplikace je `/`.

## 4. Mapa projektu a tok dat

Stack: React 19 + striktní TypeScript + Vite 8, Python + FastAPI,
pandas/PyArrow, SQLite a Parquet. Přesné závislosti určuje `package-lock.json`
a `uv.lock`. OpenCharts je lokálně patchované 0.3.0 nad Lightweight Charts
4.2.3. Nepoužívej bez ověření API jiné major verze grafu.

| Místo | Odpovědnost |
| --- | --- |
| `backend/app.py` | App factory, loopback/Origin ochrany, API, import joby a statické `dist/`. `create_app(store)` pro testy, `application()` pro uvicorn. |
| `backend/replay.py` | Jediné kanonické skládání historických barů: `project_bars`, UTC buckety, `DataGap`. |
| `backend/storage.py` | Validace 1m OHLCV, immutable Parquet soubory, SQLite katalog a dataset manifesty. |
| `backend/importer.py` | Binance Vision USD-M archivy, měsíční/denní období, SHA-256 a úplnost importu. |
| `backend/sessions.py` | Zachovaný legacy Vela snapshot API GET/PUT `/api/session`; hlavní UI jej nepoužívá. |
| `web/replay.ts`, `web/api.ts` | Sdílené typy, Replay clock/request generations, API klient a loader historických barů. |
| `web/live.ts` | Sdílený skutečný `LiveFeed`, validace, REST hydratace, stale/reconnect/backfill a cleanup. |
| `web/compare/Preview.tsx`, `workspace.ts`, `bootstrap.ts` | Hlavní OpenCharts UI na `/`, workspace, validace konfigurace a bootstrap přes `/api/markets`. |
| `web/compare/ChartCell.tsx` | Data a kresby konkrétní cell, bezpečné zobrazování prefixu, scoped undo/redo. |
| `web/compare/StudyWorkspace.tsx`, `StudySettings.tsx`, `studies.ts`, `studyData.ts` | Price overlays, samostatné oscillator panes, jejich nastavení, matematika a geometrie. |
| `web/compare/chartBus.ts`, `livePool.ts` | Synchronizace pane/cell podle času a sdílení stejných live subscriptions. |
| `web/compare/adapter.ts`, `data.ts` | Omezený adapter, storage namespace, ořez bezpečného okna a renderer převod ms → s. |
| `web/compare/main.tsx`, `preview.css` | Jediný frontend entrypoint a OpenCharts styly včetně vendor stylesheetu. |
| `tests/` | Backend pytest: projekce, import/storage, API, sessions a offline izolace. |
| `web/**/*.test.ts` | Deterministické Vitest testy host aplikace a workspace. |
| `integration/live.test.ts` | Opt-in testy skutečné Binance, 15 kombinací symbol/timeframe a reconnect. |
| `third-party/opencharts/` | OpenCharts patch, licence/NOTICE, provenance a instalovaný `.tgz`. |
| `third-party/openalgo/`, `scripts/verify-openalgo.mjs` | Archivovaný OpenAlgo tarball, licence/provenance a historický browser scénář; nejsou součástí aplikace/build závislostí. |
| `scripts/start.sh` | macOS zsh launcher: dependencies, build, datová cesta a uvicorn. |
| `index.html`, `vite.config.ts` | Jediný frontend entrypoint OpenCharts na `/`; Vite proxy `/api` → `127.0.0.1:8765`. |
| `.data/` | Skutečná lokální historie, SQLite a pomocné import/verification soubory. Ignorováno Gitem, není disposable fixture. |
| `node_modules/`, `.venv/`, `dist/`, cache adresáře | Instalované/generované výstupy. Nejsou zdroj změn a nepatří do commitu. |

Historie: Binance ZIP + checksum → importer → validované 1m Parquet + SQLite
manifest → `/api/bars` → `project_bars(asOf)` → host → renderer/indikátory.
Live: veřejný WebSocket + REST přes `/api/live/klines` → `LiveFeed` → paměťové
okno → renderer. Live nikdy neprochází historickým importem.

API orientace: `GET /api/markets` vrací pokrytí a aktuální dataset version;
`GET /api/bars?symbol=…&timeframe=…&asOf=…&version=…&limit=…` bezpečnou projekci
(limit 1–2 000, frontend žádá 1 000). Import spouští `POST /api/imports`, stav
čte `GET /api/imports/{id}`. Import jobs jsou jen v paměti procesu, katalog
přežije restart. `/api/bars` odlišuje neznámou verzi/chybějící pár (404),
datovou mezeru (409), čas mimo pokrytí (416) a neplatný vstup (422).

## 5. Spuštění a instalace

Požadavky: Node.js 22.12+ (doporučeno 24), npm, uv a Python >=3.12.
Dosavadní prostředí používá Python 3.12; `pyproject.toml` ale nepřipíná minor
verzi. Interpreter/prostředí spravuje uv, ne systémový globální pip.
Používej npm a uv s existujícími lockfiles, nezaváděj druhý package manager.

```sh
# Instalace / synchronizace checkoutu
uv sync --frozen
npm ci --no-audit --no-fund

# Lokální sestavená aplikace
./scripts/start.sh
```

OpenCharts: `http://127.0.0.1:8765/`.
Launcher vždy buildí frontend, ale `npm ci` spustí jen při chybějícím
`node_modules/`. Po změně JS dependencies, lockfile nebo vendor tarballu
proveď instalaci explicitně. Již běžící server nezabíjej bez zjištění, komu patří.

Pro hot reload spusť ve dvou terminálech z kořene projektu:

```sh
PERP_REPLAY_DATA_DIR="$PWD/.data" uv run uvicorn backend.app:application --factory --host 127.0.0.1 --port 8765
```

```sh
npm run dev
```

Použij adresu vypsanou Vite; proxy očekává backend na 8765. FastAPI samo
servíruje `dist/`, nikoli živé TSX. Změny na adrese 8765 vyžadují nový build;
pokud `dist/` při vytváření app neexistovalo, také restart backendu.

## 6. Invarianty, které změna nesmí porušit

### Replay a čas

1. Kanonický `asOf` je UTC hranice známých dat v **epoch milisekundách**,
   s minutovou přesností. Není to open time poslední celé zobrazené svíčky.
2. Minuta smí do projekce jen při `time + 60_000 <= asOf`. Vyšší bary se skládají
   pouze z těchto minut. V 10:25 má 1h bar 10:00 jen minuty 10:00 až 10:24.
3. Timeframe ani symbol nemění `asOf`. Krok jde na další UTC hranici aktivního
   timeframe, i když už cursor leží na jeho hranici. Agregace se zarovnává na UTC.
4. Gapy/duplicity se nesmějí schovat agregací, interpolací, nulovým volume ani
   fallbackem na hotový vyšší bar. Nedostupná data znamenají explicitní stav;
   konec dostupné historie zastaví přehrávání.
5. Renderer, indikátory, legendy i drawing/object UI smějí dostat jen bezpečný
   prefix. Nativní replay knihovny nesmí převzít aplikační clock ani dotáhnout
  budoucí historii. Chart pagination zůstává uvnitř dodaného okna 1 000 barů.
6. Starý request nesmí přepsat novější selection ani po ignorovaném abortu.
   Zachovej generation guards. Při rewindu ihned skryj pozdější painted data,
   včetně cache nativního grafu; nesmí probliknout ani během loadingu.
7. Kresba vytvořená později se při návratu před její vznik skryje. Uživatelovo
   ruční skrytí zůstane zachované. Session se obnovuje pozastavená.
8. Doména/backend používají ms; OpenCharts/Lightweight Charts používají
   epoch **sekundy**. Převáděj pouze na renderer hranici, včetně indikátorů,
   crosshairu a viewport sync. Nezaměň ms API bounds za renderer timestamps.

### Data, persistence a Live izolace

- Základ je Binance **USD-M perpetual trade-price 1m OHLCV**, nikoli spot,
  mark price nebo ticková trajektorie. OpenCharts host symboly jsou BTCUSDT,
  ETHUSDT a SOLUSDT bez suffixu.
- Historické soubory `.data/market/<SYMBOL>/1m/<period>-<checksum>.parquet`
  se publikují atomicky. Dataset je fingerprint uloženého manifestu.
  Nový import nesmí přepsat data staré session ani potichu nahradit neznámou verzi.
- SQLite `app.sqlite3` obsahuje `imports`, `datasets`, `sessions` a používá WAL.
  Nemazat starší Parquet/manifesty jen proto, že nejsou v nejnovějším katalogu.
  U změny schématu navrhni migraci a obnovu, ne smazání databáze.
- Launcher používá projektovou `.data/`; samostatný backend bez env používá
  `~/Library/Application Support/PerpReplay`. `PERP_REPLAY_DATA_DIR` mění místo,
  nikoli přesouvá data. Před změnou cesty vysvětli dopad na historii a sessions.
- Pro diagnostiku používej read-only SQLite. Pro testy `tmp_path` / dočasný
  Store, nikoli uživatelovu DB. Záloha běžící WAL DB vyžaduje konzistentní
  SQLite backup/snapshot, nikoli pouhé kopírování hlavního souboru.
- Backend legacy `/api/session` a tabulky mohou zůstat kvůli kompatibilitě,
  ale hlavní OpenCharts UI je nesmí číst ani zapisovat. OpenCharts dostává
  dataset version z `/api/markets`.
- OpenCharts workspace stav má dosavadní prefix `opencharts-preview:`; nativní
  appearance preferences mají vlastní vendor storage. Stav UI, kresby a
  viewporty se ukládají v localStorage daného originu. Live market bars jsou
  pouze v paměti.
- localStorage patří originu/prohlížeči. Vite port, 8765, `localhost` a
  `127.0.0.1` nemusí sdílet nastavení. Při diagnostice persistence ověř origin.
  „Export backup“ OpenCharts je snapshot konfigurace/kreseb, ne kompletní záloha
  Parquet, SQLite, viewportů a všech nativních preferences. Import/restore UI
  zatím není implementované; JSON export neoznačuj za ověřený restore workflow.
- Live musí používat skutečný veřejný USD-M feed. Zachovej validaci,
  15s stale detekci, reconnect s prodlevou 1–30 s a kontrolovanou REST obnovu
  celého souvislého okna. Výpadek nezakrývej demo cenami nebo falešnými quotes.
- Nepřidávej Live bary do Parquet/manifestů. Přechod režimů pozastaví Replay
  a zachová jeho čas a výběry; drawings/viewports zůstávají oddělené.
- Backend zůstává na loopbacku s omezenými hosts, Origin kontrolou mutací
  a pevně vymezenou read-only live proxy. Neotevírej jej do LAN/cloud bez zadání.

### OpenCharts workspace a interakce

- Čtyři stabilní cell konfigurace se zachovají i po zmenšení layoutu. Toolbar
  a keyboard commands cílí na aktivní cell. Skryté cells odpojí Live subscriptions;
  stejné viditelné symbol/timeframe kombinace sdílejí `LiveFeed` přes `livePool`.
- Všechny viditelné replay cells sdílejí `asOf`; krok určuje timeframe aktivní
  cell. Páry a timeframes jsou nezávislé. Sync time/scroll a crosshair je volitelný.
- Mezi různými timeframes mapuj timestamps, nikoli stejné logical indexy.
  Crosshair sdílí čas, ale cenu bere z cílového instrumentu; u mezery marker smaž.
  Subpanes stejné cell musí mít stejné timestamps i přes indicator warmup.
- RSI/MACD/ATR/Stochastic mají samostatné panes; EMA/SMA/Bollinger/VWAP patří
  na price. Inputs, styling, pane geometry a drawings jsou per cell; nativní
  appearance je nyní **společná pro workspace**. Neslibuj per-cell appearance.
- VWAP resetuje v UTC dni pouze v načteném okně. Zachovej upozornění
  `UTC · loaded bars`, protože první den nemusí být kompletní.
- Zachovej scoped undo/redo, persistent weak/strong magnet a dočasný Cmd/Ctrl
  snap. Uvolnění klávesy, blur, opuštění pointeru a disposal nesmí zanechat
  zaseknutý snap ani posluchače aktivní na cizí cell.
- Menu a dialogy musí být dostupné i v pravé/dolní cell. Existující vendor
  opravy řeší clipping pomocí portals a nativního modal dialogu. Vysoký `z-index`
  uvnitř clipped cell sám problém neřeší. Skrytá time axis může hlásit šířku 0;
  neodstraňuj drawing hit-test fallback bez odpovídajícího ověření.

## 7. Změny vendor knihovny

OpenCharts se instaluje z `third-party/opencharts/dylanpersonguy-opencharts-0.3.0.tgz`,
nikoli z běžného registry balíčku. Zdrojový klon upstream není součástí tohoto
repozitáře. Původ: revision `d3fc63cc002e6e651801be6e952e7514e58fa5fe` +
`controlled-chart.patch`. Host používá jeden `OpenChartsProvider`, protože
upstream adapter registry je globální. Nespouštěj jeho demo/Terminal/trading runtime.

Pokud oprava patří do vendoru:

1. V odděleném dočasném klonu checkoutni připnutou revision a aplikuj patch.
2. Přidej/aktualizuj regresní test upstream komponenty a ověř jej tam.
3. Podle vendor README spusť `npm ci --ignore-scripts`, `npm run build:lib`
   a `npm pack --ignore-scripts`.
4. Aktualizuj patch, `.tgz` a provenance README společně. Zkontroluj, že patch
   obsahuje i nové testy a skutečně reprodukuje zabalený zdroj.
5. Obnov host lockfile integrity pro nový artefakt a ověř čistým `npm ci`,
   host testy a buildem. Stejné jméno/verze tarballu negarantují stejný obsah
   ani automatický refresh již instalovaného `node_modules`.

Úprava pouze v `node_modules` nebo `dist` není doručená oprava. Host `npm test`
**nespouští** regresní testy uložené uvnitř vendor patche.

Zachovej licence, NOTICE a viditelné atribuce OpenCharts/TradingView. Archivní
Vela licence ponech v repozitáři; Vela frontend není součástí aplikace.
Dokumentovaný původ a podmínky Binance datasetu jsou oddělené od licence
stahovacích skriptů. Novou distribuci nebo změnu použití dat posuzuj podle
aktuálních primárních podmínek, nikoli historického auditu.

Archivní OpenAlgo Charts 2.6.4 artefakty a provenance zůstávají v `third-party/`
kvůli licenční historii; balíček ani preview nejsou součástí hlavní aplikace.

## 8. Postup změny a ověření

1. Zjisti aktuální stav workspace a přečti zdroj/testy dotčené vrstvy. Urči,
   zda jde o hlavní OpenCharts `/` nebo společná data/API.
2. Popiš požadovaný výsledek a hranice změny. Větší zásah rozděl na konkrétní
   kroky. Vyjasni migrace a datové dopady před jejich provedením.
3. U chyby nejdřív reprodukuj příčinu. Změny replay, persistence, feedu a vendor
   workaroundů kryj testem skutečného chování. U čistě dokumentační či drobné
   kosmetické změny nevyráběj test, který jen opisuje implementaci.
4. Implementuj malý souvislý celek a spusť odpovídající kontroly. Neopravuj
   nesouvisející problémy jen proto, že se objevily při průzkumu.
5. Zkontroluj diff a zachování cizí práce. Pokud se mění používání, limity,
   persistence nebo architektura, aktualizuj README a relevantní dokumentaci.
   U větších UI změn ulož konkrétní verification evidence do `docs/`.

Základní kontroly pro změnu kódu:

```sh
uv run pytest -q
npm test
npm run typecheck
npm run build
```

`build` obsahuje také `tsc --noEmit`; samostatný typecheck je rychlá průběžná
kontrola. Projekt nemá vlastní `lint` script. Historický OpenAlgo Playwright
runner `scripts/verify-openalgo.mjs` není součástí aplikace ani `npm test`.
Nevymýšlej neexistující příkazy. Pro čistou dokumentaci stačí kontrola obsahu,
odkazů a diffu; kompletní suite opakuj, pokud je třeba ověřit uváděné příkazy.

| Dotčená oblast | Co zvlášť ověřit |
| --- | --- |
| Projekce/import/storage/API | `tests/`: partial 10:25, všech 5 TF, roundtrip 5m → 1h → 5m, sentinel budoucích cen/volume, gaps/duplicity, checksum, dataset pin a offline provoz. |
| Async UI a ukládání | `web/replay.test.ts` a `web/compare/*.test.ts`: pozdní odpovědi, bezpečný cutoff, layout persistence, drawings/viewport a sync. Legacy backend session má `tests/test_sessions.py`. |
| Live | `web/live.test.ts`, backend proxy testy: buffering při hydrataci, stale, timeout, reconnect/backfill, dispose a izolace od replaye. |
| OpenCharts | `web/compare/*.test.ts`: časové jednotky, bezpečné okno, drawings, indikátory, layout persistence, sync podle timestampů. U vendor změny také testy v upstream klonu. |
| Vizuální/interakční změna | Skutečný browser na `/`: render, pan/zoom, settings, drawing interactions, klávesnice/focus, modal/menu clipping, reload a konzole. |

Pro workspace navíc zkus 1/2/4 charts, maximize/restore, různé páry/TF,
společný cutoff, rewind, přepnutí Live/Replay, splitters/pane resize a magnet
release/blur. Layout ověř na laptopu kolem 1280×720 a úzkém panelu kolem 390px;
v malých cells musí zůstat dosažitelné ovládání a maximalizace. Nevydávej unit
test mockovaného grafu za důkaz skutečných canvas interakcí nebo přístupnosti.

Skutečné burzovní testy jsou volitelné a potřebují síť:

```sh
RUN_BINANCE_LIVE=1 npm test -- integration/live.test.ts
```

Běžné `npm test` tyto dva testy přeskočí. Spouštěj je pro změnu exchange
integrace nebo požadované end-to-end ověření Live, ne jako podmínku offline
práce. Výpadek burzy hlásit odděleně od deterministické regrese. Nenahrávej
testovací kresby/session do uživatelova stavu bez obnovy původního snapshotu.
