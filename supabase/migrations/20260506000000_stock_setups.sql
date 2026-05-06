-- Best S&P 500 setups (API writes via service role; public read for dashboards)
create table if not exists public.stock_setups (
  id uuid primary key default gen_random_uuid(),
  ticker text not null unique,
  composite_score numeric not null,
  trend_score numeric not null,
  momentum_score numeric not null,
  volume_score numeric not null,
  structure_score numeric not null,
  fib_score numeric not null,
  weekly_score numeric not null,
  summary text,
  details jsonb default '{}'::jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists stock_setups_composite_idx on public.stock_setups (composite_score desc);

alter table public.stock_setups enable row level security;

create policy "stock_setups_select_public"
  on public.stock_setups for select
  using (true);

-- Realtime: replicate inserts/updates/deletes to subscribed clients
alter publication supabase_realtime add table public.stock_setups;
