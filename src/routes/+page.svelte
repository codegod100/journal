<script>
  export let data;
  import Editor from "@tinymce/tinymce-svelte";
  import { PUBLIC_CLIENT_ID } from "$env/static/public";
  let conf = {
    plugins: "advlist lists link autolink codesample",
    toolbar: "link bullist numlist indent outdent  bold italic",
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
      <h3>
        {data.day}

        UTC
      </h3>
      (for simplicity gets date from server before render)
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
