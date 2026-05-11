-- ─── Garantir que household_members existe (criado em 0002) ─────────────────

create table if not exists household_members (
  user_id      uuid    not null references auth.users(id) on delete cascade,
  household_id text    not null references household_settings(id) on delete cascade,
  role         text    not null default 'owner',
  created_at   timestamptz not null default now(),
  primary key (user_id)
);

create index if not exists idx_household_members_household on household_members(household_id);

-- ─── Tabela de convites para compartilhar household ──────────────────────────

create table if not exists household_invitations (
  id           text        primary key,
  household_id text        not null references household_settings(id) on delete cascade,
  email        text        not null,
  token        text        not null unique,
  role         text        not null default 'member',
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_by   uuid        references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_invitations_token on household_invitations(token);
create index if not exists idx_invitations_email  on household_invitations(email);

-- ─── Helper: retorna o household_id do usuário autenticado ───────────────────

create or replace function get_user_household_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select household_id from household_members where user_id = auth.uid() limit 1;
$$;

-- ─── Habilitar RLS em todas as tabelas ───────────────────────────────────────

alter table household_settings    enable row level security;
alter table accounts              enable row level security;
alter table categories            enable row level security;
alter table rules                 enable row level security;
alter table entries               enable row level security;
alter table budgets               enable row level security;
alter table imports_csv           enable row level security;
alter table household_members     enable row level security;
alter table household_invitations enable row level security;

-- ─── Políticas RLS ───────────────────────────────────────────────────────────

-- household_settings
drop policy if exists "household_settings_select" on household_settings;
create policy "household_settings_select" on household_settings
  for select using (id = get_user_household_id());

drop policy if exists "household_settings_update" on household_settings;
create policy "household_settings_update" on household_settings
  for update using (id = get_user_household_id());

-- accounts
drop policy if exists "accounts_select" on accounts;
create policy "accounts_select" on accounts
  for select using (household_id = get_user_household_id());

drop policy if exists "accounts_insert" on accounts;
create policy "accounts_insert" on accounts
  for insert with check (household_id = get_user_household_id());

drop policy if exists "accounts_update" on accounts;
create policy "accounts_update" on accounts
  for update using (household_id = get_user_household_id());

drop policy if exists "accounts_delete" on accounts;
create policy "accounts_delete" on accounts
  for delete using (household_id = get_user_household_id());

-- categories
drop policy if exists "categories_select" on categories;
create policy "categories_select" on categories
  for select using (household_id = get_user_household_id());

drop policy if exists "categories_insert" on categories;
create policy "categories_insert" on categories
  for insert with check (household_id = get_user_household_id());

drop policy if exists "categories_update" on categories;
create policy "categories_update" on categories
  for update using (household_id = get_user_household_id());

drop policy if exists "categories_delete" on categories;
create policy "categories_delete" on categories
  for delete using (household_id = get_user_household_id());

-- rules
drop policy if exists "rules_select" on rules;
create policy "rules_select" on rules
  for select using (household_id = get_user_household_id());

drop policy if exists "rules_insert" on rules;
create policy "rules_insert" on rules
  for insert with check (household_id = get_user_household_id());

drop policy if exists "rules_update" on rules;
create policy "rules_update" on rules
  for update using (household_id = get_user_household_id());

drop policy if exists "rules_delete" on rules;
create policy "rules_delete" on rules
  for delete using (household_id = get_user_household_id());

-- entries
drop policy if exists "entries_select" on entries;
create policy "entries_select" on entries
  for select using (household_id = get_user_household_id());

drop policy if exists "entries_insert" on entries;
create policy "entries_insert" on entries
  for insert with check (household_id = get_user_household_id());

drop policy if exists "entries_update" on entries;
create policy "entries_update" on entries
  for update using (household_id = get_user_household_id());

drop policy if exists "entries_delete" on entries;
create policy "entries_delete" on entries
  for delete using (household_id = get_user_household_id());

-- budgets
drop policy if exists "budgets_select" on budgets;
create policy "budgets_select" on budgets
  for select using (household_id = get_user_household_id());

drop policy if exists "budgets_insert" on budgets;
create policy "budgets_insert" on budgets
  for insert with check (household_id = get_user_household_id());

drop policy if exists "budgets_update" on budgets;
create policy "budgets_update" on budgets
  for update using (household_id = get_user_household_id());

drop policy if exists "budgets_delete" on budgets;
create policy "budgets_delete" on budgets
  for delete using (household_id = get_user_household_id());

-- imports_csv
drop policy if exists "imports_csv_select" on imports_csv;
create policy "imports_csv_select" on imports_csv
  for select using (household_id = get_user_household_id());

drop policy if exists "imports_csv_insert" on imports_csv;
create policy "imports_csv_insert" on imports_csv
  for insert with check (household_id = get_user_household_id());

-- household_members: cada usuário vê apenas seus próprios vínculos
drop policy if exists "household_members_select" on household_members;
create policy "household_members_select" on household_members
  for select using (user_id = auth.uid());

-- household_invitations: membros do household podem ver e criar convites
drop policy if exists "household_invitations_select" on household_invitations;
create policy "household_invitations_select" on household_invitations
  for select using (household_id = get_user_household_id());

drop policy if exists "household_invitations_insert" on household_invitations;
create policy "household_invitations_insert" on household_invitations
  for insert with check (household_id = get_user_household_id());

-- ─── Trigger: criar household automático no signup ───────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id text;
begin
  new_household_id := 'hh-' || gen_random_uuid()::text;

  insert into household_settings (
    id, currency, timezone, theme_mode, density_mode, period_mode,
    horizon_months, notification_days, color_tokens, dashboard_config, updated_at
  ) values (
    new_household_id,
    'BRL',
    'America/Sao_Paulo',
    'light',
    'compact',
    'due_date',
    18,
    '{3,1}'::integer[],
    '{"primary":"#6C63FF","success":"#22c55e","danger":"#ef4444","warning":"#f59e0b","accent":"#ec4899","bg":"#f8fafc","bg2":"#f1f5f9","surface":"#ffffff","surface2":"#f8fafc","border":"#e2e8f0","text":"#0f172a","text2":"#475569","text3":"#94a3b8"}'::jsonb,
    '{"defaultRange":"month","showProjection":true,"showHeatmap":false}'::jsonb,
    now()
  );

  insert into household_members (user_id, household_id, role, created_at)
  values (new.id, new_household_id, 'owner', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Vincular usuário existente (pedro.v@sygecom.com.br) ao household-main ───
-- Usuários criados antes deste migration não têm household; este bloco os vincula.

do $$
declare
  pedro_id uuid;
begin
  select id into pedro_id
  from auth.users
  where email in ('pedrovictorpina@gmail.com', 'pedro.v@sygecom.com.br')
  limit 1;

  if pedro_id is not null then
    insert into household_members (user_id, household_id, role, created_at)
    values (pedro_id, 'household-main', 'owner', now())
    on conflict (user_id) do nothing;
  end if;
end;
$$;
