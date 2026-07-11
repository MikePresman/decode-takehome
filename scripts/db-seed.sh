#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

source "$ROOT/config/dev.env"

if [[ -f "$ROOT/.envrc.local" ]]; then
  source "$ROOT/.envrc.local"
fi

VENV_PYTHON="${VENV_PYTHON:-$ROOT/.venv/bin/python}"

if [[ ! -x "$VENV_PYTHON" ]]; then
  echo "Missing Python virtualenv at $VENV_PYTHON"
  echo "Create it first, then install requirements."
  exit 1
fi

cd "$ROOT"
exec "$VENV_PYTHON" -m app.db.seed_db
