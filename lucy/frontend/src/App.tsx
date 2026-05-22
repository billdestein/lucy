import React, { useEffect, useState } from 'react'
import { setCanvas, addApplet } from '@billdestein/joy-applets'
import { MainMenuComponent } from './components/MainMenuComponent'
import { handleCallback, getStoredIdToken, loginToBackend, signIn } from './auth'

export function App() {
    const [authed, setAuthed] = useState(false)
    const [loading, setLoading] = useState(true)

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
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
            }}>
                <span style={{ color: 'gold', fontSize: 48, fontFamily: 'sans-serif', fontWeight: 'bold' }}>
                    Lucy
                </span>
                <button
                    onClick={signIn}
                    style={{
                        position: 'absolute', top: 12, right: 16,
                        background: 'transparent', border: '1px solid gold',
                        color: 'gold', fontSize: 13, padding: '4px 14px',
                        borderRadius: 4, cursor: 'pointer', fontFamily: 'sans-serif',
                    }}
                >
                    Sign In
                </button>
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
