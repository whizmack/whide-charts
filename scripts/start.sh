#!/bin/zsh
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_root"
if ! command -v uv >/dev/null || ! command -v npm >/dev/null; then
  printf 'Nainstalujte bezplatné uv a Node.js 22.12+ (doporučeno Node 24). Podrobnosti jsou v README.md.\n' >&2
  exit 1
fi
uv sync --frozen
if [[ ! -d node_modules ]]; then npm ci --no-audit --no-fund; fi
npm run build
export PERP_REPLAY_DATA_DIR="${PERP_REPLAY_DATA_DIR:-$project_root/.data}"
printf '\nPerp Replay: http://127.0.0.1:8765\nData: %s\nUkončení: Ctrl+C\n\n' "$PERP_REPLAY_DATA_DIR"
exec .venv/bin/python -m uvicorn backend.app:application --factory --host 127.0.0.1 --port 8765
