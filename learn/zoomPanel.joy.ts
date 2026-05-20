//----------------------------------------------------------------------------------------------------
// zoomPanel
//----------------------------------------------------------------------------------------------------
export const zoomPanel = `

The ZoomPanel is a React component that wraps Frame.

The ZoomPanel takes two props via message:

- encodedImage - a base64-encoded string containing a png or a jpg

- mimeType - either 'image/png' or 'image/jpeg'

The image is centered in the frame's viewport.  The image is sized to be as
large as possible while maintaining its aspect ratio and without causing clipping in
either the horizontal or vertical direction.

`
