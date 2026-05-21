import React, { useState } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

type Props = {
    value: string
    onChange: (value: string) => void
}

export default function ComposerEditorComponent({ value, onChange }: Props) {
    const [focused, setFocused] = useState(false)

    const handleMount: OnMount = (editor) => {
        editor.onDidFocusEditorText(() => setFocused(true))
        editor.onDidBlurEditorText(() => setFocused(false))
    }

    const showPlaceholder = !focused && value === ''

    return (
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {showPlaceholder && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: '8px 0 0 30px',
                        color: '#c9a0a0',
                        fontSize: 13,
                        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                >
                    Enter your prompt here:
                </div>
            )}
            <Editor
                height="100%"
                theme="vs-dark"
                language="plaintext"
                value={value}
                onChange={v => onChange(v ?? '')}
                onMount={handleMount}
                options={{
                    minimap: { enabled: false },
                    lineNumbers: 'off',
                    wordWrap: 'on',
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                }}
            />
        </div>
    )
}
