create table if not exists household_settings (
  id text primary key,
  currency text not null default 'BRL',
  timezone text not null default 'America/Sao_Paulo',
  theme_mode text not null default 'light',
  density_mode text not null default 'compact',
  period_mode text not null default 'due_date',
  horizon_months integer not null default 18,
  notification_days integer[] not null default '{3,1}',
  color_tokens jsonb not null,
  dashboard_config jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists accounts (
  id text primary key,
  household_id text not null references household_settings(id) on delete cascade,
  name text not null,
  owner text not null,
  type text not null,
  limit_total numeric,
  closing_day integer,
  due_day integer,
  active boolean not null default true
);

create table if not exists categories (
  id text primary key,
  household_id text not null references household_settings(id) on delete cascade,
  name text not null,
  kind text not null,
  color text not null
);

create table if not exists rules (
  id text primary key,
  household_id text not null references household_settings(id) on delete cascade,
  title text not null,
  description text not null,
  account_id text references accounts(id) on delete set null,
  category_id text references categories(id) on delete set null,
  amount numeric not null,
  kind text not null,
  due_day integer,
  frequency text not null,
  starts_at date not null,
  ends_at date,
  auto_generate boolean not null default true,
  metadata jsonb
);

create table if not exists entries (
  id text primary key,
  household_id text not null references household_settings(id) on delete cascade,
  rule_id text references rules(id) on delete set null,
  account_id text references accounts(id) on delete set null,
  category_id text references categories(id) on delete set null,
  title text not null,
  description text not null,
  amount numeric not null,
  kind text not null,
  due_date date not null,
  competence_date date not null,
  installment_index integer,
  installment_total integer,
  status text not null default 'pending',
  origin text not null default 'manual',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists budgets (
  id text primary key,
  household_id text not null references household_settings(id) on delete cascade,
  category_id text not null references categories(id) on delete cascade,
  month_ref text not null,
  amount numeric not null
);

create table if not exists imports_csv (
  id text primary key,
  household_id text not null references household_settings(id) on delete cascade,
  account_id text references accounts(id) on delete set null,
  file_name text,
  inserted_count integer not null default 0,
  warnings jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_entries_due_date on entries(due_date);
create index if not exists idx_entries_household on entries(household_id);
create index if not exists idx_entries_account on entries(account_id);
create index if not exists idx_entries_category on entries(category_id);
