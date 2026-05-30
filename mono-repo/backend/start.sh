#!/usr/bin/env bash
set -euo pipefail

# 1. Capture SCRIPT_DIR as an absolute path before any cd commands. Always use $SCRIPT_DIR
#    for subsequent path references; never re-derive it after a cd.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 2. Build the common package (ts-node cannot resolve it otherwise).
cd "$SCRIPT_DIR/../common" && npm install --omit=dev && npm run build

# 3. Build the applets package.
cd "$SCRIPT_DIR/../applets" && npm install --omit=dev && npm run build

# 4. Select config files based on OS.
if [[ "$(uname)" == "Darwin" ]]; then
    FRONTEND_CONFIG="$HOME/lucy-config/FrontendLocalConfig.json"
    BACKEND_CONFIG="$HOME/lucy-config/BackendLocalConfig.json"
else
    FRONTEND_CONFIG="/home/ubuntu/lucy-config/FrontendProdConfig.json"
    BACKEND_CONFIG="/home/ubuntu/lucy-config/BackendProdConfig.json"
fi

# 5. Export Vite environment variables from the frontend config, then install + build the
#    frontend. Vite bakes these values into the JS bundle at build time, so they must be set
#    before the build runs. Install includes devDependencies (Vite needs them).
export VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY' "$FRONTEND_CONFIG")
export VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$FRONTEND_CONFIG")
cd "$SCRIPT_DIR/../frontend" && npm install && npm run build

# 6. cd back to SCRIPT_DIR and install the backend's own dependencies (ts-node, etc.).
cd "$SCRIPT_DIR" && npm install

# Export backend environment variables from the backend config.
export COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$BACKEND_CONFIG")
export COGNITO_REGION=$(jq -r '.COGNITO_REGION' "$BACKEND_CONFIG")
export COGNITO_USER_POOL_ID=$(jq -r '.COGNITO_USER_POOL_ID' "$BACKEND_CONFIG")
export GOOGLE_API_KEY=$(jq -r '.GOOGLE_API_KEY' "$BACKEND_CONFIG")
export MOUNT_DIR=$(jq -r '.MOUNT_DIR' "$BACKEND_CONFIG")
export ORIGIN=$(jq -r '.ORIGIN' "$BACKEND_CONFIG")
export REDIS_HOST=$(jq -r '.REDIS_HOST' "$BACKEND_CONFIG")
export REDIS_PORT=$(jq -r '.REDIS_PORT' "$BACKEND_CONFIG")

# 7. Start the server.
npx ts-node "$SCRIPT_DIR/src/server.ts"
