import { slugFromEmail, UserType } from '@billdestein/lucy-common'

// In-memory map of email to User object. The slug is computed fresh from the email via
// slugFromEmail; there is no users.json or other lookup table — the directory listing is
// the source of truth.
const usersByEmail = new Map<string, UserType>()

export function findOrCreateUser(email: string): UserType {
    let user = usersByEmail.get(email)
    if (!user) {
        user = { email, slug: slugFromEmail(email) }
        usersByEmail.set(email, user)
    }
    return user
}
