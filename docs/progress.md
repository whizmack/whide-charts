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

## 2026-10-27 — Replay loading and Live resume

- Replay forward steps now keep the previous safe frame visible while the next
  request resolves. The loading overlay appears only when there is no safe
  frame; rewind still hides bars beyond the cutoff immediately.
- `LiveFeed` starts REST history hydration alongside the WebSocket handshake.
  `livePool` retains each pair/timeframe's latest rolling window in process
  memory after the last chart unsubscribes, while stopping its socket and
  recovery timers. Returning to the same Live selection renders the cached
  window immediately and reconnects. The cache is not persisted, so the first
  Live load after app restart still depends on Binance.
- Verified Next and Play in the installed Electron app without the transient
  Replay loading overlay. After Live had hydrated, switching Replay → Live
  rendered the cached candles on first observation (~0.7 s), then recovered
  from a brief stale/reconnecting status to Live. The original paused Replay
  workspace was restored afterwards.
- Verification: `npm test` 61 passed / 2 skipped; `npm run typecheck` and
  `npm run build` passed; `uv run pytest -q` 32 passed with one existing
  Starlette/httpx deprecation warning.

## 2026-10-27 — TradingView-style chart settings

- Replaced the generic chart dialog with Symbol, Status line, Scales and lines,
  and Canvas tabs, connected to shared workspace preferences and real chart,
  axis, legend, and canvas effects.
- Added transactional draft preview, OK commit, Cancel/Escape/backdrop rollback,
  tab-scoped reset, and local named settings templates.
- Rebuilt the pinned OpenCharts package from a clean clone, refreshed the host
  lockfile, and installed the updated Electron app. Tarball SHA-256:
  `e9e7b2accae49ad8ad1a2de5eca8f1a65ffd67be7f43c81b1cfb9fc0689f64db`.
- Fixed a backdrop dismissal bug found in the installed app and added a vendor
  regression test. Vendor suite: 324 passed / 1 skipped. Host suite: 62 passed /
  2 skipped; typecheck and build passed; backend: 32 passed with the existing
  Starlette/httpx deprecation warning.
- Electron checks covered settings in 1/2/4 chart layouts, template workflows,
  Cancel/Escape/backdrop, reset, shared status-line effects, OK persistence
  after reload, and restoring the original one-chart paused Replay workspace.
  Responsive checks at 1280×720 and 390×720 remain unverified because CUA
  window-coordinate input returned `noWindowsAvailable`. Live TradingView
  settings interactions also remain unverified because its visible settings
  panel could not be rendered by CUA. Full evidence:
  `docs/2026-10-27-chart-settings-verification.md`.

## 2026-10-27 — TradingView shell parity baseline

- Inspected the live TradingView chart shell and Go to date dialog alongside
  the Whide Charts `/` preview and the supplied desktop references. Recorded
  verified matches, visual/function gaps, product-specific exclusions, and the
  next implementation order in `docs/2026-10-27-tradingview-parity-audit.md`.
- Added nine chart date-range controls, loaded-bar-bounded range mapping, a Go
  to loaded timestamp affordance, and a live UTC clock; aligned chart-bus IDs
  between the host controls and vendor renderer.
- Tuned the selected drawing tool surface toward TradingView's neutral dark
  selection color. The existing paused Replay timestamp and workspace were
  preserved during visual inspection.
- The Go to UI is still simpler than TradingView's Date/Custom range calendar;
  axis menus, the full indicator browser, broader toolbar menus, and floating
  Favorites remain follow-up work. This parity baseline is not a claim of
  complete one-to-one behavior.

## 2026-10-27 — TradingView menu audit and Go to calendar

- Inspected TradingView's interval picker, symbol search, chart-style list,
  settings shell and Go to dialog. The interval picker groups values by unit,
  exposes custom intervals and favorite stars; symbol search groups exchange
  instruments under asset-category tabs. These structures are recorded in the
  parity audit. AX state for some opened menus did not match the captured
  screenshot, so those details are marked as AX-only.
- Replaced the working-tree Go to form with a centered Date/Custom range
  dialog, UTC date/time fields, a bounded month calendar and range highlighting.
  Both date navigation and custom ranges stay inside the loaded bars.
- Targeted checks: 25 workspace/helper tests passed; `git diff --check` passed
  for the Go to files. The installed Electron app still serves the previous
  build; full build and visual verification remain outstanding.

