import React, { useState, useRef, ReactNode } from 'react'

type Props = {
    icon: ReactNode
    handler: () => void
    tooltipLabel: string
}

export default function ComposerButtonComponent({ icon, handler, tooltipLabel }: Props) {
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
    const btnRef = useRef<HTMLDivElement>(null)

    function onMouseEnter() {
        const rect = btnRef.current?.getBoundingClientRect()
        if (rect) {
            setTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + 4 })
        }
    }

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <div
                ref={btnRef}
                onClick={handler}
                onMouseEnter={onMouseEnter}
                onMouseLeave={() => setTooltipPos(null)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    color: '#ccc',
                    borderRadius: 3,
                    background: tooltipPos ? '#3c3c3c' : 'transparent',
                    transition: 'background 0.1s',
                }}
            >
                {icon}
            </div>
            {tooltipPos && (
                <div
                    style={{
                        position: 'fixed',
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                        transform: 'translateX(-50%)',
                        background: '#3c3c3c',
                        color: '#ccc',
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 3,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 99999,
                    }}
                >
                    {tooltipLabel}
                </div>
            )}
        </div>
    )
}
