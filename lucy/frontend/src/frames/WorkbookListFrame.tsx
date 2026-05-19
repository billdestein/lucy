import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridApi } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import Frame from '../Frame'
import { FrameProps, canvas } from '../canvas'
import { WorkbookType } from '@billdestein/joy-common'
import { ButtonIcons } from '../ButtonIcons'
import { stripForBackend } from '../workbookProtocol'
import FrameHeaderButtonComponent from '../components/FrameHeaderButtonComponent'
import PromptFrame from './PromptFrame'
import UploadWorkbookFrame from './UploadWorkbookFrame'
import WorkbookFrame from './WorkbookFrame'

type RowData = {
    name: string
    lastModifiedISO: string
    lastModifiedAgo: string
    _wb: WorkbookType
}

function toISO(ts: number): string {
    return new Date(ts).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
}

function toAgo(ts: number): string {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} minutes ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hours ago`
    return `${Math.floor(hrs / 24)} days ago`
}

function wbToRow(wb: WorkbookType): RowData {
    return {
        name: wb.workbookName,
        lastModifiedISO: toISO(wb.createdAt),
        lastModifiedAgo: toAgo(wb.createdAt),
        _wb: wb,
    }
}

export default function WorkbookListFrame(props: FrameProps) {
    const [rowData, setRowData] = useState<RowData[]>([])
    const gridApiRef = useRef<GridApi | null>(null)
    const gridContainerRef = useRef<HTMLDivElement>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; wb: WorkbookType } | null>(null)

    const colDefs: ColDef<RowData>[] = [
        { field: 'name', headerName: 'Name', flex: 2, sortable: true },
        {
            field: 'lastModifiedISO',
            headerName: 'Last Modified',
            flex: 2,
            sortable: true,
            cellStyle: { fontFamily: 'monospace' },
        },
        { field: 'lastModifiedAgo', headerName: 'Age', flex: 1, sortable: false },
    ]

    async function loadWorkbooks() {
        const res = await fetch('/v1/workbooks/list-workbooks', { credentials: 'include' })
        const data = await res.json()
        setRowData((data.workbooks as WorkbookType[]).map(wbToRow))
    }

    useEffect(() => { loadWorkbooks() }, [])

    const onGridReady = useCallback((params: { api: GridApi }) => {
        gridApiRef.current = params.api
    }, [])

    useEffect(() => {
        const container = gridContainerRef.current
        if (!container) return

        function handleContextMenu(e: MouseEvent) {
            e.preventDefault()
            const target = (e.target as HTMLElement).closest('.ag-row') as HTMLElement | null
            if (!target) return
            const rowIndex = parseInt(target.getAttribute('row-index') ?? '-1', 10)
            if (rowIndex < 0) return
            const rowNode = gridApiRef.current?.getDisplayedRowAtIndex(rowIndex)
            if (!rowNode) return
            const wb = (rowNode.data as RowData)._wb
            setContextMenu({ x: e.clientX, y: e.clientY, wb })
        }

        container.addEventListener('contextmenu', handleContextMenu)
        return () => container.removeEventListener('contextmenu', handleContextMenu)
    }, [])

    function openWorkbook(wb: WorkbookType) {
        canvas.addFrame(WorkbookFrame, { message: { workbookName: wb.workbookName } })
    }

    function cloneWorkbook(wb: WorkbookType) {
        canvas.addFrame(PromptFrame, {
            isModal: true,
            message: {
                prompt: 'Enter a name for the cloned workbook:',
                onOk: async (newWorkbookName: string) => {
                    await fetch('/v1/workbooks/clone-workbook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ workbook: stripForBackend(wb), newWorkbookName }),
                    })
                    loadWorkbooks()
                },
            },
        })
    }

    async function deleteWorkbook(wb: WorkbookType) {
        await fetch('/v1/workbooks/delete-workbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ workbookName: wb.workbookName }),
        })
        loadWorkbooks()
    }

    function downloadWorkbook(wb: WorkbookType) {
        const blob = new Blob([JSON.stringify(wb, null, 4)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${wb.workbookName}.lucy`
        a.click()
        URL.revokeObjectURL(url)
    }

    function addWorkbook() {
        canvas.addFrame(PromptFrame, {
            isModal: true,
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

    const headerButtons = (
        <>
            <FrameHeaderButtonComponent icon={ButtonIcons.plus} handler={addWorkbook} tooltipLabel="New Workbook" />
            <FrameHeaderButtonComponent
                icon={ButtonIcons.upload}
                handler={() => canvas.addFrame(UploadWorkbookFrame, { message: { onComplete: loadWorkbooks } })}
                tooltipLabel="Upload Workbook"
            />
            <FrameHeaderButtonComponent icon={ButtonIcons.x} handler={() => canvas.removeFrame(props.frameId)} tooltipLabel="Close" />
        </>
    )

    return (
        <Frame {...props} title="Workbooks" headerButtons={headerButtons}>
            <div
                ref={gridContainerRef}
                className="ag-theme-alpine-dark"
                style={{ flex: 1, width: '100%', height: '100%' }}
                onClick={() => setContextMenu(null)}
            >
                <AgGridReact
                    rowData={rowData}
                    columnDefs={colDefs}
                    onGridReady={onGridReady}
                    onRowClicked={e => openWorkbook((e.data as RowData)._wb)}
                />
            </div>
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
                        minWidth: 160,
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {[
                        { label: 'Open workbook', action: () => { openWorkbook(contextMenu.wb); setContextMenu(null) } },
                        { label: 'Clone workbook', action: () => { cloneWorkbook(contextMenu.wb); setContextMenu(null) } },
                        { label: 'Delete workbook', action: () => { deleteWorkbook(contextMenu.wb); setContextMenu(null) } },
                        { label: 'Download workbook', action: () => { downloadWorkbook(contextMenu.wb); setContextMenu(null) } },
                    ].map(item => (
                        <div
                            key={item.label}
                            onClick={item.action}
                            style={{ padding: '7px 14px', color: '#ccc', fontSize: 13, cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#3c3c3c')}
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
