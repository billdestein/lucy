const OIDC_AUTHORITY = import.meta.env.VITE_COGNITO_AUTHORITY as string
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string

function base64url(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function generateRandom(byteLength: number): string {
    const arr = new Uint8Array(byteLength)
    crypto.getRandomValues(arr)
    return base64url(arr.buffer)
}

async function sha256(plain: string): Promise<ArrayBuffer> {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
}

async function getDiscoveryDoc(): Promise<Record<string, string>> {
    const res = await fetch(`${OIDC_AUTHORITY}/.well-known/openid-configuration`)
    return res.json()
}

export async function signIn() {
    const doc = await getDiscoveryDoc()
    const state = generateRandom(32)
    const codeVerifier = generateRandom(64)
    const codeChallenge = base64url(await sha256(codeVerifier))

    localStorage.setItem('pkce_state', state)
    localStorage.setItem('pkce_verifier', codeVerifier)

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: window.location.origin,
        scope: 'openid email',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    })

    window.location.href = `${doc.authorization_endpoint}?${params}`
}

export async function handleCallback(): Promise<string | null> {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    if (!code || !state) return null

    const storedState = localStorage.getItem('pkce_state')
    const codeVerifier = localStorage.getItem('pkce_verifier')
    if (state !== storedState || !codeVerifier) {
        console.error('PKCE state mismatch')
        return null
    }

    const doc = await getDiscoveryDoc()
    const res = await fetch(doc.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code,
            redirect_uri: window.location.origin,
            code_verifier: codeVerifier,
        }),
    })

    if (!res.ok) {
        console.error('Token exchange failed:', await res.text())
        return null
    }

    const tokens = await res.json()
    localStorage.setItem('id_token', tokens.id_token)
    localStorage.removeItem('pkce_state')
    localStorage.removeItem('pkce_verifier')
    history.replaceState({}, '', window.location.origin)

    return tokens.id_token as string
}

export function getIdToken(): string | null {
    const token = localStorage.getItem('id_token')
    if (!token) return null
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (payload.exp < Date.now() / 1000) {
            localStorage.removeItem('id_token')
            return null
        }
        return token
    } catch {
        return null
    }
}

export async function signOut() {
    const doc = await getDiscoveryDoc()
    localStorage.removeItem('id_token')
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        logout_uri: window.location.origin,
    })
    window.location.href = `${doc.end_session_endpoint}?${params}`
}
