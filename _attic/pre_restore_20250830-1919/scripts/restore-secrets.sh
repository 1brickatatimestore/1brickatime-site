#!/usr/bin/env bash
set -euo pipefail

OUTDIR="releases"
DEST="restores/restore-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"

# pick newest .enc unless a path is passed
ENC="${1:-}"
if [[ -z "${ENC}" ]]; then
  ENC="$(ls -t "$OUTDIR"/*.enc | head -n1 || true)"
fi
if [[ -z "${ENC}" || ! -f "$ENC" ]]; then
  echo "❌ No encrypted archive found. Expected something like $OUTDIR/secrets-*.tar.gz.enc" >&2
  exit 1
fi

echo "Using: $ENC"
read -s -p "Backup password: " PW; echo

TMP="/tmp/$(basename "$ENC" .enc).tar.gz"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in "$ENC" -out "$TMP" -pass pass:"$PW"

echo "Contents:"
tar -tzf "$TMP"

echo "Extracting to: $DEST"
tar -xzf "$TMP" -C "$DEST"
rm -f "$TMP"
unset PW

echo "✅ Restored files in $DEST"
if [[ -f "$DEST/.env.vercel" ]]; then
  echo "Note: .env.vercel is a snapshot of Vercel envs."
  echo "To re-add any value to Vercel:"
  echo "  vercel env add NAME production   # then paste the value when prompted"
fi