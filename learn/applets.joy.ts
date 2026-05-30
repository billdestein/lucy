//----------------------------------------------------------------------------------------------------
// Applets
//----------------------------------------------------------------------------------------------------
export const applets = `

Applets is a light-weight windowing system for React applications.

The idea is that we want to have a single main react app.  The main react app has a div,
usually a large div, that we call the canvas.  Within the canvas, we can have multiple 'Applets'.
An Applet is a rectangular region that can be dragged and resized through mouse gestures.  When
there are two or more applets on the canvas, the applets can be stacked and restacked (using z-index).

The generated code for Applets goes in a directory named applets at the top level of the
Lucy mono-repo.

We expect to publish the Applets package to NPM at some point, so the project structure reflects
that decision.

In package.json, set "type": "module" so the package is treated as ESM. react and react-dom
go in peerDependencies.  @types/react and @types/react-dom go in dependencies (NOT
devDependencies) because this package is built in production environments where
devDependencies are not installed, and the type declarations are required at build time.

The tsconfig.json must use "module": "ES2020" (not "commonjs"). Vite uses Rollup to bundle
the frontend, and Rollup cannot statically analyze CommonJS re-exports produced by tsc.
ESM output avoids this problem entirely.

The tsconfig.json must also explicitly set "moduleResolution": "node". The default
moduleResolution for "module": "ES2020" is "classic", which cannot find npm packages
like react. This causes type errors on clean Linux installs (EC2) even though macOS
may mask the problem via npm caching or hoisting.

The Applets package exports functions setCanvas, addApplet, and removeApplet.

The Applets package exports Frame -- a react component (more below).

At initialization time, setCanvas is called with the id of a div to be used as the canvas.

The addApplet function takes two arguments.  The first is an Applet component and the second
is an object of type AppletProps.

An Applet component is a react function component that renders and returns a Frame component.

By convention, Applet components have names ending in Applet.

The removeApplet function takes a single argument -- the appletId of the applet to be removed.

AppletProps looks like this:

type AppletProps = {
    appletId: number
    height: number
    isModal: boolean
    message: any
    width: number
    x: number
    y: number
    zIndex: number
}

An Applet component reads the data it needs from message.  It computes its own title and
header buttons.  It then renders a Frame component, passing the title, header buttons,
its viewport content as children, and the geometry fields from FrameProps.

The Frame component has these props:

- The geometry fields (height, isModal, width, x, y, zIndex).  The Frame has no id of
  its own — it manages its own DOM via refs and renders the headerButtons the Applet
  supplies (including Close).  It does not use message — that is for the Applet only.
- title: string — displayed left-aligned in the header
- headerButtons: ReactNode — displayed right-aligned in the header
- children: ReactNode — rendered in the viewport

The Frame has this layout:

- A rectangular viewport.
- Above the viewport is a FrameHeader.  More on FrameHeader below.
- The FrameHeader is used as a grab bar for moving the frame.
- Around the viewport and the header is a five-pixel border.
- The grab spot for resizing is anywhere on the border, and anywhere five pixels inside the border.

The Frame uses a dark chrome theme. These colors must be distinct so the border is actually
visible — do NOT make the border the same color as the viewport background, or it disappears:
- the five-pixel border is #444444 (a visible mid-gray window edge)
- the header (grab bar) background is #2d2d2d with #dddddd text
- the viewport background is #1e1e1e

The AppletProps properties are:

- appletId is a number that uniquely identifies the applet.  It is generated in the
  addApplet function and passed to the Applet via AppletProps.  When it's time to remove
  the applet from the Canvas, the Applet passes its appletId to the removeApplet function
  (e.g. from its Close header button).

- height is the initial height of the Frame's viewport in pixels.  Defaults to 600

- isModal indicates whether or not the frame is a 'modal' frame.  More information on modal
  frames follows.

- message is an opaque data object used by the Applet to initialize itself.
  The Frame component does not read message.

- width is the initial width of the Frame's viewport in pixels. Defaults to 800

- x is the initial distance in pixels from the left edge of the canvas to the left edge of the frame.
  If not specified, the frame sets x to the x value of the nearest frame (in z order) plus 50.

- y is the initial distance in pixels from the top of the canvas to the top of the frame.
  If not specified, the frame sets y to the y value of the nearest frame (in z order) plus 50.

For each frame currently on the canvas, the canvas has it's own representation of the
frame.  That representation includes the FrameProps.  So it has initial values for x,
y, height, width and z-index.  The representation also includes the frames' current
x, y, height, width and z-index.

Modal frames are different from regular frames.  When the Canvas adds a new modal frame, it first adds
a 'click catcher' div to the DOM.  The click catcher div is translucent gray.
The click catcher covers the entire canvas.  It has a z-index one greater current z-index of all
frames currently on the canvas.  The click catcher blocks all pointer events from reaching anything behind it.  Do not set pointer-events:none on it — that would cause clicks to pass through rather than be blocked.  Once the click catcher
is in place, the canvas adds the new modal frame.  The modal frame is centered on the canvas both
horizontally and vertically. Its x and y props are ignored. Its z-index value is one greater than that
of the click catcher. When asked to remove the modal frame, the canvas also removes the click catcher
div from the DOM.

All dragging, resizing and restacking is done through direct DOM manipulation.  We don't want mouse gestures on
one Frame to cause React to rerender other frames.  Each frame keeps track if its own x, y, height, width and z-index.

The canvas div is position:relative. Each frame's outer div is position:absolute within the canvas.

The Canvas creates one plain unpositioned div (frameEl) per frame, purely as a ReactDOM.createRoot mount point.
frameEl must have no position, left, or top — it is invisible infrastructure. All positioning and z-index live
on the outer div inside the Frame component. This keeps each frame in its own React tree (so dragging one frame
does not re-render others) while ensuring outer.offsetLeft and outer.offsetTop are canvas-relative, which is
required for correct drag bounds checking.

A frame can be dragged upward but only until the top of the frame touches the top of the canvas.

A frame can be dragged downward but only until the bottom of the frame header touches the top of
the viewport.

A frame can be dragged left but only until the right edge of the frame is 30 pixels from the
left side of the viewport.

A frame can be dragged right but only until the left edge of the frame is 30 pixels from the
right side of the viewport.

## Frame implementation rules

The Frame component handles dragging and four-edge resizing. The rules that must be followed:

1. Use onMouseDownCapture (not onMouseDown) on the outer div. The capture phase fires on
   the parent before any child's bubble-phase handler runs. This lets the outer div intercept
   resize clicks at the edges before the header's drag handler sees them. For edge clicks,
   call e.stopPropagation() to prevent the header handler from also firing. For non-edge
   clicks, return early without stopping propagation so normal header drag works.

2. Track the cursor in onMouseMove on the outer div (bubble phase). Because events bubble
   up from children, this single handler covers the whole frame surface. Never use React
   state for the cursor — it causes re-renders that break active drag operations. Instead,
   write directly to outer.style.cursor.

3. Use a draggingRef (useRef(false)) to freeze cursor updates during an active drag or
   resize. At the start of any drag/resize, set draggingRef.current = true; in the mouseup
   cleanup, set it back to false. In onMouseMove, return early if draggingRef.current is true.

4. Set document.body.style.cursor at the start of a drag/resize to lock the cursor globally.
   This prevents child elements (Monaco editor, AG Grid, etc.) from overriding it mid-drag.
   Clear it in the mouseup cleanup.

5. All four edges (top, bottom, left, right, and corners) resize the frame. Left and top
   resize must also adjust the frame's left/top position to keep the opposite edge fixed.

6. The header drag handler goes on the header child div as onMouseDown (bubble phase). It is
   only reached for non-edge clicks because the capture handler on the outer div stops
   propagation for edge clicks.

7. The header buttons container should have onMouseDown={e => e.stopPropagation()} so that
   clicking a button does not start a header drag.

`