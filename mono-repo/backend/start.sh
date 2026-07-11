#!/usr/bin/env bash
set -euo pipefail

# Capture the script directory as an absolute path BEFORE any cd commands.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Select config files based on OS.
if [[ "$(uname)" == "Darwin" ]]; then
    FRONTEND_CONFIG="$HOME/git/billdestein/lucy-config/FrontendLocalConfig.json"
    BACKEND_CONFIG="$HOME/git/billdestein/lucy-config/BackendLocalConfig.json"
else
    FRONTEND_CONFIG="/mount/lucy-config/FrontendProdConfig.json"
    BACKEND_CONFIG="/mount/lucy-config/BackendProdConfig.json"
fi

# 1. Build the common package (ts-node cannot resolve it otherwise).
cd "$SCRIPT_DIR/../common" && npm install --omit=dev && npm run build

# 2. Build the applets package.
cd "$SCRIPT_DIR/../applets" && npm install --omit=dev && npm run build

# 3. Export Vite environment variables from the frontend config, then install + build the
#    frontend. Vite bakes these into the JS bundle at build time, so they must be set before
#    the build runs. The frontend needs devDependencies (Vite), so do a full install.
if [[ ! -f "$FRONTEND_CONFIG" ]]; then
    echo "ERROR: frontend config not found at $FRONTEND_CONFIG" >&2
    exit 1
fi

# Use `// empty` so a missing or null key yields an empty string (not the literal "null"),
# then hard-fail if either is empty — baking a bad Cognito authority into the bundle produces
# a silent redirect failure on the landing page.
VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY // empty' "$FRONTEND_CONFIG")
VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID // empty' "$FRONTEND_CONFIG")
if [[ -z "$VITE_COGNITO_AUTHORITY" || -z "$VITE_COGNITO_CLIENT_ID" ]]; then
    echo "ERROR: COGNITO_AUTHORITY and/or COGNITO_CLIENT_ID missing or null in $FRONTEND_CONFIG" >&2
    exit 1
fi
export VITE_COGNITO_AUTHORITY VITE_COGNITO_CLIENT_ID
cd "$SCRIPT_DIR/../frontend" && npm install && npm run build

# 4. Install the backend's own dependencies (ts-node, etc.).
cd "$SCRIPT_DIR" && npm install

# 5. Export backend environment variables from the backend config.
export COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$BACKEND_CONFIG")
export COGNITO_REGION=$(jq -r '.COGNITO_REGION' "$BACKEND_CONFIG")
export COGNITO_USER_POOL_ID=$(jq -r '.COGNITO_USER_POOL_ID' "$BACKEND_CONFIG")
# EXPRESS_PORT is optional; '// empty' yields '' (not "null") when the key is absent.
export EXPRESS_PORT=$(jq -r '.EXPRESS_PORT // empty' "$BACKEND_CONFIG")
export GOOGLE_API_KEY=$(jq -r '.GOOGLE_API_KEY' "$BACKEND_CONFIG")
export MOUNT_DIR=$(jq -r '.MOUNT_DIR' "$BACKEND_CONFIG")
export ORIGIN=$(jq -r '.ORIGIN' "$BACKEND_CONFIG")
export REDIS_HOST=$(jq -r '.REDIS_HOST' "$BACKEND_CONFIG")
export REDIS_PORT=$(jq -r '.REDIS_PORT' "$BACKEND_CONFIG")

# 6. Start the server.
cd "$SCRIPT_DIR"
npx ts-node "$SCRIPT_DIR/src/server.ts"
