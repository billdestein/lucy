import { useEffect, useRef, useState } from 'react'
import { setCanvas } from '@billdestein/lucy-applets'
import { getIdToken, handleRedirectCallback, signIn } from './auth'
import { loginToBackend } from './api'
import { MainMenuComponent } from './components/MainMenuComponent'
import { openWorkbookList } from './launchers'

type Phase = 'loading' | 'signin' | 'authed'

export function App() {
    const [phase, setPhase] = useState<Phase>('loading')

    useEffect(() => {
        ;(async () => {
            try {
                if (window.location.search.includes('code=')) {
                    const handled = await handleRedirectCallback()
                    if (handled) {
                        await loginToBackend()
                        setPhase('authed')
                        return
                    }
                }
                if (getIdToken()) {
                    await loginToBackend()
                    setPhase('authed')
                    return
                }
                setPhase('signin')
            } catch (err) {
                console.error('Auth init failed', err)
                setPhase('signin')
            }
        })()
    }, [])

    return (
        <>
            <style>{`@keyframes lucy-spin { to { transform: rotate(360deg); } }`}</style>
            {phase === 'authed' ? <AuthedApp /> : <Splash showSignIn={phase === 'signin'} />}
        </>
    )
}

function AuthedApp() {
    const canvasRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setCanvas('lucy-canvas')
        // Immediately after login, add a WorkbookListApplet to the canvas.
        void openWorkbookList()
    }, [])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <MainMenuComponent />
            <div
                id="lucy-canvas"
                ref={canvasRef}
                style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#121212' }}
            />
        </div>
    )
}

// Black window with "Lucy" centered. While the WorkbookApplet chunk preloads, a gold spinner
// shows; once ready (and once auth state is known) the Sign In button appears.
function Splash({ showSignIn }: { showSignIn: boolean }) {
    const [chunkReady, setChunkReady] = useState(false)

    useEffect(() => {
        import('./applets/WorkbookApplet')
            .then(() => setChunkReady(true))
            .catch(() => setChunkReady(true))
    }, [])

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
            <div style={{ color: 'gold', fontSize: 100, fontFamily: '"Great Vibes", cursive' }}>
                Lucy
            </div>
            {!chunkReady || !showSignIn ? <Spinner /> : <SignInButton />}
        </div>
    )
}

function Spinner() {
    return (
        <div
            style={{
                marginTop: 24,
                width: 48,
                height: 48,
                border: '4px solid rgba(212,175,55,0.3)',
                borderTopColor: 'gold',
                borderRadius: '50%',
                animation: 'lucy-spin 1s linear infinite',
            }}
        />
    )
}

function SignInButton() {
    const [hover, setHover] = useState(false)
    const [hidden, setHidden] = useState(false)
    if (hidden) return null
    return (
        <button
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => {
                // Hide immediately, before the Cognito redirect.
                setHidden(true)
                void signIn()
            }}
            style={{
                marginTop: 24,
                background: hover ? 'gold' : 'transparent',
                border: '1px solid gold',
                color: hover ? 'black' : 'gold',
                fontSize: 13,
                fontFamily: 'sans-serif',
                padding: '4px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
            }}
        >
            Sign In
        </button>
    )
}
