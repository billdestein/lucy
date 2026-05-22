import React, { useEffect, useRef, useState } from 'react'
import { Frame, AppletProps, addApplet, removeApplet } from '@billdestein/joy-applets'
import { WorkbookProvider, useWorkbook, makeEmptyPrompt } from '../WorkbookContext'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'
import { PicListComponent } from '../components/PicListComponent'
import { ViewerComponent } from '../components/ViewerComponent'
import { ComposerComponent } from '../components/ComposerComponent'
import { hydrateFromBackend, stripForBackend } from '../workbookProtocol'
import { WorkbookType } from '@billdestein/joy-common'

function WorkbookAppletInner({ frameId, height, width, x, y, zIndex, isModal, message }: AppletProps) {
    const { workbook, setWorkbook, setSelectedPicFilename } = useWorkbook()
    const workbookName = (message as { workbookName: string }).workbookName

    const [leftPct, setLeftPct] = useState(30)
    const [topPct, setTopPct] = useState(60)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function load() {
            const res = await fetch(`/v1/workbooks/get-workbook?workbookName=${encodeURIComponent(workbookName)}`, { credentials: 'include' })
            const { workbook: wb } = await res.json() as { workbook: WorkbookType }
            const prompts = wb.prompts?.length ? wb.prompts : [makeEmptyPrompt()]
            const normalized: WorkbookType = { ...wb, prompts }
            const hydrated = await hydrateFromBackend(normalized)
            setWorkbook(hydrated)
            setSelectedPicFilename(hydrated.focusedPicFilename ?? 'empty')
        }
        load()
    }, [workbookName])

    async function handleClone() {
        const { PromptApplet } = await import('./PromptApplet')
        addApplet(PromptApplet as any, {
            height: 180, width: 400, x: 200, y: 200, zIndex: 0, isModal: true,
            message: {
                prompt: 'Enter a name for the cloned workbook:',
                onOk: async (newWorkbookName: string) => {
                    await fetch('/v1/workbooks/clone-workbook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ workbook: stripForBackend(workbook), newWorkbookName }),
                    })
                },
            },
        })
    }

    async function handleUpload() {
        const { UploadPicApplet } = await import('./UploadPicApplet')
        addApplet(UploadPicApplet as any, {
            height: 300, width: 500, x: 150, y: 150, zIndex: 0, isModal: true,
            message: {
                workbookName: workbook.workbookName,
                onUploaded: async (wb: WorkbookType) => {
                    const hydrated = await hydrateFromBackend(wb)
                    setWorkbook(hydrated)
                    setSelectedPicFilename(hydrated.focusedPicFilename ?? 'empty')
                },
            },
        })
    }

    function onHorizMouseDown(e: React.MouseEvent) {
        e.preventDefault()
        const container = containerRef.current
        if (!container) return
        const startX = e.clientX
        const startPct = leftPct
        const totalW = container.offsetWidth

        function onMove(ev: MouseEvent) {
            const dx = ev.clientX - startX
            setLeftPct(Math.min(80, Math.max(10, startPct + (dx / totalW) * 100)))
        }
        function onUp() {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }

    function onVertMouseDown(e: React.MouseEvent) {
        e.preventDefault()
        const container = containerRef.current
        if (!container) return
        const startY = e.clientY
        const startPct = topPct
        const rightH = container.offsetHeight

        function onMove(ev: MouseEvent) {
            const dy = ev.clientY - startY
            setTopPct(Math.min(90, Math.max(10, startPct + (dy / rightH) * 100)))
        }
        function onUp() {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }

    return (
        <Frame
            frameId={frameId} height={height} width={width} x={x} y={y}
            zIndex={zIndex} isModal={isModal} title={workbookName}
            headerButtons={<>
                <FrameHeaderButtonComponent icon={ButtonIcons.faRegCopy} handler={handleClone} tooltipLabel="Clone Workbook" />
                <FrameHeaderButtonComponent icon={ButtonIcons.upload} handler={handleUpload} tooltipLabel="Upload Image" />
                <FrameHeaderButtonComponent icon={ButtonIcons.x} handler={() => removeApplet(frameId)} tooltipLabel="Close" />
            </>}
        >
            <div ref={containerRef} style={{ display: 'flex', width: '100%', height: '100%' }}>
                <div style={{ width: `${leftPct}%`, overflow: 'hidden' }}>
                    <PicListComponent />
                </div>

                <div
                    onMouseDown={onHorizMouseDown}
                    style={{ width: 5, background: '#444', cursor: 'col-resize', flexShrink: 0 }}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ height: `${topPct}%`, overflow: 'hidden' }}>
                        <ViewerComponent />
                    </div>

                    <div
                        onMouseDown={onVertMouseDown}
                        style={{ height: 5, background: '#444', cursor: 'row-resize', flexShrink: 0 }}
                    />

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <ComposerComponent />
                    </div>
                </div>
            </div>
        </Frame>
    )
}

export function WorkbookApplet(props: AppletProps) {
    return (
        <WorkbookProvider>
            <WorkbookAppletInner {...props} />
        </WorkbookProvider>
    )
}
