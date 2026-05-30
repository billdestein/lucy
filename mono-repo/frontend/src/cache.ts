import { get, set } from 'idb-keyval'
import { PicType, WorkbookType } from '@billdestein/lucy-common'
import { apiGet } from './api'

// Keys look like '/workbook.workbookName/pic.filename/pic.mimeType/pic.createdAt'.
function keyFor(workbookName: string, pic: PicType): string {
    return `/workbook.${workbookName}/pic.${pic.filename}/pic.${pic.mimeType}/pic.${pic.createdAt}`
}

// For any pic whose encodedImage is empty, fetch from the backend (or idb-keyval cache) and
// populate it. Sentinel pics (empty mimeType) have no file on disk and are returned as-is.
export async function refresh(workbook: WorkbookType): Promise<WorkbookType> {
    const pics = await Promise.all(
        workbook.pics.map(async (pic): Promise<PicType> => {
            if (pic.mimeType === '') {
                return { ...pic, encodedImage: '' }
            }
            if (pic.encodedImage) {
                return pic
            }
            const key = keyFor(workbook.workbookName, pic)
            let encoded = await get<string>(key)
            if (!encoded) {
                const res = await apiGet<{ encodedImage: string }>(
                    `/v1/workbooks/get-pic?workbookName=${encodeURIComponent(
                        workbook.workbookName
                    )}&picFilename=${encodeURIComponent(pic.filename)}`
                )
                encoded = res.encodedImage
                await set(key, encoded)
            }
            return { ...pic, encodedImage: encoded }
        })
    )
    return { ...workbook, pics }
}
