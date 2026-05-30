import * as os from 'os'

// MOUNT_DIR may begin with ~. Tilde is not expanded when bash assigns environment variables
// from jq output, so the backend must expand it explicitly: replace a leading ~ with
// os.homedir() before constructing any file path.
function expandTilde(p: string): string {
    if (p.startsWith('~')) return os.homedir() + p.slice(1)
    return p
}

function reqEnv(name: string): string {
    const v = process.env[name]
    if (v === undefined || v === '') {
        throw new Error(`Missing required environment variable ${name}`)
    }
    return v
}

export const config = {
    cognitoClientId: reqEnv('COGNITO_CLIENT_ID'),
    cognitoRegion: reqEnv('COGNITO_REGION'),
    cognitoUserPoolId: reqEnv('COGNITO_USER_POOL_ID'),
    googleApiKey: reqEnv('GOOGLE_API_KEY'),
    mountDir: expandTilde(reqEnv('MOUNT_DIR')),
    origin: reqEnv('ORIGIN'),
    redisHost: reqEnv('REDIS_HOST'),
    redisPort: parseInt(reqEnv('REDIS_PORT'), 10),
}

// ElastiCache Serverless requires TLS; local Redis does not support it.
export const isLocalRedis = config.redisHost === 'localhost' || config.redisHost === '127.0.0.1'

// Cookies must be marked secure only when served over https (production behind the ALB).
export const isHttps = config.origin.startsWith('https')
