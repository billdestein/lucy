import { useEffect, useRef, useState } from 'react'
import { AppletProps, Frame, removeApplet } from '@billdestein/lucy-applets'
import { WorkbookType } from '@billdestein/lucy-common'
import { apiGet } from '../api'
import { hydrateFromBackend, stripForBackend } from '../workbookProtocol'
import { apiPost } from '../api'
import { WorkbookProvider } from '../WorkbookContext'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { PicListComponent } from '../components/PicListComponent'
import { ViewerComponent } from '../components/ViewerComponent'
import { ComposerComponent } from '../components/ComposerComponent'
import { ButtonIcons } from '../ButtonIcons'
import { openPrompt, openUploadPic, openWorkbook } from '../launchers'

function makeInitialWorkbook(workbookName: string): WorkbookType {
    const now = Date.now()
    return {
        createdAt: now,
        focusedPicFilename: 'empty',
        pics: [{ createdAt: now, encodedImage: '', filename: 'empty', mimeType: '' }],
        prompts: [{ createdAt: now, focused: true, text: '' }],
        workbookName,
    }
}

export function WorkbookApplet(props: AppletProps) {
    const { workbookName } = props.message as { workbookName: string }

    const [workbook, setWorkbook] = useState<WorkbookType>(() => makeInitialWorkbook(workbookName))
    const [isLoading, setIsLoading] = useState(false)
    const [selectedPicFilename, setSelectedPicFilename] = useState('empty')

    const [leftPct, setLeftPct] = useState(30)
    const [topPct, setTopPct] = useState(60)
    const rowRef = useRef<HTMLDivElement>(null)
    const rightColRef = useRef<HTMLDivElement>(null)

    // Load the workbook from the backend, hydrate images, and normalize prompts.
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const wb = await apiGet<WorkbookType>(
                    `/v1/workbooks/get-workbook?workbookName=${encodeURIComponent(workbookName)}`
                )
                const hydrated = await hydrateFromBackend(wb)
                const normalized =
                    hydrated.prompts.length === 0
                        ? {
                              ...hydrated,
                              prompts: [{ createdAt: Date.now(), focused: true, text: '' }],
                          }
                        : hydrated
                if (!cancelled) {
                    setWorkbook(normalized)
                    setSelectedPicFilename(normalized.focusedPicFilename ?? 'empty')
                }
            } catch (err) {
                console.error('Failed to load workbook', err)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [workbookName])

    const startVDrag = (e: React.MouseEvent) => {
        e.preventDefault()
        const onMove = (ev: MouseEvent) => {
            const r = rowRef.current?.getBoundingClientRect()
            if (!r) return
            setLeftPct(Math.max(10, Math.min(80, ((ev.clientX - r.left) / r.width) * 100)))
        }
        const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }

    const startHDrag = (e: React.MouseEvent) => {
        e.preventDefault()
        const onMove = (ev: MouseEvent) => {
            const r = rightColRef.current?.getBoundingClientRect()
            if (!r) return
            setTopPct(Math.max(10, Math.min(90, ((ev.clientY - r.top) / r.height) * 100)))
        }
        const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }

    const cloneHandler = () => {
        void openPrompt({
            prompt: 'Enter a name for the cloned workbook',
            onOk: async (newWorkbookName) => {
                await apiPost('/v1/workbooks/clone-workbook', {
                    workbook: stripForBackend(workbook),
                    newWorkbookName,
                })
                window.dispatchEvent(new Event('lucy:workbooks-changed'))
                void openWorkbook(newWorkbookName)
            },
        })
    }

    const uploadHandler = () => {
        void openUploadPic({
            workbookName,
            onUploaded: async (returned) => {
                const hydrated = await hydrateFromBackend(returned)
                setWorkbook(hydrated)
                setSelectedPicFilename(hydrated.focusedPicFilename ?? 'empty')
            },
        })
    }

    const headerButtons = (
        <>
            <FrameHeaderButtonComponent
                icon={ButtonIcons.faRegCopy}
                tooltipLabel="Clone Workbook"
                handler={cloneHandler}
            />
            <FrameHeaderButtonComponent
                icon={ButtonIcons.upload}
                tooltipLabel="Upload Image"
                handler={uploadHandler}
            />
            <FrameHeaderButtonComponent
                icon={ButtonIcons.x}
                tooltipLabel="Close"
                handler={() => removeApplet(props.appletId)}
            />
        </>
    )

    return (
        <Frame
            height={props.height}
            isModal={props.isModal}
            width={props.width}
            x={props.x}
            y={props.y}
            zIndex={props.zIndex}
            title={workbookName}
            headerButtons={headerButtons}
        >
            <WorkbookProvider
                value={{
                    workbook,
                    setWorkbook,
                    isLoading,
                    setIsLoading,
                    selectedPicFilename,
                    setSelectedPicFilename,
                }}
            >
                <div ref={rowRef} style={{ display: 'flex', height: '100%', width: '100%' }}>
                    <div style={{ width: `${leftPct}%`, height: '100%', minWidth: 0 }}>
                        <PicListComponent />
                    </div>
                    <div
                        onMouseDown={startVDrag}
                        style={{ width: 5, cursor: 'col-resize', background: '#333', flex: '0 0 auto' }}
                    />
                    <div
                        ref={rightColRef}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
                    >
                        <div style={{ height: `${topPct}%`, minHeight: 0 }}>
                            <ViewerComponent />
                        </div>
                        <div
                            onMouseDown={startHDrag}
                            style={{ height: 5, cursor: 'row-resize', background: '#333', flex: '0 0 auto' }}
                        />
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ComposerComponent />
                        </div>
                    </div>
                </div>
            </WorkbookProvider>
        </Frame>
    )
}
