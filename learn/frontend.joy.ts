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

The canvas is implemented as a plain div. Each frame is mounted into a child div via
ReactDOM.createRoot, giving each frame its own isolated React tree.

The Frame component handles dragging and four-edge resizing. The rules that must be followed:

1. Use onMouseDownCapture (not onMouseDown) on the outer div. The capture phase fires on
   the parent before any child's bubble-phase handler runs. This lets the outer div intercept
   resize clicks at the edges before the header's drag handler sees them. For edge clicks,
   call e.stopPropagation() to prevent the header handler from also firing. For non-edge
   clicks, return early without stopping propagation so normal header drag works.

2. Track the cursor in onMouseMove on the outer div (bubble phase). Because events bubble
   up from children, this single handler covers the whole frame surface. Never use React
   state for the cursor — it causes re-renders that break active drag operations. Instead,
   write directly to outer.style.cursor.

3. Use a draggingRef (useRef(false)) to freeze cursor updates during an active drag or
   resize. At the start of any drag/resize, set draggingRef.current = true; in the mouseup
   cleanup, set it back to false. In onMouseMove, return early if draggingRef.current is true.

4. Set document.body.style.cursor at the start of a drag/resize to lock the cursor globally.
   This prevents child elements (Monaco editor, AG Grid, etc.) from overriding it mid-drag.
   Clear it in the mouseup cleanup.

5. All four edges (top, bottom, left, right, and corners) resize the frame. Left and top
   resize must also adjust the frame's left/top position to keep the opposite edge fixed.

6. The header drag handler goes on the header child div as onMouseDown (bubble phase). It is
   only reached for non-edge clicks because the capture handler on the outer div stops
   propagation for edge clicks.

7. The header buttons container should have onMouseDown={e => e.stopPropagation()} so that
   clicking a button does not start a header drag.

`
