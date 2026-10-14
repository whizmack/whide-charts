"""Immutable market files with versioned SQLite manifests."""

import hashlib
import json
import re
import sqlite3
import uuid
from pathlib import Path

import numpy as np
import pandas as pd

SYMBOLS = ("BTCUSDT", "ETHUSDT", "SOLUSDT")
COLUMNS = ["time", "open", "high", "low", "close", "volume"]


def validate_frame(frame: pd.DataFrame) -> pd.DataFrame:
    out = frame[COLUMNS].copy()
    if out.empty or not np.isfinite(out.to_numpy(dtype=float)).all():
        raise ValueError("The archive is empty or contains invalid numbers.")
    if (out.time % 60000 != 0).any() or (out.time < 1672531200000).any() or (out.time > 4102444800000).any():
        raise ValueError("Invalid one-minute timestamps. Expected UTC milliseconds from 2023 onward.")
    out["time"] = out.time.astype("int64")
    out = out.sort_values("time").reset_index(drop=True)
    if (out.time.diff().dropna() != 60000).any():
        raise ValueError("The archive contains gaps or duplicates.")
    if ((out[["open", "high", "low", "close"]] <= 0).any().any() or (out.volume < 0).any()
            or (out.high < out[["open", "close", "low"]].max(axis=1)).any()
            or (out.low > out[["open", "close", "high"]].min(axis=1)).any()):
        raise ValueError("The archive contains invalid OHLCV data.")
    return out


class Store:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.db_path = self.root / "app.sqlite3"
        with self.connect() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS imports (
                    symbol TEXT, period TEXT, path TEXT, checksum TEXT,
                    source TEXT, first INTEGER, last INTEGER, rows INTEGER,
                    PRIMARY KEY(symbol, period));
                CREATE TABLE IF NOT EXISTS datasets (version TEXT PRIMARY KEY, manifest TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                PRAGMA user_version=1;
            """)

    def connect(self):
        db = sqlite3.connect(self.db_path, timeout=30)
        db.row_factory = sqlite3.Row
        return db

    def manifest(self, version: str | None = None) -> list[dict]:
        with self.connect() as db:
            if version:
                row = db.execute("SELECT manifest FROM datasets WHERE version=?", (version,)).fetchone()
                if row is None:
                    raise KeyError("The saved dataset version is unavailable.")
                return json.loads(row[0])
            return [dict(r) for r in db.execute("SELECT * FROM imports ORDER BY symbol, period")]

    @staticmethod
    def fingerprint(manifest):
        return hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()

    def version(self):
        return self.fingerprint(self.manifest())

    def installed(self, symbol: str, period: str) -> bool:
        return any(p["symbol"] == symbol and (p["period"] == period or (len(period) == 10 and p["period"] == period[:7])) for p in self.manifest())

    def install(self, symbol: str, period: str, frame: pd.DataFrame, checksum: str, source: str):
        if symbol not in SYMBOLS or not re.fullmatch(r"\d{4}-\d{2}(?:-\d{2})?", period) or not re.fullmatch(r"[a-f0-9]{64}", checksum):
            raise ValueError("Invalid market, date or checksum.")
        frame = validate_frame(frame)
        relative = Path("market") / symbol / "1m" / f"{period}-{checksum}.parquet"
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        stage = path.with_suffix(f".{uuid.uuid4().hex}.tmp")
        try:
            frame.to_parquet(stage, index=False, compression="zstd")
            stage.replace(path)
        finally:
            stage.unlink(missing_ok=True)
        with self.connect() as db:
            if len(period) == 7:
                db.execute("DELETE FROM imports WHERE symbol=? AND period LIKE ?", (symbol, period+"-%"))
            db.execute("INSERT OR REPLACE INTO imports VALUES (?,?,?,?,?,?,?,?)", (
                symbol, period, str(relative), checksum, source,
                int(frame.time.iloc[0]), int(frame.time.iloc[-1]), len(frame),
            ))
            manifest = [dict(r) for r in db.execute("SELECT * FROM imports ORDER BY symbol, period")]
            version = self.fingerprint(manifest)
            db.execute("INSERT OR IGNORE INTO datasets VALUES (?,?)", (version, json.dumps(manifest)))

    def read(self, symbol: str, start: int, end: int, version: str | None = None) -> pd.DataFrame:
        parts = [p for p in self.manifest(version) if p["symbol"] == symbol and p["last"] >= start and p["first"] < end]
        frames = [pd.read_parquet(self.root / p["path"], filters=[("time", ">=", start), ("time", "<", end)]) for p in parts]
        return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=COLUMNS)

    def markets(self, version: str | None = None):
        manifest = self.manifest(version)
        output = []
        for symbol in SYMBOLS:
            parts = sorted([p for p in manifest if p["symbol"] == symbol], key=lambda p: p["first"])
            ranges = []
            for part in parts:
                if ranges and ranges[-1]["end"] == part["first"]:
                    ranges[-1]["end"] = part["last"]+60000
                else:
                    ranges.append({"start": part["first"], "end": part["last"]+60000})
            output.append({"symbol": symbol, "ranges": ranges, "rows": sum(p["rows"] for p in parts)})
        return output
