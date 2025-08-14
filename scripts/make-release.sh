#!/usr/bin/env bash
set -euo pipefail

# --- config -------------------------------------------------------
BUMP="${BUMP:-none}"     # use "none" by default; run BUMP=patch ./scripts/make-release.sh to bump
ARCHIVE_DIR="releases"
EXCLUDES=(--exclude='.git' --exclude='node_modules' --exclude="${ARCHIVE_DIR}")
# -----------------------------------------------------------------

echo "✅ Using Homebrew at: $(command -v brew || true)"
brew --version || true

# Ensure npm deps
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm not found. Install Node (e.g., brew install node) and retry."
  exit 1
fi

echo "📦 Using npm"
npm install

# Optional version bump
if [[ "$BUMP" != "none" ]]; then
  echo "🔖 Bumping version (${BUMP})…"
  # Ensure clean tree so npm version doesn’t bail
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "❌ Working tree is not clean. Commit or stash changes, then retry."
    exit 1
  fi
  npm version "$BUMP" -m "chore: release v%s"
fi

echo "🏗️ Building…"
npm run build

# Get version from package.json
VERSION="$(node -p "require('./package.json').version")"
GIT_SHA="$(git rev-parse --short HEAD)"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "${ARCHIVE_DIR}"
ARCHIVE="${ARCHIVE_DIR}/release-${VERSION}-${STAMP}-${GIT_SHA}.tar.gz"

# Create a clean archive (exclude itself, node_modules, and .git)
tar -czf "${ARCHIVE}" "${EXCLUDES[@]}" .

echo "📦 Created ${ARCHIVE}"

# Commit (if npm version didn’t already do it)
if ! git diff --cached --quiet; then
  git commit -m "chore: build artifacts for v${VERSION}"
fi

# Ensure tag exists (npm version creates it; otherwise tag now)
if ! git rev-parse "v${VERSION}" >/dev/null 2>&1; then
  git tag "v${VERSION}"
fi

echo "⬆️  Pushing commits and tags…"
git push --follow-tags

echo "✅ Done."