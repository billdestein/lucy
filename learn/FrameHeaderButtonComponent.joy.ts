//----------------------------------------------------------------------------------------------------
// frameHeaderButtonComponent
//----------------------------------------------------------------------------------------------------
export const frameHeaderButtonComponent = `

FrameHeaderButtonComponent is a React Component.  

Zerp or more FrameHeaderButtonComponents may be placed, right aligned, in a Frame header.

The FrameButtonComponent has these props:

- icon: an SVG icon from react-icons
- Handler: () => void
- Tooltip label: string

Each button has a tooltip.  On mouse over the icon, the tooltip immediately appears 
vertically above its corresponding icon.  The tooltip is positioned fixed so that it can 
extend beyond the top border of the frame.

When the mouse hovers over the button, the background color changes to something different
but complimentary.

Use onMouseDown (not onClick) with e.stopPropagation() to invoke the handler. This prevents
the frame's header drag handler from firing when the user clicks a button near the frame edge.

`
