import fs from "fs"
import git from "isomorphic-git"
import { execSync } from "child_process"
import dayjs from "dayjs"
import turndown from "turndown"
import { OAuth2Client } from "google-auth-library"
import { PUBLIC_CLIENT_ID } from "$env/static/public"
const client = new OAuth2Client(PUBLIC_CLIENT_ID);


const day = dayjs().format("YYYY-MM-DD")
const filepath = day + ".html"
const markdownPath = day + ".md"
const turndownService = new turndown()

const verify = async (jwt) => {
	const ticket = await client.verifyIdToken({
		idToken: jwt,
		audience: PUBLIC_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
		// Or, if multiple clients access the backend:
		//[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
	});
	const payload = ticket.getPayload();
	let sub = payload["sub"]
	return sub
}

export const actions = {
	verify: async ({ request, cookies }) => {
		const data = await request.formData()
		let jwt = data.get("jwt")
		console.log(jwt)
		let sub = await verify(jwt)
		cookies.set("jwt", jwt)
		cookies.set("sub", sub)
	},
	submit: async ({ request, cookies }) => {
		const data = await request.formData()
		let body = data.get("body")
		let sub = cookies.get("sub")
		let jwt = cookies.get("jwt")
		try {
			await verify(jwt)

		} catch (e) {
			console.error(e)
			cookies.delete("jwt")
			return
		}

		let dir = `build/client/git/${sub}`
		await git.init({ fs, dir })
		fs.writeFileSync(`${dir}/${filepath}`, body)
		const markdown = turndownService.turndown(body)
		console.log(markdown)
		fs.writeFileSync(`${dir}/${markdownPath}`, markdown)
		await git.add({ fs, dir, filepath })
		await git.add({ fs, dir, filepath: markdownPath })
		await git.commit({ fs, dir, message: "test", author: { name: "test" } })
		// using "dumb" git protocol, need to do manual setup with git binary
		execSync(`git clone --bare ${dir} ${dir}.git`)
		execSync("git update-server-info", { cwd: `${dir}.git` })
	}
}

export function load({ params, url, cookies }) {
	let body = ""
	let sub = cookies.get("sub")
	let jwt = cookies.get("jwt")
	let dir = `build/client/git/${sub}`
	let host = url.host
	let protocol = url.protocol
	try {
		body = fs.readFileSync(`${dir}/${filepath}`).toString()

	} catch (e) { }
	return { day, body, sub, host, protocol, jwt }
}