import fs from 'fs'
import os from 'os'
import path from 'path'

type Config = {
    COGNITO_CLIENT_ID: string
    COGNITO_REGION: string
    COGNITO_USER_POOL_ID: string
    GOOGLE_API_KEY: string
    MOUNT_DIR: string
    ORIGIN: string
    REDIS_HOST: string
    REDIS_PORT: string
}

function loadConfig(): Config {
    const isMac = process.platform === 'darwin'
    const configPath = isMac
        ? path.join(os.homedir(), 'lucy-config', 'BackendLocalConfig.json')
        : '/mount/lucy-config/BackendProdConfig.json'

    const raw = fs.readFileSync(configPath, 'utf-8')
    const cfg = JSON.parse(raw) as Config

    // Expand leading ~ in MOUNT_DIR since jq output is not shell-expanded
    if (cfg.MOUNT_DIR.startsWith('~')) {
        cfg.MOUNT_DIR = os.homedir() + cfg.MOUNT_DIR.slice(1)
    }

    return cfg
}

export const config = loadConfig()
