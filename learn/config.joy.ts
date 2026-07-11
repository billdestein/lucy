//----------------------------------------------------------------------------------------------------
// config
//----------------------------------------------------------------------------------------------------
export const config = `

Lucy uses four JSON configuration files. They are never committed to the repo.

On MacOS (local development), all four files live in ~/git/billdestein/lucy-config/.
On Linux (EC2 production), all four files live in /mount/lucy-config/.

## BackendLocalConfig.json / BackendProdConfig.json

Read by the backend startup script (start.sh) and exported as environment variables.

Fields:
- COGNITO_CLIENT_ID      — The Cognito app client ID (public client, no secret)
- COGNITO_REGION         — AWS region of the Cognito user pool (e.g. "us-west-2")
- COGNITO_USER_POOL_ID   — Cognito user pool ID
- EXPRESS_PORT           — Optional. The port the Express server listens on. When absent or
                           empty, the backend defaults to port 8080.
- GOOGLE_API_KEY         — Google API key for Gemini image generation
- MOUNT_DIR              — Root directory for user data. May begin with ~, which the
                           backend expands explicitly using os.homedir().
- ORIGIN                 — The allowed CORS origin (e.g. "https://lucythebot.com")
- REDIS_HOST             — Redis hostname. Use "localhost" for local dev,
                           ElastiCache endpoint for production.
- REDIS_PORT             — Redis port (typically "6379")

## FrontendLocalConfig.json / FrontendProdConfig.json

Read by start.sh before the frontend build. Values are exported as VITE_ environment
variables so Vite can bake them into the JS bundle at build time.

Fields:
- COGNITO_AUTHORITY  — The Cognito user pool base URL, in the form:
                       https://cognito-idp.{region}.amazonaws.com/{userPoolId}
                       Used to fetch the OpenID configuration and validate tokens.
- COGNITO_CLIENT_ID  — The Cognito app client ID (public client, no secret)

IMPORTANT: Vite bakes VITE_* values into the JS bundle as literal strings at build time.
Changing a frontend config value requires rebuilding and redeploying the frontend — it is
not enough to restart the backend. The backend start.sh handles this automatically by
exporting the VITE_ vars and running 'npm run build' in the frontend directory before
starting the server.

`
