import { Router } from 'express'

const router = Router()

// GET /v1/health/check -> HTTP 200, no body.
router.get('/check', (_req, res) => {
    res.status(200).end()
})

export default router
