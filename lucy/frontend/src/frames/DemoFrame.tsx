import React, { useRef, useEffect, useState } from 'react'
import Frame from '../Frame'
import { FrameProps } from '../canvas'

const VIDEO_RATIO = 1112 / 625

export default function DemoFrame(props: FrameProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dims, setDims] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const obs = new ResizeObserver(() => {
            const { width, height } = el.getBoundingClientRect()
            let w = width, h = width / VIDEO_RATIO
            if (h > height) { h = height; w = height * VIDEO_RATIO }
            setDims({ width: Math.floor(w), height: Math.floor(h) })
        })
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    return (
        <Frame {...props} title="Demo">
            <div
                ref={containerRef}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            >
                {dims.width > 0 && (
                    <iframe
                        src="https://s3.us-west-2.amazonaws.com/billdestein.videos/lucy-v3.mp4"
                        width={dims.width}
                        height={dims.height}
                        style={{ border: 'none', display: 'block' }}
                        allowFullScreen
                    />
                )}
            </div>
        </Frame>
    )
}
