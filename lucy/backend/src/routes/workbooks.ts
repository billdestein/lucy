import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { sessionMiddleware } from '../middleware/session'
import { readWorkbook, saveWorkbook, listWorkbooks, workbookDir, makeSentinelPic } from '../services/files'
import { ai } from '../services/gemini'
import { WorkbookType, PicType, PromptType } from '@billdestein/joy-common'

export const workbooksRouter = Router()
workbooksRouter.use(sessionMiddleware)

workbooksRouter.post('/create-workbook', async (req: Request, res: Response): Promise<void> => {
    const { workbookName } = req.body as { workbookName: string }
    const slug = req.user!.slug

    const dir = workbookDir(slug, workbookName)
    fs.mkdirSync(dir, { recursive: true })

    const workbook: WorkbookType = {
        createdAt: Date.now(),
        focusedPicFilename: 'empty',
        pics: [makeSentinelPic()],
        prompts: [{ createdAt: Date.now(), focused: true, text: '' }],
        workbookName,
    }
    saveWorkbook(slug, workbook)
    res.sendStatus(200)
})

workbooksRouter.post('/clone-workbook', async (req: Request, res: Response): Promise<void> => {
    const { workbook, newWorkbookName } = req.body as { workbook: WorkbookType; newWorkbookName: string }
    const slug = req.user!.slug

    const srcDir = workbookDir(slug, workbook.workbookName)
    const dstDir = workbookDir(slug, newWorkbookName)
    fs.mkdirSync(dstDir, { recursive: true })

    for (const pic of workbook.pics) {
        if (pic.mimeType === '') continue
        const src = path.join(srcDir, pic.filename)
        const dst = path.join(dstDir, pic.filename)
        if (fs.existsSync(src)) fs.copyFileSync(src, dst)
    }

    const clone: WorkbookType = {
        ...workbook,
        workbookName: newWorkbookName,
        createdAt: Date.now(),
        pics: workbook.pics.map(p => ({ ...p, encodedImage: '' })),
    }
    saveWorkbook(slug, clone)
    res.sendStatus(200)
})

workbooksRouter.post('/delete-pic', async (req: Request, res: Response): Promise<void> => {
    const { workbook, picName } = req.body as { workbook: WorkbookType; picName: string }
    const slug = req.user!.slug

    const picPath = path.join(workbookDir(slug, workbook.workbookName), picName)
    if (fs.existsSync(picPath)) fs.unlinkSync(picPath)

    const updated: WorkbookType = {
        ...workbook,
        pics: workbook.pics.filter(p => p.filename !== picName),
    }
    saveWorkbook(slug, updated)
    res.sendStatus(200)
})

workbooksRouter.post('/delete-workbook', async (req: Request, res: Response): Promise<void> => {
    const { workbookName } = req.body as { workbookName: string }
    const slug = req.user!.slug

    const dir = workbookDir(slug, workbookName)
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })

    const workbooks = listWorkbooks(slug)
    res.json({ workbooks })
})

