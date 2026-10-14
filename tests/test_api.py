from fastapi.testclient import TestClient

from backend.app import create_app
from backend.storage import Store
from tests.test_storage import BASE, frame


def client(tmp_path):
    store = Store(tmp_path)
    store.install("BTCUSDT", "2023-01", frame(count=120), "a"*64, "test")
    return TestClient(create_app(store)), store


def test_api_returns_safe_partial_and_preserves_clock(tmp_path):
    api, _ = client(tmp_path)
    as_of = BASE+25*60000
    for tf in ["5m", "1h", "5m", "4h", "1m"]:
        r = api.get("/api/bars", params=dict(symbol="BTCUSDT", timeframe=tf, asOf=as_of))
        assert r.status_code == 200
        assert r.json()["asOf"] == as_of
        assert r.json()["bars"][-1]["close"] == 101
        assert sum(b["volume"] for b in r.json()["bars"]) == 50


def test_future_and_wrong_market_are_rejected(tmp_path):
    api, _ = client(tmp_path)
    assert api.get("/api/bars", params=dict(symbol="BTCUSDT", timeframe="1h", asOf=BASE+121*60000)).status_code == 416
    assert api.get("/api/bars", params=dict(symbol="../spot", timeframe="1h", asOf=BASE+60000)).status_code == 422


def test_month_boundary_gap_is_not_hidden(tmp_path):
    api, store = client(tmp_path)
    store.install("BTCUSDT", "2023-02", frame(121, 20), "b"*64, "test")
    r = api.get("/api/bars", params=dict(symbol="BTCUSDT", timeframe="1h", asOf=BASE+130*60000))
    assert r.status_code == 409


def test_unknown_dataset_version_does_not_fall_back(tmp_path):
    api, _ = client(tmp_path)
    r = api.get("/api/bars", params=dict(symbol="BTCUSDT", timeframe="5m", asOf=BASE+60000, version="missing"))
    assert r.status_code == 404


def test_mutating_request_from_foreign_origin_is_blocked(tmp_path):
    api, _ = client(tmp_path)
    r = api.post("/api/imports", json=dict(start="2023-01-01", end="2023-01-31", symbols=["BTCUSDT"]), headers={"Origin":"https://evil.invalid"})
    assert r.status_code == 403
