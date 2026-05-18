import { WorkbookType } from '@billdestein/joy-common'

export function getOutputFilename(promptText: string): string | null {
    const match = promptText.match(/^--\s*save as\s+(.+)$/m)
    return match ? match[1].trim() : null
}

export function stripPromptForBackend(text: string): string {
    return text
        .split('\n')
        .filter(line => !line.trimStart().startsWith('//') && !line.trimStart().startsWith('--'))
        .join('\n')
        .trim()
}

export function isValidFilename(name: string): boolean {
    return name.length > 0 && !/[/\0]/.test(name)
}
