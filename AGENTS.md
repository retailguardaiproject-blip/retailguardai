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
- The browser never calls n8n; the Overview reads only the stored n8n summaries, and case-level pages use bundled spreadsheet reference rows.
- Store coordinates live in `src/lib/filters.tsx` because n8n rows carry no location fields.
- n8n pushes summaries to /api/public/receive-summary, verified by an x-api-key shared secret and written only by the server; signed-in users read the latest row.
