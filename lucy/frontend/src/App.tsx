import React, { useEffect, useState, useRef } from 'react'
import { getIdToken, handleCallback, signIn } from './auth'
import { setCanvas, addApplet } from '@billdestein/joy-applets'
import MainMenuComponent from './components/MainMenuComponent'
import WorkbookListApplet from './applets/WorkbookListApplet'

async function loginToBackend(idToken: string) {
    try {
        await fetch('/v1/auth/login', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` },
            credentials: 'include',
        })
    } catch (err) {
        console.error('Backend login failed:', err)
    }
}

export default function App() {
    const [idToken, setIdToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const canvasRef = useRef<HTMLDivElement>(null)
    const canvasInitialized = useRef(false)

    useEffect(() => {
        async function init() {
            const params = new URLSearchParams(window.location.search)
            if (params.has('code')) {
                const token = await handleCallback()
                if (token) {
                    await loginToBackend(token)
                    setIdToken(token)
                }
                setLoading(false)
                return
            }

            const token = getIdToken()
            if (token) {
                await loginToBackend(token)
                setIdToken(token)
            }
            setLoading(false)
        }
        init()
    }, [])

    useEffect(() => {
        if (idToken && canvasRef.current && !canvasInitialized.current) {
            canvasInitialized.current = true
            setCanvas(canvasRef.current)
            addApplet(WorkbookListApplet, {})
        }
    }, [idToken])

    if (loading) {
        return (
            <div style={centerStyle}>
                <span style={{ color: 'gold', fontSize: '2rem' }}>Lucy</span>
            </div>
        )
    }

    if (!idToken) {
        return (
            <div style={{ ...centerStyle, position: 'relative' }}>
                <span style={{ color: 'gold', fontSize: '2rem' }}>Lucy</span>
                <button
                    onClick={signIn}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        padding: '0.5rem 1.2rem',
                        background: 'transparent',
                        color: 'gold',
                        border: '1px solid gold',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        borderRadius: 3,
                    }}
                >
                    Sign In
                </button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
            <MainMenuComponent />
            <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }} />
        </div>
    )
}

const centerStyle: React.CSSProperties = {
    background: 'black',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}
