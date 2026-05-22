import React, { useState, useEffect } from 'react'
import { useWorkbook } from '../WorkbookContext'
import { ComposerEditorComponent } from './ComposerEditorComponent'
import { ComposerButtonRowComponent } from './ComposerButtonRowComponent'

export function ComposerComponent() {
    const { workbook } = useWorkbook()
    const focused = workbook.prompts.find(p => p.focused)
    const [editorText, setEditorText] = useState(focused?.text ?? '')

    useEffect(() => {
        setEditorText(focused?.text ?? '')
    }, [focused?.createdAt])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <ComposerEditorComponent value={editorText} onChange={setEditorText} />
            </div>
            <ComposerButtonRowComponent editorText={editorText} />
        </div>
    )
}
