import React from 'react'

type Props = {
    name: string
    focused: boolean
    sentinel?: boolean
    onClick: () => void
}

export function PicComponent({ name, focused, sentinel, onClick }: Props) {
    const [hovered, setHovered] = React.useState(false)

    const bg = focused ? '#094771' : hovered ? '#2a2d2e' : 'transparent'
    const color = focused ? '#fff' : sentinel ? '#4ec9b0' : '#ccc'

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '4px 10px',
                cursor: 'pointer',
                background: bg,
                color,
                fontStyle: sentinel ? 'italic' : 'normal',
                fontSize: 13,
                fontFamily: 'sans-serif',
                borderBottom: sentinel ? '1px solid #444' : 'none',
                userSelect: 'none',
            }}
        >
            {name}
        </div>
    )
}
