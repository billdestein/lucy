// Shared geometry constants for the Applets windowing system.

// Five-pixel border around the header + viewport (also the primary resize grab zone).
export const BORDER = 5

// Height of the FrameHeader (grab bar) in pixels.
export const HEADER_HEIGHT = 28

// The grab spot for resizing is anywhere on the border, and anywhere five pixels inside it.
export const RESIZE_EDGE = BORDER + 5

// Minimum viewport-inclusive outer dimensions when resizing.
export const MIN_WIDTH = 240
export const MIN_HEIGHT = 140

// When dragging, keep at least this many pixels of the frame reachable at the canvas edges.
export const EDGE_MARGIN = 30
