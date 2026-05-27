import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { FrameProps } from './types'

const MIN_WIDTH = 120
const MIN_HEIGHT = 80
const EDGE = 6 // grab thickness for side handles
const CORNER = 12 // grab size for corner handles

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
type Mode = 'move' | Dir

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// Positioned window chrome that applets render their content inside. Draggable by
// its header and resizable from any edge or corner. Initial geometry comes from the
// AppletProps the applet was given; from there the frame owns its own rect.
export function Frame({
  height,
  width,
  x,
  y,
  zIndex,
  isModal,
  title,
  headerButtons,
  children,
}: FrameProps) {
  const [rect, setRect] = useState<Rect>({ x, y, width, height })

  // Interaction state for the active drag/resize. Held in a ref so the move
  // handler reads fresh values without re-binding listeners.
  const drag = useRef<{ mode: Mode; startX: number; startY: number; start: Rect } | null>(null)

  function onPointerMove(e: PointerEvent) {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    const s = d.start

    if (d.mode === 'move') {
      setRect({ ...s, x: s.x + dx, y: s.y + dy })
      return
    }

    let { x: nx, y: ny, width: nw, height: nh } = s
    const m = d.mode
    if (m.includes('e')) nw = Math.max(MIN_WIDTH, s.width + dx)
    if (m.includes('s')) nh = Math.max(MIN_HEIGHT, s.height + dy)
    if (m.includes('w')) {
      nw = Math.max(MIN_WIDTH, s.width - dx)
      nx = s.x + (s.width - nw)
    }
    if (m.includes('n')) {
      nh = Math.max(MIN_HEIGHT, s.height - dy)
      ny = s.y + (s.height - nh)
    }
    setRect({ x: nx, y: ny, width: nw, height: nh })
  }

  function endInteraction() {
    drag.current = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', endInteraction)
  }

  function startInteraction(e: ReactPointerEvent, mode: Mode) {
    e.preventDefault()
    e.stopPropagation()
    drag.current = { mode, startX: e.clientX, startY: e.clientY, start: rect }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endInteraction)
  }

  // Side + corner resize handles, positioned around the frame's edges.
  const handle = (dir: Dir, style: React.CSSProperties, cursor: string) => (
    <div
      onPointerDown={(e) => startInteraction(e, dir)}
      style={{ position: 'absolute', zIndex: 1, cursor, ...style }}
    />
  )

  return (
    <>
      {isModal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          zIndex: zIndex + (isModal ? 1 : 0),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* edges */}
        {handle('n', { top: 0, left: CORNER, right: CORNER, height: EDGE }, 'ns-resize')}
        {handle('s', { bottom: 0, left: CORNER, right: CORNER, height: EDGE }, 'ns-resize')}
        {handle('w', { left: 0, top: CORNER, bottom: CORNER, width: EDGE }, 'ew-resize')}
        {handle('e', { right: 0, top: CORNER, bottom: CORNER, width: EDGE }, 'ew-resize')}
        {/* corners */}
        {handle('nw', { top: 0, left: 0, width: CORNER, height: CORNER }, 'nwse-resize')}
        {handle('ne', { top: 0, right: 0, width: CORNER, height: CORNER }, 'nesw-resize')}
        {handle('sw', { bottom: 0, left: 0, width: CORNER, height: CORNER }, 'nesw-resize')}
        {handle('se', { bottom: 0, right: 0, width: CORNER, height: CORNER }, 'nwse-resize')}

        <div
          onPointerDown={(e) => startInteraction(e, 'move')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            background: '#f3f3f3',
            borderBottom: '1px solid #ddd',
            cursor: 'move',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
          {/* Buttons must not start a drag */}
          <div style={{ display: 'flex', gap: 4 }} onPointerDown={(e) => e.stopPropagation()}>
            {headerButtons}
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>{children}</div>
      </div>
    </>
  )
}
