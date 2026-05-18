//----------------------------------------------------------------------------------------------------
// frontend
//----------------------------------------------------------------------------------------------------
export const frontend = `

Frontend is a React app.

In dev mode mode, the frontend listens on port 5173.

Frontend uses Cognito for authentication and authorization, so frontend needs
to know COGNITO_AUTHORITY and COGNITO_CLIENT_ID.


Frontend includes a startup script named start.sh.
The startup checks where it is running.
If running on MacOS, it reads the file ~/lucy-config/FrontendLocalConfig.json.
If running on Linux,  it reads the file /mount/lucy-config/FrontendProdConfig.json.
That file contains an object with these properties:

- COGNITO_AUTHORITY
- COGNITO_CLIENT_ID

The startup script assigns those values to their corresponding VITE environment
variables before starting the frontend server.

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

The Vite dev server must proxy /v1 to the backend so that relative API calls reach Express
on port 8080. Add this to vite.config.ts:

    server: {
        port: 5173,
        proxy: {
            '/v1': 'http://localhost:8080',
        },
    }

Without this proxy, all fetch('/v1/...') calls from the frontend hit Vite on port 5173
instead of the backend, and silently fail.

`
