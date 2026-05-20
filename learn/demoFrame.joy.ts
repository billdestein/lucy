//----------------------------------------------------------------------------------------------------
// demoFrame
//----------------------------------------------------------------------------------------------------
export const demoFrame = `

The DemoFrame is a React component.

The initial frame dimensions are 1112 x 625.

The frame's viewport contains an iframe with this src:
https://s3.us-west-2.amazonaws.com/billdestein.videos/lucy-v3.mp4

The video's native dimensions are 1112 x 625 (aspect ratio 1112/625).

The iframe grows and shrinks to fill the frame's viewport while maintaining the 1112/625
aspect ratio. Use a ResizeObserver on the container div to recompute the iframe dimensions
whenever the container is resized:

    const obs = new ResizeObserver(() => {
        const { width, height } = el.getBoundingClientRect()
        let w = width, h = width / VIDEO_RATIO
        if (h > height) { h = height; w = height * VIDEO_RATIO }
        setDims({ width: Math.floor(w), height: Math.floor(h) })
    })

The container div is a flexbox that centers the iframe horizontally and vertically.
Only render the iframe once dims.width > 0.

`
