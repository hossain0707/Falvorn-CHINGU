-- Dedicated CHINGU project only.
begin;
create table public.chingu_memory(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null check(char_length(title) between 1 and 150),content text not null check(char_length(content) between 1 and 24000),created_at timestamptz not null default now());
create index chingu_memory_owner on public.chingu_memory(user_id,created_at desc);
alter table public.chingu_memory enable row level security;
revoke all on public.chingu_memory from public,anon,authenticated;
grant select,insert,delete on public.chingu_memory to authenticated;
create policy memory_read on public.chingu_memory for select to authenticated using ((select auth.uid())=user_id);
create policy memory_write on public.chingu_memory for insert to authenticated with check ((select auth.uid())=user_id);
create policy memory_delete on public.chingu_memory for delete to authenticated using ((select auth.uid())=user_id);
create table public.chingu_quota(bucket text primary key,used integer not null check(used>=0));
alter table public.chingu_quota enable row level security;
revoke all on public.chingu_quota from public,anon,authenticated;
grant select,insert,update,delete on public.chingu_quota to service_role;
create function public.chingu_reserve_quota(p_units integer,p_daily integer) returns boolean language plpgsql security invoker set search_path='' as $$
declare dk text; mk text; d integer; m integer;
begin
if p_units not between 1 and 3 or p_daily not between 6 and 500 then return false; end if;
perform pg_catalog.pg_advisory_xact_lock(72496801);
dk:='day:'||pg_catalog.to_char(pg_catalog.timezone('UTC',pg_catalog.now()),'YYYY-MM-DD');
mk:='minute:'||pg_catalog.to_char(pg_catalog.timezone('UTC',pg_catalog.now()),'YYYY-MM-DD-HH24-MI');
select used into d from public.chingu_quota where bucket=dk;select used into m from public.chingu_quota where bucket=mk;
if coalesce(d,0)+p_units>p_daily or coalesce(m,0)+p_units>6 then return false;end if;
delete from public.chingu_quota where bucket not in(dk,mk);
insert into public.chingu_quota(bucket,used) values(dk,p_units),(mk,p_units) on conflict(bucket) do update set used=public.chingu_quota.used+excluded.used;
return true;
end;$$;
revoke all on function public.chingu_reserve_quota(integer,integer) from public,anon,authenticated;
grant execute on function public.chingu_reserve_quota(integer,integer) to service_role;
commit;
