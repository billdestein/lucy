import React, { useRef, useState } from 'react'
import { Frame, AppletProps, removeApplet } from '@billdestein/joy-applets'
import { WorkbookType } from '@billdestein/joy-common'
import { ButtonIcons } from '../ButtonIcons'

type Message = {
    workbookName: string
    onUploaded: (workbook: WorkbookType) => void
}

export default function UploadPicApplet(props: AppletProps) {
    const { workbookName, onUploaded } = props.message as Message
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')

    async function uploadFile(file: File) {
        setUploading(true)
        setError('')
        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
            })
            const imageData = dataUrl.split(',')[1]
            const res = await fetch('/v1/workbooks/upload-pic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ workbookName, imageFilename: file.name, imageData, mimeType: file.type }),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            const data = await res.json()
            onUploaded(data.workbook)
            removeApplet(props.frameId)
        } catch (err) {
            setError(String(err))
        } finally {
            setUploading(false)
        }
    }

    async function uploadFromUrl(url: string) {
        setUploading(true)
        setError('')
        try {
            const lastSegment = url.split('/').pop()?.split('?')[0] ?? 'image'
            const res = await fetch('/v1/workbooks/upload-pic-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ workbookName, imageUrl: url, imageFilename: lastSegment }),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            const data = await res.json()
            onUploaded(data.workbook)
            removeApplet(props.frameId)
        } catch (err) {
            setError(String(err))
        } finally {
            setUploading(false)
        }
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault()
        if (e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0])
        } else {
            const url = e.dataTransfer.getData('text/uri-list')
            if (url) uploadFromUrl(url)
        }
    }

    return (
        <Frame {...props} title="Upload Image" width={420} height={220}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #444',
                        margin: 10,
                        borderRadius: 4,
                        color: '#888',
                        fontSize: 13,
                        cursor: 'default',
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={onDrop}
                >
                    {uploading ? 'Uploading…' : (
                        <>
                            <span style={{ fontSize: 24, marginBottom: 8 }}>{ButtonIcons.upload}</span>
                            <span>Drop an image or URL here</span>
                        </>
                    )}
                    {error && <div style={{ color: '#f88', marginTop: 8 }}>{error}</div>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 10px 10px' }}>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={btnStyle}
                    >
                        Browse
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]) }}
                    />
                </div>
            </div>
        </Frame>
    )
}

const btnStyle: React.CSSProperties = {
    background: '#3c3c3c',
    border: 'none',
    color: '#ccc',
    padding: '4px 14px',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 13,
}
