import { createClient } from 'redis'
import { config } from '../config'

const isLocal = config.REDIS_HOST === 'localhost' || config.REDIS_HOST === '127.0.0.1'

export const redisClient = createClient({
    socket: {
        host: config.REDIS_HOST,
        port: parseInt(config.REDIS_PORT, 10),
        tls: !isLocal,
    },
})

redisClient.on('error', err => console.error('Redis error:', err))
