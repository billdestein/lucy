import { useEffect, useState } from 'react'
import { useWorkbook } from '../WorkbookContext'
import { ComposerEditorComponent } from './ComposerEditorComponent'
import { ComposerButtonRowComponent } from './ComposerButtonRowComponent'

// ComposerComponent owns the editor text in local state, initialized from the focused
// prompt's text and re-synced whenever the focused prompt changes.
export function ComposerComponent() {
    const { workbook } = useWorkbook()

    const focused = workbook.prompts.find((p) => p.focused)
    const focusedText = focused?.text ?? ''
    const focusedKey = focused?.createdAt ?? -1

    const [editorText, setEditorText] = useState(focusedText)

    // Re-sync when the focused prompt changes (e.g. paginator navigation).
    useEffect(() => {
        setEditorText(focusedText)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusedKey])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e' }}>
            <div style={{ flex: '1 1 auto', minHeight: 0 }}>
                <ComposerEditorComponent value={editorText} onChange={setEditorText} />
            </div>
            <div style={{ flex: '0 0 auto' }}>
                <ComposerButtonRowComponent editorText={editorText} />
            </div>
        </div>
    )
}
