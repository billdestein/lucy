#!/usr/bin/env bash
set -euo pipefail

# Capture the script directory as an absolute path BEFORE any cd commands.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Select config files based on OS.
if [[ "$(uname)" == "Darwin" ]]; then
    FRONTEND_CONFIG="$HOME/git/billdestein/lucy-config/FrontendLocalConfig.json"
    BACKEND_CONFIG="$HOME/git/billdestein/lucy-config/BackendLocalConfig.json"
else
    FRONTEND_CONFIG="/home/ubuntu/lucy-config/FrontendProdConfig.json"
    BACKEND_CONFIG="/home/ubuntu/lucy-config/BackendProdConfig.json"
fi

# 1. Build the common package (ts-node cannot resolve it otherwise).
cd "$SCRIPT_DIR/../common" && npm install --omit=dev && npm run build

# 2. Build the applets package.
cd "$SCRIPT_DIR/../applets" && npm install --omit=dev && npm run build

# 3. Export Vite environment variables from the frontend config, then install + build the
#    frontend. Vite bakes these into the JS bundle at build time, so they must be set before
#    the build runs. The frontend needs devDependencies (Vite), so do a full install.
export VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY' "$FRONTEND_CONFIG")
export VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$FRONTEND_CONFIG")
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
