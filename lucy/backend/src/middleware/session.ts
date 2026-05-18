import { Request, Response, NextFunction } from 'express'
import { UserType } from '@billdestein/joy-common'
import { getSession } from '../services/redis'
import { findOrCreateUser } from '../services/users'

declare global {
    namespace Express {
        interface Request {
            user?: UserType
        }
    }
}

export async function requireSession(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies?.sessionId
    if (!sessionId) {
        res.status(401).json({ error: 'No session' })
        return
    }

    const email = await getSession(sessionId)
    if (!email) {
        res.status(401).json({ error: 'Invalid session' })
        return
    }

    req.user = findOrCreateUser(email)
    next()
}
