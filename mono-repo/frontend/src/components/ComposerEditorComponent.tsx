import React, { useState } from 'react'
import Editor from '@monaco-editor/react'

type Props = {
    value: string
    onChange: (value: string) => void
}

export function ComposerEditorComponent({ value, onChange }: Props) {
    const [focused, setFocused] = useState(false)
    const showPlaceholder = !value && !focused

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {showPlaceholder && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    pointerEvents: 'none', zIndex: 1,
                    color: '#c9a0a0', fontSize: 13, fontFamily: 'monospace',
                    padding: '8px 0 0 30px',
                }}>
                    Enter your prompt here:
                </div>
            )}
            <Editor
                height="100%"
                theme="vs-dark"
                language="plaintext"
                value={value}
                onChange={v => onChange(v ?? '')}
                options={{
                    minimap: { enabled: false },
                    lineNumbers: 'off',
                    wordWrap: 'on',
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                }}
                onMount={editor => {
                    editor.onDidFocusEditorText(() => setFocused(true))
                    editor.onDidBlurEditorText(() => setFocused(false))
                }}
            />
        </div>
    )
}
