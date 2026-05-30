import React, { useRef } from 'react'
import { FrameProps } from './types'
import { getCanvas, nextTopZIndex } from './canvas'

const BORDER = 5
const HEADER_HEIGHT = 32
// Resize grab band: anywhere on the border (5px) plus 5px inside it.
const BAND = BORDER + 5
const MIN_W = 200
const MIN_H = 120

type Edges = { left: boolean; right: boolean; top: boolean; bottom: boolean }

function cursorFor(e: Edges): string {
    if ((e.left && e.top) || (e.right && e.bottom)) return 'nwse-resize'
    if ((e.right && e.top) || (e.left && e.bottom)) return 'nesw-resize'
    if (e.left || e.right) return 'ew-resize'
    if (e.top || e.bottom) return 'ns-resize'
    return 'default'
}

export function Frame(props: FrameProps) {
    const outerRef = useRef<HTMLDivElement>(null)
    const geom = useRef({ x: props.x, y: props.y, w: props.width, h: props.height })
    const draggingRef = useRef(false)

    // Write the full geometry (position + size) to the outer div.
    const applyAll = () => {
        const o = outerRef.current
        if (!o) return
        const { x, y, w, h } = geom.current
        o.style.left = x + 'px'
        o.style.top = y + 'px'
        o.style.width = w + 2 * BORDER + 'px'
        o.style.height = h + HEADER_HEIGHT + 2 * BORDER + 'px'
    }

    // Write only the position to the outer div (used during drag).
    const applyPos = () => {
        const o = outerRef.current
        if (!o) return
        o.style.left = geom.current.x + 'px'
        o.style.top = geom.current.y + 'px'
    }

    const edgesAt = (e: React.MouseEvent | MouseEvent): Edges => {
        const o = outerRef.current!
        const rect = o.getBoundingClientRect()
        const lx = e.clientX - rect.left
        const ly = e.clientY - rect.top
        return {
            left: lx < BAND,
            right: lx > rect.width - BAND,
            top: ly < BAND,
            bottom: ly > rect.height - BAND,
        }
    }

    // Capture phase fires on the outer div before the header's bubble handler. Edge clicks
    // start a resize and stop propagation; non-edge clicks fall through to the header drag.
    const onMouseDownCapture = (e: React.MouseEvent<HTMLDivElement>) => {
        const o = outerRef.current
        if (!o) return
        // Restack: bring this frame to the front on any mouse down.
        o.style.zIndex = String(nextTopZIndex())

        const edges = edgesAt(e)
        if (edges.left || edges.right || edges.top || edges.bottom) {
            e.stopPropagation()
            startResize(e, edges)
        }
    }

    const startResize = (e: React.MouseEvent, edges: Edges) => {
        draggingRef.current = true
        const startX = e.clientX
        const startY = e.clientY
        const g0 = { ...geom.current }
        document.body.style.cursor = cursorFor(edges)

        const onMove = (ev: MouseEvent) => {
            let { x, y, w, h } = g0
            const dx = ev.clientX - startX
            const dy = ev.clientY - startY
            if (edges.right) w = Math.max(MIN_W, g0.w + dx)
            if (edges.bottom) h = Math.max(MIN_H, g0.h + dy)
            if (edges.left) {
                const nw = Math.max(MIN_W, g0.w - dx)
                x = g0.x + (g0.w - nw)
                w = nw
            }
            if (edges.top) {
                const nh = Math.max(MIN_H, g0.h - dy)
                y = g0.y + (g0.h - nh)
                h = nh
            }
            geom.current = { x, y, w, h }
            applyAll()
        }
        const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            draggingRef.current = false
            document.body.style.cursor = ''
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }

    // Header drag (bubble phase). Only reached for non-edge clicks.
    const onHeaderMouseDown = (e: React.MouseEvent) => {
        draggingRef.current = true
        const startX = e.clientX
        const startY = e.clientY
        const g0 = { ...geom.current }
        document.body.style.cursor = 'move'

        const canvas = getCanvas()
        const cw = canvas ? canvas.clientWidth : Infinity
        const ch = canvas ? canvas.clientHeight : Infinity

        const onMove = (ev: MouseEvent) => {
            const outerW = geom.current.w + 2 * BORDER
            let x = g0.x + (ev.clientX - startX)
            let y = g0.y + (ev.clientY - startY)
            // Left: right edge stays >= 30px from the left. Right: left edge <= cw - 30.
            x = Math.max(30 - outerW, Math.min(cw - 30, x))
            // Up: top stays at/below canvas top. Down: keep the header visible.
            y = Math.max(0, Math.min(ch - (HEADER_HEIGHT + 2 * BORDER), y))
            geom.current = { ...geom.current, x, y }
            applyPos()
        }
        const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            draggingRef.current = false
            document.body.style.cursor = ''
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }

    // Single bubble-phase cursor tracker for the whole frame surface. Frozen during drag.
    const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (draggingRef.current) return
        const o = outerRef.current
        if (!o) return
        o.style.cursor = cursorFor(edgesAt(e))
    }

    return (
        <div
            ref={outerRef}
            onMouseDownCapture={onMouseDownCapture}
            onMouseMove={onMouseMove}
            style={{
                position: 'absolute',
                boxSizing: 'border-box',
                left: props.x,
                top: props.y,
                width: props.width + 2 * BORDER,
                height: props.height + HEADER_HEIGHT + 2 * BORDER,
                zIndex: props.zIndex,
                border: `${BORDER}px solid #444444`,
                background: '#1e1e1e',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <div
                onMouseDown={onHeaderMouseDown}
                style={{
                    flex: '0 0 auto',
                    height: HEADER_HEIGHT,
                    background: '#2d2d2d',
                    color: '#dddddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 8px',
                    userSelect: 'none',
                    fontSize: 13,
                    fontFamily: 'sans-serif',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {props.title}
                </span>
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                >
                    {props.headerButtons}
                </div>
            </div>
            <div style={{ flex: '1 1 auto', overflow: 'auto', background: '#1e1e1e' }}>
                {props.children}
            </div>
        </div>
    )
}
