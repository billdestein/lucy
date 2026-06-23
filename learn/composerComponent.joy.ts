//----------------------------------------------------------------------------------------------------
// composerComponent
//----------------------------------------------------------------------------------------------------
export const composerComponent = `

ComposerComponent is a React component.

ComposerComponent takes no props.  It reads the workbook from WorkbookContext via
useWorkbook().  It owns the editor text in local state, initialized from the focused
prompt's text on mount and re-synced whenever the focused prompt changes.

ComposerComponent contains a ComposerEditorComponent and a ComposerButtonRowComponent.

The ComposerButtonRowComponent goes at the bottom of the ComposerComponent viewport and is 
of fixed height.

The ComposerEditorComponent goes at the top of the ComposerComponent viewport and fills
the remaining vertical space.

`
