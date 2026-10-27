# Replay — průběh

## 2026-10-26 — Handoff po TradingView-like drawing/UI etapě

- Souvislý workspace shell, fixní 40px drawing rail, rozšířený drawing pack,
  contextual settings a poslední alignment pass jsou dokončené v commitu
  `956b02b` (`feat: add TradingView-style drawing workspace`) a pushnuté na
  `origin/main`. Worktree byl při předání čistý.
- Aktuální ověření: host 56 passed / 2 skipped, backend 32 passed, vendor
  303 passed / 1 skipped; host i vendor typecheck a production build prošly.
  Detail posledního vizuálního passu je v
  `docs/2026-10-26-interface-alignment-verification.md`.
- Uživatel určil jako další hlavní etapu Electron desktop shell podle
  `docs/superpowers/plans/2026-10-20-desktop-electron.md`. Implementace ještě
  nezačala; starší rozhodovací plán je nutné nejdřív aktualizovat podle
  současného OpenCharts UI na `/`.
- Favorites zůstává následující UI feature, ale má se implementovat až po
  minimálním zprovoznění Electron shellu a následně ověřovat uvnitř desktopové
  aplikace. Jde o samostatnou pohyblivou horizontální lištu s persistovaným
  výběrem nástrojů a pozicí; fixní levý rail se nemění.

## 2026-10-24 — Fixní globální drawing rail

- Primární OpenCharts drawing toolbar je jeden vždy přítomný 40px sloupec vlevo
  od celého workspace gridu. V 1/2/4-chart layoutu, při změně active cell i při
  maximize/restore zůstává na x=0; ovládací kontext se přepíná na aktivní chart.
- Drag grip a hide/show akce jsou skryté a vendor drag transform je zneplatněný.
  Drawing menu zůstává portaled do `body`, takže ani z bottom-right cell není
  clipnuté. Pohyblivá Favorites lišta zůstává odložená.
- Browser vytvořil oddělenou trendline v `chart-2` a horizontal line v
  `chart-4`; layout, active cell, kresby, magnet a ATR přežily reload. Potom
  bylo všech sedm původních `opencharts-preview:` hodnot obnoveno byte-for-byte.
- Při 390×800 bylo naměřeno: rail 0–40 px, grid 40–350 px, pravý utility rail
  350–390 px a document width 390 px bez horizontálního overflow.
- Ověření: `npm test` 53 passed / 2 skipped; `npm run typecheck` PASS;
  `npm run build` PASS; `uv run pytest -q` 32 passed, 1 známé deprecation
  warning. Detail je v `docs/2026-10-23-tradingview-shell-verification.md`.

## 2026-10-23 — TradingView-like workspace shell

- Hlavní OpenCharts `/` dostal souvislý kompaktní shell podle dodaných
  TradingView screenshotů: 40px market toolbar, levý drawing rail, vnější pravý
  utility rail, dockovaný/overlay watchlist, 42px Replay/Live transport a 26px
  status bar. Multi-chart captions mají 23 px a v single/maximized pohledu se
  nezobrazují.
- `Preview.tsx` dál vlastní stav; nové prvky v `WorkspaceChrome.tsx` jsou
  stateless. Storage namespace i tvary, Replay/Live logika, backend, data a
  vendor OpenCharts zůstaly beze změny.
- Browser ověřil 1/2/4 charts, active-cell routing, maximize/restore, pravé a
  dolní overlaye, Replay ovládání, skutečný Binance USD-M Live feed, reload
  persistence a 390px layout bez document overflow. Původní localStorage byl po
  QA obnoven.
- Ověření: `npm test` 52 passed / 2 skipped; `npm run typecheck` PASS;
  `npm run build` PASS; `uv run pytest -q` 32 passed, 1 známé deprecation
  warning. Podrobnosti: `docs/2026-10-23-tradingview-shell-verification.md`.

## 2026-10-20 — Desktop shell

Ruling: samostatná macOS aplikace je chtěná pod dočasným názvem Whide Charts.
TradingView Desktop na tomto Macu je Electron 38 (ověřeno v `/Applications/TradingView.app`).
Shell bude Electron + stávající React UI + Python sidecar přes HTTP `/api`.
Tauri odloženo. Nepřepisovat do Swiftu/Rustu. Implementace byla tehdy odložena;
uživatel její start následně určil jako další etapu v handoffu 2026-10-26 výše.
Plán: `docs/superpowers/plans/2026-10-20-desktop-electron.md`.


Plán: `docs/superpowers/plans/2026-10-14-replay.md`

