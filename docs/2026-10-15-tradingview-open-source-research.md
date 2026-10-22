# Open-source cesta co nejblíž TradingView

Stav průzkumu: **15. 10. 2026**. Kontext: Perp Replay, React 19, vlastní Binance
historie a bezpečný replay. Jde o výzkum a doporučení, nikoli rozhodnutí migrovat.
Vela i nynější OpenCharts zůstávají beze změny.

## 1. Výsledek a doporučení

**Nejsilnější nový kandidát je `marketcalls/openalgo-charts` 2.6.4.** Je to
samostatný open-source engine s hotovou vrstvou terminálového UI, nikoli další
tenký wrapper Lightweight Charts. Ze zkoumaných alternativ nejlépe kombinuje
šíři analytických nástrojů, skutečné position drawings, native indicator panes,
nastavení, object management a multi-chart workspace. Má Apache-2.0 licenci.
[Projekt a instalace](https://github.com/marketcalls/openalgo-charts),
[licence](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/LICENSE).

**Nedoporučuji okamžitou výměnu.** OpenAlgo je nejslibnější kandidát k přímému
porovnání, nikoli doložený vítěz ve všech interakcích nebo FPS. Má vlastní
replay pravidla odlišná od našich, nalezenou platformní chybu v testu a jeho
referenční UI by potřebovalo zjednodušit. Naše nynější OpenCharts už navíc
obsahuje podstatnou práci, kterou žádný samotný upstream balíček nezahrnuje.

| Pořadí pro náš účel | Kandidát | Proč se jím zabývat | Hlavní cena / slabina |
| --- | --- | --- | --- |
| **1. nový kompletní kandidát** | **OpenAlgo Charts 2.6.4** | Nejširší ověřená kombinace nástrojů, panes a workspace | Nový renderer i formát stavu; native replay nepřebírat |
| **2. hotovější klasické UI** | **TradingChest 0.5.4** | Kompaktní TradingView-like shell, skutečné position tools, mnoho studií | KLine v9 + SolidJS; chybějící hotový synchronizovaný grid a slabší settings |
| **3. moderní React základ** | **KLineChart 10 + react-klinecharts-ui 2.3.0** | Native panes, React hooks, drawing a sync foundation | Headless knihovna; terminálový vzhled vytváříme my |
| **nejmenší integrační riziko** | **Náš OpenCharts + cílené doplnění** | Již zapojené bezpečné replay/Live, čtyři cells, historie kreseb a persistence | LWC 4.2.3, omezenější katalog, vlastní orchestrace subpanes |
| **samostatná modernizace základu** | **LWC 5.2.1 + drawing plugins** | Native panes, aktuální engine od TradingView, rozšiřitelný základ | Není hotový terminál; port OpenCharts a nové napojení kreslení |
| **výkonový výzkum** | **Fast Financial Charts 2.2.0** | MIT, WebGL2, mnoho indikátorů, headless řízení | Nedostatečný position tool; UI chybí; WebGL2 je nutnost |
| **dílčí moduly / inspirace** | **CandleKit 0.2.0** | React/LWC 5, docking, indicator picker | Méně drawing funkcí než máme, raná fáze |

Moje doporučení pro případné další zadání: **nejprve izolované A/B preview
OpenAlgo vedle současného OpenCharts, se stejnými našimi daty a stejným replay
clockem**. Až podle skutečného pan/zoom/drawing testu rozhodnout o rendereru.
TradingChest ponechat jako druhý vizuální kandidát; React/KLine jako alternativu,
pokud bude prioritou nativní práce s panes a kontrola nad vlastním UI.

## 2. Jak hluboko bylo ověřováno

Průzkum zahrnoval aktuální webové vyhledávání, oficiální dokumentaci, release
notes, licence a zdrojové klony hlavních kandidátů. U vybraných knihoven proběhla
čistá instalace, testy a build. V browseru jsem otevřel samotné TradingView,
OpenAlgo gallery i lokální OpenAlgo demo a izolovaný TradingChest harness.
Lokální ukázky používaly **syntetické OHLCV**, žádný účet ani objednávky.

Rozlišuji čtyři různé důkazy:

- **Dokumentace:** autor funkci popisuje; může být zastaralá nebo přehnaná.
- **Zdroj:** existuje konkrétní implementace, nikoli jen název v menu.
- **Test/build:** čistý checkout jde ověřit; unit test nemusí zkoušet canvas.
- **Browser:** konkrétní viditelná interakce skutečně proběhla.

**Neproběhl srovnatelný instrumentovaný FPS/latency benchmark všech enginů na
stejném Macu.** Žádné pořadí níže neznamená změřené „nejplynulejší“. Neproběhl
ani audit každého forku, každého indikátoru nebo všech mobilních interakcí.
Tam, kde píšu „nenašel jsem“, jde o hranici kontroly dané revision, ne důkaz
absolutní neexistence. Počet funkcí není skóre jejich kvality.

## 3. Co konkrétně znamená TradingView feel

Pouhé tmavé pozadí a zelené/červené svíčky nestačí. Referenční Supercharts mají
hustou, ale čitelnou pracovní plochu: horní kontextový toolbar, úzkou levou
drawing rail, legendy uvnitř grafu, přímo dostupná nastavení a pravé pomocné
panely. Toto rozložení bylo vidět i v otevřeném veřejném TradingView chartu.
[Průvodce Supercharts](https://www.tradingview.com/support/solutions/43000746464-getting-started-with-supercharts/).

| Oblast | Co skutečně porovnávat |
| --- | --- |
| Pohyb | Trackpad zoom ukotvený pod pointerem, pan bez skoků, inertia, price-axis drag, autoscale, resize bez resetu viewportu |
| Čitelnost | Hustota lišt, font a formát cen, grid, candle spacing, crosshair labels, poslední cena a OHLC legenda |
| Kreslení | Hit testing tenké čáry, body vs přesun celé kresby, drag entry/SL/TP, magnet, temporary snap, floating properties, undo |
| Indikátory | Native subpanes, resize/reorder, přesun overlay ↔ pane, source/input/style settings, více os, čitelný warmup |
| Workspace | Nezávislé instrumenty/TF, aktivní cell, maximize, link groups, sync podle času, persistence |
| Replay | Jeden okamžik známých dat, bezpečný forming bar, rewind bez probliknutí budoucnosti, drawings podle času vzniku |
| Spolehlivost | Obnova stavu, schema versions, cleanup listeners, žádné rozbité menu v malé cell, žádný silent fallback |

TradingView rozlišuje nezávislé grafy v layoutu a volitelnou synchronizaci;
synchronizovaný replay má společný okamžik. Magnet má i dočasné zapnutí přes
Ctrl/Cmd. Těmito konkrétními chováními se má řídit porovnání, nikoli počtem ikon.
[Multi-chart](https://www.tradingview.com/support/solutions/43000629990-leveraging-multi-chart-layouts-in-your-analysis/),
[synchronizovaný replay](https://www.tradingview.com/blog/en/synchronized-bar-replay-45933/),
[magnet](https://www.tradingview.com/support/solutions/43000472716-cursor-lags-jumps-while-drawing/).

## 4. Co už máme: férový baseline

Baseline není čistý upstream OpenCharts. Je to **náš lokálně patchovaný
OpenCharts 0.3.0 + LWC 4.2.3 + React host**. Relevantní stav popisují
[vendor README](../third-party/opencharts/README.md),
[workspace verification](2026-10-15-workspace-verification.md) a aktuální
`web/compare/`.

Už máme čtyři uchované cell konfigurace, layout a maximalizaci, nezávislé
instrumenty/TF, společný replay cutoff, timestamp sync a crosshair, oddělený
Live/Replay, sdílení identických Live subscriptions, per-cell kresby a studies,
scoped undo/redo, magnet a temporary snap. EMA/SMA/Bollinger/VWAP jsou overlays;
RSI/MACD/ATR/Stochastic mají vlastní panes. Nastavujeme inputs, styl i geometrii.

Slabiny, které mají smysl řešit: malý katalog studií oproti širším kandidátům,
orchestrace pane grafů v hostu místo novějšího native pane základu, nutnost
udržovat vendor opravy a dále dotahovat interakční konzistenci. Appearance je
dnes společná pro workspace. Export konfigurace není kompletní restore workflow.

Aktuální upstream `dylanpersonguy/OpenCharts` je při kontrole stále na stejné
revision `d3fc63c`, ze které vychází náš patch. **Nenašel se jednoduchý novější
upstream upgrade, který by hotově vyřešil další generaci chartu.**
[Upstream](https://github.com/dylanpersonguy/OpenCharts).

Vela 0.8.4 zůstává alternativní route a její nastavení/data se nepřevádějí.
Uživatel preferuje OpenCharts; tento výzkum není pokyn Vela odstranit.

## 5. Funkční porovnání hlavních variant

„Host“ znamená, že funkci musíme dodat v Perp Replay. Native pane je část
jednoho grafu se společnou časovou osou; není to automaticky více instrumentů.
Počty níže nejsou zcela stejnou jednotkou: někde jde o registry, jinde menu.

| Vlastnost | Náš OpenCharts | OpenAlgo 2.6.4 | TradingChest 0.5.4 | React/KLine UI 2.3.0 | LWC 5 + difurious | FFC 2.2.0 | CandleKit 0.2.0 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hotová rail/settings UI | Ano | Ano | Ano | Příklady; vlastní host | Host | Host | Částečně |
| Drawing rozsah | Bohatá stávající sada | **87 registrovaných tools** | **43 menu tools**, 48 overlays celkem | 39 menu tools | 21 tools v rodině pluginů | Autor 42 | 16 typů |
| Skutečné entry/SL/TP | Ano | Ano + risk sizing | Ano, jednodušší | Ano | Ano | **Ne: 2 body** | Nenašel jsem |
| Indikátory | 8 host studies | **112 registrovaných** | 72 definic, 69 unikátních v kategoriích | 27 core + 11 custom | Host / externí matematika | Autor 90 | Adapter / katalog |
| Native indicator panes | Host skládá grafy | Ano | Ano | Ano | Ano v LWC 5 | Ano | Ano v LWC 5 |
| Inputs + plot styling | Ano | Ano | Především calcParams | API/hooks, vlastní UI | Host | Host | Picker včetně parametrů/barvy |
| Multi-chart | Ano, až 4 cells | Grid až 16 cells | Host | Workspace foundation | Host | Host | Docking workspace |
| Objects/history | Scoped drawing history | Objects + širší undo timeline | Persistence; plnou history jsem nenašel | Drawing undo/helpers | Částečné API; history host | Drawing API | Omezenější |
| Náš bezpečný replay | Ano | Nutný vlastní adapter | Nutný vlastní adapter | Nutný vlastní adapter | Host | Host | Nutný vlastní adapter |
| React 19 | Náš host | Imperative mount | Imperative Solid mount | Přirozené React hooks | Imperative / wrapper | Volitelný React peer | React |
| Licence základu | MIT + Apache/NOTICE | Apache-2.0 | Apache-2.0 | Apache-2.0 | Apache + **MPL-2.0** tools | MIT | MIT |

Podklady a přesné rozdíly jsou v následujících sekcích. Matice není tvrzení,
že všechny zapsané funkce prošly browserovým regresním testem.

## 6. OpenAlgo Charts: nejzajímavější nový základ

### Co je skutečně silné

**Pozor na podobný název:** `marketcalls/openalgo-charts` je nový samostatný
engine. Starší `crypt0inf0/openalgo-chart` je jiný projekt nad LWC.

Z čerstvě emitovaných ESM bundles jsem importoval registry: **87 drawing tools
a 112 indikátorů**. Nejde jen o číslo z landing page. Kreslení zahrnuje skutečné
long/short position, rozsáhlé Fibonacci/Gann/pitchfork nástroje, ruční harmonic
a wave anotace, text, brush, měření a analytické overlays.
[Drawing dokumentace](https://marketcalls.github.io/openalgo-charts/docs/drawing-tools/),
[draw entrypoint](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/src/draw/index.ts).

Position tool je tříúrovňová kresba entry/target/stop. Po zadání dvou bodů
vznikne výchozí stop, pak lze upravovat jednotlivé úrovně. Zdroj obsahuje risk
percentage, account size a výpočet sizingu. **V lokálním browseru jsem kresbu
vytvořil, zobrazil profit/loss zóny a otevřel její properties včetně Account
size, Risk %, visibility a barev.** Vyzkoušel jsem i drag stop anchoru; nešlo
o přesný regresní test všech geometrií a všech voleb.
[Position implementace](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/src/draw/measure-tools.ts).

Studies mají native panes, metadata inputs a stylování jednotlivých plotů.
To je významnější architektonický přínos než samotný počet indikátorů.
Matematickou shodu všech 112 studií s TradingView jsem neověřoval.
[Indikátory](https://marketcalls.github.io/openalgo-charts/docs/indicators/),
[settings zdroj](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/src/widget/dialogs/indicator-settings.ts).

Workspace má skutečné grid cells, splitters, maximize, link groups, layout
capture a saved layouts. Persistence má vlastní dokumenty, repository,
IndexedDB a JSON vrstvu. Native undo zahrnuje více akcí než jen kresby.
To může ušetřit významnou část host kódu, ale museli bychom rozhodnout,
která vrstva vlastní layout a historii, aby neexistovaly dvě konkurenční.
[Grid source](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/src/widget/grid.ts),
[workspace source](https://github.com/marketcalls/openalgo-charts/tree/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/src/workspace).

### Pohyb a vzhled

Engine používá Canvas 2D, volitelný WebGL2 backend a Canvas fallback. Zdroj
implementuje kinetic pan, wheel/trackpad zoom s časovým vyhlazením a RAF
invalidation. To je konkrétní základ pro plynulý pohyb; **není to změřený důkaz
lepšího feelu než LWC**.
[Pohyb](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/src/core/chart-motion.ts).

Autor zveřejňuje reprodukovatelné render benchmarky, ale uvedené prostředí
je Windows/Ryzen 7 a headless Chromium se **SwiftShader software GL**. Nejde
o náš Mac, skutečný trackpad ani zatížený čtyřgrafový workspace. Čísla nelze
férově postavit proti cizím „milion bodů při 120 FPS“ marketingovým ukázkám.
[Benchmark data a prostředí](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/benchmarks/releases.json).

V otevřeném lokálním demu je dark chart s legendami, volume a RSI vizuálně
relevantní. Default shell má ovšem dvě husté horní řady včetně Buy/Sell,
Account, news a dalších funkcí. **Pro náš chart-first replay bych shell zúžil**;
nepřebíral celou brokerskou obrazovku. Canvas samotný působí přesvědčivě,
ale pixelově přesnou shodu s TradingView netvrdím.
[Živé příklady](https://marketcalls.github.io/openalgo-charts/examples/).

### Konkrétní výhrady

1. **Native replay není náš kontrakt.** `formingWithin(raw, final)` vezme open
   hotového vyššího baru a omezí partial high/low/close/volume jeho finálním
   rozsahem. Při nesouladu minutového a vyššího feedu tedy tvořící se bar závisí
   na finálních datech. Ověřil jsem přímo funkci: stejný raw high 110 a final
   high 108/115 vrátí partial high 108/110. Při konzistentních feed datech clamp
   nemusí nic změnit; nejde o tvrzení, že každý replay vždy leakne. Pro náš
   systém však nesoulad znamená chybu, nikoli korekci budoucím barem.
   [Forming source](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/src/replay/forming.ts),
   [timeline](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/src/replay/timeline.ts).
2. Volitelná intrabar simulace odhaduje trajektorii z OHLC; nepoužívat ji jako
   skutečný průběh trhu ani jako podklad pro automatické vyhodnocování SL/TP.
   Náš backend dál dodává pouze již známé minuty a jejich projekci.
3. Volume profile z pouhých OHLCV je aproximace rozdělení objemu v low–high
   rozsahu. Footprint/orderflow potřebuje jemnější vstupní data. Existence
   rendereru nevytvoří skutečný bid/ask footprint z naší minutové historie.
   [Volume profile source](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/src/profile/volume-profile.ts).
4. **Čerstvé testy nejsou úplně zelené:** 11 689 pass / 1 fail. Selhává test
   očekávající `Ctrl+C`, zatímco na Macu je správně renderováno `Cmd+C`.
   Zaměřené opakování chybu reprodukovalo. Je to problém platformního očekávání
   testu, nikoli důkaz rozbitého kopírování; přesto nelze psát „suite passed“.
   [Test](https://github.com/marketcalls/openalgo-charts/blob/e68d7ae47c0babb32ba6dc50f7a5a55bf56a7a33/tests/widget-dialogs.test.ts).
5. Build emitoval JS i deklarace a vzniklé ESM/UI fungovaly, ale proces po
   posledním výstupu neukončil běh; byl ukončen ručně. **Čistý úspěšný exit
   celého build příkazu tedy není potvrzen.** Příčina nebyla v tomto průzkumu
   opravována. Před integrací patří mezi kontrolované body.
6. Nový formát drawings/workspaces není kompatibilní s naším uloženým stavem.
   Namespace a případný import musí být výslovně navržené, ne tiché přepsání.

**Verdikt:** nejlepší nový kandidát na širší analytický terminál. Především
kvůli kombinaci nástrojů a native workspace, ne kvůli neověřenému FPS slibu.

## 7. TradingChest a KLineChart: dvě různé cesty

### TradingChest 0.5.4

Apache-2.0 fork nad **KLineChart 9.8.12**, uvnitř SolidJS. Má hotový kompaktní
toolbar a drawing rail, legendy, settings, screenshot a fullscreen. V lokálním
syntetickém harnessu se dark UI s EMA/Volume/RSI skutečně renderovalo. Vzhled
je blízko klasickému chart terminálu; default ikony a texty jsou hrubší a část
ovládání méně propracovaná než současné TradingView.
[Projekt](https://github.com/evotrader/TradingChest),
[připnutý manifest](https://github.com/evotrader/TradingChest/blob/170a81c0a055702ec3d5075b7d70dd7125b9b885/package.json).

Zdroj dává **43 unikátních drawing menu tools**, celkem 48 overlay registrací.
Má skutečnou tříbodovou long/short kresbu entry → SL → TP, nikoli pouhou
order line. V browseru jsem aktivoval Long Position a ověřil průběžnou
konstrukci; úplný drag/reload regresní scénář hotové pozice neproběhl.
[Drawing menu](https://github.com/evotrader/TradingChest/blob/170a81c0a055702ec3d5075b7d70dd7125b9b885/src/widget/drawing-bar/icons/index.ts),
[position source](https://github.com/evotrader/TradingChest/blob/170a81c0a055702ec3d5075b7d70dd7125b9b885/src/extension/longPosition.ts).

Je zde **72 indicator definitions**: 27 core a 45 custom/lazy. Kategorie mají
69 unikátních položek; BOLL je ve dvou kategoriích. Nabídka je výrazně širší
než našich osm studies. Současný settings dialog ale upravuje především
numerické calcParams; není automaticky lepší než naše source/style/pane UI.
[Loaders](https://github.com/evotrader/TradingChest/blob/170a81c0a055702ec3d5075b7d70dd7125b9b885/src/indicator/loaders.ts),
[settings](https://github.com/evotrader/TradingChest/blob/170a81c0a055702ec3d5075b7d70dd7125b9b885/src/widget/indicator-setting-modal/index.tsx).

Má explicitní v2 serializaci contextu, indicators, panes a overlays, což je
dobré pro host-owned persistence. Nenašel jsem ale hotový synchronizovaný
multi-chart grid ani kompletní scoped undo/redo a object tree srovnatelný
s tím, co bychom chtěli zachovat. Named single-chart layout není multi-chart.
[Persistence](https://github.com/evotrader/TradingChest/blob/170a81c0a055702ec3d5075b7d70dd7125b9b885/src/persistence/v2.ts).

Native replay pracuje s předem načtenými bary a prefixem a blokuje změnu TF;
neřeší naši projekci z minut a společný cutoff. `trading-chest/react` navíc
exportuje dvě metrické React komponenty, **nikoli React wrapper terminálu**.
Integrace by použila imperative mount s cleanupem v React effectu.
[ReplayEngine](https://github.com/evotrader/TradingChest/blob/170a81c0a055702ec3d5075b7d70dd7125b9b885/src/replay/ReplayEngine.ts),
[React entry](https://github.com/evotrader/TradingChest/blob/170a81c0a055702ec3d5075b7d70dd7125b9b885/src/react.ts).

**Čerstvé ověření:** čistá instalace, **363/363 testů** a celý build včetně
deklarací prošly. Nejlépe reprodukovatelný hotovější kandidát KLine větve.
Jeho zděděný odkaz na `preview.klinecharts.com` ukazuje oficiální Pro, nikoli
ověřeně tento fork; proto byl vytvořen vlastní dočasný harness.

### KLineChart 10.1.0 + react-klinecharts-ui 2.3.0

Core KLineChart je Apache-2.0 Canvas engine. Aktuální 10.1.0 vyšlo 14. 10.
2026. Native panes, více Y axes, drag resize, pořadí a maximize/minimize jsou
pro analýzu velmi relevantní. Čas používá **epoch ms**, což se shoduje s naším
backendem. Samotný core má 27 indikátorů a 16 overlays, nikoli hotový TV shell.
[Release](https://github.com/klinecharts/KLineChart/releases/tag/v10.1.0),
[panes API](https://klinecharts.com/en-US/api/instance/setPaneOptions).

`NemeZZiZZ/react-klinecharts-ui` je headless React provider/hooks vrstva nad
v10: 39 menu tools, 26 custom overlay templates, 11 custom indikátorů navíc
k core, drawing history a workspace/sync foundation. Je přirozenější pro
náš React 19 než Solid wrapper. Vzhled toolbarů a dialogů ale dodává consumer.
[Projekt](https://github.com/NemeZZiZZ/react-klinecharts-ui),
[drawing registry](https://github.com/NemeZZiZZ/react-klinecharts-ui/blob/256d96ac3dc292f95227fe059e2b8329b5d1bda8/src/data/drawings.ts).

Sync skutečně mapuje timestampy a neposílá cizí cenu mezi instrumenty. Autor
uvádí nepřesnost scroll sync v blank space. Shared workspace replay/drawings
nejsou hotová univerzální vrstva. Interní replay resetuje prefix, má O(n²)
práci celé session a batching na šest reloadů/s; nenahrazuje náš engine.
[Sync](https://github.com/NemeZZiZZ/react-klinecharts-ui/blob/256d96ac3dc292f95227fe059e2b8329b5d1bda8/src/workspace/useChartSync.ts),
[replay hook](https://github.com/NemeZZiZZ/react-klinecharts-ui/blob/256d96ac3dc292f95227fe059e2b8329b5d1bda8/src/hooks/useReplay.ts).

Indikátory s příponou `_TV` nejsou automaticky prokázaná Pine parity.
Changelog například opravuje tvrzení o EMA/RMA seedingu. Je potřeba porovnat
vzorce, warmup a reference, nikoli pouze názvy. V10 změnilo data API;
TradingChest ani oficiální Pro nelze bezpečně povýšit z v9 pouhou změnou verze.
[Changelog wrapperu](https://github.com/NemeZZiZZ/react-klinecharts-ui/blob/256d96ac3dc292f95227fe059e2b8329b5d1bda8/CHANGELOG.md),
[v10 breaking changes](https://github.com/klinecharts/KLineChart/releases/tag/v10.0.0).

**Čerstvé ověření:** TypeScript a tsup build prošly, **360/360 testů na Node
24**. Na Node 26 bylo 12 localStorage/happy-dom selhání; na doporučeném Node
24 všechna zmizela. Browser QA tohoto wrapperu neproběhlo.
[Terminal příklad](https://nemezzizz.github.io/react-klinecharts-ui/examples/terminal/),
[multi-chart příklad](https://nemezzizz.github.io/react-klinecharts-ui/examples/multi-chart/).

## 8. Zůstat u OpenCharts, ale zlepšit základ

### Lightweight Charts 5.2.1

Oficiální Apache-2.0 engine od TradingView je dobrý základ svíček, os, pohybu
a časové geometrie. **Není to open-source celý TradingView**. Plný drawing
catalog, indicator UI, object tree a workspace musíme dodat sami.
[Product comparison](https://tradingview.github.io/lightweight-charts/docs/product-comparison).

V5 přináší native panes a jejich řízení. V5.2.1 řeší také crosshair a nahrazení
více series kratšími daty, což je relevantní pro rewind. Upgrade z naší 4.2.3
ale mění series creation, markers, watermark a plugin APIs. Port není běžný
dependency bump; dotýká se OpenCharts zdroje a host subpane architektury.
[5.2.1 release](https://github.com/tradingview/lightweight-charts/releases/tag/v5.2.1),
[migrace v4 → v5](https://tradingview.github.io/lightweight-charts/docs/migrations/from-v4-to-v5).

### difurious line tools: kvalitní stavebnice kreslení pro v5

Aktuální rodina má samostatný core a companion balíčky, celkem 21 tools.
Long/short position má skutečné tři anchors, magnet, body drag a serializaci.
To je mnohem relevantnější než pouhá order overlay. Licence je **MPL-2.0**,
nikoli MIT, a peer míří na LWC ^5.2.
[Core](https://github.com/difurious/lightweight-charts-line-tools-core),
[position plugin](https://github.com/difurious/lightweight-charts-line-tools-long-short-position).

Chybí hotový terminál, object tree a kompletní host undo workflow. `npm test`
je stub končící chybou; existuje vizuální test app, ne doložená automatická
suite. **Starý** monolitický `lightweight-charts-line-tools` na LWC 3.8 je
deprecated; nezaměňovat s nynější modulární v5 rodinou.
[Test app](https://github.com/difurious/lightweight-charts-line-tools-plugin-test-app).

### deepentropy indicators: výběrově, s kontrolou licence a matematiky

Repo uvádí 117 standardních studií, 1 551 community entries a 45 patterns.
To neznamená 1 713 nezávisle ověřených indikátorů s TV parity. Je zde užitečná
matematika, input metadata i plotting primitives, ale aktuální renderer cílí
na LWC >=5.2 <6. Community soubory mají různé původní licence včetně MPL a
CC BY-NC-SA; celý katalog nelze považovat za homogenní MIT balíček.
[Projekt](https://github.com/deepentropy/lightweight-charts-indicators),
[příklad původní community licence](https://github.com/deepentropy/lightweight-charts-indicators/blob/1046d47050514b4f71a05653cd2491292fdfa19b/src/community/rsi-alternative-derivation.ts).

Reference fixtures pro část TV porovnání nejsou veřejné a testy bez nich
skipují. Další rizika jsou default wall clock, multi-symbol data a offsety.
Převzal bych jen konkrétní potřebné studie po kontrole licence, vzorce a
prefix safety, nikoli celý katalog kvůli velkému číslu.

### CandleKit 0.2.0

MIT React knihovna nad LWC 5. Má zajímavý FlexLayout docking, persistent
workspace/import-export a indicator picker. Zdroj pickeru už umí parametry
a per-plot barvu, i když README část označuje za roadmap.
[Projekt](https://github.com/rohanbeingsocial/candlekit-charts).

Pro naše kreslení je to ale downgrade: 16 typů, bez nalezeného long/short,
textu, brush, magnet a undo API. Autor sám upozorňuje na ranou fázi.
Replay bez jemnějšího driveru může použít hotový coarse bar; nepřebírat.
[Replay source](https://github.com/rohanbeingsocial/candlekit-charts/blob/29891a41fb534136bcb2078b84b791bcc55c1f41/src/replay/ReplayController.ts).

**Smysluplná kombinace:** jeden renderer a jeden drawing systém; k nim
vybrané indikátory a naše replay/workspace doména. **Neskládat tři enginy na
sebe.** KLine overlays, OpenAlgo drawings a LWC primitives nejsou kompatibilní
jen proto, že všechny mají trendline. Port algoritmu či UX je jiná práce než
instalace pluginu.

## 9. Fast Financial Charts: zajímavý GPU engine, ne hotová náhrada

`Pairlens/fast-financial-charts` 2.2.0 má MIT licenci, WebGL2 main renderer,
Canvas overlays, native panes a worker indicator path. React je volitelný;
engine lze řídit imperative bez React renderu při každém ticku. Autor uvádí
90 indikátorů, 42 drawings a 16 chart types. Headless architektura umožňuje
vlastní kompaktní UI, ale žádný hotový TradingView terminal tím nedostáváme.
[Projekt](https://github.com/Pairlens/fast-financial-charts),
[licence](https://github.com/Pairlens/fast-financial-charts/blob/242d1b4188ee85f44d12da161ecea4e83877def5/LICENSE).

**Největší konkrétní mezera:** long/short drawing má v datovém typu tuple
dvou bodů a renderer jednu zónu s procentem. Nemá tři nezávislé entry/SL/TP
úrovně a plný risk/reward position workflow. Pro náš způsob analýzy je to
podstatné, i když se položka jmenuje Long Position.
[Drawing types](https://github.com/Pairlens/fast-financial-charts/blob/242d1b4188ee85f44d12da161ecea4e83877def5/src/types/drawings.ts),
[renderer registry](https://github.com/Pairlens/fast-financial-charts/blob/242d1b4188ee85f44d12da161ecea4e83877def5/src/core/drawings/registry.ts).

WebGL2 je požadavek, main renderer nemá automatický Canvas fallback.
**311 testů prošlo**, ale jsou to zdrojové unit testy, nikoli důkaz trackpad
feelu. Srovnávací browser benchmark jsem neprovedl.
[WebGL context](https://github.com/Pairlens/fast-financial-charts/blob/242d1b4188ee85f44d12da161ecea4e83877def5/src/core/render/webgl/context.ts).

Pozor: samotný engine je MIT, ale `Pairlens/trading-terminal` má FSL-1.1
s budoucí změnou licence. Celý terminal proto **není zařazen jako splňující
náš požadavek skutečně open-source základu**, přestože je veřejně čitelný.
[Licence terminálu](https://github.com/Pairlens/trading-terminal).

## 10. Další prozkoumané možnosti a proč nejsou vpředu

| Projekt | Co je užitečné | Proč jej nyní nevolit jako hlavní upgrade |
| --- | --- | --- |
| [TradeX 0.158.7](https://github.com/tradex-app/TradeX-chart) | GPL-3.0, samostatný engine, panes a TA-Lib/WASM | Position `draw()` je stub; Fibonacci také není plně implementované. Funkční drawing krok zpět. |
| [DXcharts Lite 2.7.39](https://github.com/devexperts/dxcharts-lite) | MPL-2.0, udržovaný renderer, panes/crosshair a primitives | Lite není plný drawing/study/React terminal z jiných produktových ukázek. |
| [RazeCharts 0.6.0](https://github.com/razedotbot/raze-charts) | MIT, základní studies/panes, sync layouts, entry/SL/TP overlay | Broker-state overlay není časově ukotvená persistentní position kresba; save/load trading state vynechává. Malý drawing katalog. |
| [ChartGPU 0.4.0](https://github.com/ChartGPU/ChartGPU) | MIT, WebGPU, velké série, annotations | WebGPU only bez fallbacku; obecný renderer bez kompletní analytické vrstvy. Velký line benchmark neřeší naše drawing UX. |
| [NightVision 0.4.0](https://github.com/project-nv/night-vision) | MIT, custom overlays a native panes | Poslední kontrolovaný stav z roku 2024; rozsáhlé drawing tools/toolbar nejsou hotový TV ekvivalent. |
| [TradingVue 1.0.2](https://github.com/tvjsx/trading-vue-js) | MIT, historicky relevantní interaktivní finance renderer | Výslovně neudržované, Vue 2, starý základ. |
| [Oficiální KLineChart Pro 0.1.1](https://github.com/klinecharts/pro) | Apache-2.0, známé kompaktní UI | Wrapper z roku 2023 nad starým v9 API. Novější core 10 neznamená modernizaci wrapperu. |
| [SiMahfud/klinechartpro 1.2.1](https://github.com/SiMahfud/klinechartpro) | Apache-2.0, mnoho UI nápadů | Čistý build selže na chybějícím Pine modulu; tests nemají jsdom. Raw x/y sync a nepřesná AVWAP geometrie. |
| [QUANTIX fork](https://github.com/dsavenk0/KLineChart-Pro) | Apache-2.0, custom tools, pane reorder/history | Spíše donor; část už je portována do novějšího React wrapperu. |
| [fin-charter 0.4.1](https://github.com/itssumitrai/fin-charter) | Svelte UI, 22 drawing implementací, panes/replay | Bez long/short; chybí plný LICENSE, ač README/package deklarují MIT. |
| [FX Freeplay](https://github.com/AceWritesCode/fx-freeplay) | Relevantní replay/workspace UX reference | MIT jen deklarováno, chybí plný LICENSE; replay maskuje budoucí canvas místo bezpečného datového prefixu. |
| [Starší openalgo-chart](https://github.com/crypt0inf0/openalgo-chart) | React/LWC 5, mnoho terminálového UI | Jiný projekt než nový OpenAlgo engine; monolit/broker wiring a nevyjasněný plný licenční soubor. |
| [DegenView](https://github.com/degenview/degenview) | GPL-3.0; zajímavá nativní aplikace a replay UX | Aktuální repo je Rust/egui rewrite, ne embeddable React chart. Vyžadovalo by jinou aplikaci. |
| [CandleViewer](https://github.com/basiltt/CandleViewer) | MIT, ambiciózní směr | README označuje pre-alpha/scaffolding; roadmap a cílová FPS nejsou doručená parity. |

Několik důkazů, které mění výběr:

- TradeX má skutečně prázdný position renderer a nedokončené Fibonacci,
  přestože obecný popis zní široce.
  [Position source](https://github.com/tradex-app/TradeX-chart/blob/ac3d13bac7fe8abe76382dbcd44655ffa5c40b5f/src/tools/trade-positiion.js),
  [Fibonacci source](https://github.com/tradex-app/TradeX-chart/blob/ac3d13bac7fe8abe76382dbcd44655ffa5c40b5f/src/tools/fibonacci.js).
- Raze má skutečný trading overlay, ale jeho persistence a ukotvení jsou jiný
  produktový model než saved position drawing.
  [Capabilities](https://github.com/razedotbot/raze-charts/blob/98891879d79b8fab181fed57e0bb9b06c2e23420/docs/capabilities.md),
  [TradingStore](https://github.com/razedotbot/raze-charts/blob/98891879d79b8fab181fed57e0bb9b06c2e23420/src/core/TradingStore.ts).
- SiMahfud selhává na chybějícím `@simahfud/pine-to-kline` a relativním
  `pine-to-kline/src`; AVWAP odhaduje geometrii místo použití skutečné osy.
  [Imports](https://github.com/SiMahfud/klinechartpro/blob/2e73227320088714279e736c6cb6df7abfde5f52/src/ChartProComponent.tsx),
  [AVWAP](https://github.com/SiMahfud/klinechartpro/blob/2e73227320088714279e736c6cb6df7abfde5f52/src/extension/anchoredVwap.ts).
- FX Freeplay dostává budoucí data do rendereru a překrývá je maskou. To je
  pro náš replay nepřijatelné, i kdyby obraz vizuálně vypadal správně.
  [Replay mask](https://github.com/AceWritesCode/fx-freeplay/blob/069b94cbad8b5bdc7db3d97811ca9897cb92dfbf/src/engine/charting/indicators/ReplayMaskIndicator.ts).
- DXcharts Lite je nutné oddělit od dalších proprietárních balíčků; plné
  produktové video neprokazuje funkce dostupné v Lite zdroji.
  [Oficiální package rozdělení](https://devexperts.com/dxcharts/documentation-for-developers/Getting-started/Packages/).

**Mimo náš licenční filtr:** `longsurf-ai/openchart` má vlastní dodatečné
podmínky včetně omezení multi-tenant použití a odstranění UI loga. Není to
obyčejné Apache-2.0 navzdory podobnému základu textu. Nezařazuji ho jako
doporučený FOSS kandidát.
[Skutečný LICENSE](https://github.com/longsurf-ai/openchart/blob/main/LICENSE).

Obecné Chart.js/ECharts/Plotly/uPlot jsou užitečné pro jiné datové vizualizace,
ale bez velké vlastní finance vrstvy neřeší tento úkol lépe. React wrapper
hostovaného TradingView widgetu také není vlastní open-source engine pro naše
offline data. QFChart/Vela není nová nezávislá alternativa k Vela.

## 11. Co má smysl spojit a kolik práce to znamená

| Cesta | Relativní náročnost | Co zachováme | Co musíme znovu dodat / ověřit |
| --- | --- | --- | --- |
| OpenCharts + několik studií a UX oprav | Nízká až střední podle rozsahu | Celý současný datový a workspace tok | Vybrané vzorce, settings, interakce |
| OpenCharts port na LWC 5 | Vysoká | Doména, část React hostu | Vendor API port, drawings, native panes, všechny dosavadní workaroundy |
| OpenAlgo adapter + zúžený widget | Střední až vysoká | Backend projekce a LiveFeed | Renderer lifecycle, history ownership, drawings visibility, state schema, replay guards |
| TradingChest adapter | Střední až vysoká | Backend a části host workspace | Solid mount, sync/grid/history, širší style settings, persistence bridge |
| React/KLine 10 adapter | Vysoká pro hotový produkt | Backend, React přístup, vlastní vizuální směr | UI shell, data loader bridge, drawing lifecycle, workspace dokončení |
| FFC + vlastní kompletní terminal | Vysoká | Datová doména | UI, plný position tool, drawing persistence, browser/GPU robustness |

Nejsou to hodinové odhady. Malé demo grafu může vzniknout rychle; zachovat
rewind, viewport, temporal drawings, více cells a bezpečné ukládání je jiný
rozsah. Číslo „má replay“ tuto práci neodstraňuje.

Přebírat lze nezávislou matematiku, formát nastavení, ikonografické principy
a UX vzorce při zachování licencí. Native overlay a renderer kód se musí portovat
na cílové coordinates, hit testing a lifecycle. Staré drawings nelze beze
ztrát přehodit mezi enginy prostou konverzí JSON klíčů.

## 12. Replay a backtesting: společné nepřekročitelné podmínky

Pro každý kandidát platí stejný kontrakt:

1. Backend zůstává autoritou pro `asOf` v UTC ms a skládání 1m historie.
   V 10:25 se hodinový bar skládá pouze z minut 10:00–10:24.
2. Renderer ani indikátory nedostanou budoucí bary. Native replay cache,
   skrytá data za maskou nebo hotový coarse bar nesmí obejít safe prefix.
3. Rewind odstraní pozdější painted data okamžitě; request generations
   chrání před pozdní odpovědí. Timeframe změna nepohne doménovým časem.
4. Každá kresba má čas vzniku a zachované uživatelské hidden flagy.
5. LiveFeed zůstává skutečný, oddělený od Parquet a replay datasetů.
6. OpenAlgo/LWC používají renderer sekundy, KLine ms. Převod je explicitní
   hranice adapteru, nikoli náhodná normalizace v různých komponentách.
7. Position kresba není uskutečněný obchod. Žádný nalezený chart nedává
   z minutového OHLCV pravdivou intrabar tickovou trajektorii ani automaticky
   celý journal/P&L/strategický backtesting našeho produktu.

Native replay knihoven může být užitečný v jiném produktu. U nás jej není
potřeba „opravovat“ do druhého clocku; bezpečnější je řídit chart našimi
projekcemi a kontrolovat, že si nic dalšího sám nedotahuje.

## 13. Jak rozhodnout o plynulosti bez hádání

Toto je **návrh dalšího experimentu**, nikoli již provedený benchmark:

- Stejný BTCUSDT dataset, stejný cutoff, rozlišení a browser na našem Macu.
  Základ 1 000 barů odpovídá aplikaci; 10 000 je dodatečný stress scénář.
- Stejné EMA/Bollinger/RSI/MACD, 1 a 4 cells, stejné množství viditelných
  barů. Nesmí „vyhrát“ graf, který zobrazuje méně práce nebo jiné candle width.
- Trackpad wheel/pinch, rychlý pan, price-axis drag, autoscroll na latest,
  resize splitters a návrat z maximize. Kontrolovat ukotvení a stabilitu.
- Position vytvoření, nezávislý entry/SL/TP drag, celý box drag, magnet weak/
  strong, Cmd release, blur, undo/redo a reload. Opakovat s 100 drawings.
- Replay vpřed a rewind během loadingu; partial 1h bar; různá TF v buňkách;
  Live/Replay přechod; starý request po novém selection.
- Profiler: frame time p50/p95, dropped frames, input-to-paint latency,
  long tasks a paměť po opakovaném mount/dispose. Zaznamenat DPR a hardware.
- Vizuálně porovnat 1280×720 i úzkou cell: čitelnost, dosažitelnost settings,
  clipping menus, focus a klávesnici. Samostatně zaznamenat subjektivní feel.

Vítěz musí projít **správností i interakcí**. Rozdíl v syntetickém throughputu
není dostatečný důvod přepsat fungující workflow.

## 14. Přesné kontrolované revisions a čerstvé výsledky

Zkrácený SHA identifikuje checkout při tomto průzkumu; odkazy výše připínají
klíčové důkazy na plnou revision. Verze a stav větví se budou měnit.

| Projekt | Verze / SHA | Rozsah čerstvého ověření |
| --- | --- | --- |
| OpenAlgo Charts | 2.6.4 / `e68d7ae` | Čisté npm ci; 11 689 pass, 1 fail; JS/d.ts emit a ESM registry; lokální browser. Build proces ručně ukončen po emitu. |
| TradingChest | 0.5.4 / `170a81c` | Čisté npm ci; 363 pass; celý build pass; lokální synthetic browser harness. |
| react-klinecharts-ui | 2.3.0 / `256d96a` | Frozen install, tsc a tsup pass; 360 pass na Node24. Browser netestován. |
| KLineChart core | 10.1.0 / `d5bb26f` | Zdroj, registry, release/API kontrola; ne samostatná plná suite. |
| Fast Financial Charts | 2.2.0 / `242d1b4` | Zdroj a 311 pass / 20 372 assertions; browser netestován. |
| OpenCharts upstream | 0.3.0 / `d3fc63c` | Zdroj a porovnání pinů; naše aktuální vendor a host vrstvy čteny. |
| CandleKit | 0.2.0 / `29891a4` | Source/license/registry/replay review; build ani testy neběžely. |
| difurious core / position | 1.1.2 `db2695c` / 1.1.0 `a6d2564` | Source a licence; test script je stub, ne zelená suite. |
| deepentropy indicators | 0.15.1 / `1046d47` | Source, dependency a licenční/reference fixture review. |
| TradeX | 0.158.7 / `ac3d13b` | Source review včetně neimplementovaných tools. |
| DXcharts Lite | 2.7.39 / `e83d2c3` | Source/license a rozsah veřejných packages. |
| ChartGPU | 0.4.0 / `c2b4375` | Source/docs/benchmark context; benchmark znovu neměřen. |
| RazeCharts | 0.6.0 / `9889187` | Source trading overlay/persistence review. |
| NightVision / TradingVue | 0.4.0 `43081c9` / 1.0.2 `bdbfe78` | Source a maintenance status. |
| SiMahfud | 1.2.1 / `2e73227` | Čistá instalace; build fail TS2307; tests nestartují kvůli jsdom. |
| QUANTIX / FX Freeplay | `759f029` / `069b94c` | Source, provenance a replay/persistence review. |
| fin-charter | 0.4.1 / `43db480` | Source/registry a chybějící plný licenční soubor. |
| starší openalgo-chart | `16f135c` | Source/LWC dependency a licenční kontrola. |

Testy byly spuštěny v oddělených dočasných klonech, ne instalací alternativ
do Perp Replay. Reprodukovatelné základní příkazy v příslušném klonu:

```sh
# OpenAlgo / TradingChest: respektovat jejich package-lock.json
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run build

# FFC: kontrolovaný subset všech jeho src/__tests__/*.test.ts souborů
bun test src/__tests__/*.test.ts
```

React wrapper používal vlastní frozen pnpm lockfile a Node24; jeho package
manager se tím nezavádí do host projektu. Počty unit testů mezi knihovnami
nejsou vzájemně srovnatelné skóre. Vlastní Perp Replay suite nebyla opakována,
protože tento úkol mění pouze tento výzkumný dokument.

## 15. Rozhodnutí, které z průzkumu vyplývá

Je reálné dostat se funkčně i vzhledově podstatně blíž TradingView bez
placené knihovny. Nejlepší nalezený nový komplexní základ je **OpenAlgo
Charts**; **TradingChest** je relevantní hotovější UI alternativa a
**React/KLine 10** zajímavá kontrolovatelná architektura. Současný OpenCharts
má však náskok v již zapojené doméně, který by se při migraci musel zachovat.

Další smysluplný krok je úzké srovnávací preview OpenAlgo na našich datech,
nikoli další dlouhý seznam knihoven nebo automatická migrace. Otevřené otázky
jsou přesný trackpad/drawing feel, lifecycle/persistence adapter a opakovatelné
ověření buildu. Dokud nejsou vyřešené, doporučení zůstává kandidátem pro
praktický test a Vela/OpenCharts ani uživatelská data se nemění.
