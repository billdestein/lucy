import { createContext, useContext, useState, ReactNode } from 'react'
import { PicType, PromptType, WorkbookType } from '@billdestein/lucy-common'
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

// A fresh empty, focused prompt. This is the trailing placeholder the paginator opens on;
// the backend never persists it.
export function makeEmptyPrompt(): PromptType {
    return { createdAt: Date.now(), focused: true, text: '' }
}

// The 'empty' sentinel pic: no file on disk (mimeType ''), used for text-to-image mode.
function makeEmptySentinelPic(): PicType {
    return { createdAt: Date.now(), encodedImage: '', filename: 'empty', mimeType: '' }
}

// The initial in-memory workbook before the real one loads from the backend.
function makeInitialWorkbook(): WorkbookType {
    return {
        createdAt: Date.now(),
        focusedPicFilename: 'empty',
        pics: [makeEmptySentinelPic()],
        prompts: [makeEmptyPrompt()],
        workbookName: '',
    }
}

// Provider that owns the workbook, loading, and selected-pic state for one WorkbookApplet.
// selectedPicFilename is kept in sync with workbook.focusedPicFilename by callers.
export function WorkbookProvider({ children }: { children: ReactNode }) {
    const [workbook, setWorkbook] = useState<WorkbookType>(makeInitialWorkbook)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedPicFilename, setSelectedPicFilename] = useState('empty')

    const value: WorkbookContextValue = {
        workbook,
        setWorkbook,
        isLoading,
        setIsLoading,
        selectedPicFilename,
        setSelectedPicFilename,
    }

    return <WorkbookContext.Provider value={value}>{children}</WorkbookContext.Provider>
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
