import fs from 'fs'
import path from 'path'
import { WorkbookType } from '@billdestein/lucy-common'
import { config } from '../config'

// Directory layout under MOUNT_DIR:
//   users/{slug}/workbooks/{workbookName}/workbook.json + image files

export function usersDir(): string {
    return path.join(config.mountDir, 'users')
}

export function userRoot(slug: string): string {
    return path.join(usersDir(), slug)
}

export function workbooksDir(slug: string): string {
    return path.join(userRoot(slug), 'workbooks')
}

export function workbookDir(slug: string, workbookName: string): string {
    return path.join(workbooksDir(slug), workbookName)
}

export function workbookJsonPath(slug: string, workbookName: string): string {
    return path.join(workbookDir(slug, workbookName), 'workbook.json')
}

export function ensureDir(dir: string): void {
    fs.mkdirSync(dir, { recursive: true })
}

export function readWorkbook(slug: string, workbookName: string): WorkbookType {
    const raw = fs.readFileSync(workbookJsonPath(slug, workbookName), 'utf-8')
    return JSON.parse(raw) as WorkbookType
}

export function writeWorkbook(slug: string, workbook: WorkbookType): void {
    const dir = workbookDir(slug, workbook.workbookName)
    ensureDir(dir)
    fs.writeFileSync(
        workbookJsonPath(slug, workbook.workbookName),
        JSON.stringify(workbook, null, 2),
    )
}

export function listWorkbooks(slug: string): WorkbookType[] {
    const dir = workbooksDir(slug)
    if (!fs.existsSync(dir)) return []
    const workbooks: WorkbookType[] = []
    for (const name of fs.readdirSync(dir)) {
        const jsonPath = workbookJsonPath(slug, name)
        if (fs.existsSync(jsonPath)) {
            try {
                workbooks.push(JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as WorkbookType)
            } catch (err) {
                console.error(`Failed to read workbook ${name}:`, err)
            }
        }
    }
    return workbooks
}
