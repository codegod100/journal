<script>
	export let data;
	import Editor from "@tinymce/tinymce-svelte";
	import { PUBLIC_CLIENT_ID } from "$env/static/public";
	let conf = {
		plugins: "advlist lists link",
		toolbar:
			"undo redo link linkchecker autolink | styleselect | bold italic | alignleft" +
			"aligncenter alignright alignjustify | " +
			"bullist numlist link image",
		promotion: false,
		branding: false,
		menubar: false,
	};
</script>

<a
	href="https://github.com/login/oauth/authorize?client_id={PUBLIC_CLIENT_ID}&redirect_uri=http://{data.host}"
	>Login with GitHub</a
>
{data.code}

<form method="POST" action="?/submit">
	<div>
		{data.day}
	</div>
	<Editor scriptSrc="tinymce/tinymce.min.js" bind:value={data.body} {conf} />
	<!-- <textarea
		cols="60"
		rows="10"
		name="body"
		value={data.body}
		placeholder="body"
	/> -->
	<input type="hidden" name="body" value={data.body} />
	<input type="submit" />
</form>
