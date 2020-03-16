import { readFileSync as readFile } from 'fs'
import { join } from 'path'

export const GITHUB_API_TOKEN = readFile(join(__dirname, '../protected/github-api-token.txt')).toString().trim()

export const FIREBASE_ADMIN_KEY_PATH = join(__dirname, `../protected/firebase-admin.json`)
export const DEFAULT_STORAGE_BUCKET = `memorize-ai.appspot.com`

export const REPOSITORIES_PATH = join(__dirname, '../products/repositories.json')
export const USERS_PATH = join(__dirname, '../products/users.json')

export const API_RATE_LIMIT_DELAY = 1000 * 60 * 61

export const DEFAULT_TIME_ZONE = 'America/Los_Angeles'
