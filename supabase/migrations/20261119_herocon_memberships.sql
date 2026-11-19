-- Herocon £9.99 membership entitlement scaffold.
-- Deploy only to the merchant-owned Supabase project after connecting it.
-- The account itself is FREE. This table stores paid access to new purchasing,
-- not permissions to access existing purchases or shipping invoices.
create table if not exists public.herocon_memberships (
 user_id uuid primary key references auth.users(id) on delete cascade,
 stripe_customer_id text unique,
 stripe_subscription_id text unique,
 stripe_price_id text,
 subscription_status text not null default 'inactive'
  check (subscription_status in ('inactive','active','trialing','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')),
 current_period_end timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.herocon_memberships enable row level security;

-- RLS: customers may see only their own entitlement. They may NEVER insert,
-- alter, or grant themselves a subscription; Stripe webhooks running as
-- server-only service role will update the table after verification.
drop policy if exists "Customer can read own Herocon membership" on public.herocon_memberships;
create policy "Customer can read own Herocon membership"
 on public.herocon_memberships for select to authenticated
 using ((select auth.uid())=user_id);
revoke all on public.herocon_memberships from anon;
revoke insert,update,delete on public.herocon_memberships from authenticated;
grant select on public.herocon_memberships to authenticated;
