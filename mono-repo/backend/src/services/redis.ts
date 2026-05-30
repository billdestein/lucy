import { createClient } from 'redis'
import { config, isLocalRedis } from '../config'

// Use the standard redis client library (not ioredis). TLS is required for ElastiCache
// Serverless but unsupported by local Redis, so it is set conditionally.
export const redis = createClient({
    socket: {
        host: config.redisHost,
        port: config.redisPort,
        tls: !isLocalRedis,
    } as any,
})

redis.on('error', (err) => console.error('Redis client error', err))

export async function connectRedis(): Promise<void> {
    if (!redis.isOpen) {
        await redis.connect()
    }
}
