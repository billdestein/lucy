import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import { config } from './config'
import { usersDir, ensureDir } from './services/files'
import { sessionMiddleware } from './middleware/session'
import authRoutes from './routes/auth'
import healthRoutes from './routes/health'
import workbookRoutes from './routes/workbooks'

const app = express()

app.use(cors({ origin: config.origin, credentials: true }))
app.use(cookieParser())
// 20mb to accommodate base64-encoded image uploads.
app.use(express.json({ limit: '20mb' }))

// Unprotected routes.
app.use('/v1/auth', authRoutes)
app.use('/v1/health', healthRoutes)

// All workbook routes require a valid session.
app.use('/v1/workbooks', sessionMiddleware, workbookRoutes)

// Serve the frontend static bundle in production.
const distDir = path.join(__dirname, '../../frontend/dist')
app.use(express.static(distDir))
// Catch-all for client-side routing: serve index.html for any non-API GET.
app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
})

// Ensure MOUNT_DIR/users exists at startup.
ensureDir(usersDir())

app.listen(config.expressPort, () => {
    console.log(`Lucy backend listening on port ${config.expressPort}`)
})
