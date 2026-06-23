import os from 'os'
import path from 'path'

// MOUNT_DIR may begin with ~. Tilde is not expanded when bash assigns environment variables
// from jq output, so we expand it explicitly here.
function expandTilde(p: string): string {
    if (p === '~') return os.homedir()
    if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2))
    return p
}

export const config = {
    cognitoClientId: process.env.COGNITO_CLIENT_ID || '',
    cognitoRegion: process.env.COGNITO_REGION || '',
    cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
    // EXPRESS_PORT is optional; default to 8080 when absent or empty.
    expressPort: parseInt(process.env.EXPRESS_PORT || '8080', 10),
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    mountDir: expandTilde(process.env.MOUNT_DIR || ''),
    origin: process.env.ORIGIN || '',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
}
