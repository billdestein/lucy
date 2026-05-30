import { useEffect, useRef, useState } from 'react'
import { AppletProps, Frame, removeApplet } from '@billdestein/lucy-applets'
import { FrameHeaderButtonComponent } from '../components/FrameHeaderButtonComponent'
import { ButtonIcons } from '../ButtonIcons'

const VIDEO_SRC = 'https://s3.us-west-2.amazonaws.com/billdestein.videos/lucy-v3.mp4'
const VIDEO_RATIO = 1112 / 625

export function DemoApplet(props: AppletProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dims, setDims] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const obs = new ResizeObserver(() => {
            const { width, height } = el.getBoundingClientRect()
            let w = width
            let h = width / VIDEO_RATIO
            if (h > height) {
                h = height
                w = height * VIDEO_RATIO
            }
            setDims({ width: Math.floor(w), height: Math.floor(h) })
        })
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    return (
        <Frame
            height={props.height}
            isModal={props.isModal}
            width={props.width}
            x={props.x}
            y={props.y}
            zIndex={props.zIndex}
            title="Demo"
            headerButtons={
                <FrameHeaderButtonComponent
                    icon={ButtonIcons.x}
                    tooltipLabel="Close"
                    handler={() => removeApplet(props.appletId)}
                />
            }
        >
            <div
                ref={containerRef}
                style={{
                    height: '100%',
                    width: '100%',
                    background: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}
            >
                {dims.width > 0 && (
                    <iframe
                        src={VIDEO_SRC}
                        width={dims.width}
                        height={dims.height}
                        style={{ border: 'none' }}
                    />
                )}
            </div>
        </Frame>
    )
}
