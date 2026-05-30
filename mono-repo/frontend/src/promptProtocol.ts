// A prompt is largely free-form text. A comment line starts with '//'. A command line
// starts with '--'. Supported commands: '-- save as <filename>' and '-- using <filename>'.

export function parseSaveAs(text: string): string | null {
    for (const line of text.split('\n')) {
        const t = line.trim()
        const m = t.match(/^--\s*save as\s+(.+)$/i)
        if (m) return m[1].trim()
    }
    return null
}

export function parseUsing(text: string): string[] {
    const names: string[] = []
    for (const line of text.split('\n')) {
        const t = line.trim()
        const m = t.match(/^--\s*using\s+(.+)$/i)
        if (m) names.push(m[1].trim())
    }
    return names
}
