import React from 'react'
import Frame from '../Frame'
import { FrameProps } from '../canvas'

type Message = {
    encodedImage: string
    mimeType: string
}

export default function ZoomFrame(props: FrameProps) {
    const { encodedImage, mimeType } = props.message as Message

    return (
        <Frame {...props} title="Zoom">
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', overflow: 'hidden' }}>
                <img
                    src={`data:${mimeType};base64,${encodedImage}`}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    draggable={false}
                    alt="zoom"
                />
            </div>
        </Frame>
    )
}
