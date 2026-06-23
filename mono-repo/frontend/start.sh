#!/usr/bin/env bash
set -euo pipefail

# Capture the script directory as an absolute path BEFORE any cd commands.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Build the common and applets packages. The frontend imports them as local (symlinked)
# packages whose package.json points at compiled dist/ output, so they must be built before
# Vite can resolve the package entries.
cd "$SCRIPT_DIR/../common" && npm install --omit=dev && npm run build
cd "$SCRIPT_DIR/../applets" && npm install --omit=dev && npm run build

# Select the frontend config based on OS.
if [[ "$(uname)" == "Darwin" ]]; then
    FRONTEND_CONFIG="$HOME/git/billdestein/lucy-config/FrontendLocalConfig.json"
else
    FRONTEND_CONFIG="/home/ubuntu/lucy-config/FrontendProdConfig.json"
fi

# Vite reads these from the shell at dev-server start time.
export VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY' "$FRONTEND_CONFIG")
export VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$FRONTEND_CONFIG")

cd "$SCRIPT_DIR"
npx vite
