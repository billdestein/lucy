import { Request, Response, NextFunction } from 'express'
import { redisClient } from '../services/redis'
import { findOrCreateUser } from '../services/users'
import { UserType } from '@billdestein/joy-common'

declare global {
    namespace Express {
        interface Request {
            user?: UserType
        }
    }
}

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const sessionId = req.cookies?.sessionId
    if (!sessionId) {
        res.status(401).json({ error: 'Not authenticated' })
        return
    }

    const email = await redisClient.get(`session:${sessionId}`)
    if (!email) {
        res.status(401).json({ error: 'Session expired' })
        return
    }

    req.user = findOrCreateUser(email)
    next()
}
