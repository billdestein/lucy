import fs from 'fs'
import path from 'path'
import { config } from '../config'
import { WorkbookType, PicType } from '@billdestein/joy-common'

export function workbookDir(slug: string, workbookName: string): string {
    return path.join(config.MOUNT_DIR, 'users', slug, 'workbooks', workbookName)
}

export function workbookJsonPath(slug: string, workbookName: string): string {
    return path.join(workbookDir(slug, workbookName), 'workbook.json')
}

export function readWorkbook(slug: string, workbookName: string): WorkbookType {
    const raw = fs.readFileSync(workbookJsonPath(slug, workbookName), 'utf-8')
    return JSON.parse(raw) as WorkbookType
}

export function saveWorkbook(slug: string, workbook: WorkbookType): void {
    const dir = workbookDir(slug, workbook.workbookName)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(workbookJsonPath(slug, workbook.workbookName), JSON.stringify(workbook, null, 2))
}

export function listWorkbooks(slug: string): WorkbookType[] {
    const wbRoot = path.join(config.MOUNT_DIR, 'users', slug, 'workbooks')
    if (!fs.existsSync(wbRoot)) return []

    const workbooks: WorkbookType[] = []
    for (const name of fs.readdirSync(wbRoot)) {
        const jsonPath = path.join(wbRoot, name, 'workbook.json')
        if (fs.existsSync(jsonPath)) {
            const raw = fs.readFileSync(jsonPath, 'utf-8')
            workbooks.push(JSON.parse(raw) as WorkbookType)
        }
    }
    return workbooks
}

export function makeSentinelPic(): PicType {
    return { createdAt: Date.now(), encodedImage: '', filename: 'empty', mimeType: '' }
}
