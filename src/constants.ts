import { readFileSync as readFile } from 'fs'
import { join } from 'path'

export const GITHUB_API_TOKEN = readFile(join(__dirname, '../protected/github-api-token.txt')).toString().trim()
