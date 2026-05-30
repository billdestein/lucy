//----------------------------------------------------------------------------------------------------
// cache
//----------------------------------------------------------------------------------------------------
export const cache = `

Cache is a small library written in typescript.

It uses the idb-keyval npm package.

idb-keyval makes the browser's indexeddb look like a key/value store much like localStorage.

For the cache library, keys have the form: "/workbook.workbookName/pic.filename/pic.mimeType/pic.createdAt" 

The PicType holds metadata for a single image.  When a workbook is sent to the backend and
when a workbook is received from the backend, the encodedImage in all of the PicTypes is
an empty string.  But the workbook internal to the WorkbookApplet has non-empty encodedImage
for each PicType.

The cache library has a refresh function.

The refresh function takes a workbook as its only argument and returns a Promise<WorkbookType>.

For any pic whose encodedImage is an empty string, the image is fetched from the backend
using the get-pic endpoint and stored in idb-keyval.

Pics with an empty mimeType are sentinel pics (e.g. the 'empty' placeholder) and are
skipped — they have no file on disk and are returned as-is with encodedImage: ''.

The refresh function returns a new WorkbookType that is a copy of the argument, with each
PicType's encodedImage populated from idb-keyval.

The caller (WorkbookApplet) passes the returned workbook to setWorkbook(), which triggers
a React re-render and updates the ViewerComponent and PicList.

`
