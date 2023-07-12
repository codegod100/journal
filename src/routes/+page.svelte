<script>
	export let data;
	import Editor from "@tinymce/tinymce-svelte";
	import { PUBLIC_CLIENT_ID, PUBLIC_APP_NAME } from "$env/static/public";
	let conf = {
		plugins: "advlist lists link",
		toolbar:
			"undo redo link indent outdent | bold italic | alignleft" +
			"aligncenter alignright alignjustify " +
			"bullist numlist ",
		promotion: false,
		branding: false,
		menubar: false,
	};
</script>

{#if !data.access_token}
	<a
		href="https://github.com/login/oauth/authorize?client_id={PUBLIC_CLIENT_ID}&scope=repo"
		>Login with GitHub</a
	>
{:else}
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
{/if}
