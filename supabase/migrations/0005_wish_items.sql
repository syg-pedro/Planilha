create table if not exists wish_items (
  id           text        primary key,
  household_id text        not null references household_settings(id) on delete cascade,
  name         text        not null,
  price        numeric,
  url          text,
  image_url    text,
  notes        text,
  priority     text        not null default 'medium',
  status       text        not null default 'want',
  category     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_wish_items_household on wish_items(household_id);

alter table wish_items enable row level security;

drop policy if exists "wish_items_select" on wish_items;
create policy "wish_items_select" on wish_items
  for select using (household_id = get_user_household_id());

drop policy if exists "wish_items_insert" on wish_items;
create policy "wish_items_insert" on wish_items
  for insert with check (household_id = get_user_household_id());

drop policy if exists "wish_items_update" on wish_items;
create policy "wish_items_update" on wish_items
  for update using (household_id = get_user_household_id());

drop policy if exists "wish_items_delete" on wish_items;
create policy "wish_items_delete" on wish_items
  for delete using (household_id = get_user_household_id());
