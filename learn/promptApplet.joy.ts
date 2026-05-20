//----------------------------------------------------------------------------------------------------
// promptApplet
//----------------------------------------------------------------------------------------------------
export const promptApplet = `

The PromptApplet is a React component that wraps Frame.

The PromptApplet has a 'prompt' in its message.  The prompt is displayed in the viewport.

The frame viewport also has a text input field.

And an ok button and a cancel button.

The ok button validates the text in the text area. Valid text is text that can be used as a Linux file name.
If valid, it calls the onOk callback passing the value from the text input, then calls onClose().

The cancel button handler removes the PromptApplet from the canvas.
`
