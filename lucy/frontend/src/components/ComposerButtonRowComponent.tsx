import React from 'react'
import { useWorkbook } from '../WorkbookContext'
import { ComposerButtonComponent } from './ComposerButtonComponent'
import { ButtonIcons } from '../ButtonIcons'
import { stripForBackend, hydrateFromBackend } from '../workbookProtocol'
import { preparePrompt } from '../promptProtocol'
import { addApplet } from '@billdestein/joy-applets'
import { WorkbookType, PromptType } from '@billdestein/joy-common'

type Props = { editorText: string }

export function ComposerButtonRowComponent({ editorText }: Props) {
    const { workbook, setWorkbook, setIsLoading, setSelectedPicFilename } = useWorkbook()

    const focusedIndex = workbook.prompts.findIndex(p => p.focused)
    const index = focusedIndex >= 0 ? focusedIndex + 1 : 1
    const count = workbook.prompts.length

    function previousButtonHandler() {
        if (focusedIndex <= 0) return
        const prompts = workbook.prompts.map((p, i) => ({
            ...p,
            focused: i === focusedIndex - 1,
        }))
        setWorkbook({ ...workbook, prompts })
    }

    function nextButtonHandler() {
        if (focusedIndex < 0 || focusedIndex >= workbook.prompts.length - 1) return
        const prompts = workbook.prompts.map((p, i) => ({
            ...p,
            focused: i === focusedIndex + 1,
        }))
        setWorkbook({ ...workbook, prompts })
    }

    async function runPromptHandler() {
        const wbWithText: WorkbookType = {
            ...workbook,
            prompts: workbook.prompts.map((p: PromptType, i: number) =>
                i === focusedIndex ? { ...p, text: editorText } : p
            ),
        }

        const { referencedPics, outputFilename: cmdFilename } = preparePrompt(wbWithText)

        async function doGenerate(outputFilename: string) {
            setIsLoading(true)
            try {
                const res = await fetch('/v1/workbooks/generate-pic', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        referencedPics,
                        outputFilename,
                        workbook: stripForBackend(wbWithText),
                    }),
                })
                const json = await res.json()
                if (!res.ok) throw new Error(json.error ?? `Server error ${res.status}`)
                const returnedWb = (json as { workbook: WorkbookType }).workbook
                const hydrated = await hydrateFromBackend(returnedWb)

                const finalWorkbook: WorkbookType = {
                    ...hydrated,
                    prompts: [
                        ...hydrated.prompts.map((p: PromptType) => ({ ...p, focused: false })),
                        { createdAt: Date.now(), focused: true, text: '' },
                    ],
                }
                setWorkbook(finalWorkbook)
                setSelectedPicFilename(finalWorkbook.focusedPicFilename ?? 'empty')
            } catch (err) {
                console.error('generate-pic failed:', err)
                alert(`Generation failed: ${err instanceof Error ? err.message : String(err)}`)
            } finally {
                setIsLoading(false)
            }
        }

        if (cmdFilename) {
            await doGenerate(cmdFilename)
        } else {
            const { PromptApplet } = await import('../applets/PromptApplet')
            addApplet(PromptApplet as any, {
                height: 180, width: 400, x: 200, y: 200, zIndex: 0, isModal: true,
                message: {
                    prompt: 'Enter a filename for the generated image:',
                    onOk: async (filename: string) => { await doGenerate(filename) },
                },
            })
        }
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 8px', background: '#252526', flexShrink: 0, height: 36,
        }}>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ccc', fontSize: 13, fontFamily: 'sans-serif' }}>
                <ComposerButtonComponent
                    icon={ButtonIcons.previous}
                    handler={previousButtonHandler}
                    tooltipLabel="Previous Prompt"
                />
                <span>{index} of {count}</span>
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
