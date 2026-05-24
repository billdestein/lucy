//----------------------------------------------------------------------------------------------------
// picListComponent
//----------------------------------------------------------------------------------------------------
export const picListComponent = `

PicListComponent takes no props.  It reads the workbook from WorkbookContext via
useWorkbook().

The PicListComponent iterates over the pics in the workbook, sorted by createdAt descending
(newest first).  For each pic, a PicComponent is rendered.

The pic.filename is passed as the 'name' prop, except for the empty sentinel
(filename: 'empty') which is displayed as '+ New image'.

A pic is focused when its filename matches selectedPicFilename from WorkbookContext.
Clicking a PicComponent calls setSelectedPicFilename with that pic's filename and
also updates workbook.focusedPicFilename to that filename via setWorkbook.

The sentinel prop is true for the pic with filename 'empty'.

`
