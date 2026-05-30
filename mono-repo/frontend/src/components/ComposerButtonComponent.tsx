import { ReactNode, useRef, useState } from 'react'

type Props = {
    icon: ReactNode
    handler: () => void
    tooltipLabel: string
}

// Zero or more of these are placed, right aligned, in a ComposerButtonRowComponent. The
// tooltip appears immediately below the icon and is position:fixed so it can extend beyond
// the frame's bottom border.
export function ComposerButtonComponent({ icon, handler, tooltipLabel }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const [hover, setHover] = useState(false)
    const [coords, setCoords] = useState({ left: 0, top: 0 })

    const onEnter = () => {
        const r = ref.current?.getBoundingClientRect()
        if (r) setCoords({ left: r.left + r.width / 2, top: r.bottom })
        setHover(true)
    }

    return (
        <div
            ref={ref}
            onMouseDown={(e) => {
                e.stopPropagation()
                handler()
            }}
            onMouseEnter={onEnter}
            onMouseLeave={() => setHover(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                cursor: 'pointer',
                color: '#dddddd',
                borderRadius: 4,
                background: hover ? '#4a4a4a' : 'transparent',
            }}
        >
            {icon}
            {hover && (
                <div
                    style={{
                        position: 'fixed',
                        left: coords.left,
                        top: coords.top,
                        transform: 'translate(-50%, 0)',
                        marginTop: 6,
                        background: '#000000',
                        color: '#ffffff',
                        padding: '3px 7px',
                        borderRadius: 4,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 100000,
                    }}
                >
                    {tooltipLabel}
                </div>
            )}
        </div>
    )
}
