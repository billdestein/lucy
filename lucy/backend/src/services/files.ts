import fs from 'fs'
import path from 'path'
import { WorkbookType, PicType, PromptType } from '@billdestein/joy-common'
import { config } from '../config'

export function workbookDir(slug: string, workbookName: string): string {
    return path.join(config.mountDir, 'users', slug, 'workbooks', workbookName)
}

export function workbookJsonPath(slug: string, workbookName: string): string {
    return path.join(workbookDir(slug, workbookName), 'workbook.json')
}

export function picPath(slug: string, workbookName: string, filename: string): string {
    return path.join(workbookDir(slug, workbookName), filename)
}

export function readWorkbook(slug: string, workbookName: string): WorkbookType {
    return JSON.parse(fs.readFileSync(workbookJsonPath(slug, workbookName), 'utf8')) as WorkbookType
}

export function saveWorkbook(slug: string, workbook: WorkbookType): void {
    const dir = workbookDir(slug, workbook.workbookName)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(workbookJsonPath(slug, workbook.workbookName), JSON.stringify(workbook, null, 2))
}

export function listWorkbooks(slug: string): WorkbookType[] {
    const workbooksRoot = path.join(config.mountDir, 'users', slug, 'workbooks')
    if (!fs.existsSync(workbooksRoot)) return []

    const workbooks: WorkbookType[] = []
    for (const entry of fs.readdirSync(workbooksRoot)) {
        const jsonPath = path.join(workbooksRoot, entry, 'workbook.json')
        if (fs.existsSync(jsonPath)) {
            workbooks.push(JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as WorkbookType)
        }
    }
    return workbooks
}

export function createEmptyWorkbook(name: string): WorkbookType {
    const emptyPic: PicType = {
        createdAt: Date.now(),
        encodedImage: '',
        filename: 'empty',
        mimeType: '',
    }
    const emptyPrompt: PromptType = {
        createdAt: Date.now(),
        focused: true,
        text: '',
    }
    return {
        createdAt: Date.now(),
        focusedPicFilename: 'empty',
        pics: [emptyPic],
        prompts: [emptyPrompt],
        workbookName: name,
    }
}
