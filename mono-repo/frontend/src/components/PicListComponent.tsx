import { useWorkbook } from '../WorkbookContext'
import { PicComponent } from './PicComponent'

// Iterates over the workbook's pics, sorted by createdAt descending (newest first). The
// empty sentinel (filename 'empty') is displayed as '+ New image'.
export function PicListComponent() {
    const { workbook, selectedPicFilename, setSelectedPicFilename, setWorkbook } = useWorkbook()

    const sorted = [...workbook.pics].sort((a, b) => b.createdAt - a.createdAt)

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
