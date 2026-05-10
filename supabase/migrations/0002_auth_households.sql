-- Tabela de membros do household (vincula auth.users → household)
-- Permite que futuramente um household seja compartilhado entre vários usuários.
create table if not exists household_members (
  user_id    uuid    not null references auth.users(id) on delete cascade,
  household_id text  not null references household_settings(id) on delete cascade,
  role       text    not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (user_id)
);

create index if not exists idx_household_members_household on household_members(household_id);

-- Após criar sua conta em /signup, execute o script scripts/bind-owner.ts
-- para vincular seu user_id ao household-main existente:
--   npx tsx scripts/bind-owner.ts
--
-- Ou execute manualmente:
--   INSERT INTO household_members (user_id, household_id, role)
--   SELECT id, 'household-main', 'owner'
--   FROM auth.users
--   WHERE email = 'SEU_EMAIL'
--   ON CONFLICT DO NOTHING;
