import os
import threading
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .importer import import_archive, periods
from .replay import DataGap, MINUTE, TIMEFRAMES, project_bars
from .storage import SYMBOLS, Store
from .sessions import router as session_router

Symbol = Literal["BTCUSDT", "ETHUSDT", "SOLUSDT"]
Timeframe = Literal["1m", "5m", "15m", "1h", "4h"]


class ImportRequest(BaseModel):
    start: date
    end: date
    symbols: list[Symbol] = Field(default_factory=lambda: list(SYMBOLS), min_length=1, max_length=3)


def create_app(store: Store) -> FastAPI:
    app = FastAPI(title="Perp Replay", docs_url=None, redoc_url=None)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "[::1]", "testserver"])
    jobs: dict[str, dict] = {}
    job_lock = threading.Lock()
    app.include_router(session_router(store))

    @app.middleware("http")
    async def local_mutations(request: Request, call_next):
        origin = request.headers.get("origin")
        if request.method not in ("GET", "HEAD", "OPTIONS") and origin and urlsplit(origin).hostname not in ("localhost", "127.0.0.1", "::1"):
            return JSONResponse({"detail": "Změny jsou povolené pouze z lokální aplikace."}, status_code=403)
        return await call_next(request)

    @app.get("/api/markets")
    def markets():
        return {"markets": store.markets(), "datasetVersion": store.version(), "timeframes": list(TIMEFRAMES)}

    @app.get("/api/bars")
    def bars(symbol: Symbol, timeframe: Timeframe, asOf: int = Query(ge=1672531200000, le=4102444800000), limit: int = Query(500, ge=1, le=2000), version: str | None = None):
        try:
            manifest = store.manifest(version)
            current_version = store.fingerprint(manifest)
            parts = [p for p in manifest if p["symbol"] == symbol]
            if not parts:
                raise HTTPException(404, "Pro tento pár nejsou stažená data. Otevřete správu dat.")
            lower = min(p["first"] for p in parts)
            upper = max(p["last"] for p in parts)+MINUTE
            cutoff = asOf//MINUTE*MINUTE
            if cutoff <= lower or cutoff > upper:
                raise HTTPException(416, "Zvolený čas je mimo staženou historii. Doplňte data nebo změňte datum.")
            width = TIMEFRAMES[timeframe]*MINUTE
            start = max(lower, (cutoff//width-limit)*width)
            frame = store.read(symbol, start, cutoff, current_version)
            if frame.empty or int(frame.time.max())+MINUTE != cutoff:
                raise DataGap("Pro zvolený čas chybí minutová data. Doplňte historii.")
            projected = project_bars(frame, cutoff, TIMEFRAMES[timeframe], limit)
            return {"bars": projected, "asOf": cutoff, "datasetVersion": current_version, "available": {"start":lower, "end":upper}}
        except KeyError as e:
            raise HTTPException(404, str(e)) from e
        except DataGap as e:
            raise HTTPException(409, str(e)) from e

    @app.post("/api/imports", status_code=202)
    def start_import(body: ImportRequest):
        yesterday = datetime.now(timezone.utc).date()-timedelta(days=1)
        if body.start < date(2023, 1, 1) or body.start > body.end or body.end > yesterday:
            raise HTTPException(422, "Vyberte období od 1. 1. 2023 nejpozději do včerejška UTC.")
        with job_lock:
            if any(j["status"] == "running" for j in jobs.values()):
                raise HTTPException(409, "Už probíhá import historie.")
            job_id = uuid.uuid4().hex
            work = [(s, p, d) for s in dict.fromkeys(body.symbols) for p, d in periods(body.start, body.end)]
            job = {"id": job_id, "status": "running", "done": 0, "total": len(work), "current": "", "errors": []}
            jobs[job_id] = job
        def run():
            try:
                with httpx.Client(timeout=60, follow_redirects=True) as client:
                    for symbol, period, daily in work:
                        job["current"] = f"{symbol} · {period}"
                        try:
                            import_archive(store, symbol, period, daily, client)
                        except Exception as e:
                            job["errors"].append({"symbol":symbol, "period":period, "message":str(e)})
                        job["done"] += 1
                job["status"] = "partial" if job["errors"] else "complete"
            except Exception as e:
                job["status"] = "failed"
                job["errors"].append({"message": str(e)})
        threading.Thread(target=run, daemon=True).start()
        return dict(job)

    @app.get("/api/imports/{job_id}")
    def import_status(job_id: str):
        if job_id not in jobs:
            raise HTTPException(404, "Import není dostupný; po restartu zkontrolujte pokrytí dat.")
        return jobs[job_id]

    dist = Path(__file__).resolve().parents[1] / "dist"
    if dist.exists():
        app.mount("/", StaticFiles(directory=dist, html=True), name="web")
    return app


def default_store():
    root = os.environ.get("PERP_REPLAY_DATA_DIR")
    return Store(Path(root) if root else Path.home()/"Library"/"Application Support"/"PerpReplay")


def application():
    return create_app(default_store())
