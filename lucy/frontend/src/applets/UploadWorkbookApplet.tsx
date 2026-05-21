import React from 'react'
import { Frame, AppletProps } from '@billdestein/joy-applets'

export default function UploadWorkbookApplet(props: AppletProps) {
    return (
        <Frame {...props} title="Upload Workbook">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 13 }}>
                UploadWorkbookApplet
            </div>
        </Frame>
    )
}
