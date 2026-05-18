import os from 'os'

function expandTilde(p: string): string {
    return p.startsWith('~') ? os.homedir() + p.slice(1) : p
}

export const config = {
    cognitoRegion: process.env.COGNITO_REGION!,
    cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID!,
    googleApiKey: process.env.GOOGLE_API_KEY!,
    mountDir: expandTilde(process.env.MOUNT_DIR!),
    origin: process.env.ORIGIN!,
    redisHost: process.env.REDIS_HOST!,
    redisPort: parseInt(process.env.REDIS_PORT!, 10),
}
