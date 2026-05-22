import { UserType, slugFromEmail } from '@billdestein/joy-common'

const userMap = new Map<string, UserType>()

export function findOrCreateUser(email: string): UserType {
    let user = userMap.get(email)
    if (!user) {
        user = { email, slug: slugFromEmail(email) }
        userMap.set(email, user)
    }
    return user
}
