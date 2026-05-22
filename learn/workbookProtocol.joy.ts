//----------------------------------------------------------------------------------------------------
// workbookProtocol
//----------------------------------------------------------------------------------------------------
export const workbookProtocol = `

## WorkbookContext

WorkbookContext is a React context that lives at the WorkbookApplet level.  There is one
WorkbookContext per open WorkbookApplet.

The context holds:

- workbook: WorkbookType — the current workbook
- setWorkbook: (wb: WorkbookType) => void — replaces the workbook
- isLoading: boolean — true while a generate-pic call is in flight
- setIsLoading: (loading: boolean) => void
- selectedPicFilename: string — filename of the currently selected pic (never null; 'empty' when no real pic is focused)
- setSelectedPicFilename: (filename: string) => void

All descendants of WorkbookApplet access and update the workbook through this context.
Props are not used to pass the workbook or its setters down the component tree.

selectedPicFilename and workbook.focusedPicFilename are always kept in sync.
'empty' is the sentinel value meaning no real pic is focused (text-to-image mode).

A custom hook called useWorkbook() returns the context value.  It throws if called
outside a WorkbookApplet.

## stripForBackend

stripForBackend takes a WorkbookType and returns a copy of it with the encodedImage of
every PicType set to an empty string.

Call stripForBackend before sending a workbook to any backend endpoint.

## hydrateFromBackend

hydrateFromBackend takes a WorkbookType received from a backend endpoint and returns a
Promise<WorkbookType>.  It calls the cache refresh function to populate the encodedImage
of every PicType from the local cache or from the backend get-pic endpoint if not cached.

Call hydrateFromBackend after receiving a workbook from any backend endpoint.


`
