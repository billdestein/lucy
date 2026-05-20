import React from 'react'
import ReactDOM from 'react-dom/client'

export type FrameProps = {
    frameId: number
    height: number
    isModal: boolean
    message: any
    width: number
    x: number
    y: number
    zIndex: number
}

type FrameEntry = {
    frameEl: HTMLDivElement
    root: ReactDOM.Root
    clickCatcher?: HTMLDivElement
}

let canvasEl: HTMLDivElement | null = null
const frames = new Map<number, FrameEntry>()
let nextFrameId = 1
let highestZIndex = 0

function setCanvas(el: HTMLDivElement) {
    canvasEl = el
}

function getTopZIndex(): number {
    return highestZIndex
}

function addFrame(
    Component: React.ComponentType<FrameProps>,
    partialProps: Partial<Omit<FrameProps, 'frameId' | 'zIndex'>>
) {
    if (!canvasEl) return

    const frameId = nextFrameId++
    highestZIndex++

    let x = partialProps.x
    let y = partialProps.y

    if (x === undefined || y === undefined) {
        let nearestX = 50
        let nearestY = 50
        let nearestZ = -1
        frames.forEach(entry => {
            const outer = entry.frameEl.firstElementChild as HTMLElement | null
            if (outer) {
                const z = parseInt(outer.style.zIndex || '0', 10)
                if (z > nearestZ) {
                    nearestZ = z
                    nearestX = parseInt(outer.style.left || '0', 10)
                    nearestY = parseInt(outer.style.top || '0', 10)
                }
            }
        })
        x = x ?? nearestX + (frames.size > 0 ? 50 : 0)
        y = y ?? nearestY + (frames.size > 0 ? 50 : 0)
    }

    const isModal = partialProps.isModal ?? false
    let frameZIndex = highestZIndex

    let clickCatcher: HTMLDivElement | undefined
    if (isModal) {
        clickCatcher = document.createElement('div')
        Object.assign(clickCatcher.style, {
            position: 'absolute',
            top: '0', left: '0', right: '0', bottom: '0',
            background: 'rgba(0,0,0,0.45)',
            zIndex: String(frameZIndex),
        })
        canvasEl.appendChild(clickCatcher)
        highestZIndex++
        frameZIndex = highestZIndex
    }

    const props: FrameProps = {
        frameId,
        height: partialProps.height ?? 600,
        isModal,
        message: partialProps.message ?? {},
        width: partialProps.width ?? 800,
        x,
        y,
        zIndex: frameZIndex,
    }

    const frameEl = document.createElement('div')
    canvasEl.appendChild(frameEl)

    const root = ReactDOM.createRoot(frameEl)
    root.render(React.createElement(Component, props))

    frames.set(frameId, { frameEl, root, clickCatcher })
}

function removeFrame(frameId: number) {
    const entry = frames.get(frameId)
    if (!entry) return
    entry.root.unmount()
    entry.frameEl.remove()
    entry.clickCatcher?.remove()
    frames.delete(frameId)
}

function bringToFront(frameId: number) {
    const entry = frames.get(frameId)
    if (!entry) return
    highestZIndex++
    const outer = entry.frameEl.firstElementChild as HTMLElement | null
    if (outer) outer.style.zIndex = String(highestZIndex)
}

export const canvas = { setCanvas, addFrame, removeFrame, bringToFront, getTopZIndex }
