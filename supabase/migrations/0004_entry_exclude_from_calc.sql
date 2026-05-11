alter table entries
  add column if not exists exclude_from_calc boolean not null default false;
