#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ "$(uname)" == "Darwin" ]]; then
    FRONTEND_CONFIG="$HOME/lucy-config/FrontendLocalConfig.json"
else
    FRONTEND_CONFIG="/mount/lucy-config/FrontendProdConfig.json"
fi

export VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY' "$FRONTEND_CONFIG")
export VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$FRONTEND_CONFIG")

cd "$SCRIPT_DIR"
npx vite
