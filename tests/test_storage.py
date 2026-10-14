import hashlib
import io
import zipfile

import pandas as pd
import pytest

from backend.importer import parse_archive
from backend.storage import Store

BASE = 1672531200000


def frame(start=0, count=10):
    return pd.DataFrame([dict(time=BASE+i*60000, open=100, high=102, low=99, close=101, volume=2) for i in range(start, start+count)])


def archive(header=True, high="102"):
    csv = ("open_time,open,high,low,close,volume,close_time\n" if header else "")
    csv += f"{BASE},100,{high},99,101,2,{BASE+59999}\n"
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as z:
        z.writestr("BTCUSDT-1m-2023-01.csv", csv)
    return out.getvalue()


@pytest.mark.parametrize("header", [True, False])
def test_parse_header_and_no_header(header):
    data = archive(header)
    result = parse_archive(data, hashlib.sha256(data).hexdigest())
    assert result.time.tolist() == [BASE]
    assert result.volume.tolist() == [2]


def test_checksum_mismatch_is_rejected():
    with pytest.raises(ValueError, match="checksum"):
        parse_archive(archive(), "0"*64)


@pytest.mark.parametrize("high", ["80", "nan", "inf"])
def test_invalid_ohlc_rejected(high):
    data = archive(high=high)
    with pytest.raises(ValueError):
        parse_archive(data, hashlib.sha256(data).hexdigest())


def test_catalog_and_immutable_dataset_versions(tmp_path):
    store = Store(tmp_path)
    store.install("BTCUSDT", "2023-01", frame(), "a"*64, "test")
    old = store.version()
    store.install("BTCUSDT", "2023-01", frame(count=20), "b"*64, "test")
    assert old != store.version()
    assert len(store.read("BTCUSDT", BASE, BASE+30*60000, old)) == 10
    assert len(store.read("BTCUSDT", BASE, BASE+30*60000)) == 20


def test_duplicate_and_gap_cannot_enter_store(tmp_path):
    store = Store(tmp_path)
    for bad in [pd.concat([frame(), frame().iloc[[2]]]), frame().drop(index=2)]:
        with pytest.raises(ValueError):
            store.install("BTCUSDT", "2023-01", bad, "a"*64, "test")
    assert store.markets()[0]["ranges"] == []


def test_failed_install_does_not_publish_catalog(tmp_path):
    store = Store(tmp_path)
    with pytest.raises(ValueError):
        store.install("BTCUSDT", "../bad", frame(), "a"*64, "test")
    assert not list(tmp_path.rglob("*.parquet"))
