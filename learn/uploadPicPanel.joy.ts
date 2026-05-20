//----------------------------------------------------------------------------------------------------
// uploadPicPanel
//----------------------------------------------------------------------------------------------------
export const uploadPicPanel = `

The UploadPicPanel is a React component that wraps Frame.  It is opened as a modal
from WorkbookPanel.

It receives a message with two fields:
  - workbookName: string
  - onUploaded: (workbook: WorkbookType) => void

The viewport is a click-and-drop target.  Clicking opens a hidden file input (accept="image/*").
Dropping a file or selecting one from the file dialog triggers the upload.

On file selection (Finder drag or Browse):
  - Read the file with FileReader as a data URL.
  - Extract the base64 imageData (everything after the comma in the data URL).
  - POST to /v1/workbooks/upload-pic with { workbookName, imageFilename: file.name, imageData, mimeType: file.type }.
  - On success: call onUploaded(returnedWorkbook) and close the panel via canvas.removeFrame.
  - On error: display the error message in the viewport.

On URL drag (e.g. image dragged from Chrome):
  - dataTransfer.files is empty; read the URL from dataTransfer.getData('text/uri-list').
  - Derive imageFilename from the last path segment of the URL (strip query string).
  - POST to /v1/workbooks/upload-pic-from-url with { workbookName, imageUrl, imageFilename }.
  - The backend fetches the image server-side (no CORS issues) and returns the updated workbook.
  - On success: call onUploaded(returnedWorkbook) and close the panel.
  - On error: display the error message in the viewport.

The viewport is split into a drop zone (flex: 1) and a button row at the bottom.

The drop zone shows an upload arrow and the text "Drop an image or URL here" while idle.
While uploading, it shows "Uploading…".

The button row (right-aligned) contains:
- Browse: opens the hidden file input

`
