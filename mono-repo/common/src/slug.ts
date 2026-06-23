// A user is identified by a slug of its email address. The slug is also the name of the
// user's root directory, so it must be perfectly reversible: a directory listing can be
// converted back to email addresses without any separate lookup table.
//
// Every character outside [a-z0-9.-] is encoded as ~XX (two lowercase hex digits). Because
// ~ itself is outside that set, it encodes as ~7e, making the encoding unambiguous for any
// input including emails that contain a literal ~.
//
// Examples:
//   billdestein@gmail.com   ->  billdestein~40gmail.com
//   bill+filter@gmail.com   ->  bill~2bfilter~40gmail.com
//   bill_destein@gmail.com  ->  bill~5fdestein~40gmail.com

export function slugFromEmail(email: string): string {
    return email.toLowerCase()
        .replace(/[^a-z0-9.-]/g, c => '~' + c.charCodeAt(0).toString(16).padStart(2, '0'))
}

export function emailFromSlug(slug: string): string {
    return slug.replace(/~([0-9a-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}
