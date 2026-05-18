import React from 'react'
import Editor from '@monaco-editor/react'

type Props = {
    value: string
    onChange: (value: string) => void
}

export default function ComposerEditorComponent({ value, onChange }: Props) {
    return (
        <div style={{ flex: 1, overflow: 'hidden' }}>
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
            />
        </div>
    )
}
