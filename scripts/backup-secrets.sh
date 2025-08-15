#!/usr/bin/env bash
set -euo pipefail

STAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="releases"
mkdir -p "$OUTDIR"

# ask for password twice (hidden)
while :; do
  read -s -p "Backup password: " PW1; echo
  read -s -p "Confirm password: " PW2; echo
  [[ -z "${PW1}" ]] && { echo "Password cannot be empty."; continue; }
  [[ "$PW1" != "$PW2" ]] && { echo "Passwords do not match. Try again."; continue; }
  break
done

encrypt_stream () {
  local label="$1"
  openssl enc -aes-256-cbc -md sha256 -pbkdf2 -iter 200000 -salt \
    -pass pass:"$PW1" \
    -out "$OUTDIR/${label}-${STAMP}.tar.gz.enc"
  echo "🔐 Wrote $OUTDIR/${label}-${STAMP}.tar.gz.enc"
}

# pack local envs if present
to_pack=()
[[ -f .env.local ]]      && to_pack+=(.env.local)
[[ -f .env.production ]] && to_pack+=(.env.production)
if (( ${#to_pack[@]} )); then
  tar -czf - "${to_pack[@]}" 2>/dev/null | encrypt_stream "secrets"
else
  echo "ℹ️  No local .env files found to back up."
fi

# pull Vercel envs (development set) and back them up too
if command -v vercel >/dev/null 2>&1; then
  TMP=".env.vercel"
  vercel env pull "$TMP" >/dev/null
  tar -czf - "$TMP" | encrypt_stream "vercel-envs"
  rm -f "$TMP"
else
  echo "⚠️  vercel CLI not found; skipping cloud env backup."
fi

unset PW1 PW2
echo "✅ Backup complete."
