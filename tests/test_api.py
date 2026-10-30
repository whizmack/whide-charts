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


def test_replay_and_session_load_with_external_network_disabled(tmp_path, monkeypatch):
    import socket
    def blocked(*args, **kwargs):
        raise AssertionError("Offline replay attempted an external connection")
    monkeypatch.setattr(socket.socket, "connect", blocked)
    api, _ = client(tmp_path)
    assert api.get("/api/bars", params=dict(symbol="BTCUSDT", timeframe="4h", asOf=BASE+25*60000)).status_code == 200
    assert api.get("/api/session").status_code == 200


def test_live_proxy_is_allowlisted_read_only_and_not_cached(tmp_path, monkeypatch):
    import httpx
    api, store = client(tmp_path)
    before = store.version()
    calls = []
    rows = [[1792009380000, "81938", "81940", "81900", "81912", "84"]]
    class PublicClient:
        def __init__(self, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def get(self, url, params):
            calls.append((url, params))
            return httpx.Response(200, json=rows, request=httpx.Request("GET", url))
    monkeypatch.setattr(httpx, "AsyncClient", PublicClient)
    response = api.get("/api/live/klines?symbol=SOLUSDT&timeframe=4h")
    assert response.status_code == 200
    assert response.json() == rows
    assert response.headers["cache-control"] == "no-store"
    assert calls == [("https://fapi.binance.com/fapi/v1/klines", {"symbol": "SOLUSDT", "interval": "4h", "limit": 1000})]
    assert api.get("/api/live/klines?symbol=BTCUSD&timeframe=1m").status_code == 422
    assert api.get("/api/live/klines?symbol=BTCUSDT&timeframe=1s").status_code == 422
    assert store.version() == before


def test_live_proxy_forwards_bounded_older_candle_page(tmp_path, monkeypatch):
    import httpx
    api, store = client(tmp_path)
    before = store.version()
    calls = []
    rows = [[1792009080000, "81938", "81940", "81900", "81912", "84"]]
    class PublicClient:
        def __init__(self, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            pass
        async def get(self, url, params):
            calls.append((url, params))
            return httpx.Response(200, json=rows, request=httpx.Request("GET", url))
    monkeypatch.setattr(httpx, "AsyncClient", PublicClient)
    response = api.get("/api/live/klines", params={
        "symbol":"BTCUSDT", "timeframe":"1m", "startTime":1792009080000,
        "endTime":1792009380000, "limit":500,
    })
    assert response.status_code == 200
    assert response.json() == rows
    assert calls == [("https://fapi.binance.com/fapi/v1/klines", {
        "symbol":"BTCUSDT", "interval":"1m", "startTime":1792009080000,
        "endTime":1792009380000, "limit":500,
    })]
    assert store.version() == before


def test_live_proxy_rejects_invalid_older_page_bounds_and_limits(tmp_path):
    api, _ = client(tmp_path)
    base = {"symbol":"BTCUSDT", "timeframe":"1m"}
    assert api.get("/api/live/klines", params={**base, "startTime":2000, "endTime":2000}).status_code == 422
    assert api.get("/api/live/klines", params={**base, "startTime":3000, "endTime":2000}).status_code == 422
    assert api.get("/api/live/klines", params={**base, "limit":1001}).status_code == 422


def test_live_proxy_exchange_outage_is_not_a_success(tmp_path, monkeypatch):
    import httpx
    api, _ = client(tmp_path)
    class UnavailableClient:
        def __init__(self, **kwargs):
            pass
        async def __aenter__(self):
            raise httpx.ConnectError("offline")
        async def __aexit__(self, *args):
            pass
    monkeypatch.setattr(httpx, "AsyncClient", UnavailableClient)
    response = api.get("/api/live/klines?symbol=BTCUSDT&timeframe=1m")
    assert response.status_code == 502
