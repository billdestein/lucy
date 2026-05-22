import { Router, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { redisClient } from '../services/redis'
import { findOrCreateUser } from '../services/users'
import { config } from '../config'

export const authRouter = Router()

const SESSION_TTL_SECONDS = 3600

const jwksUrl = new URL(
    `https://cognito-idp.${config.COGNITO_REGION}.amazonaws.com/${config.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
)
const JWKS = createRemoteJWKSet(jwksUrl)

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization header' })
        return
    }

    const idToken = authHeader.slice(7)

    let email: string
    try {
        const { payload } = await jwtVerify(idToken, JWKS)
        email = payload['email'] as string
        if (!email) {
            res.status(401).json({ error: 'No email in token' })
            return
        }
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' })
        return
    }

    const user = findOrCreateUser(email)

    const userDir = path.join(config.MOUNT_DIR, 'users', user.slug)
    fs.mkdirSync(userDir, { recursive: true })

    const sessionId = randomUUID()
    await redisClient.set(`session:${sessionId}`, email, { EX: SESSION_TTL_SECONDS })

    res.cookie('sessionId', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: SESSION_TTL_SECONDS * 1000,
    })

    res.sendStatus(200)
})
