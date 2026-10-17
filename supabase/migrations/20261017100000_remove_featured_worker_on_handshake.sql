create or replace function public.remove_featured_worker_after_handshake()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.beauty_connect_internal', 'on', true);

  update public.worker_profiles
  set featured_rank = null
  where id = new.worker_profile_id
    and featured_rank is not null;

  return new;
end;
$$;

revoke execute on function public.remove_featured_worker_after_handshake() from public;

create trigger remove_featured_worker_after_handshake
after insert on public.handshakes
for each row execute function public.remove_featured_worker_after_handshake();
