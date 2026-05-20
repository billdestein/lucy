import React from 'react'
import { canvas } from '../canvas'
import DemoFrame from '../frames/DemoFrame'
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
            <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => canvas.addFrame(DemoFrame, { width: 1112, height: 625 })} style={menuButtonStyle}>Demo</button>
                <button onClick={() => canvas.addFrame(WorkbookListFrame, {})} style={menuButtonStyle}>Workbooks</button>
            </div>
            <button onClick={signOut} style={menuButtonStyle}>Sign Out</button>
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
