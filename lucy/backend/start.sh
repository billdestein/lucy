#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR/../common"
npm run build

cd "$SCRIPT_DIR/../applets"
npm run build

if [[ "$(uname)" == "Darwin" ]]; then
    FRONTEND_CONFIG="$HOME/lucy-config/FrontendLocalConfig.json"
    BACKEND_CONFIG="$HOME/lucy-config/BackendLocalConfig.json"
else
    FRONTEND_CONFIG="/mount/lucy-config/FrontendProdConfig.json"
    BACKEND_CONFIG="/mount/lucy-config/BackendProdConfig.json"
fi

export VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY' "$FRONTEND_CONFIG")
export VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$FRONTEND_CONFIG")

cd "$SCRIPT_DIR/../frontend"
npm run build

cd "$SCRIPT_DIR"

CONFIG_FILE="$BACKEND_CONFIG"

export COGNITO_REGION=$(jq -r '.COGNITO_REGION' "$CONFIG_FILE")
export COGNITO_USER_POOL_ID=$(jq -r '.COGNITO_USER_POOL_ID' "$CONFIG_FILE")
export GOOGLE_API_KEY=$(jq -r '.GOOGLE_API_KEY' "$CONFIG_FILE")
export MOUNT_DIR=$(jq -r '.MOUNT_DIR' "$CONFIG_FILE")
export ORIGIN=$(jq -r '.ORIGIN' "$CONFIG_FILE")
export REDIS_HOST=$(jq -r '.REDIS_HOST' "$CONFIG_FILE")
export REDIS_PORT=$(jq -r '.REDIS_PORT' "$CONFIG_FILE")

npx ts-node "$SCRIPT_DIR/src/server.ts"
