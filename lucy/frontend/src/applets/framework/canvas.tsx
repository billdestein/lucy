import { useSyncExternalStore } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { AddAppletOptions, AppletComponent, AppletProps } from './types'

// --- module-level applet store -------------------------------------------------
// Minimal external store so addApplet/removeApplet can be called from anywhere
// (not just inside React) and the canvas re-renders via useSyncExternalStore.

interface AppletInstance extends AppletProps {
  Component: AppletComponent
}

let applets: AppletInstance[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  // New array reference so useSyncExternalStore detects the change.
  applets = applets.slice()
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot() {
  return applets
}

// --- public API ----------------------------------------------------------------

// Mount an applet onto the canvas. Returns the assigned frameId.
export function addApplet(Component: AppletComponent, opts: AddAppletOptions): string {
  const frameId = `applet-${nextId++}`
  applets.push({ Component, frameId, ...opts })
  emit()
  return frameId
}

// Remove a previously-added applet by its frameId.
export function removeApplet(frameId: string): void {
  applets = applets.filter((a) => a.frameId !== frameId)
  listeners.forEach((l) => l())
}

function CanvasRoot() {
  const list = useSyncExternalStore(subscribe, getSnapshot)
  return (
    <>
      {list.map(({ Component, ...props }) => (
        <Component key={props.frameId} {...props} />
      ))}
    </>
  )
}

let root: Root | null = null

// Bind the applet canvas to a DOM element (called once after the canvas div mounts).
export function setCanvas(elementId: string): void {
  const el = document.getElementById(elementId)
  if (!el) {
    throw new Error(`setCanvas: no element with id "${elementId}"`)
  }
  if (root) {
    root.unmount()
  }
  root = createRoot(el)
  root.render(<CanvasRoot />)
}
