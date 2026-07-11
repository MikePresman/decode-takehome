#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PYTHON="${VENV_PYTHON:-$ROOT/.venv/bin/python}"

if [[ ! -x "$VENV_PYTHON" ]]; then
  if command -v python3 >/dev/null 2>&1; then
    VENV_PYTHON="$(command -v python3)"
  elif command -v python >/dev/null 2>&1; then
    VENV_PYTHON="$(command -v python)"
  else
    echo "No usable Python interpreter found."
    exit 1
  fi
fi

cd "$ROOT"
exec "$VENV_PYTHON" -m pytest "$@"
