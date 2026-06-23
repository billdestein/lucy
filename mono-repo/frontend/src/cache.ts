import { get, set } from 'idb-keyval'
import { PicType, WorkbookType } from '@billdestein/lucy-common'

// Cache keys look like:
//   /workbook.workbookName/pic.filename/pic.mimeType/pic.createdAt
function keyFor(workbookName: string, pic: PicType): string {
    return `/workbook.${workbookName}/pic.${pic.filename}/pic.${pic.mimeType}/pic.${pic.createdAt}`
}

async function fetchEncodedImage(workbookName: string, picFilename: string): Promise<string> {
    const params = new URLSearchParams({ workbookName, picFilename })
    const res = await fetch(`/v1/workbooks/get-pic?${params.toString()}`, {
        credentials: 'include',
    })
    if (!res.ok) throw new Error(`get-pic failed: ${res.status}`)
    const data = await res.json()
    return data.encodedImage as string
}

// Returns a copy of the workbook with each PicType's encodedImage populated from idb-keyval
// (fetching from the backend and caching on a miss). Sentinel pics (empty mimeType) have no
// file on disk and are returned as-is with encodedImage ''.
export async function refresh(workbook: WorkbookType): Promise<WorkbookType> {
    const pics: PicType[] = []
    for (const pic of workbook.pics) {
        if (!pic.mimeType) {
            pics.push({ ...pic, encodedImage: '' })
            continue
        }
        if (pic.encodedImage) {
            pics.push(pic)
            continue
        }
        const key = keyFor(workbook.workbookName, pic)
        let encoded = await get<string>(key)
        if (!encoded) {
            encoded = await fetchEncodedImage(workbook.workbookName, pic.filename)
            await set(key, encoded)
        }
        pics.push({ ...pic, encodedImage: encoded })
    }
    return { ...workbook, pics }
}
