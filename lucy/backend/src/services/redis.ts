import { createClient } from 'redis'
import { config } from '../config'

const client = createClient({
    socket: {
        host: config.redisHost,
        port: config.redisPort,
        connectTimeout: 5000,
        tls: true,
    },
})

export async function connectRedis() {
    await client.connect()
}

export async function setSession(sessionId: string, email: string) {
    await client.set(`session:${sessionId}`, email, { EX: 3600 })
}

export async function getSession(sessionId: string): Promise<string | null> {
    return client.get(`session:${sessionId}`)
}