## 2026-10-27 — TradingView axis and layout comparison

- Reopened the live TradingView Layout setup, price-scale menu, time-scale menu,
  and Settings while preserving BTCUSDT/1h and cancelling the settings dialog.
  The scale menus are separate and axis-specific. The Settings accessibility
  tree exposed Trading, Alerts, and Events controls, but their visible content
  could not be confirmed because screenshots stayed on Scales and lines.
- Rechecked Whide's open time-axis context menu: it is a generic five-action
  menu (reset view, copy price, alert, object tree, chart settings) centered on
  the plot, not an axis menu. Dismissed it without changing chart state.
- Changed the layout popover source styling to TradingView's black surface,
  neutral white selected state, subtle dividers and neutral checkbox accent.
  This was visually checked in the local Vite preview; no desktop package was
  rebuilt or installed.
- Recorded these observations in `docs/2026-10-27-tradingview-parity-audit.md`.
  The next shell-parity implementation priority remains separate, axis-anchored
  price-scale and time-scale menus with only supported real actions.

## 2026-10-27 — Axis menu parity follow-up

- Implemented and visually rechecked the installed Whide price-scale and
  time-scale menus beside TradingView: both open at the clicked axis, use a
  compact charcoal surface with separators, and expose only actions backed by
  chart behavior. The timezone submenu is tall, scrollable and opens beside the
  parent menu.
- Added the TradingView `Chongqing` timezone entry (`Asia/Chongqing`, UTC+8).
  TradingView also offers `Exchange`; Whide does not expose it until the
  preference can persist Exchange as a distinct value with Binance's UTC
  semantics.
- `npm run build` and `npm run desktop:build` passed. The rebuilt app was opened,
  its Live BTCUSDT/4h feed reconnected, and the timezone accessibility list
  confirmed `Chongqing` with UTC still selected. No settings or chart appearance
  were changed.
- TradingView remained BTCUSDT/1h. Its accessibility tree exposed UTC,
  Exchange, and the timezone list; during this pass, its screenshots stayed on
  the Events settings view, so the timezone observation is AX-only. A full
  matched-viewport layout-menu comparison is still outstanding.

## 2026-10-28 — TradingView layout menu follow-up

- Replaced Whide's text-and-checkbox layout popover with icon-only chart
  diagrams grouped by supported chart count, matching TradingView's compact
  rows, dark panel, separators, white selected tile, and neutral sync switches.
  Kept the five implemented layouts and the real Crosshair and Time & scrolling
  settings; did not add unsupported template or sync controls.
- Rebuilt the macOS desktop app with `npm run desktop:build` and opened it.
  Returned the workspace to Live BTCUSDT/4h; the accessibility state confirmed
  the Binance USD-M feed was updating. Opened the layout menus in both apps
  without selecting a layout. TradingView remained BTCUSDT/1h.
- Direct desktop screenshots show close agreement in panel width, tile size,
  row density, colors, dividers, selection and switches. Remaining differences
  are TradingView's larger set of layout templates and its Symbol, Interval
  and Date range sync controls, which Whide does not implement.
- No candle settings, symbol, timeframe, viewport, or workspace layout were
  changed. The chart-style preferences remain the user's own. The menus were
  compared at the current desktop sizes; matched 1280×720 and narrow-window
  checks remain outstanding.

## 2026-10-28 — TradingView indicator browser

- Replaced the small Indicators popover with a centered native browser modeled
  on TradingView's title, search, category rail and result-list composition.
  Tightened row density and gave real chart placement its own column.
- Kept the catalog to Whide's eight supported studies. Search, overlay and
  oscillator categories, aligned placement column, announced result count,
  visible category focus, Escape dismissal and focus return were checked in the
  installed Electron app beside TradingView. No study was selected or removed.
- `npm test`: 78 passed / 2 skipped; `npm run typecheck` and
  `npm run desktop:build` passed. The packaged app was returned to Live
  BTCUSDT/4h and its Binance USD-M feed updated.
- Matched 1280×720 and narrow 390×720 checks, plus study add/remove/settings
  behavior, remain open. Detailed evidence:
  `docs/2026-10-28-indicator-browser-verification.md`.
- Opened and cancelled Whide's packaged Go to dialog without submitting a date.
  TradingView's accessibility tree showed its Go to tabs, but its screenshot
  stayed on the indicator browser, so a direct visual comparison remains open.

