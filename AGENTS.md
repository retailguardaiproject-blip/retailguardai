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
- Dashboard data comes only from n8n via `src/services/n8nApi.ts` + `useDashboardData` (sample data when no feed URL is set); keeps one swap point for the data flow.
- Data hook renders only after mount to avoid SSR hydration mismatches, since data is fetched client-side.
- Store coordinates live in `src/lib/filters.tsx` because n8n rows carry no location fields.
