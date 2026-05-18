import React from 'react'
import { useWorkbook } from '../WorkbookContext'
import PicComponent from './PicComponent'

export default function PicListComponent() {
    const { workbook, setWorkbook, setSelectedPicFilename, selectedPicFilename } = useWorkbook()

    function handleClick(filename: string) {
        setSelectedPicFilename(filename)
        setWorkbook({ ...workbook, focusedPicFilename: filename })
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: '#1e1e1e' }}>
            {workbook.pics.map(pic => (
                <PicComponent
                    key={pic.filename}
                    name={pic.filename === 'empty' ? '+ New image' : pic.filename}
                    focused={pic.filename === selectedPicFilename}
                    sentinel={pic.filename === 'empty'}
                    onClick={() => handleClick(pic.filename)}
                />
            ))}
        </div>
    )
}
