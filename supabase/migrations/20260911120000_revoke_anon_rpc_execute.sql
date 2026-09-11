-- Supabase grants EXECUTE to anon/authenticated explicitly in many projects.
-- Revoking PUBLIC alone does not remove an explicit anon grant. Keep the
-- authenticated grants already defined by the earlier migrations, but do not
-- expose security-definer routines to unauthenticated callers.
do $$
declare
  routine record;
begin
  for routine in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon',
      routine.signature
    );
  end loop;
end;
$$;
