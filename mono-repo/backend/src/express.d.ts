import { UserType } from '@billdestein/lucy-common'

declare global {
    namespace Express {
        interface Request {
            user?: UserType
        }
    }
}

export {}
