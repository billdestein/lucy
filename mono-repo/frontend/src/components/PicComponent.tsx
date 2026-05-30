import { useState } from 'react'

type Props = {
    name: string
    focused: boolean
    sentinel?: boolean
    onClick: () => void
}

// A single row in the PicList. Focused rows get a VS Code-style blue background; the sentinel
// ('+ New image') is rendered teal and italic with a separating bottom border.
export function PicComponent({ name, focused, sentinel = false, onClick }: Props) {
    const [hover, setHover] = useState(false)

    let background = 'transparent'
    if (focused) background = '#094771'
    else if (hover) background = '#2a2d2e'

    let color = '#dddddd'
    if (focused) color = '#ffffff'
    else if (sentinel) color = '#4ec9b0'

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                padding: '6px 10px',
                cursor: 'pointer',
                background,
                color,
                fontStyle: sentinel ? 'italic' : 'normal',
                borderBottom: sentinel ? '1px solid #333' : 'none',
                fontSize: 13,
                fontFamily: 'sans-serif',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {name}
        </div>
    )
}
