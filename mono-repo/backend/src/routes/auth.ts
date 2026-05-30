import { Router } from 'express'
import * as crypto from 'crypto'
import * as path from 'path'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { config, isHttps } from '../config'
import { redis } from '../services/redis'
import { findOrCreateUser } from '../services/users'
import { ensureDir, usersDir } from '../services/files'
import { asyncHandler } from '../middleware/session'

const issuer = `https://cognito-idp.${config.cognitoRegion}.amazonaws.com/${config.cognitoUserPoolId}`
const JWKS = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))

const SESSION_TTL_SECONDS = 60 * 60 // one hour

export const authRouter = Router()

// POST /v1/auth/login
// Verifies the Cognito ID token (not the access token) via the JWKS endpoint using jose,
// extracts the email claim, creates a session in Redis, and sets an http-only cookie.
authRouter.post(
    '/login',
    asyncHandler(async (req, res) => {
        const header = req.header('authorization') || ''
        const token = header.startsWith('Bearer ') ? header.slice(7) : header
        if (!token) {
            res.status(401).json({ error: 'Missing authorization header' })
            return
        }

        let email: string
        try {
            const { payload } = await jwtVerify(token, JWKS, {
                issuer,
                audience: config.cognitoClientId,
            })
            email = payload.email as string
        } catch (err: any) {
            res.status(401).json({ error: `Token verification failed: ${err.message}` })
            return
        }

        if (!email) {
            res.status(401).json({ error: 'Token has no email claim' })
            return
        }

        const user = findOrCreateUser(email)

        const sessionId = crypto.randomBytes(32).toString('hex')
        await redis.set(sessionId, email, { EX: SESSION_TTL_SECONDS })

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: isHttps,
            sameSite: 'lax',
            maxAge: SESSION_TTL_SECONDS * 1000,
        })

        // Create the newly logged-in user's directory if it does not exist.
        await ensureDir(path.join(usersDir(), user.slug))

        res.status(200).json({})
    })
)
