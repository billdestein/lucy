import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
import { config } from './config'
import { redisClient } from './services/redis'
import { authRouter } from './routes/auth'
import { healthRouter } from './routes/health'
import { workbooksRouter } from './routes/workbooks'

const app = express()

app.use(express.json({ limit: '20mb' }))
app.use(cookieParser())

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.ORIGIN)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    if (req.method === 'OPTIONS') { res.sendStatus(204); return }
    next()
})

app.use('/v1/auth', authRouter)
app.use('/v1/health', healthRouter)
app.use('/v1/workbooks', workbooksRouter)

const frontendDist = path.join(__dirname, '../../frontend/dist')
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist))
    app.get('*', (_req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'))
    })
}

async function start() {
    const usersDir = path.join(config.MOUNT_DIR, 'users')
    fs.mkdirSync(usersDir, { recursive: true })

    await redisClient.connect()
    console.log('Redis connected')

    app.listen(8080, () => console.log('Lucy backend listening on port 8080'))
}

start().catch(err => { console.error(err); process.exit(1) })