## 2026-10-28 — TradingView time-scale labels

- Compared Whide's live Scales and lines tab against reference 05. Added
  **Day of week on labels**, enabled by default to match the reference and
  retained through the existing preference/template stores. Only daily axis
  ticks receive a weekday prefix in the selected display timezone; the numeric
  chart times and UTC Replay clock stay unchanged.
- The Labels submenu reports Price scale and Last value label checked; Lines
  reports Current price line checked. No submenu option or chart setting was
  changed. TradingView reported a user change while its price-scale menu was
  being opened, so the fresh submenu contents still need a direct comparison.
- In the pinned OpenCharts clone, 328 tests passed / 1 skipped, typecheck
  passed, and package check passed. The library build and pack completed; the
  build printed existing ImportMeta `env`/`glob` type diagnostics from the
  upstream declaration step. A clean host `npm ci` completed; host tests passed
  (78 passed / 2 skipped), typecheck and build passed, and
  `npm run desktop:build` exited 0 and installed the app under `~/Applications`.
- Live desktop verification of the new checkbox and rendered labels is still
  open: CUA timed out after 60 seconds when attaching to both the running app
  and the freshly built bundle. No settings were changed during those attempts.
- Reference 05 exposes further scale controls that Whide does not support yet.
  They remain audit gaps rather than inert checkboxes.

## 2026-10-28 — TradingView price-scale inversion

- Added the **Invert scale** checkbox to the price-axis context menu. Its
  shared preference defaults off, is included in settings templates, and maps
  to the pinned renderer's `invertScale` option on the selected left/right axis.
- TDD checks in the pinned OpenCharts clone failed first for the absent
  preference and mapping, then passed. The full vendor suite passed (331 passed
  / 1 skipped); typecheck, package check, and patch reproduction passed. A
  clean pinned clone built a tarball byte-identical to the source clone.
- Host `npm ci`, 78 tests / 2 skipped, typecheck, web build, and 32 backend
  tests passed. `npm run desktop:build` exited 0 and installed the app.
- The price-menu item still needs a visual check: CUA found both installed and
  build-output apps with the same bundle ID, then timed out reading the exact
  installed app path after 30 seconds. The app appeared as running afterward;
  no preference was toggled.

## 2026-10-28 — TradingView price-label overlap

- Added **No overlapping labels** to the Scales and lines tab. It defaults on,
  persists in shared chart preferences and templates, and uses the pinned
  renderer's `alignLabels` option on both price scales.
- TDD preference, option mapping and template tests failed first and passed
  after implementation. A settings-dialog test covers the checked default and
  toggle interaction.
- Pinned vendor tests passed (335 / 1 skipped), as did typecheck, package
  check, clean patch application and clean-clone packaging. The clean tarball
  matches the source-clone tarball byte-for-byte. `build:lib` exited 0 with
  existing upstream `ImportMeta.env` / `glob` declaration diagnostics.
- `npm run desktop:build` completed and installed the app. Computer Use timed
  out after 30 seconds while binding the exact installed app path; the checkbox
  and rendered label spacing remain visually unconfirmed. No chart setting was
  changed.

## 2026-10-30 — TradingView typography and OHLC status line

- Removed the active chart header's forced monospace styling and aligned its
  font with the TradingView stack used by the workspace, axes, price badges,
  picker, vendor UI utilities and drawing canvas labels. Numerals use tabular
  lining figures.
- OHLC and change values now use the displayed candle's rendered body color,
  including user-configured up/down colors and previous-close coloring in both
  Replay and Live.
- `npm test`: 81 passed / 2 skipped; typecheck, build and
  `npm run desktop:build` passed. Targeted vendor tests: 10 passed; vendor
  typecheck passed. The vendor tarball hash matches `package-lock.json`, and
  packaged JS/CSS match `dist`.
- The full upstream vendor suite still has 13 baseline failures, reproduced
  with the prior patch. Computer Use inventory sees TradingView and Whide, but
  attachment to either native window timed out. The new build is installed at
  `~/Applications/Whide Charts.app` using the existing `.data`; its already
  running process was not restarted during packaging. The user subsequently
  checked the newly opened build and confirmed it looks OK; no chart settings,
  drawings or Replay state were changed by the implementation pass.
- Detailed evidence: `docs/2026-10-29-color-picker-axis-label-verification.md`.
