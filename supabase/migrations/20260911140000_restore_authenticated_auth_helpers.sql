-- These helpers are used by authenticated RLS policies and security-definer
-- triggers. The preceding anonymous ACL hardening removed their inherited
-- PUBLIC EXECUTE privilege, so retain the intended authenticated access.
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.is_service_role() to authenticated, service_role;
