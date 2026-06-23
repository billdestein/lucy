// Shared data types for Lucy. Used by both the frontend and backend.

export type UserType = {
    email: string
    slug: string
}

// The PicType holds metadata for a single image. When a workbook is sent to or
// received from the backend, encodedImage is an empty string. The WorkbookApplet
// holds a non-empty encodedImage for each PicType internally. See the Cache design.
export type PicType = {
    createdAt: number
    encodedImage: string
    filename: string
    mimeType: string
}

// The PromptType holds a single Gemini prompt. Only a single prompt is visible at a
// time in the UI; the 'focused' field indicates which one.
export type PromptType = {
    createdAt: number
    focused: boolean
    text: string
}

// The WorkbookType has many pics and prompts. workbookName is used as the directory basename.
export type WorkbookType = {
    createdAt: number
    focusedPicFilename: string
    pics: PicType[]
    prompts: PromptType[]
    workbookName: string
}
