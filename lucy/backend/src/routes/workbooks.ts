import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { WorkbookType, PicType } from '@billdestein/joy-common'
import { requireSession } from '../middleware/session'
import {
    workbookDir,
    picPath,
    readWorkbook,
    saveWorkbook,
    listWorkbooks,
    createEmptyWorkbook,
} from '../services/files'
import { generateImage, mutateImage } from '../services/gemini'

const router = Router()
router.use(requireSession)

router.post('/create-workbook', async (req: Request, res: Response) => {
    const { workbookName } = req.body
    const slug = req.user!.slug

    fs.mkdirSync(workbookDir(slug, workbookName), { recursive: true })
    saveWorkbook(slug, createEmptyWorkbook(workbookName))

    res.status(200).json({})
})

router.post('/clone-workbook', async (req: Request, res: Response) => {
    const { workbook, newWorkbookName } = req.body as { workbook: WorkbookType; newWorkbookName: string }
    const slug = req.user!.slug

    const srcDir = workbookDir(slug, workbook.workbookName)
    const dstDir = workbookDir(slug, newWorkbookName)
    fs.mkdirSync(dstDir, { recursive: true })

    for (const pic of workbook.pics) {
        if (pic.mimeType === '') continue
        const src = path.join(srcDir, pic.filename)
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(dstDir, pic.filename))
        }
    }

    const cloned: WorkbookType = { ...workbook, workbookName: newWorkbookName, createdAt: Date.now() }
    saveWorkbook(slug, cloned)

    res.status(200).json({})
})

router.post('/delete-pic', async (req: Request, res: Response) => {
    const { workbook, picName } = req.body as { workbook: WorkbookType; picName: string }
    const slug = req.user!.slug

    const filePath = picPath(slug, workbook.workbookName, picName)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    const updated: WorkbookType = { ...workbook, pics: workbook.pics.filter(p => p.filename !== picName) }
    saveWorkbook(slug, updated)

    res.status(200).json({})
})

router.post('/delete-workbook', async (req: Request, res: Response) => {
    const { workbookName } = req.body
    const slug = req.user!.slug

    const dir = workbookDir(slug, workbookName)
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })

    res.status(200).json({ workbooks: listWorkbooks(slug) })
})

router.post('/generate-pic', async (req: Request, res: Response) => {
    const { imageFilename, workbook } = req.body as { imageFilename: string; workbook: WorkbookType }
    const slug = req.user!.slug

    const focusedPrompt = workbook.prompts.find(p => p.focused)
    const promptText = (focusedPrompt?.text ?? '')
        .split('\n')
        .filter(line => !line.startsWith('//') && !line.startsWith('--'))
        .join('\n')
        .trim()

    let imageBuffer: Buffer
    try {
        if (!workbook.focusedPicFilename || workbook.focusedPicFilename === 'empty') {
            imageBuffer = await generateImage(promptText)
        } else {
            const srcPath = picPath(slug, workbook.workbookName, workbook.focusedPicFilename)
            const srcBase64 = fs.readFileSync(srcPath).toString('base64')
            const srcMime = workbook.pics.find(p => p.filename === workbook.focusedPicFilename)?.mimeType ?? 'image/png'
            imageBuffer = await mutateImage(srcBase64, srcMime, promptText)
        }
    } catch (err) {
        console.error('generate-pic error:', err)
        res.status(500).json({ error: String(err) })
        return
    }

    const outPath = picPath(slug, workbook.workbookName, imageFilename)
    fs.writeFileSync(outPath, imageBuffer)

    const newPic: PicType = { createdAt: Date.now(), encodedImage: '', filename: imageFilename, mimeType: 'image/png' }
    const updated: WorkbookType = {
        ...workbook,
        pics: [...workbook.pics, newPic],
        focusedPicFilename: imageFilename,
    }
    saveWorkbook(slug, updated)

    res.status(200).json({ workbook: updated })
})

router.post('/upload-pic', async (req: Request, res: Response) => {
    const { workbookName, imageFilename, imageData, mimeType } = req.body
    const slug = req.user!.slug

    fs.writeFileSync(picPath(slug, workbookName, imageFilename), Buffer.from(imageData, 'base64'))

    const workbook = readWorkbook(slug, workbookName)
    const newPic: PicType = { createdAt: Date.now(), encodedImage: '', filename: imageFilename, mimeType }
    const updated: WorkbookType = { ...workbook, pics: [...workbook.pics, newPic], focusedPicFilename: imageFilename }
    saveWorkbook(slug, updated)

    res.status(200).json({ workbook: updated })
})

router.post('/upload-pic-from-url', async (req: Request, res: Response) => {
    const { workbookName, imageUrl, imageFilename } = req.body
    const slug = req.user!.slug

    let imageBuffer: Buffer
    let mimeType: string
    try {
        const fetchRes = await fetch(imageUrl)
        if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`)
        mimeType = fetchRes.headers.get('content-type') ?? 'image/jpeg'
        imageBuffer = Buffer.from(await fetchRes.arrayBuffer())
    } catch (err) {
        res.status(502).json({ error: String(err) })
        return
    }

    fs.writeFileSync(picPath(slug, workbookName, imageFilename), imageBuffer)

    const workbook = readWorkbook(slug, workbookName)
    const newPic: PicType = { createdAt: Date.now(), encodedImage: '', filename: imageFilename, mimeType }
    const updated: WorkbookType = { ...workbook, pics: [...workbook.pics, newPic], focusedPicFilename: imageFilename }
    saveWorkbook(slug, updated)

    res.status(200).json({ workbook: updated })
})

router.get('/get-pic', async (req: Request, res: Response) => {
    const { workbookName, picFilename } = req.query as { workbookName: string; picFilename: string }
    const slug = req.user!.slug

    const filePath = picPath(slug, workbookName, picFilename)
    if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Pic not found' })
        return
    }

    res.status(200).json({ encodedImage: fs.readFileSync(filePath).toString('base64') })
})

router.get('/get-workbook', async (req: Request, res: Response) => {
    const { workbookName } = req.query as { workbookName: string }
    const slug = req.user!.slug
    res.status(200).json({ workbook: readWorkbook(slug, workbookName) })
})

router.get('/list-workbooks', async (req: Request, res: Response) => {
    res.status(200).json({ workbooks: listWorkbooks(req.user!.slug) })
})

export default router