- Schválený základ a doplnění uživatele zapracovány.
- Ruling: Nový prázdný projekt nemá existující práci k izolaci; implementace přímo na nové větvi feat/replay.
- Ruling: Uživatel schválil návrh a požádal pokračovat; plán implementuji přímo bez dalšího schvalovacího kola.
- Pre-flight: Task 1 projektuje DataFrame; Task 2 vrací stejné OHLCV JSON; Task 3 jej pouze vykreslí. Task 4 používá stavové API stejného grafu. Rozhraní konzistentní.
- UI/UX: uživatel výslovně požádal použít designové skilly. Design variance 2, motion 1, density 8 podle požadovaného TV pracovního grafu; vlastní chrome kompaktní, bez marketingových karet a animovaných pozadí. Existující CSS přístup specifikovaný plánem zachován.
- Task 1: complete — 13 projekčních testů RED→GREEN, commit f6d1325.
- Task 2: complete — checksum/parser/catalog/API testy RED→GREEN, celkem 29 backend testů se sessions; commit 62f2ae8.
- Import: všech 174 archivů bez chyby; 1 990 080 minut na každý pár, 2023-01-01 00:00Z až 2026-10-14 00:00Z (end exclusive), bez mezer.
- Ruling: Headless veřejné Vela API místo shellu VelaWorkspace — zachovává existující renderer/kresby/indikátory, ale neumožní nativní replay menu obejít naše asOf; společné aplikační chrome je v Reactu.
- UI ověřeno: skutečný render 1280×720, UTC 10:25, roundtrip 5m→1h→5m bez ztráty času; position tool vytvořen, SL přetažen a R:R se změnilo z 2 na 1.15.
- Nezávislý review: dva P2 nálezy (viewport/pan a pořadí uložení). Přidány regresní testy, oba reprodukovány RED a opraveny GREEN.
- Ruling: Vývojový launcher ukládá data v projektové .data, aby byla současná ověřená historie rovnou dostupná. Samostatný backend má standardní macOS Application Support default; přenos dat není implicitní.
- Task 3: complete — graf a vlastní asOf transport, race testy, všech pět TF; typecheck/build a Vitest PASS. UI ověřeno na běžném laptopovém okně i 390px panelu, bez horizontálního overflow.
- Task 4: complete — SQLite obnova, parametry EMA50 zachované po reloadu, oddělené páry; serial save regression PASS. Launcher zsh syntax PASS, README připraven.
- Runtime: všechny nástroje uložené v SQLite (position long i short, trendline, box, fibretracement, hline, datepricerange, text s obsahem). SL drag změnil R:R, entry a TP drag ověřeny. Play 5× skutečně postupoval, pause zastavilo čas.
- Offline: API replay i session testovány se zakázaným socket.connect; bez síťové závislosti. Fonty i assety jsou lokální. Browser console bez error/warn.
- UI refinement: zachovat bezpečný starší prefix při forward loadu místo blikání; při rewindu/změně trhu/verze skrýt ihned podle skutečně painted klíče. Samostatný regresní test PASS.
- Ruling: přidáno přístupné české menu Kreslení nad existující setTool API, protože úzké nativní flyout cíle se při ověřování obtížně aktivovaly. Kreslicí logika se neduplikuje.

## 2026-10-22 — OpenCharts jako hlavní aplikace

- Uživatel schválil OpenCharts jako hlavní aplikaci a dodal deset TradingView desktop screenshotů jako vizuální referenci pro následující UI práci. Specifikace je v `docs/superpowers/specs/2026-10-22-opencharts-main-app-design.md`.
- Root `index.html` nyní načítá `web/compare/main.tsx`; Vite build má jen jediný `index.html` entrypoint. OpenCharts bootstrap načítá dataset version z `/api/markets`, nečte `/api/session` a zachovává `opencharts-preview:` localStorage namespace.
- Vela a OpenAlgo frontendy, HTML routes a npm dependencies byly odstraněny. Sdílený `Dialog` byl přesunut do `web/compare/Dialog.tsx`, protože ho používají settings OpenCharts studií. Backend historických dat, Live proxy, Vela session API/tabulky i lokální Parquet/SQLite data zůstaly zachované.
- Ověření: `npm ci --no-audit --no-fund` dokončeno (npm upozornil na dosud neschválený optional `fsevents` install script); `npm test` 40 passed / 2 skipped; `npm run typecheck` PASS; `npm run build` PASS; `uv run pytest -q` 32 passed, 1 Starlette/httpx deprecation warning.
- Browser: `/` načetl OpenCharts a požádal jen `/api/markets` a `/api/bars`, nikdy `/api/session`. Replay další svíčka posunula cutoff 19:22 → 19:25 UTC; Live se připojil ke skutečnému Binance USD-M feedu a po návratu do Replay se zachoval čas. Trendline přežila reload a EMA settings dialog se otevřel. V izolovaném 1280×800 incognito kontextu načetl prázdný i úmyslně poškozený workspace bezpečné výchozí nastavení. Po testu byl původní `opencharts-preview:` localStorage snapshot obnoven a stránka znovu načtena.
- Produkční `dist/` obsahuje pouze `index.html`; `/compare.html` a `/openalgo.html` vracejí 404. Automatizovaný browser snapshot opakovaně překročil timeout; stránka byla ověřena přes úspěšné navigace, DOM evaluaci a skutečné UI interakce, takže samostatný console snapshot zůstává neověřený.

