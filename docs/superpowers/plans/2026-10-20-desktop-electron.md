# Desktop shell: Electron (Whide Charts)

Status: směr schválen 20. 10. 2026; dne 26. 10. 2026 uživatel určil Electron
desktop shell jako **další hlavní etapu**. Implementace zatím nezačala.
Název produktu je zatím dočasný: **Whide Charts**.

## Handoff 2026-10-26

TradingView-like webový workspace včetně fixního drawing railu, rozšířených
drawing tools, contextual settings a alignment passu je dokončený, commitnutý
a pushnutý na `main` jako `956b02b`. Aktuální hlavní UI je OpenCharts na
`/`; starší zmínky o `/compare.html`, Vela nebo volbě grafového enginu už
nejsou implementační zadání.

Před zahájením kódu z tohoto rozhodovacího dokumentu vytvoř nebo aktualizuj
konkrétní implementační plán proti současnému stromu. První milestone má být
minimální vývojový Electron shell nad existujícím UI a stávajícím FastAPI
kontraktem, ne redesign ani přepis backendu. Po jeho zprovoznění se má další
UI práce — zejména samostatná pohyblivá Favorites drawing lišta — dělat a
ověřovat uvnitř desktopové aplikace. Fixní levý 40px rail zůstává beze změny.

Související: `docs/2026-10-14-architecture-proposal.md` (původně odložilo wrapper
až po funkčním replayi), `docs/2026-10-15-tradingview-open-source-research.md`
(grafový engine), `docs/superpowers/plans/2026-10-15-chart-workspace-reference.md`
(TV-like workspace).

## Cíl

Whide Charts má působit a fungovat jako TradingView Desktop na Macu: graf,
kreslení, panely, zkratky, replay i samotné okno aplikace. Pixel-perfect klon
proprietary TV enginu není cílem a není dostupný. Cíl je UX vzor a stejný typ
kontejneru.

## Co je TradingView Desktop

Ověřeno na tomto Macu, `/Applications/TradingView.app` 3.3.0.7992:

- Electron, ne Swift. `NSPrincipalClass = AtomApplication`, `app.asar`,
  `Electron Framework.framework`, Helper GPU/Renderer procesy.
- Electron 38.2.2, Chromium 140. Universal binary (arm64 + x86_64).
- Oficiální release notes později uvádějí update Electronu na 41.
- Stejná webová platforma jako v prohlížeči. Desktop přidává hlavně okna:
  multi-monitor, obnovení tabů, propojené tickery, sync křížku, nativní
  notifikace.

Proto TV na Macu nepůsobí nativně. Pocit produktu dělá webový graf, ne AppKit.

## Rozhodnutí

**Shell: Electron + stávající React UI + Python sidecar.**

Tauri 2 odložit. Menší `.app` nestojí za WKWebView u canvas grafů. Electron je
stejný kontejner a stejný engine, ve kterém běží TradingView.

Přepis UI nebo backendu do Rustu/Swiftu se nedělá.

Electron teď není o hodně těžší než Tauri. Těžká část je u obou stejná: zabalit
Python, codesign a životní cyklus procesu. Okno je tenký obal.

Přestup Electron → Tauri později zůstává lehký, pokud UI dál mluví jen na Python
přes HTTP `/api`. Shell pak jen otevře okno, spustí backend a při quit ho zabije.

## Architektura wrapperu

Neměnit kontrakt `React ↔ FastAPI`. Electron nesmí převzít replay, import,
sessions ani filesystem grafu.

```
TradingView.app (Electron)
  Chromium okno → tradingview.com web UI

Whide Charts.app (Electron)
  Chromium okno → lokální Vite/dist UI
  sidecar: Python/uvicorn na 127.0.0.1 (stejné API jako dnes)
  data: Application Support / PERP_REPLAY_DATA_DIR
```

Povolené v Electronu:

- okno, Dock, ikona, menu, quit
- spawn/kill Python sidecar a čekání, až `/api` žije
- codesign, auto-update později
- volitelně později: více oken, obnovení layoutu monitorů, nativní notifikace

Zakázané v Electronu:

- Tauri/Electron commandy místo `/api`
- čtení Parquet/SQLite z main procesu
- business logika replaye, importu, journalu

Launcher `./scripts/start.sh` a prohlížeč zůstávají vývojovou cestou, dokud
`.app` neexistuje.

## Co z TV pocitu není shell

Kompaktní terminál, kresby, magnet, indikátorové panely, multi-chart, sync
křížku uvnitř workspace, replay `asOf`. To zůstává v Reactu a zvoleném grafovém
enginu (Vela / OpenCharts / OpenAlgo podle samostatných plánů).

Electron bez tohoto UI TradingView nepřipomíná. Toto UI v Chromu bez Electronu
TradingView připomíná víc než nativní WKWebView s chudým grafem.

## Tradeoff

Větší `.app` (TV dmg je ~200 MB) a dva runtime (Chromium + Python). Výměna:
stejný render jako TV, JS main process, známý sidecar vzor.

## Implementační start

Navazující konkrétní implementační plán má pokrýt:

1. Minimální Electron okno nad `dist/` nebo Vite dev, bez změny API.
2. Sidecar: start uvicorn, health, graceful quit, datová cesta.
3. macOS `.app` (arm64 nejdřív), ikona, menu, loopback only.
4. Balení Python (uv/venv nebo standalone) a codesign.
5. Ověření: replay, Live, kreslení, hlavní OpenCharts UI na `/`, quit zabije
   backend, data zůstanou v Application Support.

Do dokončení prvního desktop milestone zůstává React + FastAPI + `start.sh`
plně podporovanou vývojovou cestou; Electron nesmí rozbít browser workflow.
