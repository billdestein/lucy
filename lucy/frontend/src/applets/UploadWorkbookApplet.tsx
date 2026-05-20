import React from 'react'
import { Frame } from '@bill-destein/react-better-frames'
import { FrameProps } from '@bill-destein/react-better-frames'

export default function UploadWorkbookApplet(props: FrameProps) {
    return (
        <Frame {...props} title="Upload Workbook">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 13 }}>
                UploadWorkbookApplet
            </div>
        </Frame>
    )
}
