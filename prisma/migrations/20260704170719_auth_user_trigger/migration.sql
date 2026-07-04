-- Mirror every Supabase auth user into the public."User" profile table.
-- Guarded so it is a no-op on a plain Postgres (local Docker) with no auth schema.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public."User" (id, email, name, role, "createdAt", "updatedAt")
  values (
    new.id::text,
    new.email,
    new.raw_user_meta_data ->> 'name',
    'TOURIST',
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if to_regclass('auth.users') is not null then
    execute 'drop trigger if exists on_auth_user_created on auth.users';
    execute 'create trigger on_auth_user_created after insert on auth.users '
         || 'for each row execute function public.handle_new_user()';
  end if;
end
$$;
