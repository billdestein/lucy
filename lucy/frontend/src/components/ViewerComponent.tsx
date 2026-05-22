import React, { useState, useRef } from 'react'
import { useWorkbook } from '../WorkbookContext'
import { addApplet } from '@billdestein/joy-applets'

export function ViewerComponent() {
    const { workbook, isLoading, selectedPicFilename } = useWorkbook()
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const pic = workbook.pics.find(p => p.filename === selectedPicFilename)
        ?? workbook.pics[workbook.pics.length - 1]

    const hasImage = pic && pic.encodedImage && pic.mimeType
    const imgSrc = hasImage ? `data:${pic.mimeType};base64,${pic.encodedImage}` : null

    function handleContextMenu(e: React.MouseEvent) {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY })
    }

    function closeMenu() { setContextMenu(null) }

    function handleDownload() {
        if (!imgSrc || !pic) return
        const a = document.createElement('a')
        a.href = imgSrc
        a.download = pic.filename
        a.click()
        closeMenu()
    }

    function handleSaveAs() {
        alert('save')
        closeMenu()
    }

    async function handleZoom() {
        if (!pic) return
        const { ZoomApplet } = await import('../applets/ZoomApplet')
        addApplet(ZoomApplet as any, {
            height: 600, width: 800, x: 100, y: 100, zIndex: 0, isModal: false,
            message: { encodedImage: pic.encodedImage, mimeType: pic.mimeType },
        })
        closeMenu()
    }

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onContextMenu={handleContextMenu}
            onClick={closeMenu}
        >
            {imgSrc ? (
                <img
                    src={imgSrc}
                    alt={pic!.filename}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
            ) : (
                <div style={{ width: '100%', height: '100%', background: '#000' }} />
            )}

            {isLoading && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'conic-gradient(red, orange, yellow, green, blue, purple, red)',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), black calc(100% - 7px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), black calc(100% - 7px))',
                        animation: 'lucy-spin 1s linear infinite',
                    }} />
                    <style>{`@keyframes lucy-spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {contextMenu && (
                <div
                    style={{
                        position: 'fixed', top: contextMenu.y, left: contextMenu.x,
                        background: '#2d2d2d', border: '1px solid #555', borderRadius: 4,
                        zIndex: 99999, minWidth: 160, boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {[
                        { label: 'Download image', action: handleDownload },
                        { label: 'Save as pic', action: handleSaveAs },
                        { label: 'Zoom', action: handleZoom },
                    ].map(item => (
                        <div
                            key={item.label}
                            onClick={item.action}
                            style={{
                                padding: '6px 14px', color: '#ccc', fontSize: 13,
                                cursor: 'pointer', fontFamily: 'sans-serif',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#3a3a3a')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
