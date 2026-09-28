-- Fix the campaign delivery claim function's PL/pgSQL output-column ambiguity.
-- The function returns a column named campaign_id, so the stale-delivery query
-- must qualify the source column explicitly.

create or replace function public.bc_claim_push_campaign_deliveries(
  p_limit integer default 50
)
returns table(delivery_id uuid, campaign_id uuid, profile_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  stale_delivery record;
begin
  if not public.is_service_role() then
    raise exception 'Service authorization is required.';
  end if;

  update public.push_campaigns
  set status = 'active'
  where status = 'scheduled'
    and starts_at <= now()
    and ends_at > now();

  update public.push_campaigns
  set status = 'completed'
  where status in ('scheduled', 'active', 'paused')
    and ends_at <= now();

  -- A process that died while holding a claim is terminally failed. It is not
  -- retried automatically because the external push provider may have already
  -- accepted the request before the process stopped.
  for stale_delivery in
    select stale.id, stale.campaign_id
    from public.push_campaign_deliveries as stale
    where stale.status = 'processing'
      and stale.claimed_at < now() - interval '30 minutes'
    for update skip locked
  loop
    update public.push_campaign_deliveries
    set status = 'failed',
        last_error = 'Scheduler claim expired before the delivery was finalized.'
    where id = stale_delivery.id
      and status = 'processing';

    update public.push_campaigns
    set failed_count = failed_count + 1
    where id = stale_delivery.campaign_id;
  end loop;

  return query
  with due as (
    select delivery.id
    from public.push_campaign_deliveries as delivery
    join public.push_campaigns as campaign on campaign.id = delivery.campaign_id
    where campaign.status = 'active'
      and delivery.status = 'pending'
      and delivery.scheduled_for <= now()
    order by delivery.scheduled_for, delivery.id
    limit greatest(1, least(coalesce(p_limit, 50), 200))
    for update of delivery skip locked
  )
  update public.push_campaign_deliveries as delivery
  set status = 'processing',
      attempt_count = delivery.attempt_count + 1,
      claimed_at = now(),
      last_error = null
  from due, public.push_campaign_recipients as recipient
  where delivery.id = due.id
    and recipient.id = delivery.recipient_id
  returning delivery.id, delivery.campaign_id, recipient.profile_id;
end;
$$;

revoke all on function public.bc_claim_push_campaign_deliveries(integer)
from public, anon, authenticated;
grant execute on function public.bc_claim_push_campaign_deliveries(integer)
to service_role;
