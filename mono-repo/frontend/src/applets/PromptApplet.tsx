import { useState } from 'react'
import { AppletProps, Frame, removeApplet } from '@billdestein/lucy-applets'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'
import type { PromptMessage } from '../launchers'

// Valid text is text usable as a Linux file name.
function isValidFilename(name: string): boolean {
    const t = name.trim()
    if (t === '' || t === '.' || t === '..') return false
    return !/[/\0]/.test(t)
}

const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid #888',
    color: '#dddddd',
    fontSize: 13,
    fontFamily: 'sans-serif',
    padding: '4px 14px',
    borderRadius: 4,
    cursor: 'pointer',
}

export function PromptApplet(props: AppletProps) {
    const { prompt, onOk } = props.message as PromptMessage
    const [value, setValue] = useState('')
    const [error, setError] = useState(false)

    const ok = () => {
        if (!isValidFilename(value)) {
            setError(true)
            return
        }
        onOk(value.trim())
        removeApplet(props.appletId)
    }

    const cancel = () => removeApplet(props.appletId)

    return (
        <Frame
            height={props.height}
            isModal={props.isModal}
            width={props.width}
            x={props.x}
            y={props.y}
            zIndex={props.zIndex}
            title={prompt}
            headerButtons={
                <FrameHeaderButtonComponent
                    icon={ButtonIcons.x}
                    tooltipLabel="Close"
                    handler={cancel}
                />
            }
        >
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: 16,
                    background: '#1e1e1e',
                    color: '#dddddd',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ fontSize: 14 }}>{prompt}</div>
                <input
                    autoFocus
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        setError(false)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') ok()
                        if (e.key === 'Escape') cancel()
                    }}
                    style={{
                        padding: '6px 8px',
                        fontSize: 13,
                        background: '#2d2d2d',
                        border: `1px solid ${error ? '#c0392b' : '#555'}`,
                        borderRadius: 4,
                        color: '#ffffff',
                    }}
                />
                {error && (
                    <div style={{ color: '#e74c3c', fontSize: 12 }}>
                        Not a valid file name.
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button style={buttonStyle} onClick={cancel}>
                        Cancel
                    </button>
                    <button style={buttonStyle} onClick={ok}>
                        OK
                    </button>
                </div>
            </div>
        </Frame>
    )
}
