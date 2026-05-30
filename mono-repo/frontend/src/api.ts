import { getIdToken } from './auth'

// All API calls use relative URLs; the cookie carries the session. Credentials are included
// so the http-only session cookie is sent and stored.
async function request<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetch(path, { credentials: 'include', ...init })
    if (!res.ok) {
        let message = res.statusText
        try {
            const txt = await res.text()
            if (txt) {
                try {
                    message = JSON.parse(txt).error ?? txt
                } catch {
                    message = txt
                }
            }
        } catch {
            // ignore
        }
        throw new Error(message)
    }
    const text = await res.text()
    return (text ? JSON.parse(text) : {}) as T
}

export function apiGet<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' })
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// Establish the backend session from the stored Cognito ID token.
export async function loginToBackend(): Promise<void> {
    const token = getIdToken()
    if (!token) throw new Error('No id token')
    const res = await fetch('/v1/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
        throw new Error(`Backend login failed: ${await res.text()}`)
    }
}
