const AUTHORITY = import.meta.env.VITE_COGNITO_AUTHORITY
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID
const REDIRECT_URI = window.location.origin

function base64urlEncode(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    return crypto.subtle.digest('SHA-256', encoder.encode(plain))
}

function randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    const arr = new Uint8Array(length)
    crypto.getRandomValues(arr)
    return Array.from(arr, b => chars[b % chars.length]).join('')
}

async function getOidcConfig(): Promise<{ authorization_endpoint: string; token_endpoint: string }> {
    const res = await fetch(`${AUTHORITY}/.well-known/openid-configuration`)
    return res.json()
}

export async function signIn(): Promise<void> {
    const oidc = await getOidcConfig()
    const state = randomString(32)
    const codeVerifier = randomString(64)
    const codeChallenge = base64urlEncode(await sha256(codeVerifier))

    localStorage.setItem('pkce_state', state)
    localStorage.setItem('pkce_verifier', codeVerifier)

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: 'openid email',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    })

    window.location.href = `${oidc.authorization_endpoint}?${params}`
}

export async function handleCallback(): Promise<string | null> {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    if (!code || !state) return null

    const storedState = localStorage.getItem('pkce_state')
    const codeVerifier = localStorage.getItem('pkce_verifier')

    if (state !== storedState || !codeVerifier) {
        localStorage.removeItem('pkce_state')
        localStorage.removeItem('pkce_verifier')
        return null
    }

    const oidc = await getOidcConfig()
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code,
        code_verifier: codeVerifier,
    })

    const res = await fetch(oidc.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    })

    const tokens = await res.json()
    const idToken = tokens.id_token as string

    localStorage.setItem('id_token', idToken)
    localStorage.removeItem('pkce_state')
    localStorage.removeItem('pkce_verifier')
    history.replaceState(null, '', window.location.pathname)

    return idToken
}

export function getStoredIdToken(): string | null {
    const token = localStorage.getItem('id_token')
    if (!token) return null

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('id_token')
            return null
        }
        return token
    } catch {
        return null
    }
}

export async function loginToBackend(idToken: string): Promise<void> {
    await fetch('/v1/auth/login', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        credentials: 'include',
    })
}

export function signOut(): void {
    localStorage.removeItem('id_token')
    window.location.reload()
}
