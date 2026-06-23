// Thin wrappers over fetch. All calls use relative /v1 URLs (proxied to Express in dev,
// same-origin in production) and include cookies for the session.

export async function apiGet(path: string): Promise<any> {
    const res = await fetch(path, { credentials: 'include' })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
}

export async function apiPost(path: string, body: unknown): Promise<any> {
    const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
}
