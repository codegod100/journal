<script>
	export let data;
	import Editor from "@tinymce/tinymce-svelte";
	import { onMount, tick } from "svelte";
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

	let jwt = data.jwt;

	function handleCredentialResponse(response) {
		console.log("Encoded JWT ID token: " + response.credential);
		jwt = response.credential;
	}

	onMount(async () => {
		// await tick();
		google.accounts.id.initialize({
			client_id: PUBLIC_CLIENT_ID,
			callback: handleCredentialResponse,
		});

		google.accounts.id.renderButton(
			document.getElementById("google"),
			{ theme: "outline", size: "large" } // customization attributes
		);

		// google.accounts.id.prompt(); // also display the One Tap dialog
	});
</script>

<svelte:head>
	<script src="https://accounts.google.com/gsi/client" async defer></script>
</svelte:head>

{#if !jwt}
	<div id="google" />
{:else}
	<form method="POST">
		<div>
			{data.day}
			{#if data.sub}
				| Git clone url: {globalThis.location}git/{data.sub}/.git
			{/if}
		</div>
		<Editor scriptSrc="tinymce/tinymce.min.js" bind:value={data.body} {conf} />
		<!-- <textarea
		cols="60"
		rows="10"
		name="body"
		value={data.body}
		placeholder="body"
	/> -->
		<input type="hidden" name="jwt" value={jwt} />
		<input type="hidden" name="body" value={data.body} />
		<input type="submit" />
	</form>
{/if}
