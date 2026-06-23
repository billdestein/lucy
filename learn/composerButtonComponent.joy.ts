//----------------------------------------------------------------------------------------------------
// composerButtonComponent
//----------------------------------------------------------------------------------------------------
export const composerButtonComponent = `

ComposerButtonComponent is a React Component.  

Zero or more ComposerButtonComponents may be placed, right aligned, in a ComposerButtonRowComponent.

The ComposerButtonComponent has these props:

- icon: an SVG icon from react-icons
- Handler: () => void
- Tooltip label: string

Each button has a tooltip.  On mouse over the icon, the tooltip immediately appears
vertically below its corresponding icon.  The tooltip is positioned fixed so that it can
extend beyond the bottom border of the frame.

The tooltip must be rendered in a React portal to document.body (react-dom createPortal).
A position:fixed element is normally anchored to the viewport, but if any ancestor has a
CSS transform that ancestor becomes the containing block for the fixed element. The
paginator wraps its buttons in a div with transform: translateX(-50%) to center it, so a
non-portaled tooltip would be mis-anchored to that div and would contribute to the frame's
scrollable overflow — making the frame's scrollbars appear and flicker on hover. Rendering
the tooltip into document.body avoids the transformed ancestor entirely, so the fixed
coordinates (computed from getBoundingClientRect) resolve against the viewport as intended.

When the mouse hovers over the button, the background color changes to something different
but complimentary.
`
