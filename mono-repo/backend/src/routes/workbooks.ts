import { Router, Request } from 'express'
import fs from 'fs'
import path from 'path'
import { PicType, PromptType, WorkbookType } from '@billdestein/lucy-common'
import {
    ensureDir,
    workbookDir,
    readWorkbook,
    writeWorkbook,
    listWorkbooks,
} from '../services/files'
import { generateImageFromText, mutateImage } from '../services/gemini'

const router = Router()

// The session middleware guarantees req.user is set for every route here.
function slugOf(req: Request): string {
    return req.user!.slug
}

// Strip comment lines ('//') and command lines ('--') from a prompt, leaving the text to
// send to Gemini.
function promptTextFrom(text: string): string {
    return text
        .split('\n')
        .filter(line => {
            const t = line.trim()
            return !t.startsWith('//') && !t.startsWith('--')
        })
        .join('\n')
        .trim()
}

// POST /v1/workbooks/create-workbook -> {}
router.post('/create-workbook', (req, res) => {
    const { workbookName } = req.body as { workbookName: string }
    const slug = slugOf(req)
    ensureDir(workbookDir(slug, workbookName))

    const now = Date.now()
    const workbook: WorkbookType = {
        createdAt: now,
        focusedPicFilename: 'empty',
        // A single empty sentinel pic and a single empty focused prompt.
        pics: [{ createdAt: now, encodedImage: '', filename: 'empty', mimeType: '' }],
        prompts: [{ createdAt: now, focused: true, text: '' }],
        workbookName,
    }
    writeWorkbook(slug, workbook)
    res.json({})
})

// POST /v1/workbooks/clone-workbook -> {}
router.post('/clone-workbook', (req, res) => {
    const { workbook, newWorkbookName } = req.body as {
        workbook: WorkbookType
        newWorkbookName: string
    }
    const slug = slugOf(req)
    const srcDir = workbookDir(slug, workbook.workbookName)
    const dstDir = workbookDir(slug, newWorkbookName)
    ensureDir(dstDir)

    // Copy all pic files, skipping the empty sentinel.
    for (const pic of workbook.pics) {
        if (pic.filename === 'empty' || pic.mimeType === '') continue
        const srcFile = path.join(srcDir, pic.filename)
        const dstFile = path.join(dstDir, pic.filename)
        if (fs.existsSync(srcFile)) fs.copyFileSync(srcFile, dstFile)
    }

    const clone: WorkbookType = {
        createdAt: Date.now(),
        focusedPicFilename: workbook.focusedPicFilename,
        pics: workbook.pics.map(p => ({ ...p, encodedImage: '' })),
        prompts: workbook.prompts,
        workbookName: newWorkbookName,
    }
    writeWorkbook(slug, clone)
    res.json({})
})

// POST /v1/workbooks/delete-pic -> {}
router.post('/delete-pic', (req, res) => {
    const { workbook, picName } = req.body as { workbook: WorkbookType; picName: string }
    const slug = slugOf(req)

    const wb = readWorkbook(slug, workbook.workbookName)
    wb.pics = wb.pics.filter(p => p.filename !== picName)
    if (wb.focusedPicFilename === picName) wb.focusedPicFilename = 'empty'
    writeWorkbook(slug, wb)

    const file = path.join(workbookDir(slug, workbook.workbookName), picName)
    if (fs.existsSync(file)) fs.unlinkSync(file)

    res.json({})
})

// POST /v1/workbooks/delete-workbook -> { workbooks: WorkbookType[] }
router.post('/delete-workbook', (req, res) => {
    const { workbookName } = req.body as { workbookName: string }
    const slug = slugOf(req)
    const dir = workbookDir(slug, workbookName)
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
    res.json({ workbooks: listWorkbooks(slug) })
})

