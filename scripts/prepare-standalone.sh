#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Ensure Next.js standalone has latest static/public assets before boot.
mkdir -p .next/standalone/.next/static
if [ -d .next/static ]; then
  rsync -a .next/static/ .next/standalone/.next/static/
fi
if [ -d public ]; then
  rsync -a public/ .next/standalone/public/
fi
