//----------------------------------------------------------------------------------------------------
// frontend
//----------------------------------------------------------------------------------------------------
export const frontend = `

Frontend is a React app.

In dev mode mode, the frontend listens on port 5173.

Frontend uses Cognito for authentication and authorization, so frontend needs
to know COGNITO_AUTHORITY and COGNITO_CLIENT_ID.



## Vite environment variables and build-time baking

In development (npx vite), VITE_ environment variables are read from the shell at server
start time and injected into every page load dynamically.

In production, the frontend is built as a static bundle by running 'npm run build'. Vite
replaces every occurrence of import.meta.env.VITE_* with the literal string value at build
time. The resulting JS files contain the baked-in values and no longer read from the
environment at runtime.

This has an important implication: if a VITE_ variable changes (e.g. the Cognito client ID
is rotated), the frontend must be rebuilt and redeployed — restarting the backend is not
enough. The backend start.sh handles this automatically because it exports the VITE_ vars
and runs 'npm run build' in the frontend directory before starting the server.

In development mode, no build step is needed — just restart the Vite dev server with the
updated config and the new values are picked up immediately.

Initially, frontend shows an all black window with the word "Lucy" centered in the window
in color gold.  And there's a signin button in the upper right that initiates Cognito login.

Once logged in, the frontend has a MainMenuComponent across the top of the browser window.
The remainder of the vertical space is the canvas.

Immediately after login, a WorkbookListFrame is added to the canvas automatically.

One button in the MainMenuComponent has label "Workbooks".  When clicked, it adds a
WorkbookListFrame to the canvas.

The OIDC scope must be 'openid email' — do not include 'profile', as Cognito does not enable
it by default and it will cause an invalid_scope error.

Do NOT use react-oidc-context or oidc-client-ts.  These libraries store PKCE state in
sessionStorage before the Cognito redirect.  Cognito's hosted UI sometimes performs an
intermediate redirect that clears sessionStorage, causing an unrecoverable 'No matching state
found in storage' error on the callback.

Instead, implement the Authorization Code + PKCE flow manually:
- On sign-in: generate a random state and code_verifier, store both in localStorage, compute
  the code_challenge (SHA-256 base64url of the verifier), fetch the authorization_endpoint
  from {COGNITO_AUTHORITY}/.well-known/openid-configuration, and redirect there.
- On callback (URL contains ?code=...&state=...): verify state matches localStorage, exchange
  the code for tokens by POSTing to the token_endpoint (from the discovery doc) with
  grant_type=authorization_code and code_verifier, then store the id_token in localStorage
  and clean the URL with history.replaceState.
- On subsequent loads: read the stored id_token, decode the JWT payload to check the exp
  claim, and treat it as valid if not expired.

After obtaining the id_token, the frontend calls /v1/auth/login with the ID token
in the Authorization header, not the access token.
Using the access token would fail because the Cognito GetUser API requires the
aws.cognito.signin.user.admin scope, which is not granted under 'openid email'.

The Cognito app client must have http://localhost:5173 registered as an allowed callback URL
for local development.

The redirect_uri in both the authorization request and the token exchange must be exactly
window.location.origin (e.g. http://localhost:5173) — no path suffix like '/callback'.
Cognito rejects any redirect_uri that doesn't exactly match a registered callback URL.

## How the frontend reaches the backend

All API calls use relative URLs (e.g. fetch('/v1/workbooks/list-workbooks')). There is no
BACKEND_URL variable in the frontend source. Two mechanisms resolve these relative paths:

- In development: vite.config.ts proxies /v1/* to http://localhost:8080, so the Vite dev
  server forwards those requests to the Express backend.

      server: {
          port: 5173,
          proxy: {
              '/v1': 'http://localhost:8080',
          },
      }

  Without this proxy, fetch('/v1/...') calls hit Vite on port 5173 and fail.

- In production: Express serves the frontend's static bundle from dist/. The frontend and
  backend share the same origin, so relative /v1 URLs go directly to Express — no proxy
  or BACKEND_URL needed.

## start.sh

The frontend has a start.sh script for local development. It reads
~/lucy-config/FrontendLocalConfig.json (macOS) or /mount/lucy-config/FrontendProdConfig.json
(Linux), exports VITE_COGNITO_AUTHORITY and VITE_COGNITO_CLIENT_ID, then runs npx vite.

As with all start.sh scripts, capture SCRIPT_DIR as an absolute path at the top before
any cd commands, and cd back to SCRIPT_DIR before starting the server.

`
