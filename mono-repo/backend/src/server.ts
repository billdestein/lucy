import express, { ErrorRequestHandler } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import * as path from 'path'
import { config } from './config'
import { connectRedis } from './services/redis'
import { ensureDir, usersDir } from './services/files'
import { sessionMiddleware } from './middleware/session'
import { authRouter } from './routes/auth'
import { healthRouter } from './routes/health'
import { workbooksRouter } from './routes/workbooks'

const PORT = 8080

async function main() {
    // At initialization, create MOUNT_DIR/users if it does not exist.
    await ensureDir(usersDir())
    await connectRedis()

    const app = express()

    app.use(cors({ origin: config.origin, credentials: true }))
    app.use(cookieParser())
    // 20mb limit accommodates base64-encoded image uploads.
    app.use(express.json({ limit: '20mb' }))

    // Public endpoints.
    app.use('/v1/auth', authRouter)
    app.use('/v1/health', healthRouter)

    // Authenticated endpoints.
    app.use('/v1/workbooks', sessionMiddleware, workbooksRouter)

    // Serve the frontend static bundle in production.
    const distDir = path.join(__dirname, '../../frontend/dist')
    app.use(express.static(distDir))
    // Catch-all so client-side routing works on direct URL loads.
    app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'))
    })

    const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
        console.error('Unhandled error', err)
        res.status(500).json({ error: err?.message || 'Internal server error' })
    }
    app.use(errorHandler)

    app.listen(PORT, () => {
        console.log(`Lucy backend listening on port ${PORT}`)
    })
}

main().catch((err) => {
    console.error('Failed to start server', err)
    process.exit(1)
})
