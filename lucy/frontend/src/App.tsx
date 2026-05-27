import React, { useEffect, useState } from 'react'
import { setCanvas, addApplet } from './applets/framework'
import { MainMenuComponent } from './components/MainMenuComponent'
import { handleCallback, getStoredIdToken, loginToBackend, signIn } from './auth'

export function App() {
    const [authed, setAuthed] = useState(false)
    const [loading, setLoading] = useState(true)
    const [chunkReady, setChunkReady] = useState(false)
    const [signingIn, setSigningIn] = useState(false)

    useEffect(() => {
        import('./applets/WorkbookApplet').then(() => setChunkReady(true)).catch(() => setChunkReady(true))
    }, [])

    useEffect(() => {
        async function init() {
            if (window.location.search.includes('code=')) {
                const token = await handleCallback()
                if (token) {
                    await loginToBackend(token)
                    setAuthed(true)
                    setLoading(false)
                    return
                }
            }

            const token = getStoredIdToken()
            if (token) {
                await loginToBackend(token)
                setAuthed(true)
                setLoading(false)
                return
            }

            setLoading(false)
        }
        init()
    }, [])

    // Runs after the canvas div is in the DOM
    useEffect(() => {
        if (!authed) return
        setCanvas('canvas')
        import('./applets/WorkbookListApplet').then(({ WorkbookListApplet }) => {
            addApplet(WorkbookListApplet as any, {
                height: 400, width: 700, x: 80, y: 80, zIndex: 0, isModal: false, message: {},
            })
        })
    }, [authed])

    if (loading) {
        return <div style={{ width: '100%', height: '100%', background: '#000' }} />
    }

    if (!authed) {
        return (
            <div style={{
                width: '100%', height: '100%', background: '#000',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
            }}>
                <span style={{ color: 'gold', fontSize: 100, fontFamily: 'Great Vibes' }}>
                    Lucy
                </span>
                {chunkReady && !signingIn ? (
                    <button
                        onClick={() => { setSigningIn(true); signIn() }}
                        style={{
                            marginTop: 24,
                            background: 'transparent', border: '1px solid gold',
                            color: 'gold', fontSize: 13, padding: '4px 14px',
                            borderRadius: 4, cursor: 'pointer', fontFamily: 'sans-serif',
                            transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'gold'; e.currentTarget.style.color = '#000' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'gold' }}
                    >
                        Sign In
                    </button>
                ) : (
                    <div style={{
                        marginTop: 24, width: 28, height: 28,
                        border: '3px solid rgba(255,215,0,0.2)',
                        borderTopColor: 'gold',
                        borderRadius: '50%',
                        animation: 'lucy-spin 0.8s linear infinite',
                    }} />
                )}
                <style>{`@keyframes lucy-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <MainMenuComponent />
            <div id="canvas" style={{ flex: 1, position: 'relative', overflow: 'hidden' }} />
        </div>
    )
}
