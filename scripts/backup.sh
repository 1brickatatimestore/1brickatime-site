#!/usr/bin/env bash
set -euo pipefail

mkdir -p releases

# Ensure gpg exists (install if missing)
if ! command -v gpg >/dev/null 2>&1; then
  echo "🔑 Installing gnupg via Homebrew..."
  brew install gnupg
fi

ts="$(date +%Y%m%d-%H%M%S)"
out="releases/secrets-${ts}.tar.gz.gpg"

echo "📦 Encrypting .env.local and .env.production → $out"
tar -czf - .env.local .env.production | gpg -c -o "$out"

echo "✅ Done. Keep the passphrase safe! To restore:"
echo "    gpg -d \"$out\" > /tmp/secrets.tar.gz && tar -xzf /tmp/secrets.tar.gz && rm /tmp/secrets.tar.gz"