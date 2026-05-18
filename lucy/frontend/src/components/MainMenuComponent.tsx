import React from 'react'
import { canvas } from '../canvas'
import WorkbookListFrame from '../frames/WorkbookListFrame'
import { signOut } from '../auth'

export default function MainMenuComponent() {
    return (
        <div
            style={{
                width: '100%',
                height: 40,
                background: '#2d2d2d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                flexShrink: 0,
                borderBottom: '1px solid #444',
            }}
        >
            <button
                onClick={() => canvas.addFrame(WorkbookListFrame, {})}
                style={menuButtonStyle}
            >
                Workbooks
            </button>
            <button onClick={signOut} style={menuButtonStyle}>
                Sign Out
            </button>
        </div>
    )
}

const menuButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 13,
    padding: '4px 10px',
    borderRadius: 3,
}