## 2026-10-14 — Live / Replay + terminal redesign

Added public Binance USD-M live candles alongside isolated replay, automatic stale detection/reconnect/backfill, separate Live drawing storage and shared appearance settings. Compact terminal chrome follows supplied TradingView references; candle zoom remains user controlled. Verification: 25 frontend + 32 backend tests; 2 opt-in real Binance tests (all 15 streams + forced reconnect) passed. See `docs/2026-10-14-live-verification.md`.
# 2026-10-25 — Native drawing tools pack

- Added Brush, Highlighter, Path, Polyline, Curve, Price Range, Date Range,
  Date & Price Range, Anchored Text and Note to the patched OpenCharts drawing
  engine.
- Added one exported tool catalog shared by the fixed rail, legacy drawing
  dropdown and future Favorites implementation.
- Added native data-space persistence, resolution, rendering, hit-testing,
  placement, body/anchor editing, copy/nudge support and range readouts.
- Rebuilt the vendor patch/tarball, refreshed lockfile integrity and verified
  clean host installation.
- Current evidence and the exact browser scenarios are in
  `docs/2026-10-25-drawing-tools-pack-verification.md`.
- The TradingView-like drawing settings redesign and movable Favorites bar are
  intentionally still the next stages; no commit was created.

## 2026-10-26 — TradingView-like drawing settings

- Replaced the generic drawing editor with contextual Style, Text,
  Coordinates, Visibility and Position Inputs tabs, transactional preview with
  Cancel rollback, normalized OK persistence and family-aware defaults.
- Added the selected-object toolbar with contextual controls, chart-relative
  anchoring, viewport clamping and an internal narrow-width overflow region.
  The primary 40 px workspace drawing rail remains fixed and unchanged.
- Rectangle and Long Position were verified in the built application. The
  final expanded Rectangle toolbar exposed visibility and ordering actions at
  1280×800. A preceding 390×720 browser run kept the toolbar within x=48–342
  with no horizontal overflow; final expanded-control geometry is covered by
  automated viewport tests. Rectangle Cancel preserved JSON byte-for-byte; OK
  persisted width 4 across reload.
- Rebuilt the pinned OpenCharts patch and tarball. A fresh clone reproduced the
  tracked package exactly (SHA-256
  `07dec58422cffeb415de50197cd0024091a90146f43790bff22315f8f99082ce`).
- Final review fixes connected Position presentation/stats, drawing z-order,
  Fibonacci family defaults, attached text and compact range labels to their
  renderers instead of leaving settings inert.
- Verification: vendor 302 passed / 1 skipped; host 55 passed / 2 skipped;
  backend 32 passed with the known deprecation warning; typechecks and build
  passed. Details: `docs/2026-10-25-drawing-settings-verification.md`.
- Favorites remains the next stage. No commit was created, matching the agreed
  Settings plus Favorites checkpoint.

## 2026-10-26 — Interface alignment pass

- Preserved all compact bar/control heights and corrected internal icon, text,
  select/input and tabular-number centering across host chrome and OpenCharts.
- Added stable alignment hooks and regressions for workspace rails/replay/status,
  drawing settings, the selected-drawing toolbar and Chart Settings close icon.
- Browser measurements covered 1280×800, emulated 390×720, 1/2/4 charts and a
  200% CSS-zoom stress proxy. The fixed drawing rail stayed at x=0 and the
  390 px viewport kept scroll width at 390 px.
- Replaced the native pair selector with a compact anchored menu and fixed new
  drawing selection in stay-in-drawing-mode so its style/settings toolbar is
  immediately available.
- Rebuilt the pinned OpenCharts package from a clean clone. Final SHA-256:
  `442e076f442f2d04d7bb075845582ec36476861a3ff1fe6c805aea8429e21503`.
- Refined Rectangle and Trend Line settings to the supplied TradingView
  geometry: 380px desktop dialog, shared 112px label axis, compact 34px
  controls, paired Text alignment selects and overflow-free narrow layout.
  Rebuilt the pinned package; current SHA-256:
  `50f2736842d2c3abf5e7b07f3c7fcb612021997d3e8c29649faba2145e6ca99b`.
- Verification details: `docs/2026-10-26-interface-alignment-verification.md`.
  Favorites remains next; no commit was created.
