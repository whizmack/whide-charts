# Replay — průběh

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

## 2026-10-14 — Live / Replay + terminal redesign

Added public Binance USD-M live candles alongside isolated replay, automatic stale detection/reconnect/backfill, separate Live drawing storage and shared appearance settings. Compact terminal chrome follows supplied TradingView references; candle zoom remains user controlled. Verification: 25 frontend + 32 backend tests; 2 opt-in real Binance tests (all 15 streams + forced reconnect) passed. See `docs/2026-10-14-live-verification.md`.
