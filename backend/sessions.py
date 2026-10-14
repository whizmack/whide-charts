import json
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .storage import SYMBOLS, Store


class Selection(BaseModel):
    model_config = ConfigDict(extra="forbid")
    symbol: Literal["BTCUSDT", "ETHUSDT", "SOLUSDT"]
    timeframe: Literal["1m", "5m", "15m", "1h", "4h"]
    asOf: int = Field(ge=1672531200000, le=4102444800000, multiple_of=60000)


class Session(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schemaVersion: Literal[1]
    selection: Selection
    datasetVersion: str = Field(pattern=r"^[a-f0-9]{64}$")
    speed: float = Field(ge=0.25, le=20)
    chartsBySymbol: dict[str, dict] = Field(default_factory=dict)
    drawingsCreatedAt: dict[str, int] = Field(default_factory=dict)


def router(store: Store):
    routes = APIRouter()

    @routes.get("/api/session")
    def get_session():
        with store.connect() as db:
            row = db.execute("SELECT payload FROM sessions WHERE id='current'").fetchone()
        return json.loads(row[0]) if row else None

    @routes.put("/api/session")
    def save_session(body: Session):
        if not set(body.chartsBySymbol).issubset(SYMBOLS):
            raise HTTPException(422, "Session obsahuje neznámý pár.")
        try:
            market = next(m for m in store.markets(body.datasetVersion) if m["symbol"] == body.selection.symbol)
        except KeyError as e:
            raise HTTPException(422, "Verze datasetu session není dostupná.") from e
        if not any(r["start"] < body.selection.asOf <= r["end"] for r in market["ranges"]):
            raise HTTPException(422, "Čas session není v dostupných datech.")
        encoded = body.model_dump_json()
        if len(encoded) > 2_000_000:
            raise HTTPException(422, "Session je příliš velká; exportujte a omezte počet kreseb.")
        with store.connect() as db:
            db.execute("INSERT OR REPLACE INTO sessions VALUES ('current',?)", (encoded,))
        return {"saved": True}

    return routes
