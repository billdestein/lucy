import fs from 'fs'
import path from 'path'
import { UserType, slugFromEmail } from '@billdestein/joy-common'
import { config } from '../config'

const usersByEmail = new Map<string, UserType>()

const usersJsonPath = path.join(config.mountDir, 'users.json')

function readUsersJson(): Record<string, string> {
    if (!fs.existsSync(usersJsonPath)) return {}
    return JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'))
}

function writeUsersJson(map: Record<string, string>) {
    fs.writeFileSync(usersJsonPath, JSON.stringify(map, null, 2))
}

export function findOrCreateUser(email: string): UserType {
    if (usersByEmail.has(email)) {
        return usersByEmail.get(email)!
    }

    const slugsMap = readUsersJson()
    let slug = slugsMap[email]
    if (!slug) {
        slug = slugFromEmail(email)
        slugsMap[email] = slug
        writeUsersJson(slugsMap)
    }

    const user: UserType = { email, slug }
    usersByEmail.set(email, user)

    const userDir = path.join(config.mountDir, 'users', slug)
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true })
    }

    return user
}
