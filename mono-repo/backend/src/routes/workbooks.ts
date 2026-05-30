import { Router } from 'express'
import * as fs from 'fs/promises'
import * as path from 'path'
import { PicType, WorkbookType } from '@billdestein/lucy-common'
import { asyncHandler } from '../middleware/session'
import {
    ensureDir,
    listWorkbooks,
    readWorkbook,
    workbookDir,
    writeWorkbook,
} from '../services/files'
import { generateImageFromText, mutateImage } from '../services/gemini'

export const workbooksRouter = Router()

// Strip comment ('//') and command ('--') lines from a prompt, leaving the free-form text.
function buildPromptText(text: string): string {
    return text
        .split('\n')
        .filter((line) => {
            const t = line.trim()
            return !t.startsWith('//') && !t.startsWith('--')
        })
        .join('\n')
        .trim()
}

// POST /v1/workbooks/create-workbook
workbooksRouter.post(
    '/create-workbook',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const { workbookName } = req.body as { workbookName: string }
        const now = Date.now()
        await ensureDir(workbookDir(slug, workbookName))
        const workbook: WorkbookType = {
            createdAt: now,
            focusedPicFilename: 'empty',
            pics: [{ createdAt: now, encodedImage: '', filename: 'empty', mimeType: '' }],
            prompts: [{ createdAt: now, focused: true, text: '' }],
            workbookName,
        }
        await writeWorkbook(slug, workbook)
        res.status(200).json({})
    })
)

// POST /v1/workbooks/clone-workbook
workbooksRouter.post(
    '/clone-workbook',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const { workbook, newWorkbookName } = req.body as {
            workbook: WorkbookType
            newWorkbookName: string
        }
        await ensureDir(workbookDir(slug, newWorkbookName))

        // Copy all pic files (skipping the empty sentinel) to the new directory.
        for (const pic of workbook.pics) {
            if (!pic.mimeType || pic.filename === 'empty') continue
            const src = path.join(workbookDir(slug, workbook.workbookName), pic.filename)
            const dst = path.join(workbookDir(slug, newWorkbookName), pic.filename)
            try {
                await fs.copyFile(src, dst)
            } catch {
                // Skip files that are missing on disk.
            }
        }

        const clone: WorkbookType = {
            createdAt: Date.now(),
            focusedPicFilename: workbook.focusedPicFilename,
            pics: workbook.pics,
            prompts: workbook.prompts,
            workbookName: newWorkbookName,
        }
        await writeWorkbook(slug, clone)
        res.status(200).json({})
    })
)

// POST /v1/workbooks/delete-pic
workbooksRouter.post(
    '/delete-pic',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const { workbook, picName } = req.body as { workbook: WorkbookType; picName: string }
        const wb = await readWorkbook(slug, workbook.workbookName)
        wb.pics = wb.pics.filter((p) => p.filename !== picName)
        await writeWorkbook(slug, wb)
        try {
            await fs.unlink(path.join(workbookDir(slug, wb.workbookName), picName))
        } catch {
            // File may already be gone.
        }
        res.status(200).json({})
    })
)

// POST /v1/workbooks/delete-workbook
workbooksRouter.post(
    '/delete-workbook',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const { workbookName } = req.body as { workbookName: string }
        await fs.rm(workbookDir(slug, workbookName), { recursive: true, force: true })
        const workbooks = await listWorkbooks(slug)
        res.status(200).json({ workbooks })
    })
)

