import { UserType } from '@billdestein/lucy-common'

// The session middleware attaches the resolved User to req.user. This global augmentation
// makes that typed. The backend tsconfig sets "ts-node": { "files": true } so that this
// standalone .d.ts is loaded when running under ts-node — otherwise tsc --noEmit passes but
// ts-node fails at runtime with "Property 'user' does not exist on type 'Request'".
declare global {
    namespace Express {
        interface Request {
            user?: UserType
        }
    }
}

export {}
