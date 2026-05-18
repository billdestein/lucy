import React, { useRef, useEffect, ReactNode } from 'react'
import { FrameProps, canvas } from './canvas'

const BORDER = 5
const HEADER_H = 30
const RESIZE_ZONE = 10

type Props = FrameProps & {
    title: string
    headerButtons?: ReactNode
    children: ReactNode
}

export default function Frame({ frameId, height, isModal, width, x, y, zIndex, title, headerButtons, children }: Props) {
    const outerRef = useRef<HTMLDivElement>(null)
    const drag = useRef({ active: false, startMouseX: 0, startMouseY: 0, startLeft: 0, startTop: 0 })
    const resize = useRef({ active: false, startMouseX: 0, startMouseY: 0, startW: 0, startH: 0 })

    useEffect(() => {
        const outer = outerRef.current
        if (!outer) return

        const totalW = width + BORDER * 2
        const totalH = height + HEADER_H + BORDER * 2

        if (isModal) {
            const canvas = outer.closest('[style*="position: relative"], [style*="position:relative"]') as HTMLElement | null
            const cw = canvas?.clientWidth ?? window.innerWidth
            const ch = canvas?.clientHeight ?? window.innerHeight
            outer.style.left = `${Math.max(0, (cw - totalW) / 2)}px`
            outer.style.top = `${Math.max(0, (ch - totalH) / 2)}px`
        } else {
            outer.style.left = `${x}px`
            outer.style.top = `${y}px`
        }
        outer.style.width = `${totalW}px`
        outer.style.height = `${totalH}px`
        outer.style.zIndex = String(zIndex)
    }, [])

    function getCanvas(): HTMLElement | null {
        return outerRef.current?.parentElement?.parentElement ?? null
    }

    function onHeaderMouseDown(e: React.MouseEvent) {
        if (isModal) return
        e.preventDefault()
        canvas.bringToFront(frameId)
        const outer = outerRef.current!
        drag.current = {
            active: true,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startLeft: outer.offsetLeft,
            startTop: outer.offsetTop,
        }

        function onMouseMove(e: MouseEvent) {
            if (!drag.current.active) return
            const cv = getCanvas()
            const cvW = cv?.clientWidth ?? window.innerWidth
            const cvH = cv?.clientHeight ?? window.innerHeight
            const outer = outerRef.current!
            const ow = outer.offsetWidth
            const oh = outer.offsetHeight

            let newLeft = drag.current.startLeft + (e.clientX - drag.current.startMouseX)
            let newTop = drag.current.startTop + (e.clientY - drag.current.startMouseY)

            newLeft = Math.max(30 - ow, Math.min(cvW - 30, newLeft))
            newTop = Math.max(0, Math.min(cvH - HEADER_H - BORDER * 2, newTop))

            outer.style.left = `${newLeft}px`
            outer.style.top = `${newTop}px`
        }

        function onMouseUp() {
            drag.current.active = false
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    function onBorderMouseDown(e: React.MouseEvent) {
        const outer = outerRef.current!
        const rect = outer.getBoundingClientRect()
        const rx = e.clientX - rect.left
        const ry = e.clientY - rect.top
        const ow = outer.offsetWidth
        const oh = outer.offsetHeight

        const nearRight = rx >= ow - RESIZE_ZONE
        const nearBottom = ry >= oh - RESIZE_ZONE
        if (!nearRight && !nearBottom) return

        e.preventDefault()
        canvas.bringToFront(frameId)
        resize.current = {
            active: true,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startW: ow,
            startH: oh,
        }

        function onMouseMove(e: MouseEvent) {
            if (!resize.current.active) return
            const outer = outerRef.current!
            const dx = e.clientX - resize.current.startMouseX
            const dy = e.clientY - resize.current.startMouseY

            if (nearRight) outer.style.width = `${Math.max(200, resize.current.startW + dx)}px`
            if (nearBottom) outer.style.height = `${Math.max(150, resize.current.startH + dy)}px`
        }

        function onMouseUp() {
            resize.current.active = false
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    return (
        <div
            ref={outerRef}
            style={{
                position: 'absolute',
                boxSizing: 'border-box',
                border: `${BORDER}px solid #555`,
                background: '#1e1e1e',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'default',
            }}
            onMouseDown={e => {
                canvas.bringToFront(frameId)
                onBorderMouseDown(e)
            }}
        >
            <div
                style={{
                    height: HEADER_H,
                    background: '#2d2d2d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 6px',
                    flexShrink: 0,
                    cursor: isModal ? 'default' : 'grab',
                    userSelect: 'none',
                }}
                onMouseDown={onHeaderMouseDown}
            >
                <span style={{ color: '#ccc', fontSize: 13 }}>{title}</span>
                <div style={{ display: 'flex', gap: 2 }} onMouseDown={e => e.stopPropagation()}>
                    {headerButtons}
                </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </div>
    )
}
