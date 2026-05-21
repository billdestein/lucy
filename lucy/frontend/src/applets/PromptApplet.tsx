import React, { useState } from 'react'
import { Frame, AppletProps, removeApplet } from '@billdestein/joy-applets'
import { isValidFilename } from '../promptProtocol'

type Message = {
    prompt: string
    onOk: (value: string) => void
}

export default function PromptApplet(props: AppletProps) {
    const { frameId, prompt, onOk } = { ...props, ...(props.message as Message) }
    const [text, setText] = useState('')
    const [error, setError] = useState('')

    function handleOk() {
        if (!isValidFilename(text)) {
            setError('Invalid filename')
            return
        }
        onOk(text)
        removeApplet(frameId)
    }

    function handleCancel() {
        removeApplet(frameId)
    }

    return (
        <Frame {...props} title="Lucy" width={380} height={140}>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, color: '#ccc', fontSize: 13 }}>
                <div>{prompt}</div>
                <input
                    autoFocus
                    value={text}
                    onChange={e => { setText(e.target.value); setError('') }}
                    onKeyDown={e => { if (e.key === 'Enter') handleOk() }}
                    style={{
                        background: '#3c3c3c',
                        border: '1px solid #555',
                        color: '#ccc',
                        padding: '4px 8px',
                        fontSize: 13,
                        borderRadius: 3,
                        outline: 'none',
                    }}
                />
                {error && <div style={{ color: '#f88', fontSize: 12 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={handleCancel} style={btnStyle}>Cancel</button>
                    <button onClick={handleOk} style={{ ...btnStyle, background: '#0e639c' }}>OK</button>
                </div>
            </div>
        </Frame>
    )
}

const btnStyle: React.CSSProperties = {
    background: '#3c3c3c',
    border: 'none',
    color: '#ccc',
    padding: '4px 14px',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 13,
}