// POST /v1/workbooks/generate-pic -> { workbook: WorkbookType }
router.post('/generate-pic', async (req, res) => {
    const { outputFilename, workbook } = req.body as {
        referencedPics: PicType[]
        outputFilename: string
        workbook: WorkbookType
    }
    const slug = slugOf(req)

    try {
        const focused = workbook.prompts.find((p: PromptType) => p.focused)
        const promptText = promptTextFrom(focused ? focused.text : '')

        let bytes: Buffer
        const focusedPic = workbook.focusedPicFilename
        if (!focusedPic || focusedPic === 'empty') {
            // Text-to-image generation.
            bytes = await generateImageFromText(promptText)
        } else {
            // Image mutation: read the source pic, base64-encode it, and mutate.
            const srcPath = path.join(workbookDir(slug, workbook.workbookName), focusedPic)
            const sourceBytes = fs.readFileSync(srcPath).toString('base64')
            bytes = await mutateImage(sourceBytes, promptText)
        }

        // Write the new image to disk.
        const outPath = path.join(workbookDir(slug, workbook.workbookName), outputFilename)
        fs.writeFileSync(outPath, bytes)

        // Upsert the new PicType into the workbook (replace in place if it exists).
        const newPic: PicType = {
            createdAt: Date.now(),
            encodedImage: '',
            filename: outputFilename,
            mimeType: 'image/png',
        }
        const idx = workbook.pics.findIndex(p => p.filename === outputFilename)
        if (idx >= 0) workbook.pics[idx] = newPic
        else workbook.pics.push(newPic)

        workbook.focusedPicFilename = outputFilename
        writeWorkbook(slug, workbook)
        res.json({ workbook })
    } catch (err: any) {
        console.error('generate-pic error:', err)
        res.status(500).json({ error: err?.message || 'Image generation failed' })
    }
})

// POST /v1/workbooks/upload-pic -> { workbook: WorkbookType }
router.post('/upload-pic', (req, res) => {
    const { workbookName, imageFilename, imageData, mimeType } = req.body as {
        workbookName: string
        imageFilename: string
        imageData: string
        mimeType: string
    }
    const slug = slugOf(req)

    const bytes = Buffer.from(imageData, 'base64')
    fs.writeFileSync(path.join(workbookDir(slug, workbookName), imageFilename), bytes)

    const wb = readWorkbook(slug, workbookName)
    wb.pics.push({ createdAt: Date.now(), encodedImage: '', filename: imageFilename, mimeType })
    wb.focusedPicFilename = imageFilename
    writeWorkbook(slug, wb)
    res.json({ workbook: wb })
})

// POST /v1/workbooks/upload-pic-from-url -> { workbook: WorkbookType }
router.post('/upload-pic-from-url', async (req, res) => {
    const { workbookName, imageUrl, imageFilename } = req.body as {
        workbookName: string
        imageUrl: string
        imageFilename: string
    }
    const slug = slugOf(req)

    try {
        // Fetch the image server-side using Node's native fetch (no CORS issues).
        const response = await fetch(imageUrl)
        if (!response.ok) {
            res.status(502).json({ error: `Fetch failed: ${response.status} ${response.statusText}` })
            return
        }
        const mimeType = response.headers.get('content-type') || 'application/octet-stream'
        const bytes = Buffer.from(await response.arrayBuffer())
        fs.writeFileSync(path.join(workbookDir(slug, workbookName), imageFilename), bytes)

        const wb = readWorkbook(slug, workbookName)
        wb.pics.push({ createdAt: Date.now(), encodedImage: '', filename: imageFilename, mimeType })
        wb.focusedPicFilename = imageFilename
        writeWorkbook(slug, wb)
        res.json({ workbook: wb })
    } catch (err: any) {
        console.error('upload-pic-from-url error:', err)
        res.status(502).json({ error: err?.message || 'Failed to fetch image' })
    }
})

// GET /v1/workbooks/get-pic -> { encodedImage: string }
router.get('/get-pic', (req, res) => {
    const { workbookName, picFilename } = req.query as {
        workbookName: string
        picFilename: string
    }
    const slug = slugOf(req)
    const file = path.join(workbookDir(slug, workbookName), picFilename)
    const encodedImage = fs.readFileSync(file).toString('base64')
    res.json({ encodedImage })
})

// GET /v1/workbooks/get-workbook -> bare WorkbookType (NOT wrapped)
router.get('/get-workbook', (req, res) => {
    const { workbookName } = req.query as { workbookName: string }
    const slug = slugOf(req)
    res.json(readWorkbook(slug, workbookName))
})

// GET /v1/workbooks/list-workbooks -> { workbooks: WorkbookType[] }
router.get('/list-workbooks', (req, res) => {
    res.json({ workbooks: listWorkbooks(slugOf(req)) })
})

export default router
