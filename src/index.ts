import { writeFileSync as writeFile } from 'fs'
import { join } from 'path'
import axios from 'axios'
import * as chalk from 'chalk'

import { GITHUB_API_TOKEN } from './constants'

interface Repository {
	loaded: boolean
	stargazers: string[]
}

interface User {
	email: string
	sent: boolean
}

const repositories: Record<string, Repository> = require('../products/repositories.json')
const users: Record<string, User | null> = require('../products/users.json')

const saveRepositories = () =>
	writeFile(join(__dirname, '../products/repositories.json'), JSON.stringify(repositories))

const saveUsers = () =>
	writeFile(join(__dirname, '../products/users.json'), JSON.stringify(users))

const getData = async (url: string) => {
	const response = await axios.get(url, {
		headers: {
			Authorization: `token ${GITHUB_API_TOKEN}`
		}
	})
	
	return response.data
}

const getStargazerLoginsFromRepository = async (id: string, repository: Repository) => {
	if (repository.loaded)
		return repository.stargazers
	
	const stargazers: string[] = []
	
	for (let page = 1;; page++)
		try {
			process.stdout.write(chalk.yellow.bold(`Loading stargazers for repository ${id} on page ${page}...`))
			
			const chunk = await getData(`https://api.github.com/repos/${id}/stargazers?page=${page}`)
			
			if (!chunk.length)
				break
			
			stargazers.push(...chunk.map(({ login }: { login: string }) => login))
			console.log(chalk.green.bold(' DONE'))
		} catch (error) {
			console.log(chalk.red.bold(` ERROR: ${error.toString()}`))
			break
		}
	
	repository.loaded = true
	repository.stargazers = stargazers
	saveRepositories()
	
	return stargazers
}

const getEmailsFromLogins = async (logins: string[], repository: Repository) => {
	for (const login of logins)
		try {
			if (users[login] !== undefined)
				continue
			
			process.stdout.write(chalk.yellow.bold(`Loading email for user ${login}...`))
			
			const events = await getData(`https://api.github.com/users/${login}/events`)
			
			const match = JSON.stringify(events).match(/"email":"(.+?)"/)
			const email = match && match[1]
			
			if (!(typeof email === 'string' && /.+?@.+\..+/.test(email))) {
				users[login] = null
				saveUsers()
				
				console.log(chalk.red.bold(` ERROR: Unable to find their email in their events`))
				continue
			}
			
			if (/^github@/i.test(email) || /github\.com$/i.test(email)) {
				users[login] = null
				saveUsers()
				
				console.log(chalk.blue.bold(' ERROR: Their email appears to be owned by GitHub'))
				continue
			}
			
			users[login] = { email, sent: false }
			saveUsers()
			
			console.log(chalk.green.bold(` DONE: ${email}`))
		} catch (error) {
			if (error.code === 404) {
				console.log(chalk.red.bold(` ERROR: This user does not exist`))
				
				repository.stargazers = repository.stargazers.filter(otherLogin => otherLogin !== login)
				saveRepositories()
				
				continue
			}
			
			throw error
		}
}

const sleep = (duration: number): Promise<void> =>
	new Promise(resolve => setTimeout(resolve, duration))

const main = async (): Promise<void> => {
	try {
		for (const [id, repository] of Object.entries(repositories))
			await getEmailsFromLogins(
				await getStargazerLoginsFromRepository(id, repository),
				repository
			)
	} catch (error) {
		console.log(chalk.red.bold(` ERROR: ${error.message}`))
		
		if (error.code === 403) {
			console.log(chalk.cyan.bold(
				'RETRYING (1 hour): The rate limit was reached. 1 hour remaining (with an extra minute to guarantee the rate limit was reloaded).'
			))
			await sleep(1000 * 60 * 61)
		} else
			console.log(chalk.cyan.bold(
				'RETRYING (now): An unknown error occurred.'
			))
		
		return main()
	}
}

if (require.main === module)
	main()
