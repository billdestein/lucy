import { signOut } from '../auth'
import { openDemo, openWorkbookList } from '../launchers'

const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid #888',
    color: '#dddddd',
    fontSize: 13,
    fontFamily: 'sans-serif',
    padding: '4px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    marginRight: 8,
}

// The single MainMenuComponent: a row of buttons spanning the window width. Two left-aligned
// buttons ("Demo", "Workbooks") and one right-aligned button ("Sign Out").
export function MainMenuComponent() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                height: 44,
                background: '#1e1e1e',
                borderBottom: '1px solid #333',
                padding: '0 12px',
                flex: '0 0 auto',
            }}
        >
            <button style={buttonStyle} onClick={() => void openDemo()}>
                Demo
            </button>
            <button style={buttonStyle} onClick={() => void openWorkbookList()}>
                Workbooks
            </button>
            <div style={{ flex: 1 }} />
            <button style={{ ...buttonStyle, marginRight: 0 }} onClick={() => void signOut()}>
                Sign Out
            </button>
        </div>
    )
}
