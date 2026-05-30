import { useEffect, useState } from 'react'
import { useWorkbook } from '../WorkbookContext'
import { openZoom } from '../launchers'

type Menu = { x: number; y: number } | null

export function ViewerComponent() {
    const { workbook, isLoading, selectedPicFilename } = useWorkbook()
    const [menu, setMenu] = useState<Menu>(null)

    useEffect(() => {
        if (!menu) return
        const close = () => setMenu(null)
        window.addEventListener('click', close)
        return () => window.removeEventListener('click', close)
    }, [menu])

    const realPics = workbook.pics.filter((p) => p.filename !== 'empty' && p.mimeType !== '')
    let pic = realPics.find((p) => p.filename === selectedPicFilename)
    if (!pic) pic = realPics.length ? realPics[realPics.length - 1] : undefined

    const dataUrl = pic && pic.encodedImage ? `data:${pic.mimeType};base64,${pic.encodedImage}` : null

    const download = () => {
        if (!dataUrl || !pic) return
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = pic.filename
        a.click()
        setMenu(null)
    }

    const zoom = () => {
        if (pic && pic.encodedImage) void openZoom(pic.encodedImage, pic.mimeType)
        setMenu(null)
    }

    return (
        <div
            style={{
                position: 'relative',
                height: '100%',
                width: '100%',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {dataUrl && (
                <img
                    src={dataUrl}
                    onContextMenu={(e) => {
                        e.preventDefault()
                        setMenu({ x: e.clientX, y: e.clientY })
                    }}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                    }}
                />
            )}

            {menu && (
                <div
                    style={{
                        position: 'fixed',
                        left: menu.x,
                        top: menu.y,
                        background: '#2d2d2d',
                        border: '1px solid #444',
                        borderRadius: 4,
                        zIndex: 100000,
                        fontSize: 13,
                        fontFamily: 'sans-serif',
                        color: '#dddddd',
                        minWidth: 150,
                    }}
                >
                    <MenuItem label="Download image" onClick={download} />
                    <MenuItem label="Save as pic" onClick={() => { alert('save'); setMenu(null) }} />
                    <MenuItem label="Zoom" onClick={zoom} />
                </div>
            )}

            {isLoading && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <style>{`@keyframes lucy-spin { to { transform: rotate(360deg); } }`}</style>
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            background:
                                'conic-gradient(red, orange, yellow, green, blue, purple, red)',
                            WebkitMask:
                                'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 7px))',
                            mask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 7px))',
                            animation: 'lucy-spin 1s linear infinite',
                        }}
                    />
                </div>
            )}
        </div>
    )
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
    const [hover, setHover] = useState(false)
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                padding: '6px 12px',
                cursor: 'pointer',
                background: hover ? '#094771' : 'transparent',
            }}
        >
            {label}
        </div>
    )
}
