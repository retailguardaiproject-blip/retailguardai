<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Live case data is fetched from n8n only through authenticated server functions; disconnected users receive spreadsheet samples, and live failures never silently substitute samples.
- Store connection settings per user with owner-scoped RLS, and store AES-GCM encrypted credentials in a service-only table so browser reads cannot expose them.
- Only HTTPS production webhooks on n8n Cloud are accepted, with redirects disabled, bounded responses, timeouts, and validated case fields, to prevent credential forwarding and unsafe server fetches.
- Data hook renders only after mount to avoid SSR hydration mismatches, since data is fetched client-side.
- Store coordinates live in `src/lib/filters.tsx` because n8n rows carry no location fields.
