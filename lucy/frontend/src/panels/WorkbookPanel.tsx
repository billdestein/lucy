import React, { useState, useEffect, useRef } from 'react'
import { Frame } from '@bill-destein/react-better-frames'
import { FrameProps, canvas } from '@bill-destein/react-better-frames'
import { WorkbookProvider } from '../WorkbookContext'
import { WorkbookType, PicType, PromptType } from '@billdestein/joy-common'
import { hydrateFromBackend, stripForBackend } from '../workbookProtocol'
import { ButtonIcons } from '../ButtonIcons'
import FrameHeaderButtonComponent from '../components/FrameHeaderButtonComponent'
import PicListComponent from '../components/PicListComponent'
import ViewerComponent from '../components/ViewerComponent'
import ComposerComponent from '../components/ComposerComponent'
import UploadPicPanel from './UploadPicPanel'
import PromptPanel from './PromptPanel'

function Slider({ orientation, onMouseDown }: { orientation: 'horizontal' | 'vertical'; onMouseDown: (e: React.MouseEvent) => void }) {
    const [hovered, setHovered] = React.useState(false)
    const isVert = orientation === 'vertical'
    return (
        <div
            onMouseDown={onMouseDown}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width:  isVert ? 6 : '100%',
                height: isVert ? '100%' : 6,
                flexShrink: 0,
                cursor: isVert ? 'col-resize' : 'row-resize',
                background: hovered ? '#555' : '#3c3c3c',
                transition: 'background 0.1s',
                zIndex: 1,
            }}
        />
    )
}

type Message = { workbookName: string }

function emptyWorkbook(name: string): WorkbookType {
    const emptyPic: PicType = { createdAt: Date.now(), encodedImage: '', filename: 'empty', mimeType: '' }
    const emptyPrompt: PromptType = { createdAt: Date.now(), focused: true, text: '' }
    return { createdAt: Date.now(), focusedPicFilename: 'empty', pics: [emptyPic], prompts: [emptyPrompt], workbookName: name }
}

export default function WorkbookPanel(props: FrameProps) {
    const { workbookName } = props.message as Message
    const [workbook, setWorkbook] = useState<WorkbookType>(emptyWorkbook(workbookName))
    const [isLoading, setIsLoading] = useState(false)
    const [selectedPicFilename, setSelectedPicFilename] = useState('empty')
    const [leftPct, setLeftPct] = useState(30)
    const [topPct, setTopPct] = useState(60)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function load() {
            const res = await fetch(`/v1/workbooks/get-workbook?workbookName=${encodeURIComponent(workbookName)}`, { credentials: 'include' })
            if (!res.ok) return
            const data = await res.json()
            let wb: WorkbookType = data.workbook
            if (!wb.prompts || wb.prompts.length === 0) {
                wb = { ...wb, prompts: [{ createdAt: Date.now(), focused: true, text: '' }] }
            }
            const hydrated = await hydrateFromBackend(wb)
            setWorkbook(hydrated)
            setSelectedPicFilename(hydrated.focusedPicFilename ?? 'empty')
        }
        load()
    }, [])

    function onHorizDragStart(e: React.MouseEvent) {
        e.preventDefault()
        const container = containerRef.current
        if (!container) return
        const startX = e.clientX
        const startPct = leftPct
        const totalW = container.clientWidth

        function onMove(e: MouseEvent) {
            const dx = e.clientX - startX
            const newPct = Math.max(10, Math.min(90, startPct + (dx / totalW) * 100))
            setLeftPct(newPct)
        }
        function onUp() {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }

    function onVertDragStart(e: React.MouseEvent) {
        e.preventDefault()
        const container = containerRef.current
        if (!container) return
        const startY = e.clientY
        const startPct = topPct
        const totalH = container.clientHeight

        function onMove(e: MouseEvent) {
            const dy = e.clientY - startY
            const newPct = Math.max(10, Math.min(90, startPct + (dy / totalH) * 100))
            setTopPct(newPct)
        }
        function onUp() {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }

    function cloneHandler() {
        canvas.addFrame(PromptPanel, {
            isModal: true,
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

    function uploadHandler() {
        canvas.addFrame(UploadPicPanel, {
            isModal: true,
            message: {
                workbookName,
                onUploaded: async (wb: WorkbookType) => {
                    const hydrated = await hydrateFromBackend(wb)
                    setWorkbook(hydrated)
                    setSelectedPicFilename(hydrated.focusedPicFilename ?? 'empty')
                },
            },
        })
    }

    const headerButtons = (
        <>
            <FrameHeaderButtonComponent icon={ButtonIcons.faRegCopy} handler={cloneHandler} tooltipLabel="Clone Workbook" />
            <FrameHeaderButtonComponent icon={ButtonIcons.upload} handler={uploadHandler} tooltipLabel="Upload Image" />
            <FrameHeaderButtonComponent icon={ButtonIcons.x} handler={() => canvas.removeFrame(props.frameId)} tooltipLabel="Close" />
        </>
    )

    return (
        <WorkbookProvider value={{ workbook, setWorkbook, isLoading, setIsLoading, selectedPicFilename, setSelectedPicFilename }}>
            <Frame {...props} title={workbookName} headerButtons={headerButtons}>
                <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <div style={{ width: `${leftPct}%`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <PicListComponent />
                    </div>
                    <Slider orientation="vertical" onMouseDown={onHorizDragStart} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ height: `${topPct}%`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <ViewerComponent />
                        </div>
                        <Slider orientation="horizontal" onMouseDown={onVertDragStart} />
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <ComposerComponent />
                        </div>
                    </div>
                </div>
            </Frame>
        </WorkbookProvider>
    )
}
