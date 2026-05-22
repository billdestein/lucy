// These functions are fixed by spec — do not alter the algorithm.
// The slug is persisted as a directory name; any drift makes existing user dirs unreachable.
export function slugFromEmail(email: string): string {
    return email.toLowerCase()
        .replace(/[^a-z0-9.-]/g, c => '~' + c.charCodeAt(0).toString(16).padStart(2, '0'))
}

export function emailFromSlug(slug: string): string {
    return slug.replace(/~([0-9a-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}
