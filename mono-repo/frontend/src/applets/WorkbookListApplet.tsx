import { useCallback, useEffect, useRef, useState } from 'react'
import { AppletProps, Frame, removeApplet } from '@billdestein/lucy-applets'
import { WorkbookType } from '@billdestein/lucy-common'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridApi, GridReadyEvent, RowClickedEvent } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { apiGet, apiPost } from '../api'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'
import { openPrompt, openUploadWorkbook, openWorkbook } from '../launchers'

// ag-grid-community (the packages build) auto-registers all community modules; no
// ModuleRegistry call is needed.

type Row = {
    name: string
    createdISO: string
    createdAgo: string
    _wb: WorkbookType
}

type Menu = { x: number; y: number; wb: WorkbookType } | null

function toCreatedISO(ts: number): string {
    return new Date(ts).toISOString().replace(/\.\d+Z$/, '').replace('T', ' ')
}

function toCreatedAgo(ts: number): string {
    const diff = Date.now() - ts
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days >= 1) return `${days} days ago`
    if (hours >= 1) return `${hours} hours ago`
    return `${minutes} minutes ago`
}

const columnDefs: ColDef<Row>[] = [
    { field: 'name', headerName: 'Name', sortable: true, flex: 1 },
    {
        field: 'createdISO',
        headerName: 'Created',
        sortable: true,
        width: 210,
        cellStyle: { fontFamily: 'monospace' },
    },
    { field: 'createdAgo', headerName: '', sortable: false, width: 150 },
]

export function WorkbookListApplet(props: AppletProps) {
    const [rowData, setRowData] = useState<Row[]>([])
    const [menu, setMenu] = useState<Menu>(null)
    const gridApiRef = useRef<GridApi<Row> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const loadWorkbooks = useCallback(async () => {
        try {
            const res = await apiGet<{ workbooks: WorkbookType[] }>('/v1/workbooks/list-workbooks')
            setRowData(
                res.workbooks.map((wb) => ({
                    name: wb.workbookName,
                    createdISO: toCreatedISO(wb.createdAt),
                    createdAgo: toCreatedAgo(wb.createdAt),
                    _wb: wb,
                }))
            )
        } catch (err) {
            console.error('Failed to list workbooks', err)
        }
    }, [])

    useEffect(() => {
        void loadWorkbooks()
        // Preload the WorkbookApplet chunk while the user reads the list.
        void import('./WorkbookApplet')
        const onChanged = () => void loadWorkbooks()
        window.addEventListener('lucy:workbooks-changed', onChanged)
        return () => window.removeEventListener('lucy:workbooks-changed', onChanged)
    }, [loadWorkbooks])

    // Native right-click detection on the grid container (not AG Grid's context menu).
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const handler = (event: MouseEvent) => {
            event.preventDefault()
            let node = event.target as HTMLElement | null
            const rowEl = node?.closest('.ag-row') as HTMLElement | null
            if (!rowEl) return
            const rowIndex = Number(rowEl.getAttribute('row-index'))
            const rowNode = gridApiRef.current?.getDisplayedRowAtIndex(rowIndex)
            const wb = rowNode?.data?._wb
            if (wb) setMenu({ x: event.clientX, y: event.clientY, wb })
        }
        el.addEventListener('contextmenu', handler)
        return () => el.removeEventListener('contextmenu', handler)
    }, [])

    useEffect(() => {
        if (!menu) return
        const close = () => setMenu(null)
        window.addEventListener('click', close)
        return () => window.removeEventListener('click', close)
    }, [menu])

    const onGridReady = (e: GridReadyEvent<Row>) => {
        gridApiRef.current = e.api
    }

    const onRowClicked = (e: RowClickedEvent<Row>) => {
        if (e.data) void openWorkbook(e.data._wb.workbookName)
    }

    const cloneWorkbook = (wb: WorkbookType) => {
        setMenu(null)
        void openPrompt({
            prompt: 'Enter a name for the cloned workbook',
            onOk: async (newWorkbookName) => {
                await apiPost('/v1/workbooks/clone-workbook', { workbook: wb, newWorkbookName })
                void loadWorkbooks()
            },
        })
    }

    const deleteWorkbook = async (wb: WorkbookType) => {
        setMenu(null)
        await apiPost('/v1/workbooks/delete-workbook', { workbookName: wb.workbookName })
        void loadWorkbooks()
    }

    const downloadWorkbook = (wb: WorkbookType) => {
        setMenu(null)
        const blob = new Blob([JSON.stringify(wb, null, 4)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'workbook.lucy'
        a.click()
        URL.revokeObjectURL(a.href)
    }

    const addWorkbook = () => {
        void openPrompt({
            prompt: 'Enter a name for your new workbook',
            onOk: async (workbookName) => {
                await apiPost('/v1/workbooks/create-workbook', { workbookName })
                void loadWorkbooks()
            },
        })
    }

    const uploadWorkbook = () => {
        void openUploadWorkbook({ onComplete: () => void loadWorkbooks() })
    }

    const headerButtons = (
        <>
            <FrameHeaderButtonComponent
                icon={ButtonIcons.plus}
                tooltipLabel="New Workbook"
                handler={addWorkbook}
            />
            <FrameHeaderButtonComponent
                icon={ButtonIcons.upload}
                tooltipLabel="Upload Workbook"
                handler={uploadWorkbook}
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
            title="Workbooks"
            headerButtons={headerButtons}
        >
            <div ref={containerRef} className="ag-theme-alpine-dark" style={{ height: '100%', width: '100%' }}>
                <AgGridReact<Row>
                    rowData={rowData}
                    columnDefs={columnDefs}
                    onGridReady={onGridReady}
                    onRowClicked={onRowClicked}
                />
            </div>

            {menu && (
                <div
                    style={{
                        position: 'fixed',
                        left: menu.x,
                        top: menu.y,
                        background: '#2d2d2d',
                        border: '1px solid #444',
                        borderRadius: 4,
                        zIndex: 100000,
                        fontSize: 13,
                        fontFamily: 'sans-serif',
                        color: '#dddddd',
                        minWidth: 170,
                    }}
                >
                    <MenuItem label="Open workbook" onClick={() => { setMenu(null); void openWorkbook(menu.wb.workbookName) }} />
                    <MenuItem label="Clone workbook" onClick={() => cloneWorkbook(menu.wb)} />
                    <MenuItem label="Delete workbook" onClick={() => void deleteWorkbook(menu.wb)} />
                    <MenuItem label="Download workbook" onClick={() => downloadWorkbook(menu.wb)} />
                </div>
            )}
        </Frame>
    )
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
    const [hover, setHover] = useState(false)
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ padding: '6px 12px', cursor: 'pointer', background: hover ? '#094771' : 'transparent' }}
        >
            {label}
        </div>
    )
}
