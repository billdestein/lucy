import React, { useState } from 'react'
import { Frame, AppletProps, removeApplet } from './framework'

function isValidLinuxFilename(name: string): boolean {
    return name.length > 0 && !name.includes('/') && !name.includes('\0')
}

export function PromptApplet({ frameId, height, width, x, y, zIndex, isModal, message }: AppletProps) {
    const { prompt, onOk } = message as { prompt: string; onOk: (value: string) => void }
    const [value, setValue] = useState('')
    const [error, setError] = useState('')

    function handleOk() {
        if (!isValidLinuxFilename(value)) {
            setError('Invalid filename.')
            return
        }
        onOk(value)
        removeApplet(frameId)
    }

    function handleCancel() {
        removeApplet(frameId)
    }

    return (
        <Frame
            frameId={frameId} height={height} width={width} x={x} y={y}
            zIndex={zIndex} isModal={isModal} title="Prompt"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, color: '#ccc', fontFamily: 'sans-serif', fontSize: 13 }}>
                <div>{prompt}</div>
                <input
                    autoFocus
                    value={value}
                    onChange={e => { setValue(e.target.value); setError('') }}
                    onKeyDown={e => { if (e.key === 'Enter') handleOk() }}
                    style={{ background: '#3c3c3c', border: '1px solid #555', color: '#ccc', padding: '4px 8px', borderRadius: 3, fontSize: 13 }}
                />
                {error && <div style={{ color: '#f44' }}>{error}</div>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={handleCancel} style={btnStyle}>Cancel</button>
                    <button onClick={handleOk} style={{ ...btnStyle, background: '#0e639c' }}>OK</button>
                </div>
            </div>
        </Frame>
    )
}

const btnStyle: React.CSSProperties = {
    background: '#3c3c3c', border: '1px solid #555', color: '#ccc',
    padding: '4px 14px', borderRadius: 3, fontSize: 13, cursor: 'pointer',
}
