"""Binance USD-M archives only. No credentials, sockets or trading endpoints."""

import calendar
import hashlib
import io
import time
import zipfile
from datetime import date, datetime, timedelta, timezone

import httpx
import pandas as pd

from .storage import COLUMNS, Store, validate_frame

DATA_TERMS = "https://github.com/binance/binance-public-data/blob/master/TERMS_AND_CONDITIONS.md"


def parse_archive(data: bytes, checksum: str) -> pd.DataFrame:
    if hashlib.sha256(data).hexdigest() != checksum:
        raise ValueError("Nesouhlasí SHA-256 checksum archivu. Zkuste stažení zopakovat.")
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        files = [p for p in z.infolist() if p.filename.endswith(".csv")]
        if len(files) != 1 or files[0].file_size > 64*1024*1024:
            raise ValueError("Archiv nemá očekávaný CSV soubor.")
        text = z.read(files[0])
    header = not text.split(b",", 1)[0].isdigit()
    frame = pd.read_csv(io.BytesIO(text), header=0 if header else None, usecols=range(6))
    frame.columns = COLUMNS
    for c in COLUMNS:
        frame[c] = pd.to_numeric(frame[c], errors="raise")
    return validate_frame(frame)


def periods(start: date, end: date):
    """Prefer complete historical months, then daily files for partial months."""
    today = datetime.now(timezone.utc).date()
    cursor = start
    while cursor <= end:
        last = cursor.replace(day=calendar.monthrange(cursor.year, cursor.month)[1])
        if cursor.day == 1 and last <= end and (cursor.year, cursor.month) < (today.year, today.month):
            yield cursor.strftime("%Y-%m"), False
            cursor = last + timedelta(days=1)
        else:
            yield cursor.isoformat(), True
            cursor += timedelta(days=1)


def import_archive(store: Store, symbol: str, period: str, daily=False, client: httpx.Client | None = None):
    if store.installed(symbol, period):
        return "cached"
    cadence = "daily" if daily else "monthly"
    name = f"{symbol}-1m-{period}.zip"
    url = f"https://data.binance.vision/data/futures/um/{cadence}/klines/{symbol}/1m/{name}"
    def download(c):
        for attempt in range(3):
            try:
                response = c.get(url)
                response.raise_for_status()
                check = c.get(url+".CHECKSUM")
                check.raise_for_status()
                return response.content, check.text.split()[0]
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404 or attempt == 2:
                    raise
                time.sleep(attempt+1)
            except httpx.TransportError:
                if attempt == 2:
                    raise
                time.sleep(attempt+1)
    if client is not None:
        data, checksum = download(client)
    else:
        with httpx.Client(timeout=60, follow_redirects=True) as c:
            data, checksum = download(c)
    frame = parse_archive(data, checksum)
    first = datetime.fromisoformat(period if daily else period+"-01").replace(tzinfo=timezone.utc)
    days = 1 if daily else calendar.monthrange(first.year, first.month)[1]
    if len(frame) != days*1440 or int(frame.time.iloc[0]) != int(first.timestamp()*1000):
        raise ValueError(f"Archiv {symbol} {period} nemá úplné minutové pokrytí.")
    store.install(symbol, period, frame, checksum, url)
    return "imported"
