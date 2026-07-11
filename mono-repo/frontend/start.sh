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
    FRONTEND_CONFIG="/mount/lucy-config/FrontendProdConfig.json"
fi

if [[ ! -f "$FRONTEND_CONFIG" ]]; then
    echo "ERROR: frontend config not found at $FRONTEND_CONFIG" >&2
    exit 1
fi

# Vite reads these from the shell at dev-server start time. Use `// empty` so a missing or
# null key yields an empty string (not the literal "null"), then hard-fail if either is
# empty — baking a bad Cognito authority into the bundle produces a silent redirect failure
# on the landing page.
VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY // empty' "$FRONTEND_CONFIG")
VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID // empty' "$FRONTEND_CONFIG")
if [[ -z "$VITE_COGNITO_AUTHORITY" || -z "$VITE_COGNITO_CLIENT_ID" ]]; then
    echo "ERROR: COGNITO_AUTHORITY and/or COGNITO_CLIENT_ID missing or null in $FRONTEND_CONFIG" >&2
    exit 1
fi
export VITE_COGNITO_AUTHORITY VITE_COGNITO_CLIENT_ID

cd "$SCRIPT_DIR"
npx vite
