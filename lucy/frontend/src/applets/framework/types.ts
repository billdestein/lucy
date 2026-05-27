import type { ReactElement, ReactNode } from 'react'

// Props every applet component receives. The canvas injects frameId plus the
// geometry/behaviour passed to addApplet; `message` carries applet-specific data.
export interface AppletProps {
  frameId: string
  height: number
  width: number
  x: number
  y: number
  zIndex: number
  isModal: boolean
  message?: unknown
}

// Options passed to addApplet (everything in AppletProps except the canvas-assigned frameId).
export type AddAppletOptions = Omit<AppletProps, 'frameId'>

// An applet is just a React component rendered with AppletProps.
export type AppletComponent = (props: AppletProps) => ReactElement | null

// Props for the <Frame> chrome that applets render their content inside.
export interface FrameProps {
  frameId: string
  height: number
  width: number
  x: number
  y: number
  zIndex: number
  isModal: boolean
  title?: string
  headerButtons?: ReactNode
  children?: ReactNode
}
