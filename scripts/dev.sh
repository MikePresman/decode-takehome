#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v initdb >/dev/null 2>&1; then
  echo "initdb not found. Enter the Nix shell first with 'direnv allow' or 'nix develop'."
  exit 1
fi

if ! command -v pip >/dev/null 2>&1; then
  echo "pip not found. Enter the Nix shell first with 'direnv allow' or 'nix develop'."
  exit 1
fi

if ! python -m venv --help >/dev/null 2>&1; then
  echo "python venv module is unavailable. Enter the Nix shell first with 'direnv allow' or 'nix develop'."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Enter the Nix shell first with 'direnv allow' or 'nix develop'."
  exit 1
fi

mkdir -p "$ROOT/tmp"

source "$ROOT/config/dev.env"

if [[ -f "$ROOT/.envrc.local" ]]; then
  source "$ROOT/.envrc.local"
fi

LOCAL_PGUSER="$(id -un)"
if [[ "${PGUSER:-}" == "postgres" ]]; then
  PGUSER="$LOCAL_PGUSER"
fi

if [[ "${PGHOST:-}" == "localhost" ]]; then
  PGHOST="127.0.0.1"
fi

FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"

PGDATA_DIR="${PGDATA_DIR:-$ROOT/tmp/postgres}"
PGLOG_FILE="${PGLOG_FILE:-$ROOT/tmp/postgres.log}"
VENV_DIR="${VENV_DIR:-$ROOT/.venv}"
VENV_PYTHON="$VENV_DIR/bin/python"
VENV_PIP="$VENV_DIR/bin/pip"
VENV_UVICORN="$VENV_DIR/bin/uvicorn"

port_is_available() {
  python - "$1" "$2" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        sock.bind((host, port))
    except OSError:
        raise SystemExit(1)

raise SystemExit(0)
PY
}

if [[ ! -d "$PGDATA_DIR" ]] && ! port_is_available "$PGHOST" "$PGPORT"; then
  original_port="$PGPORT"
  while ! port_is_available "$PGHOST" "$PGPORT"; do
    PGPORT=$((PGPORT + 1))
  done
  echo "Port $original_port is in use; using $PGPORT for the local Postgres cluster"
fi

DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"

if [[ ! -x "$VENV_PYTHON" ]]; then
  echo "Creating local virtual environment in $VENV_DIR"
  python -m venv "$VENV_DIR"
fi

echo "Installing backend dependencies from requirements.txt"
"$VENV_PIP" install -r "$ROOT/requirements.txt"

if [[ ! -x "$VENV_UVICORN" ]]; then
  echo "uvicorn is still unavailable after installing requirements."
  exit 1
fi

cleanup() {
  local exit_code=$?

  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi

  if pg_ctl -D "$PGDATA_DIR" status >/dev/null 2>&1; then
    pg_ctl -D "$PGDATA_DIR" -m fast stop >/dev/null 2>&1 || true
  fi

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

configure_postgres() {
  local conf="$PGDATA_DIR/postgresql.conf"
  local auto_conf="$PGDATA_DIR/postgresql.auto.conf"

  python - "$conf" "$PGHOST" "$PGPORT" <<'PY'
from pathlib import Path
import re
import sys

conf_path = Path(sys.argv[1])
host = sys.argv[2]
port = sys.argv[3]
text = conf_path.read_text()

replacements = {
    "listen_addresses": f"listen_addresses = '{host}'",
    "port": f"port = {port}",
    "shared_memory_type": "shared_memory_type = mmap",
    "dynamic_shared_memory_type": "dynamic_shared_memory_type = posix",
}

for key, value in replacements.items():
    pattern = rf"(?m)^#?\s*{re.escape(key)}\s*=.*$"
    if re.search(pattern, text):
        text = re.sub(pattern, value, text, count=1)
    else:
        text += f"\n{value}\n"

conf_path.write_text(text)
PY

  if [[ -f "$auto_conf" ]]; then
    python - "$auto_conf" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
lines = path.read_text().splitlines()
blocked = {
    "listen_addresses",
    "port",
    "shared_memory_type",
    "dynamic_shared_memory_type",
}
kept = [line for line in lines if not any(line.startswith(f"{key} =") for key in blocked)]
path.write_text("\n".join(kept) + ("\n" if kept else ""))
PY
  fi
}

if [[ ! -d "$PGDATA_DIR" ]]; then
  echo "Initializing local Postgres cluster in $PGDATA_DIR"
  initdb -D "$PGDATA_DIR" -U "$PGUSER" >/dev/null
  echo "host all all 127.0.0.1/32 trust" >>"$PGDATA_DIR/pg_hba.conf"
fi

configure_postgres

if ! pg_ctl -D "$PGDATA_DIR" status >/dev/null 2>&1; then
  echo "Starting local Postgres on port $PGPORT"
  pg_ctl -D "$PGDATA_DIR" -l "$PGLOG_FILE" start >/dev/null
fi

until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" >/dev/null 2>&1; do
  sleep 1
done

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'" | grep -q 1 || \
  createdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$PGDATABASE"

echo "Starting backend on $BACKEND_URL"
(
  cd "$ROOT"
  exec "$VENV_UVICORN" app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload
) &
BACKEND_PID=$!

if [[ -f "$ROOT/frontend/package.json" ]]; then
  if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
    echo "Installing frontend dependencies from frontend/package.json"
    (
      cd "$ROOT/frontend"
      pnpm install
    )
  else
    echo "Frontend dependencies already installed; skipping pnpm install"
  fi
  echo "Starting frontend on $FRONTEND_URL"
  (
    cd "$ROOT/frontend"
    exec pnpm dev --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT"
  ) &
  FRONTEND_PID=$!
fi

echo "Local stack is running. Press Ctrl+C to stop."
wait
