#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$ROOT/../_backups"
STAMP="$(date +%F_%H-%M-%S)"
OUT="$BACKUP_DIR/1brickatime-site_${STAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

tar --exclude='./node_modules' \
    --exclude='./.next' \
    -czf "$OUT" -C "$ROOT" .

echo "Backup written to: $OUT"
