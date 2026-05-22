import { Router } from 'express'

export const healthRouter = Router()

healthRouter.get('/check', (_req, res) => {
    res.sendStatus(200)
})
