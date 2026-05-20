//----------------------------------------------------------------------------------------------------
// viewerComponent
//----------------------------------------------------------------------------------------------------
export const viewerComponent = `

The ViewerComponent is a React component.

The ViewerComponent takes no props.  It reads workbook, isLoading and selectedPicFilename
from WorkbookContext via useWorkbook().

The ViewerComponent displays the pic whose filename matches selectedPicFilename from
WorkbookContext, falling back to the last pic in workbook.pics if none is selected.
Shows a black box if there are no pics.

The image is centered in the space allocated for the ViewerComponent.  

The image is sized to be as large as possible while maintaining it's aspect ration 
and without causing clipping in either the horizontal or vertical direction.

The image has a context menu with these options:

- "Download image": download the image as is typical in web apps.

- "Save as pic": does alert('save')

- "Zoom": adds a ZoomFrame to the canvas.  The encoded image and mime type are passed as props.  

While the surrounding workbook has an API call to the generate-pic is pending show a spinner.
The spinner is 72px, centered over a rgba(0,0,0,0.4) overlay that covers the viewer.
It is a rainbow conic-gradient ring (red → orange → yellow → green → blue → purple → red),
masked to a 7px-wide arc using radial-gradient on the mask property (and WebkitMask).
It rotates with a 1s linear CSS animation.

`
