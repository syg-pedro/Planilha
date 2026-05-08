create table if not exists patrimony (
  id text primary key,
  household_id text not null references household_settings(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('asset', 'liability')),
  value numeric not null default 0,
  category text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  id text primary key,
  household_id text not null references household_settings(id) on delete cascade,
  name text not null,
  target_amount numeric not null default 0,
  current_amount numeric not null default 0,
  deadline date,
  color text not null default 'var(--primary)',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patrimony_household on patrimony(household_id);
create index if not exists idx_goals_household on goals(household_id);
