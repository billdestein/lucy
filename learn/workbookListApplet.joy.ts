//----------------------------------------------------------------------------------------------------
// workbookListApplet
//----------------------------------------------------------------------------------------------------
export const workbookListApplet = `

The WorkbookListApplet is an Applet.

At initialization, WorkbookListApplet calls the list-workbooks endpoint on the backend server.

loadWorkbooks is a useCallback with empty deps so it is stable across renders. It is called on
mount and also whenever the window event 'lucy:workbooks-changed' fires (registered via
useEffect). This allows other applets (e.g. WorkbookApplet after a clone) to trigger a refresh.

The WorkbookListApplet has an AG Grid React that fills the frame body.

Use ag-grid-community and ag-grid-react version ^30.0.0.
Import 'ag-grid-community/styles/ag-grid.css' and 'ag-grid-community/styles/ag-theme-alpine.css'.
Use className "ag-theme-alpine-dark" on the grid container div. Do NOT import a separate
ag-theme-alpine-dark.css file — the dark variant is a class defined within ag-theme-alpine.css.

The grid has one row for each workbook returned from the backend.

Each row has three columns

(1) name is string

(2) createdISO is derived from workbook.createdAt (a millisecond epoch timestamp),
    formatted as an ISO datetime string with these modifications: remove milliseconds,
    replace 'T' with ' ', remove 'Z'.  Use a fixed width font so all values in the
    column have the same width.

(3) createdAgo is the time since workbook.createdAt, expressed as xxx days ago,
    or xxx hours ago, or xxx minutes ago.

Columns 1 (name) and 2 (createdISO) are sortable.  Column 3 (createdAgo) is not.

The AG Grid row data is NOT a WorkbookType. Each row object has the shape:
{ name, createdISO, createdAgo, _wb: WorkbookType }
where _wb holds the original WorkbookType. When the context menu needs the WorkbookType
(e.g. to pass to an API call or to open a WorkbookApplet), always read rowNode.data._wb —
do not cast rowNode.data directly as WorkbookType, as it does not have a workbookName property.

Clicking a row opens the corresponding WorkbookApplet, the same as the "Open workbook" context menu option.

Each row has a context menu.  The context menu is implemented from scratch.  It does not
use AG Grids context menu features.  When the user right clicks on a row, the context menu
pops up, with its uper left corner at the cursor position when the click event happened.

Implement right-click detection using a native 'contextmenu' event listener attached to the
grid container div via useEffect — do not use AG Grid's onRowContextMenu or onCellContextMenu
props. In the handler, call preventDefault(), then walk up from event.target using
.closest('.ag-row') to find the row element, read its 'row-index' attribute, and call
gridApi.getDisplayedRowAtIndex(rowIndex) to get the row data. Store the grid API via
onGridReady.

The context menu has these four options:

The "Clone workbook" option opens a PromptApplet asking for a new workbook name.
On ok, it POSTs to /v1/workbooks/clone-workbook with { workbook, newWorkbookName }
and then refreshes the grid.

The "Delete workbook" option makes an API call to the backend's
delete-workbook endpoint.  It uses the response to refresh the grid.

The "Download workbook" option stringifies the workbook with an indent of four,
and downloads it as workbook.lucy.

The "Open workbook" calls addApplet to add the WorkbookApplet.
The selected workbook name is passed as a prop to the WorkbookApplet.

The frame has these three FrameHeaderButtonComponents right-aligned in the header:

{
    icon: ButtonIcons.plus
    toolTipLabel: 'New Workbook'
    Handler: addWorkbook (see details below)
}

{
    icon: ButtonIcons.upload
    toolTipLabel: 'Upload Workbook'
    Handler: uploadWorkbook (see details below)
}

{
    icon: ButtonIcons.x
    toolTipLabel: 'Close'
    Handler: Call removeApplet
}

The surrounding frame has the string 'Workbooks' left-aligned in the header.

The addWorkbookHandler uses PromptApplet with prompt "Enter a name for your new workbook",
and then makes an API call to the backend's create-workbook endpoint.

The uploadWorkbook function creates an instance of the UploadWorkbookApplet.
UploadWorkbookApplet calls its callback function when complete.  The callback
function refreshes the grid.

`
