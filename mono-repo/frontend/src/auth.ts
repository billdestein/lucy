// Manual Authorization Code + PKCE flow against Cognito. We deliberately do NOT use
// react-oidc-context / oidc-client-ts: they store PKCE state in sessionStorage, which
// Cognito's hosted UI can clear via an intermediate redirect, producing an unrecoverable
// "No matching state found in storage" error. We store state in localStorage instead.

const AUTHORITY = import.meta.env.VITE_COGNITO_AUTHORITY
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID
// 'openid email' only — do NOT add 'profile' (Cognito disables it by default -> invalid_scope).
const SCOPE = 'openid email'

const KEY_STATE = 'lucy_oidc_state'
const KEY_VERIFIER = 'lucy_oidc_verifier'
const KEY_ID_TOKEN = 'lucy_id_token'

// Fail loudly if the build-time Cognito config is missing. A missing config key is commonly
// baked in as the string 'null' or '' (e.g. `jq -r` on an absent key emits "null"), which
// would otherwise produce a broken authority URL and a silent redirect failure — the user
// sees the buttons vanish with no hosted-UI dialog. Reject it up front with an actionable
// message so the failure surfaces instead of hanging.
function requireConfig(name: string, value: string | undefined): string {
    if (!value || value === 'null' || value === 'undefined') {
        throw new Error(
            `${name} is not configured (got ${JSON.stringify(value)}). The frontend was built ` +
            `without a valid Cognito config — rebuild with COGNITO_AUTHORITY and ` +
            `COGNITO_CLIENT_ID set in the frontend config.`,
        )
    }
    return value
}

type Discovery = {
    authorization_endpoint: string
    token_endpoint: string
    end_session_endpoint?: string
}

let discoveryCache: Discovery | null = null
async function discovery(): Promise<Discovery> {
    if (discoveryCache) return discoveryCache
    const authority = requireConfig('VITE_COGNITO_AUTHORITY', AUTHORITY)
    const res = await fetch(`${authority}/.well-known/openid-configuration`)
    if (!res.ok) {
        throw new Error(
            `Failed to fetch OpenID configuration from ${authority} (HTTP ${res.status}).`,
        )
    }
    discoveryCache = await res.json()
    return discoveryCache!
}

function randomHex(byteLength: number): string {
    const arr = new Uint8Array(byteLength)
    crypto.getRandomValues(arr)
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

function base64url(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf)
    let str = ''
    for (const b of bytes) str += String.fromCharCode(b)
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(input: string): Promise<ArrayBuffer> {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
}

// redirect_uri must EXACTLY match a registered Cognito callback URL — window.location.origin
// with no path suffix.
function redirectUri(): string {
    return window.location.origin
}

// Shared PKCE redirect: generate + store state/verifier, then redirect to the given hosted-UI
// endpoint with the standard authorize query parameters.
async function authorizeRedirect(endpoint: string): Promise<void> {
    const state = randomHex(16)
    const verifier = randomHex(48)
    localStorage.setItem(KEY_STATE, state)
    localStorage.setItem(KEY_VERIFIER, verifier)
    const challenge = base64url(await sha256(verifier))
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: requireConfig('VITE_COGNITO_CLIENT_ID', CLIENT_ID),
        redirect_uri: redirectUri(),
        scope: SCOPE,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
    })
    window.location.href = `${endpoint}?${params.toString()}`
}

export async function signIn(): Promise<void> {
    const d = await discovery()
    await authorizeRedirect(d.authorization_endpoint)
}

export async function signUp(): Promise<void> {
    const d = await discovery()
    // Cognito's hosted-UI sign-up page takes the same params as authorize, on the '/signup'
    // path. After sign-up + confirmation it redirects back with ?code=...&state=..., handled
    // by the same callback logic as sign-in.
    const signupUrl = d.authorization_endpoint.replace('/oauth2/authorize', '/signup')
    await authorizeRedirect(signupUrl)
}

// Returns true if a callback was handled (and tokens stored).
export async function handleRedirectCallback(): Promise<boolean> {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (!code || !state) return false

    const savedState = localStorage.getItem(KEY_STATE)
    const verifier = localStorage.getItem(KEY_VERIFIER)
    if (state !== savedState || !verifier) throw new Error('OIDC state mismatch')

    const d = await discovery()
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code,
        redirect_uri: redirectUri(),
        code_verifier: verifier,
    })
    const res = await fetch(d.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    })
    if (!res.ok) throw new Error('Token exchange failed')
    const tokens = await res.json()
    localStorage.setItem(KEY_ID_TOKEN, tokens.id_token)
    localStorage.removeItem(KEY_STATE)
    localStorage.removeItem(KEY_VERIFIER)
    // Clean the ?code=...&state=... off the URL.
    history.replaceState({}, '', redirectUri())
    return true
}

export function getIdToken(): string | null {
    return localStorage.getItem(KEY_ID_TOKEN)
}

function decodeJwtPayload(token: string): any {
    const part = token.split('.')[1]
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
}

export function isAuthenticated(): boolean {
    const token = getIdToken()
    if (!token) return false
    try {
        const { exp } = decodeJwtPayload(token)
        return typeof exp === 'number' && exp * 1000 > Date.now()
    } catch {
        return false
    }
}

// Establish the backend session by POSTing the ID token (NOT the access token).
export async function backendLogin(): Promise<void> {
    const token = getIdToken()
    if (!token) throw new Error('No ID token')
    const res = await fetch('/v1/auth/login', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
    })
    if (!res.ok) throw new Error('Backend login failed')
}

export async function signOut(): Promise<void> {
    localStorage.removeItem(KEY_ID_TOKEN)
    try {
        const d = await discovery()
        if (d.end_session_endpoint) {
            const params = new URLSearchParams({
                client_id: CLIENT_ID,
                logout_uri: redirectUri(),
            })
            window.location.href = `${d.end_session_endpoint}?${params.toString()}`
            return
        }
    } catch {
        // fall through to a local reload
    }
    window.location.href = redirectUri()
}
