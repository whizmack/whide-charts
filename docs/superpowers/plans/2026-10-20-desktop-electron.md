# Desktop shell: Electron (Whide Charts)

Status: směr schválen 20. 10. 2026; dne 26. 10. 2026 uživatel určil Electron
desktop shell jako **další hlavní etapu**. První desktop milestone byl dokončen
27. 10. 2026. Název produktu je **Whide Charts**. Aktuální evidence je v
[`docs/2026-10-27-whide-charts-desktop-verification.md`](../../2026-10-27-whide-charts-desktop-verification.md).

## Handoff 2026-10-26

TradingView-like webový workspace včetně fixního drawing railu, rozšířených
drawing tools, contextual settings a alignment passu je dokončený, commitnutý
a pushnutý na `main` jako `956b02b`. Aktuální hlavní UI je OpenCharts na
`/`; starší zmínky o `/compare.html`, Vela nebo volbě grafového enginu už
nejsou implementační zadání.

První milestone je hotový: lokální arm64 `.app` nad současným OpenCharts rootem
`/` a stávajícím FastAPI kontraktem. Další UI práce — zejména samostatná
pohyblivá Favorites drawing lišta — se má dělat a ověřovat uvnitř desktopové
aplikace. Fixní levý 40px rail zůstává beze změny.

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

Launcher `./scripts/start.sh` a prohlížeč zůstávají vývojovou cestou vedle `.app`.

## Co z TV pocitu není shell

Kompaktní terminál, kresby, magnet, indikátorové panely, multi-chart, sync
křížku uvnitř workspace, replay `asOf`. To zůstává v Reactu v hlavní aplikaci OpenCharts na `/`.

Electron bez tohoto UI TradingView nepřipomíná. Toto UI v Chromu bez Electronu
TradingView připomíná víc než nativní WKWebView s chudým grafem.

## Tradeoff

Větší `.app` (TV dmg je ~200 MB) a dva runtime (Chromium + Python). Výměna:
stejný render jako TV, JS main process, známý sidecar vzor.

## První implementační milestone · 2026-10-27

**Goal:** Vytvořit arm64 `Whide Charts.app`, kterou lze otevřít jako běžnou aplikaci a
nechat běžet z Docku. Okno zobrazuje současné OpenCharts UI na `/`; Electron
spustí zabalený FastAPI sidecar a při ukončení zavře pouze sidecar, který sám
spustil.

**Architecture:** Electron načte stávající build `dist/` přes loopback FastAPI
na stabilním `127.0.0.1:8765`. Stabilní origin zachová desktopové localStorage
mezi spuštěními. Backend se nejprve pokusí obsloužit existující kompatibilní
server na tomto portu, jinak spustí vlastní zabalený sidecar. Build vygeneruje
PyInstaller executable a Electron Builder `.app` pro arm64. První instalace
ukáže existující projektové `.data` přes uloženou cestu; Parquet ani SQLite se
nekopírují, nemažou ani nemigrují.

**Tech Stack:** Electron, electron-builder, stávající React 19/Vite build,
FastAPI/Uvicorn, PyInstaller, npm a uv se stávajícími lockfiles.

### Globální omezení

- OpenCharts zůstává hlavní UI na `/`; nepřidávat další renderer ani API.
- Backend binduje pouze na `127.0.0.1`; port aplikace je `8765`.
- Připojení k existujícímu serveru je povoleno jen po úspěšném `/api/health`.
- Při zavření okna ukončit pouze child process vlastněný Electronem.
- Datová cesta první instalace je existující `.data`; nikdy automaticky
  nekopírovat, přesouvat ani mazat historii.
- První artefakt cílí na Apple Silicon arm64 a lokální použití tohoto Macu.
  Developer ID, notarizace, updater, Intel build a distribuce jsou mimo scope.
- Zachovat webový launcher `scripts/start.sh`, Vite workflow a API kontrakt.

### Review focus

- Port `8765` už obsluhuje host aplikaci: ověřit `/api/health`, připojit se bez
  spawnování druhého backendu a při quit ponechat host proces běžet.
- Port je obsazen nesouvisející službou: zobrazit srozumitelnou chybu a službu
  ani proces neukončit.
- Sidecar se nespustí nebo neprojde health checkem: ukončit vlastněný proces a
  zobrazit chybu s logem cesty ke spuštění.
- App se ukončí během bootu nebo uživatel zvolí Quit: uklidit vlastněný sidecar.
- Projekt `.data` není dostupný: použít standardní
  `~/Library/Application Support/PerpReplay` cestu, aniž by se data automaticky
  přesouvala.

### Soubory a odpovědnosti

- `desktop/main.cjs`: Electron lifecycle, bezpečné okno, backend discovery,
  sidecar spawn/cleanup a lokální error dialog.
- `backend/desktop.py`: Uvicorn entry point se stabilním loopback bindem a
  environment konfigurací portu/datové cesty.
- `backend/app.py`: read-only `/api/health` a volitelná cesta `dist/` z
  `PERP_REPLAY_WEB_DIR`; webový launcher zachová default z repozitáře.
- `desktop/pyinstaller.spec`: zabalit backend a Python runtime jako onedir sidecar
  bez opakovaného one-file rozbalování při startu.
- `electron-builder.yml`: arm64 `Whide Charts.app`, backend + `dist/` resources,
  bundle id `com.whiz.whidecharts` a výstup do `~/Applications`.
- `scripts/build-desktop.mjs`: sestavení webu, PyInstaller sidecar, počáteční
  datová cesta a Electron Builder v pevném pořadí.
- `package.json`, `package-lock.json`, `pyproject.toml`, `uv.lock`,
  `desktop/package.json`: nové nástroje a desktop příkazy; zachovat jeden
  správce pro každý ekosystém.
- `README.md`: pokyny pro sestavení a spuštění desktop app vedle webového
  launcheru.

### Stav milestonu 1 · dokončeno 2026-10-27

- [x] `/api/health` a desktopový Uvicorn entry point; standardní `application()`
  a webový launcher zůstávají dostupné.
- [x] Electron `BrowserWindow`, ověření kompatibilního backendu, spawn sidecaru,
  startovní chyba a ukončení pouze vlastního procesu.
- [x] PyInstaller onedir sidecar pro arm64 Python 3.12.
- [x] Electron Builder `.app` a opakovatelný build/install do
  `~/Applications/Whide Charts.app`.
- [x] README, TypeScript/Vite build, Replay UI a API, podpis bundle a sidecar
  lifecycle ověřeny; Live režim zůstává neověřený.

Po tomto milestone pokračuje Favorites drawing lišta uvnitř desktopové app.
Podepsaná/notarizovaná distribuce pro jiné Macy bude samostatný plán, který
zachová stejný React ↔ FastAPI kontrakt.
