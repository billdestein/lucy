import React from 'react'
import Frame from '../Frame'
import { FrameProps } from '../canvas'

export default function UploadWorkbookFrame(props: FrameProps) {
    return (
        <Frame {...props} title="Upload Workbook">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 13 }}>
                UploadWorkbookFrame
            </div>
        </Frame>
    )
}
