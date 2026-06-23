import { Request, Response, NextFunction } from 'express'
import { getSessionEmail } from '../services/redis'
import { findOrCreateUser } from '../services/users'

// All endpoint calls (other than login and health) carry the session ID in an http-only
// cookie. The session ID is used to look up the email in Redis, and the email is used to
// "find or create" the User object, which is attached to req.user.
export async function sessionMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const sessionId = req.cookies?.sessionId
    if (!sessionId) {
        res.status(401).json({ error: 'No session' })
        return
    }
    const email = await getSessionEmail(sessionId)
    if (!email) {
        res.status(401).json({ error: 'Invalid or expired session' })
        return
    }
    req.user = findOrCreateUser(email)
    next()
}
