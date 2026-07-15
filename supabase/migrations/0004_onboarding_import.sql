-- Estado persistente do primeiro uso. O progresso pertence ao household para
-- que quem compartilha os dados não receba uma configuração vazia novamente.
alter table household_settings
  add column if not exists onboarding_state jsonb not null
  default '{"version":1,"status":"new","completedSteps":[]}'::jsonb;

-- A importação inicial precisa ser tudo-ou-nada: contas, categorias, regras e
-- lançamentos são inseridos na mesma transação do PostgreSQL.
create or replace function import_onboarding_workbook(
  p_household_id text,
  p_accounts jsonb,
  p_categories jsonb,
  p_rules jsonb,
  p_entries jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and p_household_id is distinct from get_user_household_id() then
    raise exception 'Você não pode importar dados para este espaço financeiro.';
  end if;

  if exists (select 1 from accounts where household_id = p_household_id)
     or exists (select 1 from categories where household_id = p_household_id)
     or exists (select 1 from rules where household_id = p_household_id)
     or exists (select 1 from entries where household_id = p_household_id) then
    raise exception 'A importação inicial só pode ser usada em uma conta sem dados.';
  end if;

  insert into accounts (id, household_id, name, owner, type, limit_total, closing_day, due_day, active)
  select source.id, p_household_id, source.name, source.owner, source.type,
         source.limit_total, source.closing_day, source.due_day, coalesce(source.active, true)
  from jsonb_to_recordset(coalesce(p_accounts, '[]'::jsonb)) as source(
    id text, name text, owner text, type text, limit_total numeric,
    closing_day integer, due_day integer, active boolean
  );

  insert into categories (id, household_id, name, kind, color)
  select source.id, p_household_id, source.name, source.kind, source.color
  from jsonb_to_recordset(coalesce(p_categories, '[]'::jsonb)) as source(
    id text, name text, kind text, color text
  );

  insert into rules (
    id, household_id, title, description, account_id, category_id, amount,
    kind, due_day, frequency, starts_at, ends_at, auto_generate, metadata
  )
  select source.id, p_household_id, source.title, source.description,
         source.account_id, source.category_id, source.amount, source.kind,
         source.due_day, source.frequency, source.starts_at, source.ends_at,
         source.auto_generate, source.metadata
  from jsonb_to_recordset(coalesce(p_rules, '[]'::jsonb)) as source(
    id text, title text, description text, account_id text, category_id text,
    amount numeric, kind text, due_day integer, frequency text, starts_at date,
    ends_at date, auto_generate boolean, metadata jsonb
  );

  insert into entries (
    id, household_id, rule_id, account_id, category_id, title, description,
    amount, kind, due_date, competence_date, installment_index,
    installment_total, status, origin, exclude_from_calc, metadata,
    created_at, updated_at
  )
  select source.id, p_household_id, source.rule_id, source.account_id,
         source.category_id, source.title, source.description, source.amount,
         source.kind, source.due_date, source.competence_date,
         source.installment_index, source.installment_total, source.status,
         source.origin, coalesce(source.exclude_from_calc, false), source.metadata,
         source.created_at, source.updated_at
  from jsonb_to_recordset(coalesce(p_entries, '[]'::jsonb)) as source(
    id text, rule_id text, account_id text, category_id text, title text,
    description text, amount numeric, kind text, due_date date,
    competence_date date, installment_index integer, installment_total integer,
    status text, origin text, exclude_from_calc boolean, metadata jsonb,
    created_at timestamptz, updated_at timestamptz
  );

  update household_settings
  set onboarding_state = jsonb_build_object(
        'version', 1,
        'status', 'completed',
        'completedSteps', jsonb_build_array('import-workbook', 'accounts', 'fixed-items'),
        'updatedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
      updated_at = now()
  where id = p_household_id;
end;
$$;

revoke all on function import_onboarding_workbook(text, jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function import_onboarding_workbook(text, jsonb, jsonb, jsonb, jsonb) to authenticated, service_role;
