# Schválená architektura

Stav: schváleno uživatelem 14. října 2026 včetně doplnění timeframe a indikátorů.
Výsledky průzkumu jsou v [technickém auditu](2026-10-14-technical-audit.md).

## Doporučená varianta

Lokální webová aplikace: React + TypeScript + Vite, graf Vela, backend
Python 3.12 + FastAPI. Backend servíruje i sestavený frontend, takže uživatel
spustí aplikaci jedním lokálním launcherem a používá jednu adresu v prohlížeči.
Žádný cloud, účet ani předplatné. Po importu funguje replay a journal offline.
Backend naslouchá pouze na loopbacku; aplikace nepovoluje objednávky.

Vela obstará renderer, zoom, pan, crosshair, osy a existující kreslicí nástroje.
React obstará aplikační ovládání, journal a výsledky. Jediná instance grafu
zůstává ve workspace při přepínání modulů. Na začátku jeden graf, bez gridů,
plugin frameworku nebo obecného event busu.

Freqtrade bude ve třetí etapě samostatný, připnutý lokální Python proces
v izolovaném prostředí. FastAPI jej spouští přes seznam argumentů, sleduje
stav a importuje oficiální exporty. UI má frontu běhů, zrušení a čitelné chyby.
Verze enginu a závislostí se ukládá; aktualizace není automatická uprostřed běhu.

## Alternativy

| Varianta | Výhoda | Cena / nevýhoda |
| --- | --- | --- |
| Lokální web + FastAPI — doporučeno | Málo vrstev, Python přirozeně obslouží data i engine | Běží v prohlížeči, není ihned samostatná .app |
| Electron + React + Python | Samostatné Mac okno, snadný přístup k souborům | Větší instalace, distribuce dvou runtime a procesů |
| Tauri + React + Python | Menší desktopový shell | Rust a balení Python sidecaru přidávají práci první etapě |

Desktopový wrapper lze doplnit po funkčním replayi, pokud bude samostatná .app
žádoucí. Základní aplikace nebude potřebovat Docker.

**Doplnění 20. 10. 2026:** samostatná macOS `.app` je chtěná. Shell bude
**Electron** (stejný kontejner jako TradingView Desktop), React UI a Python
sidecar beze změny HTTP `/api`. Tauri odloženo kvůli WKWebView u canvas grafů.
Rozhodnutí a rozsah: `docs/superpowers/plans/2026-10-20-desktop-electron.md`.
Implementace až na výslovné zadání.

## Společná data

- Kanonický market identifikátor obsahuje burzu, USD-M perpetual a symbol.
  Adaptér mapuje `BTCUSDT` na Vela `BTCUSDT.P` a Freqtrade `BTC/USDT:USDT`.
- Základ OHLCV je 1m Binance USD-M trade-price série, UTC epoch ms.
  Timeframes 1m, 5m, 15m, 1h a 4h jsou odvozené UTC agregace; žádné nahrazování spot daty.
- Minutový základ je potřeba pro pravdivý partial bar vyššího timeframe.
  Nezjišťuje pořadí ticků uvnitř minuty a nevymýšlí cenovou trajektorii.
- Archivy se stahují po měsících, nedávné dny po dnech. Import kontroluje
  checksum, typ trhu, timestamp jednotky, OHLC konzistenci, duplicity a mezery.
  Chybějící archiv se ukáže jako nedostupný, nikoli jako prázdné úspěšné stažení.
- Replay čte pouze potřebná časová okna. Prefetch může mít budoucí data ve
  vrstvě úložiště, ale grafu, indikátorům a overlayům je nepředává.
- Funding a mark price jsou samostatné datové typy. Pro quant se nesmějí
  zaměnit za ceny zobrazovaných obchodních svíček.

## Uložení a záloha

Jedna uživatelská datová složka, standardně v macOS Application Support,
s možností zvolit jiný disk. Nepoužívat localStorage jako hlavní databázi.

| Obsah | Uložení |
| --- | --- |
| Minutová OHLCV, odvozená OHLCV, funding, mark | Parquet rozdělený podle trhu, typu dat a měsíce |
| Dostupnost, kontrolní součty, verze datasetů | SQLite katalog |
| Sessions, drawings, journal, tagy, index běhů | SQLite s transakcemi a verzovanými migracemi |
| Screenshoty | PNG soubory s odkazy z DB |
| Quant výsledky | Neměnný adresář běhu: původní export enginu, log, config, strategie a manifest |

