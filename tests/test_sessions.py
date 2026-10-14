from fastapi.testclient import TestClient

from backend.app import create_app
from backend.storage import Store
from tests.test_storage import BASE, frame


def test_session_survives_new_application_instance(tmp_path):
    store = Store(tmp_path)
    store.install("BTCUSDT", "2023-01", frame(count=120), "a"*64, "test")
    payload = dict(schemaVersion=1, selection=dict(symbol="BTCUSDT", timeframe="1h", asOf=BASE+25*60000),
                   datasetVersion=store.version(), speed=2, chartsBySymbol={"BTCUSDT":{"drawings":{"version":1,"drawings":[]},"indicators":[{"type":"ema","inputs":{"length":20}}]}}, drawingsCreatedAt={"line-1":BASE+30*60000})
    api = TestClient(create_app(store))
    assert api.put("/api/session", json=payload).status_code == 200
    reloaded = TestClient(create_app(Store(tmp_path))).get("/api/session").json()
    assert reloaded == payload
    assert "playing" not in reloaded


def test_future_and_unknown_version_rejected(tmp_path):
    store = Store(tmp_path)
    store.install("BTCUSDT", "2023-01", frame(count=120), "a"*64, "test")
    api = TestClient(create_app(store))
    payload = dict(schemaVersion=1, selection=dict(symbol="BTCUSDT", timeframe="5m", asOf=BASE+121*60000),datasetVersion=store.version(),speed=1,chartsBySymbol={},drawingsCreatedAt={})
    assert api.put("/api/session",json=payload).status_code == 422
    payload["selection"]["asOf"] = BASE+60*60000
    payload["datasetVersion"] = "0"*64
    assert api.put("/api/session",json=payload).status_code == 422
