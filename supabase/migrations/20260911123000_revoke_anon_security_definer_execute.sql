-- Remove explicit anonymous EXECUTE grants from every public
-- security-definer routine. Existing authenticated/service-role grants are
-- intentionally preserved.
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
