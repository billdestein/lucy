import { Router } from 'express'

export const healthRouter = Router()

// GET /v1/health/check
healthRouter.get('/check', (_req, res) => {
    res.sendStatus(200)
})
