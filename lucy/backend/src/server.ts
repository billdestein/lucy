import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { config } from './config'
import { connectRedis } from './services/redis'
import authRouter from './routes/auth'
import healthRouter from './routes/health'
import workbooksRouter from './routes/workbooks'

const app = express()

app.use(cors({ origin: config.origin, credentials: true }))
app.use(express.json({ limit: '20mb' }))
app.use(cookieParser())

app.use('/v1/auth', authRouter)
app.use('/v1/health', healthRouter)
app.use('/v1/workbooks', workbooksRouter)

async function main() {
    await connectRedis()

    fs.mkdirSync(path.join(config.mountDir, 'users'), { recursive: true })

    app.listen(8080, () => {
        console.log('Backend listening on port 8080')
    })
}

main().catch(console.error)
