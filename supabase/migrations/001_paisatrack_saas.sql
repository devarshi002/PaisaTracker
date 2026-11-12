-- PaisaTrack SaaS schema
-- Run this migration in Supabase SQL Editor or with Supabase CLI.
-- Roles: owner, editor, viewer. Each user has a private personal wallet.
-- Shared wallets are accessible only to their active members.

create extension if not exists pgcrypto;

create type public.wallet_kind as enum ('personal', 'group');
create type public.wallet_role as enum ('owner', 'editor', 'viewer');
create type public.transaction_kind as enum ('income', 'expense');
create type public.subscription_state as enum ('trialing', 'pending_payment', 'active', 'past_due', 'cancelled', 'expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.wallet_kind not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_wallet_has_no_invite check (kind <> 'personal' or invite_code is null)
);

create table public.wallet_members (
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.wallet_role not null default 'viewer',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (wallet_id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  kind public.transaction_kind not null,
  title text not null check (char_length(title) between 1 and 120),
  category text not null default 'Other',
  amount numeric(12,2) not null check (amount > 0),
  transaction_date date not null default current_date,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_wallet_date_idx on public.transactions(wallet_id, transaction_date desc);
create index wallet_members_user_idx on public.wallet_members(user_id) where is_active = true;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_code text not null default 'individual_monthly',
  amount_paise integer not null default 10000 check (amount_paise = 10000),
  currency text not null default 'INR' check (currency = 'INR'),
  interval_unit text not null default 'month' check (interval_unit = 'month'),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '15 days'),
  status public.subscription_state not null default 'trialing',
  auto_renew_consent_at timestamptz,
  consent_terms_version text,
  provider text,
  provider_customer_id text,
  provider_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  provider_event_id text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

-- Security-definer helpers prevent recursive RLS checks on wallet_members.
create or replace function public.is_wallet_member(p_wallet_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.wallet_members wm
    where wm.wallet_id = p_wallet_id
      and wm.user_id = auth.uid()
      and wm.is_active = true
  );
$$;

create or replace function public.wallet_role_for(p_wallet_id uuid)
returns public.wallet_role
language sql stable security definer
set search_path = public
as $$
  select wm.role from public.wallet_members wm
  where wm.wallet_id = p_wallet_id
    and wm.user_id = auth.uid()
    and wm.is_active = true
  limit 1;
$$;

create or replace function public.can_write_wallet(p_wallet_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.wallet_role_for(p_wallet_id) in ('owner', 'editor'), false);
$$;

revoke all on function public.is_wallet_member(uuid) from public;
revoke all on function public.wallet_role_for(uuid) from public;
revoke all on function public.can_write_wallet(uuid) from public;
grant execute on function public.is_wallet_member(uuid) to authenticated;
grant execute on function public.wallet_role_for(uuid) to authenticated;
grant execute on function public.can_write_wallet(uuid) to authenticated;

-- On signup: create profile, personal wallet, owner membership and 15-day trial.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  new_wallet_id uuid;
  chosen_name text;
begin
  chosen_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'PaisaTrack user');

  insert into public.profiles(id, display_name)
  values (new.id, chosen_name)
  on conflict (id) do nothing;

  insert into public.wallets(name, kind, owner_id)
  values ('My Personal Wallet', 'personal', new.id)
  returning id into new_wallet_id;

  insert into public.wallet_members(wallet_id, user_id, role)
  values (new_wallet_id, new.id, 'owner');

  insert into public.subscriptions(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_paisatrack on auth.users;
create trigger on_auth_user_created_paisatrack
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Create a shared wallet. The caller becomes its owner.
create or replace function public.create_group_wallet(p_name text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  new_id uuid;
  invite text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 60 then
    raise exception 'Group name must be between 2 and 60 characters';
  end if;

  invite := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10));
  insert into public.wallets(name, kind, owner_id, invite_code)
  values (trim(p_name), 'group', auth.uid(), invite)
  returning id into new_id;

  insert into public.wallet_members(wallet_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

grant execute on function public.create_group_wallet(text) to authenticated;

-- Join using a group invite code. Membership is always viewer initially.
create or replace function public.join_group_wallet(p_invite_code text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  target_wallet_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select id into target_wallet_id
  from public.wallets
  where kind = 'group' and invite_code = upper(trim(p_invite_code));

  if target_wallet_id is null then raise exception 'Invalid invite code'; end if;

  insert into public.wallet_members(wallet_id, user_id, role, is_active)
  values (target_wallet_id, auth.uid(), 'viewer', true)
  on conflict (wallet_id, user_id)
  do update set is_active = true, role = 'viewer';

  return target_wallet_id;
end;
$$;

grant execute on function public.join_group_wallet(text) to authenticated;

-- Explicit opt-in audit. This records consent but does NOT charge the user.
-- A payment provider mandate must be confirmed server-side before status becomes active.
create or replace function public.record_auto_renew_consent(p_terms_version text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_terms_version is null or char_length(trim(p_terms_version)) < 1 then
    raise exception 'Terms version is required';
  end if;

  update public.subscriptions
  set auto_renew_consent_at = now(),
      consent_terms_version = trim(p_terms_version),
      status = case when status = 'expired' then 'pending_payment'::public.subscription_state else status end,
      updated_at = now()
  where user_id = auth.uid();

  if not found then raise exception 'Subscription record not found'; end if;
end;
$$;

grant execute on function public.record_auto_renew_consent(text) to authenticated;

-- Users can cancel future renewal. A provider cancellation should also be sent
-- from a trusted server/Edge Function; this RPC only records the user's request.
create or replace function public.request_subscription_cancellation()
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.subscriptions
  set cancel_at_period_end = true, cancelled_at = now(), updated_at = now()
  where user_id = auth.uid();
end;
$$;

grant execute on function public.request_subscription_cancellation() to authenticated;

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_members enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;

-- Profiles: users may read/update only their own profile.
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Wallets: members can see a wallet. Only owner can update/delete.
create policy "wallets_select_member" on public.wallets for select to authenticated using (public.is_wallet_member(id));
create policy "wallets_update_owner" on public.wallets for update to authenticated using (owner_id = auth.uid() and public.is_wallet_member(id)) with check (owner_id = auth.uid());
create policy "wallets_delete_owner" on public.wallets for delete to authenticated using (owner_id = auth.uid() and kind = 'group');

-- Memberships: members can see the member list. Only owner can change membership/roles.
create policy "members_select_same_wallet" on public.wallet_members for select to authenticated using (public.is_wallet_member(wallet_id));
create policy "members_insert_owner" on public.wallet_members for insert to authenticated
with check (
  exists (select 1 from public.wallets w where w.id = wallet_id and w.owner_id = auth.uid() and w.kind = 'group')
  and user_id <> auth.uid()
  and role in ('editor', 'viewer')
);
create policy "members_update_owner" on public.wallet_members for update to authenticated
using (exists (select 1 from public.wallets w where w.id = wallet_id and w.owner_id = auth.uid()))
with check (exists (select 1 from public.wallets w where w.id = wallet_id and w.owner_id = auth.uid()));
create policy "members_delete_owner_or_self" on public.wallet_members for delete to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.wallets w where w.id = wallet_id and w.owner_id = auth.uid())
);

-- Transactions: all active members may read; owner/editor may write.
create policy "transactions_select_member" on public.transactions for select to authenticated using (public.is_wallet_member(wallet_id));
create policy "transactions_insert_writer" on public.transactions for insert to authenticated
with check (created_by = auth.uid() and public.can_write_wallet(wallet_id));
create policy "transactions_update_writer" on public.transactions for update to authenticated
using (public.can_write_wallet(wallet_id))
with check (public.can_write_wallet(wallet_id));
create policy "transactions_delete_writer" on public.transactions for delete to authenticated
using (public.can_write_wallet(wallet_id));

-- Subscription records: users can read their own row. No client-side updates.
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using (user_id = auth.uid());

-- Billing events are server-only (service role bypasses RLS).


-- Entitlement check: a trial is valid for exactly 15 days. After that,
-- access requires a provider-confirmed active subscription period.
create or replace function public.has_subscription_access()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = auth.uid()
      and (
        (s.status = 'trialing' and now() < s.trial_ends_at)
        or
        (s.status = 'active' and s.current_period_end is not null and now() < s.current_period_end)
        or
        (s.status = 'cancelled' and s.current_period_end is not null and now() < s.current_period_end)
      )
  );
$$;

revoke all on function public.has_subscription_access() from public;
grant execute on function public.has_subscription_access() to authenticated;

