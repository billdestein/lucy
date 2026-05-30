import { addApplet } from '@billdestein/lucy-applets'
import { WorkbookType } from '@billdestein/lucy-common'

// Applets are opened via dynamic import so each lands in its own chunk and there are no
// static circular imports between applets.

export async function openWorkbookList(): Promise<number> {
    const m = await import('./applets/WorkbookListApplet')
    return addApplet(m.WorkbookListApplet, {})
}

export async function openWorkbook(workbookName: string): Promise<number> {
    const m = await import('./applets/WorkbookApplet')
    return addApplet(m.WorkbookApplet, { message: { workbookName } })
}

export async function openDemo(): Promise<number> {
    const m = await import('./applets/DemoApplet')
    return addApplet(m.DemoApplet, { width: 1112, height: 625 })
}

export async function openZoom(encodedImage: string, mimeType: string): Promise<number> {
    const m = await import('./applets/ZoomApplet')
    return addApplet(m.ZoomApplet, { message: { encodedImage, mimeType } })
}

export type PromptMessage = {
    prompt: string
    onOk: (value: string) => void
}

export async function openPrompt(message: PromptMessage): Promise<number> {
    const m = await import('./applets/PromptApplet')
    return addApplet(m.PromptApplet, { message, isModal: true, width: 440, height: 180 })
}

export type UploadPicMessage = {
    workbookName: string
    onUploaded: (workbook: WorkbookType) => void
}

export async function openUploadPic(message: UploadPicMessage): Promise<number> {
    const m = await import('./applets/UploadPicApplet')
    return addApplet(m.UploadPicApplet, { message, width: 440, height: 280 })
}

export type UploadWorkbookMessage = {
    onComplete: () => void
}

export async function openUploadWorkbook(message: UploadWorkbookMessage): Promise<number> {
    const m = await import('./applets/UploadWorkbookApplet')
    return addApplet(m.UploadWorkbookApplet, { message, width: 440, height: 220 })
}
