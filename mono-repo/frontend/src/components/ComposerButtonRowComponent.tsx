import { PicType, PromptType, WorkbookType } from '@billdestein/lucy-common'
import { useWorkbook } from '../WorkbookContext'
import { apiPost } from '../api'
import { hydrateFromBackend, stripForBackend } from '../workbookProtocol'
import { parseSaveAs, parseUsing } from '../promptProtocol'
import { openPrompt } from '../launchers'
import { ButtonIcons } from '../ButtonIcons'
import { ComposerButtonComponent } from './ComposerButtonComponent'

type Props = {
    editorText: string
}

export function ComposerButtonRowComponent({ editorText }: Props) {
    const { workbook, setWorkbook, setIsLoading, setSelectedPicFilename } = useWorkbook()

    const prompts = workbook.prompts
    const focusedIndex = prompts.findIndex((p) => p.focused)
    const index = focusedIndex >= 0 ? focusedIndex + 1 : 1
    const count = prompts.length

    // Move focus to the previous prompt.
    const previousButtonHandler = () => {
        const i = prompts.findIndex((p) => p.focused)
        if (i <= 0) return
        const next = prompts.map((p, j) => ({ ...p, focused: j === i - 1 }))
        setWorkbook({ ...workbook, prompts: next })
    }

    // Move focus to the next prompt.
    const nextButtonHandler = () => {
        const i = prompts.findIndex((p) => p.focused)
        if (i < 0 || i >= prompts.length - 1) return
        const next = prompts.map((p, j) => ({ ...p, focused: j === i + 1 }))
        setWorkbook({ ...workbook, prompts: next })
    }

    const runWith = async (outputFilename: string) => {
        setIsLoading(true)
        try {
            // referencedPics from '-- using' commands (currently unused by the backend).
            const usingNames = parseUsing(editorText)
            const referencedPics: PicType[] = workbook.pics
                .filter((p) => usingNames.includes(p.filename))
                .map((p) => ({ ...p, encodedImage: '' }))

            // Build a clean prompts array: drop empties, unfocus the rest, append what ran.
            const history = prompts
                .filter((p) => p.text.trim() !== '')
                .map((p) => ({ ...p, focused: false }))
            const ran: PromptType = { createdAt: Date.now(), focused: true, text: editorText }
            const toSend: WorkbookType = stripForBackend({
                ...workbook,
                prompts: [...history, ran],
            })

            const res = await apiPost<{ workbook: WorkbookType }>('/v1/workbooks/generate-pic', {
                referencedPics,
                outputFilename,
                workbook: toSend,
            })

            const hydrated = await hydrateFromBackend(res.workbook)
            const finalPrompts = [
                ...hydrated.prompts
                    .filter((p) => p.text.trim() !== '')
                    .map((p) => ({ ...p, focused: false })),
                { createdAt: Date.now(), focused: true, text: '' },
            ]
            const finalWorkbook: WorkbookType = { ...hydrated, prompts: finalPrompts }
            setWorkbook(finalWorkbook)
            setSelectedPicFilename(finalWorkbook.focusedPicFilename ?? 'empty')
        } catch (err) {
            alert(`Generation failed: ${err instanceof Error ? err.message : String(err)}`)
        } finally {
            setIsLoading(false)
        }
    }

    const runPromptHandler = () => {
        const saveAs = parseSaveAs(editorText)
        if (saveAs) {
            void runWith(saveAs)
        } else {
            // No '-- save as' command: prompt the user for an output filename.
            void openPrompt({
                prompt: 'Enter a name for the output image',
                onOk: (value) => void runWith(value),
            })
        }
    }

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                height: 40,
                background: '#252526',
                borderTop: '1px solid #333',
                padding: '0 8px',
                position: 'relative',
            }}
        >
            {/* Paginator centered in the row. */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#dddddd',
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                }}
            >
                <ComposerButtonComponent
                    icon={ButtonIcons.previous}
                    tooltipLabel="Previous Prompt"
                    handler={previousButtonHandler}
                />
                <span>{index}</span>
                <span>of</span>
                <span>{count}</span>
                <ComposerButtonComponent
                    icon={ButtonIcons.next}
                    tooltipLabel="Next Prompt"
                    handler={nextButtonHandler}
                />
            </div>

            {/* Play button right-aligned. */}
            <div style={{ flex: 1 }} />
            <ComposerButtonComponent
                icon={ButtonIcons.play}
                tooltipLabel="Run Prompt"
                handler={runPromptHandler}
            />
        </div>
    )
}
