import { Router, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config'
import { setSession } from '../services/redis'
import { findOrCreateUser } from '../services/users'

const router = Router()

const jwksUrl = new URL(
    `https://cognito-idp.${config.cognitoRegion}.amazonaws.com/${config.cognitoUserPoolId}/.well-known/jwks.json`
)
const JWKS = createRemoteJWKSet(jwksUrl)

router.post('/login', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization header' })
        return
    }

    const idToken = authHeader.slice(7)

    try {
        const { payload } = await jwtVerify(idToken, JWKS)
        const email = payload.email as string
        if (!email) {
            res.status(401).json({ error: 'No email in token' })
            return
        }

        findOrCreateUser(email)

        const sessionId = uuidv4()
        await setSession(sessionId, email)

        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 3600 * 1000,
        })

        res.status(200).json({})
    } catch (err) {
        console.error('Login error:', err)
        res.status(401).json({ error: 'Invalid token' })
    }
})

export default router
