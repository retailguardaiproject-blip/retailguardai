# Casewise Summary Studio

Your approach is right: an HTTP Request node (POST) after the summary node, sending to an endpoint on the Lovable side. The trick is that Lovable needs something to receive the data. There are two common patterns.

**Option 1: Push (what you're doing)**

1. In Lovable, ask it to create a backend endpoint that accepts a POST with JSON. This is usually a Supabase Edge Function, since Lovable apps use Supabase. The function validates a secret header and stores the data in a Supabase table.

2. The dashboard reads from that table, so it stays current without extra work.

3. In n8n, configure the HTTP Request node:

   - **Method:** POST

   - **URL:** the Edge Function URL Lovable gives you

   - **Authentication:** Generic Credential Type, then Header Auth (for example `x-api-key: <shared secret>`). Use a secret you invent and store in both places. This is not an n8n API key.

   - **Send Body:** on, **Body Content Type:** JSON, and map the summary node's output (for example `{{ $json }}`).

**Option 2: Pull (often simpler and more robust)**

Add a **Webhook** node in n8n with Header Auth, and have the Respond to Webhook node return the summary JSON. The Lovable app calls that URL when the dashboard loads. The downside is that the workflow runs on every request, which can be slow if the analysis is heavy.

**Recommendation:** use Option 1 if the dashboard should show stored or historical results. Use Option 2 for a quick, on-demand view.

Some things to watch for:

- Lovable's preview and published apps may have CORS limits on browser-to-n8n calls. This is why the n8n-to-Edge-Function direction (Option 1) is safer.

- Never put the secret in the front-end code.

If you share the Edge Function URL and the shape of your summary JSON, I can configure the HTTP Request node in your workflow.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://casewise-summary-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/57abe9f6-dda3-4ea8-912a-1bec464f53fb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
