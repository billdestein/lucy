import React, { useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { GridApi, ColDef } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Frame, AppletProps, addApplet, removeApplet } from '@billdestein/joy-applets'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'
import { WorkbookType } from '@billdestein/joy-common'

type RowData = {
    name: string
    createdISO: string
    createdAgo: string
    _wb: WorkbookType
}

function toISO(ms: number): string {
    return new Date(ms).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')
}

function toAgo(ms: number): string {
    const diff = Date.now() - ms
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} minutes ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
}

function toRowData(wb: WorkbookType): RowData {
    return {
        name: wb.workbookName,
        createdISO: toISO(wb.createdAt),
        createdAgo: toAgo(wb.createdAt),
        _wb: wb,
    }
}

const COL_DEFS: ColDef<RowData>[] = [
    { field: 'name', headerName: 'Name', sortable: true, flex: 1 },
    {
        field: 'createdISO', headerName: 'Created', sortable: true, width: 180,
        cellStyle: { fontFamily: 'monospace' },
    },
    { field: 'createdAgo', headerName: 'Age', sortable: false, width: 140 },
]

export function WorkbookListApplet({ frameId, height, width, x, y, zIndex, isModal }: AppletProps) {
    const [rowData, setRowData] = useState<RowData[]>([])
    const gridApiRef = useRef<GridApi<RowData> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; wb: WorkbookType } | null>(null)

    async function loadWorkbooks() {
        const res = await fetch('/v1/workbooks/list-workbooks', { credentials: 'include' })
        const { workbooks } = await res.json() as { workbooks: WorkbookType[] }
        setRowData(workbooks.map(toRowData))
    }

    useEffect(() => { loadWorkbooks() }, [])

    function onGridReady(params: { api: GridApi<RowData> }) {
        gridApiRef.current = params.api
    }

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        function handler(e: MouseEvent) {
            e.preventDefault()
            const target = e.target as HTMLElement
            const row = target.closest('.ag-row')
            if (!row || !gridApiRef.current) return
            const rowIndex = parseInt(row.getAttribute('row-index') ?? '-1', 10)
            if (rowIndex < 0) return
            const node = gridApiRef.current.getDisplayedRowAtIndex(rowIndex)
            if (!node?.data) return
            setContextMenu({ x: e.clientX, y: e.clientY, wb: node.data._wb })
        }

        el.addEventListener('contextmenu', handler)
        return () => el.removeEventListener('contextmenu', handler)
    }, [])

    function closeMenu() { setContextMenu(null) }

    function openWorkbook(wb: WorkbookType) {
        import('./WorkbookApplet').then(({ WorkbookApplet }) => {
            addApplet(WorkbookApplet as any, {
                height: 600, width: 900, x: 100, y: 100, zIndex: 0, isModal: false,
                message: { workbookName: wb.workbookName },
            })
        })
    }

    function handleRowClick(e: { data?: RowData }) {
        if (e.data) openWorkbook(e.data._wb)
    }

    async function handleClone(wb: WorkbookType) {
        closeMenu()
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
                        body: JSON.stringify({ workbook: wb, newWorkbookName }),
                    })
                    loadWorkbooks()
                },
            },
        })
    }

    async function handleDelete(wb: WorkbookType) {
        closeMenu()
        const res = await fetch('/v1/workbooks/delete-workbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ workbookName: wb.workbookName }),
        })
        const { workbooks } = await res.json() as { workbooks: WorkbookType[] }
        setRowData(workbooks.map(toRowData))
    }

    function handleDownload(wb: WorkbookType) {
        closeMenu()
        const blob = new Blob([JSON.stringify(wb, null, 4)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'workbook.lucy'
        a.click()
        URL.revokeObjectURL(url)
    }

    async function addWorkbook() {
        const { PromptApplet } = await import('./PromptApplet')
        addApplet(PromptApplet as any, {
            height: 180, width: 400, x: 200, y: 200, zIndex: 0, isModal: true,
            message: {
                prompt: 'Enter a name for your new workbook:',
                onOk: async (workbookName: string) => {
                    await fetch('/v1/workbooks/create-workbook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ workbookName }),
                    })
                    loadWorkbooks()
                },
            },
        })
    }

    async function uploadWorkbook() {
        const { UploadWorkbookApplet } = await import('./UploadWorkbookApplet')
        addApplet(UploadWorkbookApplet as any, {
            height: 300, width: 500, x: 150, y: 150, zIndex: 0, isModal: false,
            message: { onComplete: loadWorkbooks },
        })
    }

    return (
        <Frame
            frameId={frameId} height={height} width={width} x={x} y={y}
            zIndex={zIndex} isModal={isModal} title="Workbooks"
            headerButtons={<>
                <FrameHeaderButtonComponent icon={ButtonIcons.plus} handler={addWorkbook} tooltipLabel="New Workbook" />
                <FrameHeaderButtonComponent icon={ButtonIcons.upload} handler={uploadWorkbook} tooltipLabel="Upload Workbook" />
                <FrameHeaderButtonComponent icon={ButtonIcons.x} handler={() => removeApplet(frameId)} tooltipLabel="Close" />
            </>}
        >
            <div
                ref={containerRef}
                className="ag-theme-alpine-dark"
                style={{ width: '100%', height: '100%' }}
                onClick={closeMenu}
            >
                <AgGridReact<RowData>
                    rowData={rowData}
                    columnDefs={COL_DEFS}
                    onGridReady={onGridReady}
                    onRowClicked={handleRowClick}
                    rowSelection="single"
                />
            </div>

            {contextMenu && (
                <div
                    style={{
                        position: 'fixed', top: contextMenu.y, left: contextMenu.x,
                        background: '#2d2d2d', border: '1px solid #555', borderRadius: 4,
                        zIndex: 99999, minWidth: 180, boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {[
                        { label: 'Open workbook', action: () => { openWorkbook(contextMenu.wb); closeMenu() } },
                        { label: 'Clone workbook', action: () => handleClone(contextMenu.wb) },
                        { label: 'Delete workbook', action: () => handleDelete(contextMenu.wb) },
                        { label: 'Download workbook', action: () => handleDownload(contextMenu.wb) },
                    ].map(item => (
                        <div
                            key={item.label}
                            onClick={item.action}
                            style={{ padding: '6px 14px', color: '#ccc', fontSize: 13, cursor: 'pointer', fontFamily: 'sans-serif' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#3a3a3a')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            )}
        </Frame>
    )
}
