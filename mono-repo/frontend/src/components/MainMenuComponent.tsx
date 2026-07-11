import React from 'react'
import { addApplet } from '@billdestein/joy-applets'
import { signOut } from '../auth'

export function MainMenuComponent() {
    async function handleDemo() {
        const { DemoApplet } = await import('../applets/DemoApplet')
        addApplet(DemoApplet as any, {
            height: 625, width: 1112, x: 50, y: 50, zIndex: 0, isModal: false, message: {},
        })
    }

    async function handleWorkbooks() {
        const { WorkbookListApplet } = await import('../applets/WorkbookListApplet')
        addApplet(WorkbookListApplet as any, {
            height: 400, width: 700, x: 80, y: 80, zIndex: 0, isModal: false, message: {},
        })
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', height: 36,
            background: '#2d2d2d', borderBottom: '1px solid #444', padding: '0 8px',
        }}>
            <div style={{ display: 'flex', gap: 4 }}>
                <MenuButton label="Demo" onClick={handleDemo} />
                <MenuButton label="Workbooks" onClick={handleWorkbooks} />
            </div>
            <div style={{ marginLeft: 'auto' }}>
                <MenuButton label="Sign Out" onClick={signOut} />
            </div>
        </div>
    )
}

function MenuButton({ label, onClick }: { label: string; onClick: () => void }) {
    const [hovered, setHovered] = React.useState(false)
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? '#3a3d4a' : 'transparent',
                border: 'none', color: '#ccc', fontSize: 13,
                fontFamily: 'sans-serif', padding: '4px 10px',
                borderRadius: 4, cursor: 'pointer',
            }}
        >
            {label}
        </button>
    )
}
