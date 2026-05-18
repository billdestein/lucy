import React, { useState, useEffect } from 'react'
import { useWorkbook } from '../WorkbookContext'
import ComposerEditorComponent from './ComposerEditorComponent'
import ComposerButtonRowComponent from './ComposerButtonRowComponent'

export default function ComposerComponent() {
    const { workbook } = useWorkbook()
    const focusedPrompt = workbook.prompts.find(p => p.focused)
    const [editorText, setEditorText] = useState(focusedPrompt?.text ?? '')

    useEffect(() => {
        setEditorText(focusedPrompt?.text ?? '')
    }, [focusedPrompt?.createdAt])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e' }}>
            <ComposerEditorComponent value={editorText} onChange={setEditorText} />
            <ComposerButtonRowComponent editorText={editorText} />
        </div>
    )
}
