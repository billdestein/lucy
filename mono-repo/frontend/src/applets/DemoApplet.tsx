import React, { useEffect, useRef, useState } from 'react'
import { Frame, AppletProps, removeApplet } from '@billdestein/lucy-applets'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'

const VIDEO_RATIO = 1112 / 625

export function DemoApplet({ appletId, height, width, x, y, zIndex, isModal }: AppletProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dims, setDims] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const obs = new ResizeObserver(() => {
            const { width: w0, height: h0 } = el.getBoundingClientRect()
            let w = w0, h = w0 / VIDEO_RATIO
            if (h > h0) { h = h0; w = h0 * VIDEO_RATIO }
            setDims({ width: Math.floor(w), height: Math.floor(h) })
        })
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    return (
        <Frame
            height={height} width={width} x={x} y={y}
            zIndex={zIndex} isModal={isModal} title="Demo"
            headerButtons={
                <FrameHeaderButtonComponent
                    icon={ButtonIcons.x}
                    handler={() => removeApplet(appletId)}
                    tooltipLabel="Close"
                />
            }
        >
            <div
                ref={containerRef}
                style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}
            >
                {dims.width > 0 && (
                    <iframe
                        src="https://s3.us-west-2.amazonaws.com/billdestein.videos/lucy-v3.mp4"
                        width={dims.width}
                        height={dims.height}
                        style={{ border: 'none' }}
                        allowFullScreen
                    />
                )}
            </div>
        </Frame>
    )
}
