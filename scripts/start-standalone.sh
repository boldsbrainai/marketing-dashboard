#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/prepare-standalone.sh"

# If a 1Password service account token is available, resolve runtime env vars from
# a non-secret op:// template file.
OP_ENV_FILE="${HERMES_OP_ENV_FILE:-/etc/hermes-dashboard/hermes-dashboard.op.env}"
if command -v op >/dev/null 2>&1 && [[ -n "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]] && [[ -f "$OP_ENV_FILE" ]]; then
  echo "[start] resolving runtime env via 1Password: $OP_ENV_FILE" >&2

  # If 1Password is temporarily rate-limiting, fall back to starting without op.
  # This keeps the dashboard online when secrets are already present via EnvironmentFile/.env.
  if op run --env-file="$OP_ENV_FILE" -- node "$ROOT/.next/standalone/server.js"; then
    exit 0
  fi

  echo "[start] op run failed; starting without 1Password env overlay" >&2
fi

exec node "$ROOT/.next/standalone/server.js"
