import * as fs from 'fs/promises'
import * as path from 'path'
import { WorkbookType } from '@billdestein/lucy-common'
import { config } from '../config'

// Path layout: MOUNT_DIR/users/{slug}/workbooks/{workbookName}/
export function usersDir(): string {
    return path.join(config.mountDir, 'users')
}

export function userRootDir(slug: string): string {
    return path.join(usersDir(), slug)
}

export function workbooksDir(slug: string): string {
    return path.join(userRootDir(slug), 'workbooks')
}

export function workbookDir(slug: string, workbookName: string): string {
    return path.join(workbooksDir(slug), workbookName)
}

export function workbookJsonPath(slug: string, workbookName: string): string {
    return path.join(workbookDir(slug, workbookName), 'workbook.json')
}

export async function ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true })
}

export async function readWorkbook(slug: string, workbookName: string): Promise<WorkbookType> {
    const raw = await fs.readFile(workbookJsonPath(slug, workbookName), 'utf-8')
    return JSON.parse(raw) as WorkbookType
}

// Images live in separate files; workbook.json never stores encodedImage.
export async function writeWorkbook(slug: string, workbook: WorkbookType): Promise<void> {
    await ensureDir(workbookDir(slug, workbook.workbookName))
    const toStore: WorkbookType = {
        ...workbook,
        pics: workbook.pics.map((p) => ({ ...p, encodedImage: '' })),
    }
    await fs.writeFile(
        workbookJsonPath(slug, workbook.workbookName),
        JSON.stringify(toStore, null, 2),
        'utf-8'
    )
}

// Construct the array of workbooks by reading each workbook.json file.
export async function listWorkbooks(slug: string): Promise<WorkbookType[]> {
    let entries: string[]
    try {
        entries = await fs.readdir(workbooksDir(slug))
    } catch {
        return []
    }
    const result: WorkbookType[] = []
    for (const name of entries) {
        try {
            result.push(await readWorkbook(slug, name))
        } catch {
            // Skip entries that are not workbook directories or have no workbook.json.
        }
    }
    return result
}
