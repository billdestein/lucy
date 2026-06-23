//----------------------------------------------------------------------------------------------------
// promptApplet
//----------------------------------------------------------------------------------------------------
export const promptApplet = `

The PromptApplet is an Applet.

It receives a message with exactly these two fields:
  - prompt: string — the instruction displayed in the viewport (e.g. "Enter a name for your new workbook")
  - onOk: (value: string) => void — called with the validated text input value when the user clicks ok

The prompt is displayed in the viewport.

The frame viewport also has a text input field.

And an ok button and a cancel button.

The ok button validates the text in the text area. Valid text is text that can be used as a Linux file name.
If valid, it calls the onOk callback passing the value from the text input, then calls removeApplet(appletId).

The cancel button handler calls removeApplet(appletId).
`
