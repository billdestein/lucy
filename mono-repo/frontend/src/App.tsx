import { CSSProperties, useEffect, useRef, useState } from 'react'
import { setCanvas, addApplet } from '@billdestein/lucy-applets'
import { backendLogin, handleRedirectCallback, isAuthenticated, signIn, signUp } from './auth'
import { MainMenuComponent } from './components/MainMenuComponent'
import { WorkbookListApplet } from './applets/WorkbookListApplet'

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
    const [authError, setAuthError] = useState<string | null>(null)
    const canvasInitialized = useRef(false)

    // Start a Cognito redirect flow. Hide the buttons optimistically (the browser normally
    // navigates away within a moment), but if the redirect fails — e.g. missing config or an
    // unreachable discovery endpoint — restore the buttons and show the error instead of
    // leaving the user stuck on a blank landing page.
    async function startAuth(begin: () => Promise<void>) {
        setAuthError(null)
        setSigningIn(true)
        try {
            await begin()
        } catch (e) {
            console.error('Auth redirect failed', e)
            setAuthError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.')
            setSigningIn(false)
        }
    }

    useEffect(() => {
        // Preload the WorkbookApplet chunk immediately.
        import('./applets/WorkbookApplet')
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
                    <AuthButton label="Sign Up" onClick={() => startAuth(signUp)} />
                    <AuthButton label="Sign In" onClick={() => startAuth(signIn)} />
                </div>
            )}
            {authError && (
                <div
                    style={{
                        color: '#ff6b6b',
                        fontFamily: 'sans-serif',
                        fontSize: 13,
                        marginTop: 16,
                        maxWidth: 360,
                        textAlign: 'center',
                    }}
                >
                    {authError}
                </div>
            )}
        </div>
    )
}