Čas, ceny a anchor pozice kreseb se ukládají v datových souřadnicích, nikoliv
v pixelech nebo indexech svíček. Vela serializace se uloží jako verzovaný JSON
spolu s verzí knihovny. Běh uvádí hash dat, strategie, parametry, fees a engine.
Úprava importovaných archivů vytvoří novou verzi dat; nepřepíše tiše původní běh.

Export journalu: CSV a JSON. Přenosná záloha: konzistentní SQLite snapshot,
screenshoty, sessions, strategie a výsledky v archivu s manifestem a checksumy.
Historická tržní data lze přibalit volitelně; jinak manifest umožní jejich obnovu.
Obnova se nejprve ověří ve staging složce a nepřepíše existující data bez volby
uživatele. Kopírovat pouze soubor SQLite při aktivním WAL není bezpečná záloha.

## Pravidla replaye

Jediný zdroj pravdy je `asOf`: UTC čas hranice známých dat. Není totožný s open
time poslední zobrazené svíčky. První verze pracuje s minutovou přesností;
zvolený začátek se zaokrouhlí dolů na UTC minutu a tato hodnota je viditelná.

1. Základní 1m bar lze použít, pouze pokud jeho konec je nejpozději `asOf`.
2. Hotové vyšší bary se zobrazí jen tehdy, pokud už skutečně skončily.
3. Otevřený vyšší bar se sestaví pouze z dokončených 1m barů do `asOf`.
   Příklad: v 10:25 ukáže 1h bar 10:00 jen data 10:00–10:24.
4. Přepnutí 1m ↔ 5m ↔ 15m ↔ 1h ↔ 4h ani změna páru nemění `asOf`.
5. Krok posune čas na další hranici aktuálního timeframe. Play používá stejné
   kroky, pauza čas nemění. Minutové krokování lze doplnit později.
6. Když chybí nezbytné 1m bary, graf se bezpečně pozastaví a uvede chybějící
   rozsah. Nikdy nesáhne po finální vyšší svíčce jako náhradě.
7. Na konci dostupných dat se replay zastaví bez návratu k plné historii.
8. Opožděná odpověď starého požadavku nesmí změnit novější market/timeframe/cursor.
9. Indikátory se počítají z viditelného prefixu a partial baru. Předpočítané
   hodnoty z celé historie se do replaye neimportují.
10. Kresby mají session a čas vytvoření. Po návratu před jejich vznik se
    standardně skryjí, aby starší uložená analýza neprozrazovala budoucnost.

Existující Vela replay lze použít tam, kde dodržuje tyto invarianty; jeho
nativní časová logika nesmí ovládat aplikační čas. První integrační zkouška
ověří bezpečné předávání omezeného okna i zachování kreseb a viewportu.
Pokud veřejné API nestačí, preferovat malou připnutou opravu ve Vela před
přepisem grafu. Každá nutná oprava musí mít regresní test.

Ukládá se `asOf`, market, timeframe, viewport, drawings, dataset version a
nastavení rychlosti. Otevření uložené session začíná pozastavené.

## Journal — druhá etapa

Setup se uloží jako snapshot position toolu; pozdější posun kresby nemění
historický záznam. Záznam rozlišuje plán a dokončený obchod. Povinné jsou market,
směr, timeframe, čas, entry, SL a TP; poznámky a tagy volitelné.
Screenshot zachycuje graf včetně kreseb a viditelného replay času.

Výsledek je v první verzi ručně zadaný. Uchováme explicitně čisté P&L v USDT,
počáteční risk v USDT a kapitálovou základnu pro procentní výnos; R = čisté
P&L / počáteční risk. Samostatně lze uvést procentní změnu ceny. Bez známého
risku nebo kapitálové základny zobrazit příslušnou metriku jako neurčenou.
Nezaměňovat změnu ceny s návratností marže při páce.

Statistiky pracují pouze s dokončenými obchody z vybraného filtru. Win rate
je podíl kladných výsledků ze všech dokončených obchodů, breakeven samostatně.
Profit factor je součet kladných čistých P&L / absolutní součet záporných P&L;
bez ztrát není konečné běžné číslo. Equity křivka řadí realizované výsledky
podle času dokončení a uvádí počáteční kapitál. Otevření replaye z journalu
nastaví místo setupu a neodhalí jeho budoucí výsledek na grafu.

