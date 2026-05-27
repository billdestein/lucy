import React from 'react'
import { Frame, AppletProps, removeApplet } from './framework'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'

export function ZoomApplet({ frameId, height, width, x, y, zIndex, isModal, message }: AppletProps) {
    const { encodedImage, mimeType } = message as { encodedImage: string; mimeType: string }
    const src = `data:${mimeType};base64,${encodedImage}`

    return (
        <Frame
            frameId={frameId} height={height} width={width} x={x} y={y}
            zIndex={zIndex} isModal={isModal} title="Zoom"
            headerButtons={
                <FrameHeaderButtonComponent
                    icon={ButtonIcons.x}
                    handler={() => removeApplet(frameId)}
                    tooltipLabel="Close"
                />
            }
        >
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                <img
                    src={src}
                    alt="zoom"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
            </div>
        </Frame>
    )
}
