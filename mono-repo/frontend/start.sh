#!/usr/bin/env bash
set -euo pipefail

# Capture SCRIPT_DIR as an absolute path before any cd commands.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Select the frontend config based on OS.
if [[ "$(uname)" == "Darwin" ]]; then
    FRONTEND_CONFIG="$HOME/lucy-config/FrontendLocalConfig.json"
else
    FRONTEND_CONFIG="/mount/lucy-config/FrontendProdConfig.json"
fi

# Export the Vite environment variables. In dev, Vite reads these from the shell at server
# start and injects them dynamically on every page load.
export VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY' "$FRONTEND_CONFIG")
export VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$FRONTEND_CONFIG")

# cd back to SCRIPT_DIR before starting the dev server.
cd "$SCRIPT_DIR" && npx vite
