import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { AppletProps } from './types'

type FrameRecord = {
    appletId: number
    frameEl: HTMLDivElement
    root: Root
    isModal: boolean
    clickCatcher: HTMLDivElement | null
    x: number
    y: number
    width: number
    height: number
    zIndex: number
}

let canvasEl: HTMLElement | null = null
let nextAppletId = 1
let topZIndex = 0
const frames = new Map<number, FrameRecord>()

// At initialization time, setCanvas is called with the id of the div to use as the canvas.
// The canvas div is position:relative so absolutely-positioned frames are canvas-relative.
export function setCanvas(id: string): void {
    canvasEl = document.getElementById(id)
    if (canvasEl) {
        canvasEl.style.position = 'relative'
    }
}

export function getCanvas(): HTMLElement | null {
    return canvasEl
}

// Returns the next z-index above all current frames (used for restacking on click).
export function nextTopZIndex(): number {
    topZIndex += 1
    return topZIndex
}

// addApplet takes an Applet component and a (partial) AppletProps. It generates the
// appletId and z-index, fills in geometry defaults, and mounts the Applet into its own
// React root on a plain unpositioned mount point inside the canvas.
export function addApplet(
    Component: React.ComponentType<AppletProps>,
    props: Partial<AppletProps> = {}
): number {
    if (!canvasEl) {
        throw new Error('Canvas not set. Call setCanvas(id) first.')
    }

    const appletId = nextAppletId++
    const isModal = props.isModal ?? false
    const width = props.width ?? 800
    const height = props.height ?? 600

    // Default x/y to the nearest frame (highest z) plus 50, else a base offset.
    let x = props.x
    let y = props.y
    if (x === undefined || y === undefined) {
        let nearest: FrameRecord | null = null
        for (const f of frames.values()) {
            if (!nearest || f.zIndex > nearest.zIndex) nearest = f
        }
        x = x ?? (nearest ? nearest.x + 50 : 60)
        y = y ?? (nearest ? nearest.y + 50 : 60)
    }

    let clickCatcher: HTMLDivElement | null = null
    let zIndex: number

    if (isModal) {
        // Add a translucent click catcher that blocks all pointer events behind it. Do not
        // set pointer-events:none — that would let clicks pass through.
        clickCatcher = document.createElement('div')
        const ccZ = nextTopZIndex()
        Object.assign(clickCatcher.style, {
            position: 'absolute',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(128,128,128,0.4)',
            zIndex: String(ccZ),
        })
        canvasEl.appendChild(clickCatcher)

        // The modal frame's z-index is one greater than the click catcher. It is centered
        // on the canvas; its x and y props are ignored.
        zIndex = nextTopZIndex()
        x = Math.max(0, (canvasEl.clientWidth - (width + 10)) / 2)
        y = Math.max(0, (canvasEl.clientHeight - (height + 42)) / 2)
    } else {
        zIndex = nextTopZIndex()
    }

    // One plain unpositioned div per frame, purely as a ReactDOM mount point. It has no
    // position/left/top — all positioning lives on the Frame's outer div.
    const frameEl = document.createElement('div')
    canvasEl.appendChild(frameEl)
    const root = createRoot(frameEl)

    const appletProps: AppletProps = {
        appletId,
        height,
        isModal,
        message: props.message,
        width,
        x: x!,
        y: y!,
        zIndex,
    }
    root.render(React.createElement(Component, appletProps))

    frames.set(appletId, {
        appletId,
        frameEl,
        root,
        isModal,
        clickCatcher,
        x: x!,
        y: y!,
        width,
        height,
        zIndex,
    })

    return appletId
}

// removeApplet unmounts the applet, removes its mount point, and (for modal frames) removes
// the click catcher div.
export function removeApplet(appletId: number): void {
    const rec = frames.get(appletId)
    if (!rec) return
    rec.root.unmount()
    rec.frameEl.parentElement?.removeChild(rec.frameEl)
    rec.clickCatcher?.parentElement?.removeChild(rec.clickCatcher)
    frames.delete(appletId)
}