workbooksRouter.post('/generate-pic', async (req: Request, res: Response): Promise<void> => {
    const { referencedPics: _referencedPics, outputFilename, workbook } = req.body as {
        referencedPics: PicType[]
        outputFilename: string
        workbook: WorkbookType
    }
    const slug = req.user!.slug

    const focusedPrompt = workbook.prompts.find(p => p.focused)
    const rawText = focusedPrompt?.text ?? ''
    const promptText = rawText
        .split('\n')
        .filter(line => !line.trimStart().startsWith('//') && !line.trimStart().startsWith('--'))
        .join('\n')
        .trim()

    let imageBytes: string
    try {
        if (!workbook.focusedPicFilename || workbook.focusedPicFilename === 'empty') {
            const result = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: promptText,
            })
            imageBytes = result.generatedImages![0].image!.imageBytes as unknown as string
        } else {
            const srcPath = path.join(workbookDir(slug, workbook.workbookName), workbook.focusedPicFilename)
            const srcBuf = fs.readFileSync(srcPath)
            const srcB64 = srcBuf.toString('base64')
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [
                    { inlineData: { data: srcB64, mimeType: 'image/png' } },
                    { text: promptText },
                ] as any,
            })
            const parts = response.candidates![0].content!.parts!
            const imagePart = parts.find((p: any) => p.inlineData?.data)
            if (!imagePart) throw new Error('No image returned from Gemini')
            imageBytes = imagePart.inlineData!.data as string
        }
    } catch (err) {
        console.error('Gemini error:', err)
        res.status(500).json({ error: String(err) })
        return
    }

    const outPath = path.join(workbookDir(slug, workbook.workbookName), outputFilename)
    fs.writeFileSync(outPath, Buffer.from(imageBytes, 'base64'))

    const newPic: PicType = {
        createdAt: Date.now(),
        encodedImage: '',
        filename: outputFilename,
        mimeType: 'image/png',
    }

    const existingIndex = workbook.pics.findIndex(p => p.filename === outputFilename)
    const pics = existingIndex >= 0
        ? workbook.pics.map((p, i) => i === existingIndex ? newPic : p)
        : [...workbook.pics, newPic]

    const updated: WorkbookType = { ...workbook, pics, focusedPicFilename: outputFilename }
    saveWorkbook(slug, updated)
    res.json({ workbook: updated })
})

workbooksRouter.post('/upload-pic', async (req: Request, res: Response): Promise<void> => {
    const { workbookName, imageFilename, imageData, mimeType } = req.body as {
        workbookName: string
        imageFilename: string
        imageData: string
        mimeType: string
    }
    const slug = req.user!.slug

    const outPath = path.join(workbookDir(slug, workbookName), imageFilename)
    fs.writeFileSync(outPath, Buffer.from(imageData, 'base64'))

    const workbook = readWorkbook(slug, workbookName)
    const newPic: PicType = { createdAt: Date.now(), encodedImage: '', filename: imageFilename, mimeType }
    const updated: WorkbookType = {
        ...workbook,
        pics: [...workbook.pics, newPic],
        focusedPicFilename: imageFilename,
    }
    saveWorkbook(slug, updated)
    res.json({ workbook: updated })
})

workbooksRouter.post('/upload-pic-from-url', async (req: Request, res: Response): Promise<void> => {
    const { workbookName, imageUrl, imageFilename } = req.body as {
        workbookName: string
        imageUrl: string
        imageFilename: string
    }
    const slug = req.user!.slug

    let fetchRes: globalThis.Response
    try {
        fetchRes = await fetch(imageUrl)
    } catch (err) {
        res.status(502).json({ error: String(err) })
        return
    }

    const mimeType = fetchRes.headers.get('content-type') ?? 'image/jpeg'
    const buf = Buffer.from(await fetchRes.arrayBuffer())

    const outPath = path.join(workbookDir(slug, workbookName), imageFilename)
    fs.writeFileSync(outPath, buf)

    const workbook = readWorkbook(slug, workbookName)
    const newPic: PicType = { createdAt: Date.now(), encodedImage: '', filename: imageFilename, mimeType }
    const updated: WorkbookType = {
        ...workbook,
        pics: [...workbook.pics, newPic],
        focusedPicFilename: imageFilename,
    }
    saveWorkbook(slug, updated)
    res.json({ workbook: updated })
})

workbooksRouter.get('/get-pic', async (req: Request, res: Response): Promise<void> => {
    const { workbookName, picFilename } = req.query as { workbookName: string; picFilename: string }
    const slug = req.user!.slug

    const picPath = path.join(workbookDir(slug, workbookName), picFilename)
    const data = fs.readFileSync(picPath)
    const encodedImage = data.toString('base64')
    res.json({ encodedImage })
})

workbooksRouter.get('/get-workbook', async (req: Request, res: Response): Promise<void> => {
    const { workbookName } = req.query as { workbookName: string }
    const slug = req.user!.slug

    const workbook = readWorkbook(slug, workbookName)
    res.json({ workbook })
})

workbooksRouter.get('/list-workbooks', async (_req: Request, res: Response): Promise<void> => {
    const slug = _req.user!.slug
    const workbooks = listWorkbooks(slug)
    res.json({ workbooks })
})
