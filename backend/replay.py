"""Project completed one-minute candles onto a chart without future information."""

import pandas as pd

MINUTE = 60_000
TIMEFRAMES = {"1m": 1, "5m": 5, "15m": 15, "1h": 60, "4h": 240}


class DataGap(ValueError):
    """A price series cannot safely form complete or partial candles."""


def project_bars(frame: pd.DataFrame, as_of: int, minutes: int, limit: int = 500) -> list[dict]:
    if minutes not in TIMEFRAMES.values() or not 1 <= limit <= 2000:
        raise ValueError("Unsupported timeframe or window size.")
    if frame.empty:
        return []
    known = frame.loc[frame.time + MINUTE <= as_of].sort_values("time").copy()
    if known.empty:
        return []
    # Validate BEFORE grouping: resample must never disguise a missing minute.
    if (known.time.diff().dropna() != MINUTE).any():
        raise DataGap("History contains missing or duplicate minutes. Download the missing data.")
    width = minutes * MINUTE
    first_full_bucket = ((int(known.time.iloc[0]) + width - 1) // width) * width
    known = known.loc[known.time >= first_full_bucket]
    if known.empty:
        return []
    known["bucket"] = (known.time // width) * width
    out = known.groupby("bucket", sort=True).agg(
        open=("open", "first"), high=("high", "max"), low=("low", "min"),
        close=("close", "last"), volume=("volume", "sum"),
    ).tail(limit)
    return [{"time": int(t), **{k: float(v) for k, v in row.items()}} for t, row in out.iterrows()]
