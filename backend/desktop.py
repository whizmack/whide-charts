"""Desktop sidecar entry point. The HTTP API remains the app boundary."""

import os

import uvicorn

from backend.app import application


def main() -> None:
    uvicorn.run(
        application(),
        host="127.0.0.1",
        port=int(os.environ.get("PERP_REPLAY_API_PORT", "8765")),
        log_level="info",
    )


if __name__ == "__main__":
    main()
