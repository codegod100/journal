import dayjs from "dayjs"
import turndown from "turndown"
import { redirect } from "@sveltejs/kit"
import { PUBLIC_CLIENT_ID, PUBLIC_APP_NAME } from "$env/static/public"
import { CLIENT_SECRET } from "$env/static/private"
import { Octokit } from "@octokit/core";

function utoa(str) {
	return btoa(unescape(encodeURIComponent(str)));
}
// Decode
function atou(str) {
	return decodeURIComponent(escape(atob(str)));
}


const day = dayjs().format("YYYY-MM-DD")
const filepath = day + ".html"
const markdownPath = day + ".md"
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
		message: 'my commit message',
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
			await writeFile({ token, path: filepath, content: body })
			await writeFile({ token, path: markdownPath, content: markdown })

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
	let code = url.searchParams.get("code")
	let token = await exchange({ code })
	let host = url.host
	if (token.error) {
		return { host }
	}
	console.log({ token })
	// cookies.set("refresh", token.refresh_token)

	let access_token = cookies.get("access_token")
	const octokit = new Octokit({
		auth: access_token || token.access_token
	})

	// let resp = await octokit.request('GET /user/installations', {
	// 	headers: {
	// 		'X-GitHub-Api-Version': '2022-11-28'
	// 	}
	// })
	// console.log(resp)
	// if (resp.data.total_count == 0) {
	// 	throw redirect(302, `https://github.com/apps/${PUBLIC_APP_NAME}/installations/new?setup_url=http://${url.host}`)
	// }

	try {
		let resp = await octokit.request('POST /user/repos', {
			name: 'daily',
			description: 'Daily journal entries',
			homepage: 'https://journal.vera.pink',
			'private': false,

		})

	} catch (e) { console.error("create repo", e.message) }

	if (code) {
		cookies.set("access_token", token.access_token)

	}
	let body = ""
	try {
		let user = await octokit.request('GET /user', {
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})
		console.log({ user })

		let owner = user.data.login


		let content = await octokit.request(`GET /repos/${owner}/daily/contents/${filepath}`, {
			owner,
			repo: 'daily',
			path: filepath,
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
		})
		body = atou(content.data.content)
	} catch (e) {
		console.error("submit data", e.message)
		return { host }
	}



	return { day, body, code, host, access_token }
}