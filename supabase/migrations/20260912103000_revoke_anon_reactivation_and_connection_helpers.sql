-- Explicitly remove legacy anon grants. Revoking from PUBLIC does not remove
-- an explicit grant that an earlier migration made directly to anon.
revoke execute on function public.worker_can_view_employer_profile(uuid) from anon;
revoke execute on function public.employer_can_view_worker_profile(uuid) from anon;
revoke execute on function public.bc_request_worker_reactivation(text) from anon;
revoke execute on function public.bc_approve_worker_reactivation(uuid) from anon;
revoke execute on function public.bc_decline_worker_reactivation(uuid, text) from anon;
