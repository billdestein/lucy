import { get, set } from 'idb-keyval'
import { WorkbookType, PicType } from '@billdestein/joy-common'

function cacheKey(workbookName: string, pic: PicType): string {
    return `/workbook.${workbookName}/pic.${pic.filename}/${pic.mimeType}/${pic.createdAt}`
}

async function fetchPic(workbookName: string, picFilename: string): Promise<string> {
    const res = await fetch(
        `/v1/workbooks/get-pic?workbookName=${encodeURIComponent(workbookName)}&picFilename=${encodeURIComponent(picFilename)}`,
        { credentials: 'include' }
    )
    const data = await res.json()
    return data.encodedImage as string
}

export async function refresh(workbook: WorkbookType): Promise<WorkbookType> {
    const updatedPics = await Promise.all(
        workbook.pics.map(async (pic): Promise<PicType> => {
            if (pic.mimeType === '') return pic
            if (pic.encodedImage !== '') return pic

            const key = cacheKey(workbook.workbookName, pic)
            const cached = await get<string>(key)
            if (cached) {
                return { ...pic, encodedImage: cached }
            }

            const encodedImage = await fetchPic(workbook.workbookName, pic.filename)
            await set(key, encodedImage)
            return { ...pic, encodedImage }
        })
    )
    return { ...workbook, pics: updatedPics }
}
