import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)
import turndown from "turndown"
import { PUBLIC_CLIENT_ID } from "$env/static/public"
import { CLIENT_SECRET, npm_config_resolution_mode } from "$env/static/private"
import { Octokit } from "@octokit/core";
import showdown from "showdown"
const converter = new showdown.Converter();

function utoa(str) {
	return btoa(unescape(encodeURIComponent(str)));
}
// Decode
function atou(str) {
	return decodeURIComponent(escape(atob(str)));
}


const day = () => dayjs.utc().format("YYYY-MM-DD")
const filepath = () => day() + ".html"
const markdownPath = () => day() + ".md"
const turndownService = new turndown()



const writeFile = async ({ token, path, content }) => {
	const octokit = new Octokit({
		auth: token
	})

	let user = await octokit.request('GET /user', {
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})

	let owner = user.data.login

	let sha = ""

	try {
		let resp = await octokit.request(`GET /repos/${owner}/daily/contents/${path}`, {
			owner,
			repo: 'daily',
			path,
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})
		sha = resp.data.sha

	} catch (e) { console.error("couldn't get file", path) }
	console.log(sha, path)
	await octokit.request(`PUT /repos/${owner}/daily/contents/${path}`, {
		owner,
		repo: 'daily',
		path,
		message: 'updating journal entry',
		content: utoa(content),
		sha,
		headers: {
			'X-GitHub-Api-Version': '2022-11-28'
		}
	})




}

export const actions = {

	submit: async ({ request, cookies }) => {
		const data = await request.formData()
		let body = data.get("body")
		let token = cookies.get("access_token")

		const markdown = turndownService.turndown(body)
		try {
			await writeFile({ token, path: markdownPath(), content: markdown })

		} catch (e) { console.log(e.message) }

	}
}

const exchange = async ({ code, refresh }) => {
	let form = new FormData()
	form.set("client_id", PUBLIC_CLIENT_ID)
	form.set("client_secret", CLIENT_SECRET)
	if (code) {
		form.set("code", code)

	}
	if (refresh) {
		form.set("grant_type", "refresh_token")
		form.set("refresh_token", refresh)
	}

	const resp = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: {
			Accept: "application/json"
		},
		body: form
	})

	return resp.json()

}



export async function load({ params, url, cookies }) {
	let host = url.host
	let code = url.searchParams.get("code")
	let access_token = cookies.get("access_token")
	if (code && !access_token) {
		let token = await exchange({ code })
		console.log({ token })
		if (token.error) {
			return { host }
		}
		access_token = token.access_token
		cookies.set("access_token", token.access_token)
	} else {
		if (!access_token) { return {} }
	}


	const octokit = new Octokit({
		auth: access_token
	})


	try {
		let resp = await octokit.request('POST /user/repos', {
			name: 'daily',
			description: 'Daily journal entries',
			homepage: 'https://journal.vera.pink',
			'private': false,

		})

	} catch (e) { console.error("create repo", e.message) }


	let body = ""
	try {
		let user = await octokit.request('GET /user', {
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})
		console.log({ user })

		let owner = user.data.login


		let content = await octokit.request(`GET /repos/${owner}/daily/contents/${markdownPath()}`, {
			owner,
			repo: 'daily',
			path: filepath(),
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})
		body = converter.makeHtml(atou(content.data.content))

	} catch (e) {
		console.error("submit data", e.message)
		return { host, access_token, day: day() }
	}



	return { day: day(), body, code, host, access_token }
}