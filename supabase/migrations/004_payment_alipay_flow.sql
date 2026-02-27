begin;

insert into public.plans (code, name, price_cny, duration_days, is_active)
values
  ('monthly', '月度会员', 19, 30, true),
  ('quarterly', '季度会员', 49, 90, true),
  ('yearly', '年度会员', 159, 365, true)
on conflict (code) do update
set
  name = excluded.name,
  price_cny = excluded.price_cny,
  duration_days = excluded.duration_days,
  is_active = excluded.is_active;

alter table public.plans enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'plans' and policyname = 'plans_select_all'
  ) then
    create policy plans_select_all on public.plans
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_select_own'
  ) then
    create policy orders_select_own on public.orders
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'subscriptions' and policyname = 'subscriptions_select_own'
  ) then
    create policy subscriptions_select_own on public.subscriptions
      for select
      using (auth.uid() = user_id);
  end if;
end;
$$;

grant select on public.plans to anon, authenticated;
grant select on public.orders, public.subscriptions to authenticated;

create or replace function public.mark_order_paid(
  p_order_no text,
  p_provider text,
  p_provider_txn_id text,
  p_paid_amount int,
  p_raw_payload jsonb default '{}'::jsonb
)
returns table (
  order_id uuid,
  user_id uuid,
  premium_expires_at timestamptz,
  already_paid boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_duration_days int;
  v_base_end timestamptz;
  v_new_end timestamptz;
begin
  select *
  into v_order
  from public.orders
  where order_no = p_order_no
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.status = 'paid' then
    select coalesce(max(s.end_at), now())
    into v_new_end
    from public.subscriptions s
    where s.user_id = v_order.user_id
      and s.status = 'active';

    return query select v_order.id, v_order.user_id, v_new_end, true;
    return;
  end if;

  if p_paid_amount is null or p_paid_amount <> v_order.amount then
    raise exception 'paid_amount_mismatch';
  end if;

  insert into public.payment_events (
    order_id,
    provider,
    provider_txn_id,
    raw_payload,
    verified
  )
  values (
    v_order.id,
    p_provider,
    p_provider_txn_id,
    coalesce(p_raw_payload, '{}'::jsonb),
    true
  )
  on conflict (provider, provider_txn_id) do nothing;

  update public.orders
  set
    status = 'paid',
    paid_at = now()
  where id = v_order.id;

  select p.duration_days
  into v_duration_days
  from public.plans p
  where p.id = v_order.plan_id;

  if v_duration_days is null then
    raise exception 'plan_not_found';
  end if;

  select coalesce(max(s.end_at), now())
  into v_base_end
  from public.subscriptions s
  where s.user_id = v_order.user_id
    and s.status = 'active'
    and s.end_at > now();

  v_new_end := v_base_end + make_interval(days => v_duration_days);

  insert into public.subscriptions (
    user_id,
    plan_id,
    status,
    source,
    start_at,
    end_at
  )
  values (
    v_order.user_id,
    v_order.plan_id,
    'active',
    p_provider,
    now(),
    v_new_end
  );

  return query select v_order.id, v_order.user_id, v_new_end, false;
end;
$$;

revoke all on function public.mark_order_paid(text, text, text, int, jsonb) from public;
grant execute on function public.mark_order_paid(text, text, text, int, jsonb) to service_role;

commit;
