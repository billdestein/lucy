#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Build common
cd "$SCRIPT_DIR/../common" && npm run build

# Build applets
cd "$SCRIPT_DIR/../applets" && npm run build

# Select config files based on OS
if [[ "$(uname)" == "Darwin" ]]; then
    FRONTEND_CONFIG="$HOME/lucy-config/FrontendLocalConfig.json"
    BACKEND_CONFIG="$HOME/lucy-config/BackendLocalConfig.json"
else
    FRONTEND_CONFIG="/mount/lucy-config/FrontendProdConfig.json"
    BACKEND_CONFIG="/mount/lucy-config/BackendProdConfig.json"
fi

# Export Vite variables and build frontend
export VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY' "$FRONTEND_CONFIG")
export VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$FRONTEND_CONFIG")
cd "$SCRIPT_DIR/../frontend" && npm run build

# Export backend environment variables
cd "$SCRIPT_DIR"
export COGNITO_REGION=$(jq -r '.COGNITO_REGION' "$BACKEND_CONFIG")
export COGNITO_USER_POOL_ID=$(jq -r '.COGNITO_USER_POOL_ID' "$BACKEND_CONFIG")
export GOOGLE_API_KEY=$(jq -r '.GOOGLE_API_KEY' "$BACKEND_CONFIG")
export MOUNT_DIR=$(jq -r '.MOUNT_DIR' "$BACKEND_CONFIG")
export ORIGIN=$(jq -r '.ORIGIN' "$BACKEND_CONFIG")
export REDIS_HOST=$(jq -r '.REDIS_HOST' "$BACKEND_CONFIG")
export REDIS_PORT=$(jq -r '.REDIS_PORT' "$BACKEND_CONFIG")

# Start server
npx ts-node "$SCRIPT_DIR/src/server.ts"
