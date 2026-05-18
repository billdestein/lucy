import React, { createContext, useContext } from 'react'
import { WorkbookType } from '@billdestein/joy-common'

type WorkbookContextType = {
    workbook: WorkbookType
    setWorkbook: (wb: WorkbookType) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    selectedPicFilename: string
    setSelectedPicFilename: (filename: string) => void
}

const WorkbookContext = createContext<WorkbookContextType | null>(null)

export function useWorkbook(): WorkbookContextType {
    const ctx = useContext(WorkbookContext)
    if (!ctx) throw new Error('useWorkbook must be used inside a WorkbookFrame')
    return ctx
}

export const WorkbookProvider = WorkbookContext.Provider
