import { WorkbookType, PicType } from '@billdestein/joy-common'

export type PreparedPrompt = {
    referencedPics: PicType[]
    outputFilename: string | null
    promptText: string
}

export function preparePrompt(workbook: WorkbookType): PreparedPrompt {
    const focused = workbook.prompts.find(p => p.focused)
    const text = focused?.text ?? ''
    const lines = text.split('\n')

    let outputFilename: string | null = null
    const referencedPics: PicType[] = []

    for (const line of lines) {
        const trimmed = line.trimStart()
        const saveMatch = trimmed.match(/^--\s*save as\s+(.+)$/i)
        if (saveMatch) {
            outputFilename = saveMatch[1].trim()
            continue
        }
        const usingMatch = trimmed.match(/^--\s*using\s+(.+)$/i)
        if (usingMatch) {
            const filename = usingMatch[1].trim()
            const pic = workbook.pics.find(p => p.filename === filename)
            if (pic) referencedPics.push(pic)
        }
    }

    const promptText = lines
        .filter(line => {
            const t = line.trimStart()
            return !t.startsWith('//') && !t.startsWith('--')
        })
        .join('\n')
        .trim()

    return { referencedPics, outputFilename, promptText }
}
