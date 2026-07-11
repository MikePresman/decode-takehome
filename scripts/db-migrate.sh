#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$ROOT/config/dev.env"

if [[ -f "$ROOT/.envrc.local" ]]; then
  source "$ROOT/.envrc.local"
fi

VENV_PYTHON="${VENV_PYTHON:-$ROOT/.venv/bin/python}"

if [[ ! -x "$VENV_PYTHON" ]]; then
  echo "Missing Python virtualenv interpreter."
  exit 1
fi

cd "$ROOT"
exec "$VENV_PYTHON" -m alembic upgrade head
