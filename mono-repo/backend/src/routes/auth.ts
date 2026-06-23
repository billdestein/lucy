import { Router } from 'express'
import crypto from 'crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { config } from '../config'
import { findOrCreateUser } from '../services/users'
import { setSession } from '../services/redis'
import { ensureDir, userRoot } from '../services/files'

const router = Router()

const issuer = `https://cognito-idp.${config.cognitoRegion}.amazonaws.com/${config.cognitoUserPoolId}`
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))

// POST /v1/auth/login
// Input: authorization header containing the Cognito ID token (not the access token).
// Verifies the token via Cognito's JWKS endpoint using jose, extracts the 'email' claim,
// creates the User + its directory, stores a session in Redis, and returns the session in
// an http-only cookie.
router.post('/login', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || ''
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
        if (!token) {
            res.status(401).json({ error: 'Missing authorization header' })
            return
        }

        const { payload } = await jwtVerify(token, jwks, {
            issuer,
            audience: config.cognitoClientId,
        })

        const email = payload.email as string | undefined
        if (!email) {
            res.status(401).json({ error: 'Token has no email claim' })
            return
        }

        const user = findOrCreateUser(email)

        const sessionId = crypto.randomBytes(32).toString('hex')
        await setSession(sessionId, email)

        // Create the newly logged-in user's directory if it does not exist.
        ensureDir(userRoot(user.slug))

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000,
        })

        // The session is delivered via Set-Cookie; the body is an empty object.
        res.json({})
    } catch (err: any) {
        console.error('login error:', err)
        res.status(401).json({ error: err?.message || 'Login failed' })
    }
})

export default router
