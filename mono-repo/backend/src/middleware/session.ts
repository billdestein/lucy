import { RequestHandler } from 'express'
import { redis } from '../services/redis'
import { findOrCreateUser } from '../services/users'

// All endpoints (other than login and health) receive the session id in an http-only
// cookie. The session id is used to look up the email in Redis, and the email is used to
// find-or-create the in-memory User object.
export const sessionMiddleware: RequestHandler = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.sessionId
        if (!sessionId) {
            res.status(401).json({ error: 'No session' })
            return
        }
        const email = await redis.get(sessionId)
        if (!email) {
            res.status(401).json({ error: 'Invalid or expired session' })
            return
        }
        req.user = findOrCreateUser(email)
        next()
    } catch (err) {
        next(err)
    }
}

// Wrap async route handlers so rejected promises reach the Express error handler.
export const asyncHandler =
    (fn: RequestHandler): RequestHandler =>
    (req, res, next) =>
        Promise.resolve(fn(req, res, next)).catch(next)
