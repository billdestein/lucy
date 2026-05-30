import { createContext, useContext } from 'react'
import { WorkbookType } from '@billdestein/lucy-common'

// One WorkbookContext per open WorkbookApplet. All descendants access and update the
// workbook through this context rather than through props.
export type WorkbookContextValue = {
    workbook: WorkbookType
    setWorkbook: (wb: WorkbookType) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    // Never null; 'empty' means no real pic is focused (text-to-image mode).
    selectedPicFilename: string
    setSelectedPicFilename: (filename: string) => void
}

const WorkbookContext = createContext<WorkbookContextValue | null>(null)

export const WorkbookProvider = WorkbookContext.Provider

export function useWorkbook(): WorkbookContextValue {
    const ctx = useContext(WorkbookContext)
    if (!ctx) {
        throw new Error('useWorkbook must be called within a WorkbookApplet')
    }
    return ctx
}