Automatické SL/TP vyhodnocení ručních obchodů zůstává mimo tuto etapu.
Vyžaduje samostatný návrh pro oba zásahy ve stejné svíčce, gaps, fees a funding.

## Quant — třetí etapa

Freqtrade futures, nejdříve isolated margin, Python strategie s `can_short`.
UI vybírá strategii, páry, rozsah, timeframe, počáteční kapitál, stake/leverage,
fees a parametry deklarované strategií. Parametry musí být skutečně předány
podporovanou cestou enginu; nelze předpokládat libovolné CLI argumenty.

Adaptér vytváří engine-kompatibilní soubory ze stejného datasetu, který používá
graf. Odvozený export má hash a shodné UTC agregace; nevzniknou dvě nezávisle
stažené historie. 1m detail timeframe zpřesní intrabar vyhodnocení v možnostech
enginu. Nezajistí tickovou přesnost ani realistické slippage automaticky.

Funding se použije jen při ověřeném pokrytí potřebných funding a mark dat.
Chybějící funding není potichu nula: spustit běh lze buď po doplnění dat, nebo
s výslovně označeným předpokladem bez fundingu. Fees jsou explicitní a uložené.
Předpoklady plnění, liquidation a historických exchange limits jsou viditelné
v detailu běhu. Lookahead a recursive analysis doplní validaci strategie.

Původní výsledky enginu jsou autoritativní pro jeho P&L. Aplikace z nich
odvozuje přehledy, porovnání a společný formát trade overlay. Každý obchod má
`source = manual | quant` a quant `runId`; statistiky je standardně oddělují.
R zobrazit jen při definovaném počátečním riziku, nevymýšlet jej z P&L.

V replayi zobrazit automatický entry až v jeho čase, exit a skutečný výsledek
až po jejich čase. Stop/TP ukazovat jen jako tehdy známé úrovně. Hotový exit
nebo budoucí trail nesmí být předem vidět. Prohlížení kompletního běhu bude
explicitní režim mimo zaslepený replay.

## Etapy a jejich podmínky dokončení

### 1. Replay

1. Malá integrační zkouška Vela + minutová data + `asOf`: partial vyšší bar,
   přepínání v obou směrech, zachování kreseb a renderovaných hodnot.
2. Importer, katalog pokrytí a uložení dat; jeden měsíc všech tří párů, pak
   postupné doplnění dostupné historie od ledna 2023.
3. Výběr trhu/času, step, play/pause, rychlost a stav chybějících dat.
4. Existující trendline, horizontála, rectangle, Fibonacci, text, měření a
   position tool, jejich persistence a obnovení session.
5. Ověření offline provozu, reálného DOM i grafu, zoomu, panu, crosshairu,
   drag entry/SL/TP a reloadu. Změřené testy úniku budoucnosti i během načítání.

První etapu nepovažovat za hotovou bez shody `asOf` při 5m → 1h → 5m,
správného partial OHLCV a bezpečného chování při chybějících datech.

### 2. Journal

Snapshot setupu a screenshot; seznam, filtry, ruční výsledky, statistiky,
equity, návrat do replaye a ověřená záloha/obnova. Numerické fixtures pro long,
short, loss, breakeven, nulový risk, fees a nedokončené setupy.

### 3. Quant

Nejprve referenční běh s předvídatelnými long/short obchody: ověřit čas vstupu
a výstupu, fees, funding a P&L proti exportu a nezávislému výpočtu konkrétních
obchodů. Pak runner, parametry, importy, overlay, porovnání a diagnostika biasu.
Případné omezení Freqtrade přiznat v UI a návrhu; nevytvářet vlastní engine.

Každá etapa má vlastní podrobný plán až ve chvíli, kdy na ni přejdeme.

## Schválené upřesnění

Žádný live stream. Historická data od ledna 2023 do posledního dostupného archivu;
aktualizace historie na požádání, s viditelným koncem pokrytí. První etapa zahrnuje
Volume, SMA, EMA, RSI, MACD a Bollinger Bands s nastavením parametrů.
