import React, { createContext, useContext, useState, ReactNode } from 'react'
import { WorkbookType, PicType, PromptType } from '@billdestein/joy-common'

export function makeSentinelPic(): PicType {
    return { createdAt: Date.now(), encodedImage: '', filename: 'empty', mimeType: '' }
}

export function makeEmptyPrompt(): PromptType {
    return { createdAt: Date.now(), focused: true, text: '' }
}

export function makeInitialWorkbook(): WorkbookType {
    return {
        createdAt: Date.now(),
        focusedPicFilename: 'empty',
        pics: [makeSentinelPic()],
        prompts: [makeEmptyPrompt()],
        workbookName: '',
    }
}

type WorkbookContextType = {
    workbook: WorkbookType
    setWorkbook: (wb: WorkbookType) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    selectedPicFilename: string
    setSelectedPicFilename: (filename: string) => void
}

const WorkbookContext = createContext<WorkbookContextType | null>(null)

export function WorkbookProvider({ children }: { children: ReactNode }) {
    const [workbook, setWorkbook] = useState<WorkbookType>(makeInitialWorkbook())
    const [isLoading, setIsLoading] = useState(false)
    const [selectedPicFilename, setSelectedPicFilename] = useState('empty')

    return (
        <WorkbookContext.Provider value={{
            workbook, setWorkbook,
            isLoading, setIsLoading,
            selectedPicFilename, setSelectedPicFilename,
        }}>
            {children}
        </WorkbookContext.Provider>
    )
}

export function useWorkbook(): WorkbookContextType {
    const ctx = useContext(WorkbookContext)
    if (!ctx) throw new Error('useWorkbook must be used inside a WorkbookApplet')
    return ctx
}
