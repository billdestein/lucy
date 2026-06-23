import { UserType, slugFromEmail } from '@billdestein/lucy-common'

// In-memory map of email to User object. The slug is computed fresh from the email on every
// login via slugFromEmail; there is no users.json or lookup table. The directory listing is
// the source of truth and emailFromSlug recovers the email from a directory name exactly.
const users = new Map<string, UserType>()

export function findOrCreateUser(email: string): UserType {
    let user = users.get(email)
    if (!user) {
        user = { email, slug: slugFromEmail(email) }
        users.set(email, user)
    }
    return user
}
