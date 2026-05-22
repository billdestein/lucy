import { get, set } from 'idb-keyval'
import { WorkbookType, PicType } from '@billdestein/joy-common'

function picKey(workbook: WorkbookType, pic: PicType): string {
    return `/workbook.${workbook.workbookName}/pic.${pic.filename}/pic.${pic.mimeType}/pic.${pic.createdAt}`
}

export async function refresh(workbook: WorkbookType): Promise<WorkbookType> {
    const pics = await Promise.all(
        workbook.pics.map(async (pic): Promise<PicType> => {
            if (pic.mimeType === '') return pic  // sentinel — no file on disk

            if (pic.encodedImage) {
                await set(picKey(workbook, pic), pic.encodedImage)
                return pic
            }

            const key = picKey(workbook, pic)
            const cached = await get<string>(key)
            if (cached) return { ...pic, encodedImage: cached }

            const res = await fetch(
                `/v1/workbooks/get-pic?workbookName=${encodeURIComponent(workbook.workbookName)}&picFilename=${encodeURIComponent(pic.filename)}`,
                { credentials: 'include' }
            )
            const { encodedImage } = await res.json() as { encodedImage: string }
            await set(key, encodedImage)
            return { ...pic, encodedImage }
        })
    )
    return { ...workbook, pics }
}
