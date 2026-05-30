import { useRef, useState } from 'react'
import { AppletProps, Frame, removeApplet } from '@billdestein/lucy-applets'
import { WorkbookType } from '@billdestein/lucy-common'
import { apiPost } from '../api'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'
import type { UploadPicMessage } from '../launchers'

const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid #888',
    color: '#dddddd',
    fontSize: 13,
    fontFamily: 'sans-serif',
    padding: '4px 14px',
    borderRadius: 4,
    cursor: 'pointer',
}

export function UploadPicApplet(props: AppletProps) {
    const { workbookName, onUploaded } = props.message as UploadPicMessage
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [status, setStatus] = useState<'idle' | 'uploading'>('idle')
    const [error, setError] = useState<string | null>(null)

    const finish = (workbook: WorkbookType) => {
        onUploaded(workbook)
        removeApplet(props.appletId)
    }

    const uploadFile = (file: File) => {
        setStatus('uploading')
        setError(null)
        const reader = new FileReader()
        reader.onload = async () => {
            try {
                const dataUrl = reader.result as string
                const imageData = dataUrl.slice(dataUrl.indexOf(',') + 1)
                const res = await apiPost<{ workbook: WorkbookType }>(
                    '/v1/workbooks/upload-pic',
                    { workbookName, imageFilename: file.name, imageData, mimeType: file.type }
                )
                finish(res.workbook)
            } catch (err) {
                setStatus('idle')
                setError(err instanceof Error ? err.message : String(err))
            }
        }
        reader.onerror = () => {
            setStatus('idle')
            setError('Failed to read file')
        }
        reader.readAsDataURL(file)
    }

    const uploadUrl = async (imageUrl: string) => {
        setStatus('uploading')
        setError(null)
        try {
            const clean = imageUrl.split('?')[0]
            const imageFilename = clean.substring(clean.lastIndexOf('/') + 1) || 'image'
            const res = await apiPost<{ workbook: WorkbookType }>(
                '/v1/workbooks/upload-pic-from-url',
                { workbookName, imageUrl, imageFilename }
            )
            finish(res.workbook)
        } catch (err) {
            setStatus('idle')
            setError(err instanceof Error ? err.message : String(err))
        }
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0])
        } else {
            const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
            if (url) void uploadUrl(url)
        }
    }

    return (
        <Frame
            height={props.height}
            isModal={props.isModal}
            width={props.width}
            x={props.x}
            y={props.y}
            zIndex={props.zIndex}
            title="Upload Image"
            headerButtons={
                <FrameHeaderButtonComponent
                    icon={ButtonIcons.x}
                    tooltipLabel="Close"
                    handler={() => removeApplet(props.appletId)}
                />
            }
        >
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#1e1e1e',
                    color: '#dddddd',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        margin: 12,
                        border: '2px dashed #555',
                        borderRadius: 6,
                        cursor: 'pointer',
                    }}
                >
                    <div style={{ fontSize: 22 }}>{ButtonIcons.upload}</div>
                    <div>{status === 'uploading' ? 'Uploading…' : 'Drop an image or URL here'}</div>
                    {error && <div style={{ color: '#e74c3c', fontSize: 12 }}>{error}</div>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 12px 12px' }}>
                    <button style={buttonStyle} onClick={() => fileInputRef.current?.click()}>
                        Browse
                    </button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadFile(f)
                    }}
                />
            </div>
        </Frame>
    )
}
