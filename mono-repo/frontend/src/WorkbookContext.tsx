import { createContext, useContext } from 'react'
import { WorkbookType } from '@billdestein/lucy-common'
import { refresh } from './cache'

// One WorkbookContext per open WorkbookApplet. All descendants read/update the workbook
// through this context rather than via props.
export type WorkbookContextValue = {
    workbook: WorkbookType
    setWorkbook: (wb: WorkbookType) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    // Never null; 'empty' means no real pic is focused (text-to-image mode).
    selectedPicFilename: string
    setSelectedPicFilename: (filename: string) => void
}

export const WorkbookContext = createContext<WorkbookContextValue | null>(null)

export function useWorkbook(): WorkbookContextValue {
    const ctx = useContext(WorkbookContext)
    if (!ctx) throw new Error('useWorkbook must be called within a WorkbookApplet')
    return ctx
}

// Returns a copy of the workbook with every PicType's encodedImage set to ''. Call before
// sending a workbook to any backend endpoint.
export function stripForBackend(workbook: WorkbookType): WorkbookType {
    return { ...workbook, pics: workbook.pics.map(p => ({ ...p, encodedImage: '' })) }
}

// Populates every PicType's encodedImage from the local cache (or the get-pic endpoint).
// Call after receiving a workbook from any backend endpoint.
export function hydrateFromBackend(workbook: WorkbookType): Promise<WorkbookType> {
    return refresh(workbook)
}