// POST /v1/workbooks/generate-pic
workbooksRouter.post(
    '/generate-pic',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const { outputFilename, workbook } = req.body as {
            referencedPics: PicType[]
            outputFilename: string
            workbook: WorkbookType
        }

        try {
            const focused = workbook.prompts.find((p) => p.focused)
            const promptText = buildPromptText(focused?.text ?? '')

            let bytes: Buffer
            const focusedPic = workbook.focusedPicFilename
            if (!focusedPic || focusedPic === 'empty') {
                // Text-to-image generation.
                bytes = await generateImageFromText(promptText)
            } else {
                // Image mutation: read the source pic and base64-encode it.
                const srcPath = path.join(workbookDir(slug, workbook.workbookName), focusedPic)
                const srcBytes = await fs.readFile(srcPath)
                bytes = await mutateImage(srcBytes.toString('base64'), promptText)
            }

            const outPath = path.join(workbookDir(slug, workbook.workbookName), outputFilename)
            await fs.writeFile(outPath, bytes)

            const newPic: PicType = {
                createdAt: Date.now(),
                encodedImage: '',
                filename: outputFilename,
                mimeType: 'image/png',
            }

            // Upsert: replace in place if a pic with the same filename exists, else append.
            const idx = workbook.pics.findIndex((p) => p.filename === outputFilename)
            if (idx >= 0) {
                workbook.pics[idx] = newPic
            } else {
                workbook.pics.push(newPic)
            }
            workbook.focusedPicFilename = outputFilename

            await writeWorkbook(slug, workbook)
            res.status(200).json({ workbook })
        } catch (err: any) {
            console.error('generate-pic error', err)
            res.status(500).json({ error: err.message || String(err) })
        }
    })
)

// POST /v1/workbooks/upload-pic
workbooksRouter.post(
    '/upload-pic',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const { workbookName, imageFilename, imageData, mimeType } = req.body as {
            workbookName: string
            imageFilename: string
            imageData: string
            mimeType: string
        }
        await fs.writeFile(
            path.join(workbookDir(slug, workbookName), imageFilename),
            Buffer.from(imageData, 'base64')
        )
        const wb = await readWorkbook(slug, workbookName)
        wb.pics.push({
            createdAt: Date.now(),
            encodedImage: '',
            filename: imageFilename,
            mimeType,
        })
        wb.focusedPicFilename = imageFilename
        await writeWorkbook(slug, wb)
        res.status(200).json({ workbook: wb })
    })
)

// POST /v1/workbooks/upload-pic-from-url
workbooksRouter.post(
    '/upload-pic-from-url',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const { workbookName, imageUrl, imageFilename } = req.body as {
            workbookName: string
            imageUrl: string
            imageFilename: string
        }

        let response: Response
        try {
            response = await fetch(imageUrl)
        } catch (err: any) {
            res.status(502).json({ error: err.message || String(err) })
            return
        }
        if (!response.ok) {
            res.status(502).json({ error: `Fetch failed with status ${response.status}` })
            return
        }

        const mimeType = response.headers.get('content-type') || 'image/png'
        const bytes = Buffer.from(await response.arrayBuffer())
        await fs.writeFile(path.join(workbookDir(slug, workbookName), imageFilename), bytes)

        const wb = await readWorkbook(slug, workbookName)
        wb.pics.push({
            createdAt: Date.now(),
            encodedImage: '',
            filename: imageFilename,
            mimeType,
        })
        wb.focusedPicFilename = imageFilename
        await writeWorkbook(slug, wb)
        res.status(200).json({ workbook: wb })
    })
)

// GET /v1/workbooks/get-pic
workbooksRouter.get(
    '/get-pic',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const workbookName = req.query.workbookName as string
        const picFilename = req.query.picFilename as string
        const bytes = await fs.readFile(path.join(workbookDir(slug, workbookName), picFilename))
        res.status(200).json({ encodedImage: bytes.toString('base64') })
    })
)

// GET /v1/workbooks/get-workbook
workbooksRouter.get(
    '/get-workbook',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const workbookName = req.query.workbookName as string
        const workbook = await readWorkbook(slug, workbookName)
        res.status(200).json(workbook)
    })
)

// GET /v1/workbooks/list-workbooks
workbooksRouter.get(
    '/list-workbooks',
    asyncHandler(async (req, res) => {
        const slug = req.user!.slug
        const workbooks = await listWorkbooks(slug)
        res.status(200).json({ workbooks })
    })
)
