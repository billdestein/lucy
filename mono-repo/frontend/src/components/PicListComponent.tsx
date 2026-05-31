import { useWorkbook } from '../WorkbookContext'
import { PicComponent } from './PicComponent'

// Iterates over the workbook's pics. The empty sentinel (filename 'empty'), displayed as
// '+ New image', is always pinned to the top; the remaining pics follow, sorted by createdAt
// descending (newest first).
export function PicListComponent() {
    const { workbook, selectedPicFilename, setSelectedPicFilename, setWorkbook } = useWorkbook()

    const sorted = [...workbook.pics].sort((a, b) => {
        if (a.filename === 'empty') return -1
        if (b.filename === 'empty') return 1
        return b.createdAt - a.createdAt
    })

    return (
        <div style={{ height: '100%', overflow: 'auto', background: '#252526' }}>
            {sorted.map((pic) => {
                const isSentinel = pic.filename === 'empty'
                return (
                    <PicComponent
                        key={pic.filename + '/' + pic.createdAt}
                        name={isSentinel ? '+ New image' : pic.filename}
                        focused={pic.filename === selectedPicFilename}
                        sentinel={isSentinel}
                        onClick={() => {
                            setSelectedPicFilename(pic.filename)
                            setWorkbook({ ...workbook, focusedPicFilename: pic.filename })
                        }}
                    />
                )
            })}
        </div>
    )
}
