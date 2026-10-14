# Replay — závěrečné ověření 14. října 2026

- Backend: 30 testů prošlo. Frontend: 15 testů prošlo. TypeScript a produkční Vite build prošly.
- Projekce: všech pět TF, partial OHLCV, budoucí sentinel ceny/volume, minute boundary,
  UTC 4h buckets, mezery, duplicity a neúplný počáteční bucket.
- Data: 174 Binance USD-M 1m archivů, všechny SHA-256 souhlasí. BTC, ETH i SOL
  mají každý 1 990 080 minut bez mezer, 2023-01-01 00:00Z až 2026-10-14 00:00Z
  (konec exclusive). Celkem 5 970 240 minutových svíček; lokální složka asi 154 MB.
- Čas replaye ve skutečném UI: 2023-01-08 10:25 UTC, 5m→1h→5m zachová 10:25;
  jednotlivý krok přejde na 10:30, play při 5× postupuje a pause zastaví čas.
- Graf: skutečný nativní Vela renderer, EMA/Volume, osy a crosshair; všechny
  požadované kresby byly vytvořeny a ověřeny v uloženém SQLite snapshotu.
- Pozice: long i short, změny entry/SL/TP přetažením; například přetažení SL
  změnilo zobrazené R:R z 2 na 1.15. Jde o kreslicí nástroj, ne výsledek obchodu.
- Indikátory: všech šest přidáno a vykresleno; EMA 50 a ostatní inputs přežily reload.
- Sessions: kresby a čas obnoveny pozastavené; přepnutí na ETH skrylo BTC kresby,
  návrat je obnovil. Text „Ověřovací text“ byl potvrzen a uložen.
- UI: ověřeno ve standardním laptopovém okně i 390px úzkém panelu; přístupné
  vlastní dialogy, popisky a focus; fonty a assety jsou lokální. Browser log bez error/warn.
- Offline: datové a session API projdou i při blokovaném socket.connect.
- Nezávislá kontrola našla viewport a session-save-order chyby. Obě byly
  reprodukovány regresními RED testy, opraveny a znovu zkontrolovány; žádný
  zbývající P1/P2 nález v kontrolovaném rozsahu.

Ověřovací session je zálohována v `.data/verification-session.json`; aktuální
session byla před předáním vyčištěna, aby aplikace začínala přehledným grafem.
Historická data zůstávají dostupná. Výchozí session používá EMA 20 a Volume.

Journal, P&L, vyhodnocování SL/TP a Freqtrade běhy patří do dalších etap.
Pine Script není zahrnut. Nebyl proveden screen-reader test ani distribuční
Mac installer; aplikace je lokální web spuštěný launcherem.
