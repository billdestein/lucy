//----------------------------------------------------------------------------------------------------
// composerEditorComponent
//----------------------------------------------------------------------------------------------------
export const composerEditorComponent = `

The entire viewport of the ComposerEditorComponent is filled with a React Monaco editor.

Use @monaco-editor/react.

The editor uses the 'vs-dark' theme.  The language mode is 'plaintext'.  The minimap is
disabled.  Line numbers are off.  Word wrap is on.  Font size is 13.

The editor is a controlled component.  It takes a 'value' prop (string) and an 'onChange'
prop ((value: string) => void).  The parent (ComposerComponent) owns the editor text in
local state and passes it down.

On mount, the editor is pre-populated with the text of the focused PromptType in the workbook,
if one exists.  If no PromptType is focused, the editor starts empty.

When the editor is empty and not focused, display placeholder text "Enter your prompt here:"
as an absolutely-positioned overlay div (pointerEvents: 'none', zIndex: 1) inside the
position: relative wrapper.  Use color #c9a0a0 (muted dusty rose), fontSize 13, monospace
font to match the editor.  Set padding: '8px 0 0 30px' to align with Monaco's content left
(glyphMargin ~20px + lineDecorations ~10px with lineNumbers off).  The placeholder disappears
when the editor gains focus.  Track
focus state via onMount: attach editor.onDidFocusEditorText and editor.onDidBlurEditorText
to a focused boolean in useState.

The editor is always editable — it is never set to read-only.

The editor text is NOT written back into the workbook on every keystroke.  The workbook is
updated only when runPrompt executes (via the ComposerButtonRowComponent).

`
