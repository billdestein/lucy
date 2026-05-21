//----------------------------------------------------------------------------------------------------
// workbookApplet
//----------------------------------------------------------------------------------------------------
export const workbookApplet = `

The WorkbookApplet is a React component that wraps Frame.

WorkbookApplet owns selectedPicFilename state (string), initialized to 'empty'.
After loading a workbook from the backend, selectedPicFilename is set to
workbook.focusedPicFilename (defaulting to 'empty' if absent for old workbooks).
selectedPicFilename and setSelectedPicFilename are provided through WorkbookContext.
selectedPicFilename always equals workbook.focusedPicFilename.

At initialization time, the WorkbookApplet creates a WorkbookType with a single empty
sentinel pic (filename: 'empty', mimeType: ''), focusedPicFilename: 'empty', and a
single prompt with text set to empty string.  The WorkbookApplet is the provider of
the WorkbookContext.  The workbook and its setter, along with isLoading and its setter,
and selectedPicFilename and its setter are held in this context.  PicListComponent,
ViewerComponent, and ComposerComponent access the workbook through the context, not
through props.

After loading the workbook from the backend, if the workbook has no prompts, the
WorkbookApplet adds a single empty focused prompt before storing it in context.  This
normalizes workbooks that were created before the backend was updated to include an
initial prompt.

The frame header has these FrameHeaderButtonComponents (left to right):

{
    icon: ButtonIcons.faRegCopy
    toolTipLabel: 'Clone Workbook'
    Handler: Open a PromptApplet asking for a new workbook name.  On ok, POST
        to /v1/workbooks/clone-workbook with { workbook: stripForBackend(workbook), newWorkbookName }.
}

{
    icon: ButtonIcons.upload
    toolTipLabel: 'Upload Image'
    Handler: Call addApplet UploadPicApplet, passing message:
        { workbookName, onUploaded }
    onUploaded calls hydrateFromBackend on the returned workbook, then
    calls setWorkbook and setSelectedPicFilename(hydrated.focusedPicFilename ?? 'empty').
}

{
    icon: ButtonIcons.x
    toolTipLabel: 'Close'
    Handler: Call removeApplet
}

The frame viewport is split into two panes, left and right, by a five-pixel slider.
Initially, the left pane is 30% wide.

The right pane is split into two panes, top and bottom, by a five-pixel slider.
Initially, the top pane is 60% heigh.

The left pane contains an instance of the PicListComponent.

The upper right pane contains an instance of the ViewerComponent.

The lower right pane contains an instance of the ComposerComponent.

`
