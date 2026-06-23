import { createClient } from 'redis'
import { config } from '../config'

// ElastiCache Serverless requires TLS, but local Redis does not support it. Enable TLS
// conditionally based on the host.
const isLocal = config.redisHost === 'localhost' || config.redisHost === '127.0.0.1'

const socket: Record<string, unknown> = {
    host: config.redisHost,
    port: config.redisPort,
}
if (!isLocal) {
    socket.tls = true
}

const client = createClient({ socket: socket as any })
client.on('error', err => console.error('Redis client error:', err))

let connecting: Promise<void> | null = null
async function ensureConnected(): Promise<void> {
    if (client.isOpen) return
    if (!connecting) {
        connecting = client.connect().then(() => undefined)
    }
    await connecting
}

const SESSION_TTL_SECONDS = 60 * 60 // one hour

export async function setSession(sessionId: string, email: string): Promise<void> {
    await ensureConnected()
    await client.set(`session:${sessionId}`, email, { EX: SESSION_TTL_SECONDS })
}

export async function getSessionEmail(sessionId: string): Promise<string | null> {
    await ensureConnected()
    return client.get(`session:${sessionId}`)
}
