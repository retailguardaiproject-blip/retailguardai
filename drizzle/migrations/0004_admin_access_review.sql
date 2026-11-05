create or replace function public.admin_list_accounts()
returns table (user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, is_admin boolean, is_viewer boolean)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  return query select u.id, u.email::text, u.created_at, u.last_sign_in_at,
    public.has_role(u.id, 'admin'), public.has_role(u.id, 'viewer')
  from auth.users u order by u.created_at desc;
end $$;

create or replace function public.admin_set_viewer(_user_id uuid, _approved boolean)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  if _approved then
    insert into public.user_roles (user_id, role) values (_user_id, 'viewer') on conflict do nothing;
  else
    delete from public.user_roles where user_id = _user_id and role = 'viewer';
  end if;
end $$;

revoke all on function public.admin_list_accounts() from public, anon;
revoke all on function public.admin_set_viewer(uuid, boolean) from public, anon;
grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_set_viewer(uuid, boolean) to authenticated;