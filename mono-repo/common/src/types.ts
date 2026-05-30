export type UserType = {
    email: string
    slug: string
}

// The PicType holds metadata for a single image. When a workbook is sent to or received
// from the backend, encodedImage is an empty string. The workbook internal to the
// WorkbookApplet carries a non-empty encodedImage for each PicType.
export type PicType = {
    createdAt: number
    encodedImage: string
    filename: string
    mimeType: string
}

// The PromptType holds a single Gemini prompt. In the UI, only a single prompt is visible
// at a time, and the 'focused' field indicates which prompt.
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
