import Editor, { OnMount } from '@monaco-editor/react'
import { useState } from 'react'

type Props = {
    value: string
    onChange: (value: string) => void
}

// The entire viewport is a Monaco editor (vs-dark, plaintext, no minimap, no line numbers,
// word wrap on, font size 13). It is a controlled component; the parent owns the text.
export function ComposerEditorComponent({ value, onChange }: Props) {
    const [focused, setFocused] = useState(false)

    const onMount: OnMount = (editor) => {
        editor.onDidFocusEditorText(() => setFocused(true))
        editor.onDidBlurEditorText(() => setFocused(false))
    }

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <Editor
                height="100%"
                theme="vs-dark"
                language="plaintext"
                value={value}
                onChange={(v) => onChange(v ?? '')}
                onMount={onMount}
                options={{
                    minimap: { enabled: false },
                    lineNumbers: 'off',
                    wordWrap: 'on',
                    fontSize: 13,
                }}
            />
            {value === '' && !focused && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        pointerEvents: 'none',
                        color: '#c9a0a0',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        padding: '8px 0 0 30px',
                    }}
                >
                    Enter your prompt here:
                </div>
            )}
        </div>
    )
}
