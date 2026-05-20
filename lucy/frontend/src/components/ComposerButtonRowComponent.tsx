import React from 'react'
import { useWorkbook } from '../WorkbookContext'
import ComposerButtonComponent from './ComposerButtonComponent'
import { ButtonIcons } from '../ButtonIcons'
import { stripForBackend, hydrateFromBackend } from '../workbookProtocol'
import { getOutputFilename } from '../promptProtocol'
import { canvas } from '@bill-destein/react-better-frames'
import PromptApplet from '../applets/PromptApplet'
import { WorkbookType } from '@billdestein/joy-common'

type Props = { editorText: string }

export default function ComposerButtonRowComponent({ editorText }: Props) {
    const { workbook, setWorkbook, setIsLoading, setSelectedPicFilename } = useWorkbook()

    const focusedIndex = workbook.prompts.findIndex(p => p.focused)
    const count = workbook.prompts.length
    const displayIndex = focusedIndex >= 0 ? focusedIndex + 1 : 0

    function previousButtonHandler() {
        if (focusedIndex <= 0) return
        const prompts = workbook.prompts.map((p, i) => ({ ...p, focused: i === focusedIndex - 1 }))
        setWorkbook({ ...workbook, prompts })
    }

    function nextButtonHandler() {
        if (focusedIndex >= count - 1) return
        const prompts = workbook.prompts.map((p, i) => ({ ...p, focused: i === focusedIndex + 1 }))
        setWorkbook({ ...workbook, prompts })
    }

    async function runPrompt(imageFilename: string) {
        const updatedPrompts = workbook.prompts.map((p, i) =>
            i === focusedIndex ? { ...p, text: editorText } : p
        )
        const wbToSend: WorkbookType = { ...workbook, prompts: updatedPrompts }

        setIsLoading(true)
        try {
            const res = await fetch('/v1/workbooks/generate-pic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ imageFilename, workbook: stripForBackend(wbToSend) }),
            })
            if (!res.ok) {
                const err = await res.json()
                alert(`Error: ${err.error}`)
                return
            }
            const data = await res.json()
            const hydrated = await hydrateFromBackend(data.workbook)

            const newPrompts = [
                ...hydrated.prompts.map(p => ({ ...p, focused: false })),
                { createdAt: Date.now(), focused: true, text: '' },
            ]
            const final: WorkbookType = { ...hydrated, prompts: newPrompts }
            setWorkbook(final)
            setSelectedPicFilename(final.focusedPicFilename ?? 'empty')
        } finally {
            setIsLoading(false)
        }
    }

    function runPromptHandler() {
        const filename = getOutputFilename(editorText)
        if (filename) {
            runPrompt(filename)
        } else {
            canvas.addFrame(PromptApplet, {
                isModal: true,
                message: {
                    prompt: 'Enter a filename for the generated image:',
                    onOk: (name: string) => runPrompt(name),
                },
            })
        }
    }

    return (
        <div
            style={{
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                background: '#252526',
                flexShrink: 0,
                borderTop: '1px solid #3c3c3c',
            }}
        >
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ccc', fontSize: 13 }}>
                <ComposerButtonComponent
                    icon={ButtonIcons.previous}
                    handler={previousButtonHandler}
                    tooltipLabel="Previous Prompt"
                />
                <span>{displayIndex} of {count}</span>
                <ComposerButtonComponent
                    icon={ButtonIcons.next}
                    handler={nextButtonHandler}
                    tooltipLabel="Next Prompt"
                />
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <ComposerButtonComponent
                    icon={ButtonIcons.play}
                    handler={runPromptHandler}
                    tooltipLabel="Run Prompt"
                />
            </div>
        </div>
    )
}
