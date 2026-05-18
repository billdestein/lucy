import React from 'react'

type Props = {
    name: string
    focused: boolean
    sentinel?: boolean
    onClick: () => void
}

export default function PicComponent({ name, focused, sentinel, onClick }: Props) {
    const [hovered, setHovered] = React.useState(false)

    const bg = focused
        ? '#0e639c'
        : hovered
        ? '#2a2d2e'
        : 'transparent'

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
                fontSize: 13,
                fontStyle: sentinel ? 'italic' : 'normal',
                borderBottom: sentinel ? '1px solid #444' : 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {name}
        </div>
    )
}
