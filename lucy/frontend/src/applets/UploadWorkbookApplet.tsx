import React from 'react'
import { Frame, AppletProps, removeApplet } from './framework'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'

// Stub — full implementation deferred to a later session.
export function UploadWorkbookApplet({ frameId, height, width, x, y, zIndex, isModal }: AppletProps) {
    return (
        <Frame
            frameId={frameId} height={height} width={width} x={x} y={y}
            zIndex={zIndex} isModal={isModal} title="Upload Workbook"
            headerButtons={
                <FrameHeaderButtonComponent
                    icon={ButtonIcons.x}
                    handler={() => removeApplet(frameId)}
                    tooltipLabel="Close"
                />
            }
        >
            <div style={{ padding: 16, color: '#ccc', fontFamily: 'sans-serif', fontSize: 13 }}>
                UploadWorkbookApplet
            </div>
        </Frame>
    )
}
