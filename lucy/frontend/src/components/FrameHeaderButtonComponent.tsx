import React, { useState, useRef } from 'react'

type Props = {
    icon: React.ReactNode
    handler: () => void
    tooltipLabel: string
}

export function FrameHeaderButtonComponent({ icon, handler, tooltipLabel }: Props) {
    const [hovered, setHovered] = useState(false)
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
    const btnRef = useRef<HTMLDivElement>(null)

    function handleMouseEnter() {
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            setTooltipPos({ top: r.top - 30, left: r.left + r.width / 2 })
        }
        setHovered(true)
    }

    return (
        <>
            <div
                ref={btnRef}
                onMouseDown={e => { e.stopPropagation(); handler() }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setHovered(false)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 24, height: 24, borderRadius: 4, cursor: 'pointer',
                    color: '#ccc',
                    background: hovered ? '#505050' : 'transparent',
                }}
            >
                {icon}
            </div>
            {hovered && (
                <div style={{
                    position: 'fixed',
                    top: tooltipPos.top,
                    left: tooltipPos.left,
                    transform: 'translateX(-50%)',
                    background: '#333',
                    color: '#fff',
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 3,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 99999,
                }}>
                    {tooltipLabel}
                </div>
            )}
        </>
    )
}
