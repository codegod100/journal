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


export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData()
		let body = data.get("body")
		console.log(data.get("jwt"))
		const ticket = await client.verifyIdToken({
			idToken: data.get("jwt"),
			audience: PUBLIC_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
			// Or, if multiple clients access the backend:
			//[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
		});
		const payload = ticket.getPayload();
		console.log(payload)
		let sub = payload["sub"]
		cookies.set("sub", sub)
		let dir = `static/git/${sub}`
		await git.init({ fs, dir })
		fs.writeFileSync(`${dir}/${filepath}`, body)
		const markdown = turndownService.turndown(body)
		console.log(markdown)
		fs.writeFileSync(`${dir}/${markdownPath}`, markdown)
		await git.add({ fs, dir, filepath })
		await git.add({ fs, dir, filepath: markdownPath })
		await git.commit({ fs, dir, message: "test", author: { name: "test" } })
		// using "dumb" git protocol, need to do manual setup with git binary
		execSync("git update-server-info", { cwd: dir })
	}
}

export function load({ params, cookies }) {
	let body = ""
	let sub = cookies.get("sub")
	let dir = `static/git/${sub}`
	try {
		body = fs.readFileSync(`${dir}/${filepath}`).toString()

	} catch (e) { }
	return { day, body, sub }
}