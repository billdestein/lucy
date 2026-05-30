// Manual Authorization Code + PKCE flow against Cognito. We deliberately avoid
// react-oidc-context / oidc-client-ts because they store PKCE state in sessionStorage,
// which Cognito's hosted UI can clear during an intermediate redirect.

const AUTHORITY = import.meta.env.VITE_COGNITO_AUTHORITY
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID
const SCOPE = 'openid email'

// redirect_uri must exactly equal window.location.origin — no path suffix.
function redirectUri(): string {
    return window.location.origin
}

type OpenIdConfig = {
    authorization_endpoint: string
    token_endpoint: string
    end_session_endpoint?: string
}

let discoveryPromise: Promise<OpenIdConfig> | null = null
function discover(): Promise<OpenIdConfig> {
    if (!discoveryPromise) {
        discoveryPromise = fetch(`${AUTHORITY}/.well-known/openid-configuration`).then((r) =>
            r.json()
        )
    }
    return discoveryPromise
}

function randomString(bytes = 32): string {
    const arr = new Uint8Array(bytes)
    crypto.getRandomValues(arr)
    return base64url(arr.buffer)
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

export async function signIn(): Promise<void> {
    const state = randomString(16)
    const codeVerifier = randomString(32)
    localStorage.setItem('lucy.oauth.state', state)
    localStorage.setItem('lucy.oauth.verifier', codeVerifier)

    const codeChallenge = base64url(await sha256(codeVerifier))
    const cfg = await discover()

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: redirectUri(),
        scope: SCOPE,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    })
    window.location.assign(`${cfg.authorization_endpoint}?${params.toString()}`)
}

// If the URL contains ?code=...&state=..., exchange the code for tokens and store the
// id_token. Returns true if a callback was handled.
export async function handleRedirectCallback(): Promise<boolean> {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (!code || !state) return false

    const expectedState = localStorage.getItem('lucy.oauth.state')
    const codeVerifier = localStorage.getItem('lucy.oauth.verifier')
    if (!expectedState || state !== expectedState || !codeVerifier) {
        throw new Error('OAuth state mismatch')
    }

    const cfg = await discover()
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code,
        redirect_uri: redirectUri(),
        code_verifier: codeVerifier,
    })
    const res = await fetch(cfg.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    })
    if (!res.ok) {
        throw new Error(`Token exchange failed: ${await res.text()}`)
    }
    const tokens = await res.json()
    localStorage.setItem('lucy.id_token', tokens.id_token)

    localStorage.removeItem('lucy.oauth.state')
    localStorage.removeItem('lucy.oauth.verifier')

    // Clean the URL of the code/state query params.
    window.history.replaceState({}, document.title, redirectUri())
    return true
}

function decodeJwtPayload(token: string): any {
    const part = token.split('.')[1]
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
}

export function getIdToken(): string | null {
    const token = localStorage.getItem('lucy.id_token')
    if (!token) return null
    try {
        const payload = decodeJwtPayload(token)
        if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
            return null
        }
        return token
    } catch {
        return null
    }
}

export async function signOut(): Promise<void> {
    localStorage.removeItem('lucy.id_token')
    try {
        const cfg = await discover()
        if (cfg.end_session_endpoint) {
            const params = new URLSearchParams({
                client_id: CLIENT_ID,
                logout_uri: redirectUri(),
            })
            window.location.assign(`${cfg.end_session_endpoint}?${params.toString()}`)
            return
        }
    } catch {
        // Fall through to a local sign-out.
    }
    window.location.assign(redirectUri())
}
