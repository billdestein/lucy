import { CSSProperties, useEffect, useRef, useState } from 'react'
import { setCanvas, addApplet } from '@billdestein/lucy-applets'
import { backendLogin, handleRedirectCallback, isAuthenticated, signIn, signUp } from './auth'
import { MainMenuComponent } from './MainMenuComponent'
import { WorkbookListApplet } from './WorkbookListApplet'

const CANVAS_ID = 'lucy-canvas'

type Phase = 'loading' | 'signin' | 'authed'

// Shared style for the landing-page Sign Up / Sign In buttons.
const authButtonStyle: CSSProperties = {
    background: 'transparent',
    border: '1px solid gold',
    color: 'gold',
    fontSize: 13,
    fontFamily: 'sans-serif',
    padding: '4px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'all 0.15s',
}

function AuthButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            style={authButtonStyle}
            onClick={onClick}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'gold'
                e.currentTarget.style.color = 'black'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'gold'
            }}
        >
            {label}
        </button>
    )
}

export function App() {
    const [phase, setPhase] = useState<Phase>('loading')
    const [chunkReady, setChunkReady] = useState(false)
    const [signingIn, setSigningIn] = useState(false)
    const canvasInitialized = useRef(false)

    useEffect(() => {
        // Preload the WorkbookApplet chunk immediately.
        import('./WorkbookApplet')
            .then(() => setChunkReady(true))
            .catch(() => setChunkReady(true))
        ;(async () => {
            try {
                if (window.location.search.includes('code=')) {
                    await handleRedirectCallback()
                }
            } catch (e) {
                console.error('OIDC callback failed', e)
            }
            if (isAuthenticated()) {
                try {
                    await backendLogin()
                } catch (e) {
                    console.error('Backend login failed', e)
                }
                setPhase('authed')
            } else {
                setPhase('signin')
            }
        })()
    }, [])

    // After login, set up the canvas and add the initial WorkbookListApplet.
    useEffect(() => {
        if (phase === 'authed' && !canvasInitialized.current) {
            canvasInitialized.current = true
            setCanvas(CANVAS_ID)
            addApplet(WorkbookListApplet, { message: {} })
        }
    }, [phase])

    if (phase === 'authed') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                <MainMenuComponent />
                <div
                    id={CANVAS_ID}
                    style={{ position: 'relative', flex: '1 1 auto', overflow: 'hidden', background: '#101010' }}
                />
            </div>
        )
    }

    const showSpinner = !chunkReady || phase === 'loading'
    const showButtons = chunkReady && phase === 'signin' && !signingIn

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                background: '#000000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    color: 'gold',
                    fontFamily: "'Great Vibes', cursive",
                    fontSize: 100,
                    lineHeight: 1,
                }}
            >
                Lucy
            </div>
            {showSpinner && <div className="lucy-gold-spinner" />}
            {showButtons && (
                <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                    <AuthButton
                        label="Sign Up"
                        onClick={() => {
                            setSigningIn(true)
                            signUp()
                        }}
                    />
                    <AuthButton
                        label="Sign In"
                        onClick={() => {
                            setSigningIn(true)
                            signIn()
                        }}
                    />
                </div>
            )}
        </div>
    )
}
