import { WorkbookType } from '@billdestein/lucy-common'
import { refresh } from './cache'

// Return a copy of the workbook with every PicType's encodedImage emptied. Call before
// sending a workbook to any backend endpoint.
export function stripForBackend(workbook: WorkbookType): WorkbookType {
    return {
        ...workbook,
        pics: workbook.pics.map((p) => ({ ...p, encodedImage: '' })),
    }
}

// Populate encodedImage for every PicType from the cache (or backend). Call after receiving
// a workbook from any backend endpoint.
export function hydrateFromBackend(workbook: WorkbookType): Promise<WorkbookType> {
    return refresh(workbook)
}
