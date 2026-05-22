//----------------------------------------------------------------------------------------------------
// common
//----------------------------------------------------------------------------------------------------
export const common = `

The common repo is used by both the frontend and backend repos.  It defines the types below in the common repo.

The package name for the common repo is @billdestein/joy-common

A user is identified by a slug of its email address.
The slug is also the name of the user's root directory.

The slug functions are specified as exact TypeScript below — do not paraphrase or
reinterpret them. The slug is persisted as a directory name on disk, and must be
perfectly reversible so that a directory listing can be converted back to email
addresses without any separate lookup table. If the algorithm drifts across code
generations, existing user directories become unreachable.

Every character outside [a-z0-9.-] is encoded as ~XX (two lowercase hex digits).
Because ~ itself is outside that set, it encodes as ~7e, making the encoding
unambiguous for any input including emails that contain a literal ~.

export function slugFromEmail(email: string): string {
    return email.toLowerCase()
        .replace(/[^a-z0-9.-]/g, c => '~' + c.charCodeAt(0).toString(16).padStart(2, '0'))
}

export function emailFromSlug(slug: string): string {
    return slug.replace(/~([0-9a-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

Examples:
  billdestein@gmail.com   →  billdestein~40gmail.com
  bill+filter@gmail.com   →  bill~2bfilter~40gmail.com
  bill_destein@gmail.com  →  bill~5fdestein~40gmail.com

export type UserType = {
    email: string,
    slug: string,
}

Refer to the Cache design for details on encodedImage.

export type PicType = {
    createdAt: number
    encodedImage: string
    filename: string
    mimeType: string
}

The PromptType holds a single Gemini prompt.  In the UI, only a single prompt is visible 
at a time, and the 'focused' field indicates which prompt.  It's okay to have that in a common data type.

export type PromptType = {
  createdAt: number
  focused: boolean
  text: string
}

The WorkbookType has many pics and prompts.  WorkbookName is use as the the directory basename.

export type WorkbookType = {
    createdAt: number
    focusedPicFilename: string
    pics: PicType[]
    prompts: PromptType[]
    workbookName: string
}

`
