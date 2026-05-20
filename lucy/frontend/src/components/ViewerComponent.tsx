import React, { useState, useRef } from 'react'
import { useWorkbook } from '../WorkbookContext'
import { canvas } from '@bill-destein/react-better-frames'
import ZoomApplet from '../applets/ZoomApplet'

export default function ViewerComponent() {
    const { workbook, isLoading, selectedPicFilename } = useWorkbook()
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const pic =
        workbook.pics.find(p => p.filename === selectedPicFilename) ??
        workbook.pics[workbook.pics.length - 1]

    const hasImage = pic && pic.mimeType !== '' && pic.encodedImage !== ''
    const src = hasImage ? `data:${pic.mimeType};base64,${pic.encodedImage}` : null

    function onContextMenu(e: React.MouseEvent) {
        if (!hasImage) return
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY })
    }

    function dismiss() {
        setContextMenu(null)
    }

    function downloadImage() {
        dismiss()
        if (!src || !pic) return
        const a = document.createElement('a')
        a.href = src
        a.download = pic.filename
        a.click()
    }

    function saveAsPic() {
        dismiss()
        alert('save')
    }

    function zoomImage() {
        dismiss()
        if (!pic) return
        canvas.addFrame(ZoomApplet, { message: { encodedImage: pic.encodedImage, mimeType: pic.mimeType } })
    }

    return (
        <div
            ref={containerRef}
            style={{
                flex: 1,
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}
            onContextMenu={onContextMenu}
            onClick={dismiss}
        >
            {isLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 10 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%', animation: 'spin 1s linear infinite',
                        background: 'conic-gradient(from 0deg, #e74c3c, #f39c12, #f1c40f, #2ecc71, #3498db, #9b59b6, #e74c3c)',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 7px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 7px))',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}
            {src ? (
                <img
                    src={src}
                    alt={pic?.filename}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    draggable={false}
                />
            ) : (
                <div style={{ width: '100%', height: '100%', background: '#000' }} />
            )}
            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        left: contextMenu.x,
                        top: contextMenu.y,
                        background: '#2d2d2d',
                        border: '1px solid #555',
                        borderRadius: 4,
                        zIndex: 99999,
                        minWidth: 140,
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {[
                        { label: 'Download image', action: downloadImage },
                        { label: 'Save as pic', action: saveAsPic },
                        { label: 'Zoom', action: zoomImage },
                    ].map(item => (
                        <div
                            key={item.label}
                            onClick={item.action}
                            style={{
                                padding: '7px 14px',
                                color: '#ccc',
                                fontSize: 13,
                                cursor: 'pointer',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#3c3c3c')}
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
