import * as chalk from 'chalk'
import { v4 as uuid } from 'uuid'

import { storage } from './firebase-admin'

import { REPOSITORIES_PATH, USERS_PATH, DEFAULT_TIME_ZONE } from './constants'

export default async () => {
	process.stdout.write(chalk.gray.bold('Backing up...'))
	
	const now = new Date()
		.toLocaleString('en-US', { timeZone: DEFAULT_TIME_ZONE })
		.replace(/[\s\/]+/g, '_')
		.replace(/,/g, '')
	
	await Promise.all([
		storage
			.upload(REPOSITORIES_PATH, {
				destination: `backups/github-repositories-${now}.json`,
				public: false,
				metadata: {
					contentType: 'application/json',
					metadata: {
						firebaseStorageDownloadTokens: uuid()
					}
				}
			}),
		storage
			.upload(USERS_PATH, {
				destination: `backups/github-users-${now}.json`,
				public: false,
				metadata: {
					contentType: 'application/json',
					metadata: {
						firebaseStorageDownloadTokens: uuid()
					}
				}
			})
	])
	
	console.log(chalk.green.bold(' DONE'))
}

if (require.main === module)
	exports.default()
