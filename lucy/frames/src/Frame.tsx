import React, { useRef, useEffect, ReactNode } from 'react'
import { FrameProps, canvas } from './canvas'

const BORDER = 5
const HEADER_H = 30
const ZONE = 10

type Props = FrameProps & {
    title: string
    headerButtons?: ReactNode
    children: ReactNode
}

export default function Frame({
    frameId, height, isModal, width, x, y, zIndex, title, headerButtons, children,
}: Props) {
    const outerRef = useRef<HTMLDivElement>(null)
    const draggingRef = useRef(false)

    useEffect(() => {
        const outer = outerRef.current
        if (!outer) return
        const totalW = width + BORDER * 2
        const totalH = height + HEADER_H + BORDER * 2
        if (isModal) {
            const canvasEl = outer.parentElement?.parentElement as HTMLElement | null
            const cw = canvasEl?.clientWidth ?? window.innerWidth
            const ch = canvasEl?.clientHeight ?? window.innerHeight
            outer.style.left = `${Math.max(0, (cw - totalW) / 2)}px`
            outer.style.top  = `${Math.max(0, (ch - totalH) / 2)}px`
        } else {
            outer.style.left = `${x}px`
            outer.style.top  = `${y}px`
        }
        outer.style.width  = `${totalW}px`
        outer.style.height = `${totalH}px`
        outer.style.zIndex = String(zIndex)
    }, [])

    function zones(e: React.MouseEvent) {
        const outer = outerRef.current!
        const rect = outer.getBoundingClientRect()
        const rx = e.clientX - rect.left
        const ry = e.clientY - rect.top
        const ow = outer.offsetWidth
        const oh = outer.offsetHeight
        return {
            nearLeft:   rx < ZONE,
            nearRight:  rx >= ow - ZONE,
            nearTop:    ry < ZONE,
            nearBottom: ry >= oh - ZONE,
            inHeader:   ry >= ZONE && ry < BORDER + HEADER_H,
        }
    }

    function onOuterMouseMove(e: React.MouseEvent) {
        if (draggingRef.current) return
        const outer = outerRef.current!
        const { nearLeft, nearRight, nearTop, nearBottom, inHeader } = zones(e)

        let cursor = 'default'
        if      (nearTop    && nearLeft)  cursor = 'nw-resize'
        else if (nearTop    && nearRight) cursor = 'ne-resize'
        else if (nearBottom && nearLeft)  cursor = 'sw-resize'
        else if (nearBottom && nearRight) cursor = 'se-resize'
        else if (nearTop)                 cursor = 'n-resize'
        else if (nearBottom)              cursor = 's-resize'
        else if (nearLeft)                cursor = 'w-resize'
        else if (nearRight)               cursor = 'e-resize'
        else if (inHeader && !isModal)    cursor = 'grab'
        outer.style.cursor = cursor
    }

    function onHeaderMouseDown(e: React.MouseEvent) {
        if (isModal) return
        e.preventDefault()

        const outer = outerRef.current!
        const startMouseX = e.clientX
        const startMouseY = e.clientY
        const startLeft   = outer.offsetLeft
        const startTop    = outer.offsetTop
        const canvasEl    = outer.parentElement?.parentElement as HTMLElement | null

        draggingRef.current = true
        document.body.style.cursor     = 'grabbing'
        document.body.style.userSelect = 'none'

        function onMouseMove(ev: MouseEvent) {
            const cvW = canvasEl?.clientWidth  ?? window.innerWidth
            const cvH = canvasEl?.clientHeight ?? window.innerHeight
            const ow  = outer.offsetWidth
            let newLeft = startLeft + (ev.clientX - startMouseX)
            let newTop  = startTop  + (ev.clientY - startMouseY)
            newLeft = Math.max(30 - ow, Math.min(cvW - 30, newLeft))
            newTop  = Math.max(0, Math.min(cvH - HEADER_H - BORDER * 2, newTop))
            outer.style.left = `${newLeft}px`
            outer.style.top  = `${newTop}px`
        }

        function onMouseUp() {
            draggingRef.current = false
            document.body.style.cursor     = ''
            document.body.style.userSelect = ''
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    // Capture phase runs before onHeaderMouseDown so we can steal resize clicks at the edges
    function onOuterMouseDownCapture(e: React.MouseEvent) {
        canvas.bringToFront(frameId)
        if (e.button !== 0) return

        const outer = outerRef.current!
        const { nearLeft, nearRight, nearTop, nearBottom } = zones(e)
        if (!nearLeft && !nearRight && !nearTop && !nearBottom) return

        // Prevent the header drag handler from also firing for these edge clicks
        e.stopPropagation()
        e.preventDefault()

        const startMouseX = e.clientX
        const startMouseY = e.clientY
        const startLeft = outer.offsetLeft
        const startTop  = outer.offsetTop
        const startW    = outer.offsetWidth
        const startH    = outer.offsetHeight

        draggingRef.current = true
        document.body.style.cursor     = outer.style.cursor
        document.body.style.userSelect = 'none'

        function onMouseMove(ev: MouseEvent) {
            const dx = ev.clientX - startMouseX
            const dy = ev.clientY - startMouseY
            let newLeft = startLeft, newTop = startTop
            let newW = startW,       newH   = startH

            if (nearRight)  newW = Math.max(200, startW + dx)
            if (nearBottom) newH = Math.max(150, startH + dy)
            if (nearLeft)  { newW = Math.max(200, startW - dx); newLeft = startLeft + startW - newW }
            if (nearTop)   { newH = Math.max(150, startH - dy); newTop  = startTop  + startH - newH }

            outer.style.width  = `${newW}px`
            outer.style.height = `${newH}px`
            outer.style.left   = `${newLeft}px`
            outer.style.top    = `${newTop}px`
        }

        function onMouseUp() {
            draggingRef.current = false
            document.body.style.cursor     = ''
            document.body.style.userSelect = ''
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
            }}
            onMouseMove={onOuterMouseMove}
            onMouseDownCapture={onOuterMouseDownCapture}
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
