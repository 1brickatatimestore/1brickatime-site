#!/usr/bin/env bash
set -euo pipefail

STAMP=$(date +%Y%m%d-%H%M%S)
ROOT="$PWD"
BACKUP_DIR="$HOME/1brickatime-backups/$STAMP"
PROJECT_DST="$BACKUP_DIR/project"
API_DST="$BACKUP_DIR/api_snapshots"
ENV_DST="$BACKUP_DIR/env"
MONGO_DST="$BACKUP_DIR/mongo"
ZIP_PATH="$HOME/1brickatime-backups/backup-$STAMP.zip"

echo "▶ Creating folders under $BACKUP_DIR"
mkdir -p "$PROJECT_DST" "$API_DST" "$ENV_DST" "$MONGO_DST"

echo "▶ Pulling Vercel production env locally"
# This writes .vercel/.env.production.local
vercel pull --environment=production --yes >/dev/null

echo "▶ Copying project (excluding heavy build dirs)"
rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.vercel/output' \
  "$ROOT/." "$PROJECT_DST/"

echo "▶ Saving Vercel project config & env files"
# Keep the .vercel folder (minus build output) and any .env* files you may have
rsync -a --exclude='output' "$ROOT/.vercel/" "$ENV_DST/.vercel/"
[ -f "$ROOT/.env.local" ] && cp "$ROOT/.env.local" "$ENV_DST/.env.local"
[ -f "$ROOT/.env.production" ] && cp "$ROOT/.env.production" "$ENV_DST/.env.production"
[ -f "$ROOT/.vercel/.env.production.local" ] && cp "$ROOT/.vercel/.env.production.local" "$ENV_DST/.env.production.local"

echo "▶ Saving your shell helpers (~/.zshrc)"
[ -f "$HOME/.zshrc" ] && cp "$HOME/.zshrc" "$BACKUP_DIR/zshrc.backup"

# Figure out a PROD_URL to snapshot some API responses
PROD_URL_DEFAULT="https://www.1brickatatimestore.com"
PROD_URL="${PROD_URL:-$PROD_URL_DEFAULT}"
echo "▶ Using PROD_URL: $PROD_URL"

echo "▶ Capturing a few API responses (non-sensitive)"
curl -fsS "${PROD_URL%/}/api/ping" > "$API_DST/ping.json" || true
curl -fsS "${PROD_URL%/}/api/debug/db-counts" > "$API_DST/db-counts.json" || true
curl -fsS "${PROD_URL%/}/api/products?type=MINIFIG&onlyInStock=false&includeSoldOut=true&limit=100" > "$API_DST/products-sample.json" || true
curl -fsS "${PROD_URL%/}/" -o "$API_DST/deployed-home.html" || true

echo "▶ (Optional) Mongo dump if MONGODB_URI is present and mongodump is available"
MONGODB_URI=""
# Try to pull MONGODB_URI from env files we just saved
if [ -f "$ENV_DST/.env.production.local" ]; then
  MONGODB_URI=$(grep -E '^MONGODB_URI=' "$ENV_DST/.env.production.local" | sed 's/^MONGODB_URI=//')
fi
if [ -z "$MONGODB_URI" ] && [ -f "$ENV_DST/.env.production" ]; then
  MONGODB_URI=$(grep -E '^MONGODB_URI=' "$ENV_DST/.env.production" | sed 's/^MONGODB_URI=//')
fi

if command -v mongodump >/dev/null 2>&1 && [ -n "$MONGODB_URI" ]; then
  echo "   → Running mongodump (this can take a bit)"
  mongodump --uri "$MONGODB_URI" --out "$MONGO_DST" || echo "   (mongodump failed; skipping DB dump)"
else
  echo "   (Skipping mongodump — either MONGODB_URI not found or mongodump not installed)"
fi

echo "▶ Creating zip archive"
mkdir -p "$(dirname "$ZIP_PATH")"
(cd "$BACKUP_DIR/.." && zip -rq "$ZIP_PATH" "$STAMP")

echo "✅ Backup complete."
echo "   Folder: $BACKUP_DIR"
echo "   Zip:    $ZIP_PATH"
