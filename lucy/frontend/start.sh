#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ "$(uname)" == "Darwin" ]]; then
    CONFIG_FILE="$HOME/lucy-config/FrontendLocalConfig.json"
else
    CONFIG_FILE="/mount/lucy-config/FrontendProdConfig.json"
fi

export VITE_COGNITO_AUTHORITY=$(jq -r '.COGNITO_AUTHORITY' "$CONFIG_FILE")
export VITE_COGNITO_CLIENT_ID=$(jq -r '.COGNITO_CLIENT_ID' "$CONFIG_FILE")

cd "$SCRIPT_DIR"
npx vite
