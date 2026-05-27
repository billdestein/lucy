import React, { useRef, useState } from 'react'
import { Frame, AppletProps, removeApplet } from './framework'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'
import { WorkbookType } from '@billdestein/joy-common'

export function UploadPicApplet({ frameId, height, width, x, y, zIndex, isModal, message }: AppletProps) {
    const { workbookName, onUploaded } = message as {
        workbookName: string
        onUploaded: (wb: WorkbookType) => void
    }
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    async function uploadFile(file: File) {
        setUploading(true)
        setError('')
        try {
            const reader = new FileReader()
            const dataUrl = await new Promise<string>((res, rej) => {
                reader.onload = () => res(reader.result as string)
                reader.onerror = rej
                reader.readAsDataURL(file)
            })
            const imageData = dataUrl.split(',')[1]
            const res = await fetch('/v1/workbooks/upload-pic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ workbookName, imageFilename: file.name, imageData, mimeType: file.type }),
            })
            if (!res.ok) throw new Error(await res.text())
            const { workbook } = await res.json() as { workbook: WorkbookType }
            onUploaded(workbook)
            removeApplet(frameId)
        } catch (err) {
            setError(String(err))
        } finally {
            setUploading(false)
        }
    }

    async function uploadFromUrl(imageUrl: string) {
        setUploading(true)
        setError('')
        try {
            const urlObj = new URL(imageUrl)
            const imageFilename = urlObj.pathname.split('/').pop()?.split('?')[0] ?? 'image'
            const res = await fetch('/v1/workbooks/upload-pic-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ workbookName, imageUrl, imageFilename }),
            })
            if (!res.ok) throw new Error(await res.text())
            const { workbook } = await res.json() as { workbook: WorkbookType }
            onUploaded(workbook)
            removeApplet(frameId)
        } catch (err) {
            setError(String(err))
        } finally {
            setUploading(false)
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        if (e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0])
        } else {
            const url = e.dataTransfer.getData('text/uri-list')
            if (url) uploadFromUrl(url)
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) uploadFile(file)
    }

    return (
        <Frame
            frameId={frameId} height={height} width={width} x={x} y={y}
            zIndex={zIndex} isModal={isModal} title="Upload Image"
            headerButtons={
                <FrameHeaderButtonComponent
                    icon={ButtonIcons.x}
                    handler={() => removeApplet(frameId)}
                    tooltipLabel="Close"
                />
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#aaa', fontFamily: 'sans-serif', fontSize: 14,
                        cursor: 'pointer', gap: 8,
                    }}
                >
                    {uploading ? (
                        <span>Uploading…</span>
                    ) : (
                        <>
                            <span style={{ fontSize: 32 }}>↑</span>
                            <span>Drop an image or URL here</span>
                            {error && <span style={{ color: '#f44', fontSize: 12 }}>{error}</span>}
                        </>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 8px', background: '#252526' }}>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: '#3c3c3c', border: '1px solid #555', color: '#ccc', padding: '4px 12px', borderRadius: 3, fontSize: 13, cursor: 'pointer' }}
                    >
                        Browse
                    </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
        </Frame>
    )
}
