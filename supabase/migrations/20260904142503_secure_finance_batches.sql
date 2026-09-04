-- Called only by the server after authentication. Every batch is one transaction.
create or replace function public.save_finance_batch(
  p_household_id text, p_table text, p_upserts jsonb, p_deletes text[]
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  patch jsonb;
  previous jsonb;
  merged jsonb;
  defaults jsonb;
  columns_sql text;
  updates_sql text;
  foreign_id text;
  reference_table text;
  reference_key text;
  allowed boolean;
  affected integer;
begin
  if p_table not in ('entries', 'rules', 'accounts', 'wish_items') then
    raise exception 'Unsupported finance table' using errcode = '22023';
  end if;
  if jsonb_typeof(p_upserts) is distinct from 'array' or jsonb_array_length(p_upserts) > 1000
     or coalesce(array_length(p_deletes, 1), 0) > 1000 then
    raise exception 'Invalid batch size' using errcode = '22023';
  end if;
  perform 1 from public.household_settings where id = p_household_id for update;
  if not found then raise exception 'Unknown household' using errcode = '42501'; end if;

  execute format('select id from public.%I where id = any($1) and household_id <> $2 limit 1', p_table)
    into foreign_id using p_deletes, p_household_id;
  if foreign_id is not null then raise exception 'Foreign record' using errcode = '42501'; end if;

  defaults := case p_table
    when 'entries' then jsonb_build_object('description', '', 'rule_id', null, 'account_id', null, 'category_id', null,
      'competence_date', null, 'installment_index', null, 'installment_total', null,
      'status', 'pending', 'origin', 'manual', 'metadata', null, 'exclude_from_calc', false, 'created_at', now(), 'updated_at', now())
    when 'rules' then jsonb_build_object('description', '', 'account_id', null, 'category_id', null,
      'due_day', null, 'frequency', 'monthly', 'ends_at', null, 'auto_generate', false, 'metadata', null)
    when 'accounts' then jsonb_build_object('owner', '', 'type', 'bank', 'limit_total', null, 'closing_day', null, 'due_day', null, 'active', true)
    else jsonb_build_object('price', null, 'url', null, 'image_url', null, 'notes', null, 'priority', 'medium', 'status', 'want', 'category', null, 'created_at', now(), 'updated_at', now())
  end;
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position),
         string_agg(format('%I = excluded.%I', column_name, column_name), ', ' order by ordinal_position)
           filter (where column_name not in ('id', 'household_id', 'created_at'))
    into columns_sql, updates_sql
    from information_schema.columns where table_schema = 'public' and table_name = p_table;

  -- Later errors roll back these deletions and every earlier upsert.
  execute format('delete from public.%I where household_id = $1 and id = any($2)', p_table)
    using p_household_id, p_deletes;
  for patch in select value from jsonb_array_elements(p_upserts) loop
    if coalesce(patch->>'id', '') = '' then raise exception 'Missing id' using errcode = '22023'; end if;
    execute format('select to_jsonb(t) from public.%I t where id = $1 for update', p_table)
      into previous using patch->>'id';
    if previous is not null and previous->>'household_id' <> p_household_id then
      raise exception 'Foreign record' using errcode = '42501';
    end if;
    merged := defaults || coalesce(previous, '{}'::jsonb) || (patch - 'household_id' - 'created_at' - 'updated_at')
      || jsonb_build_object('household_id', p_household_id);
    if p_table in ('entries', 'wish_items') then merged := merged || jsonb_build_object('updated_at', now()); end if;
    if p_table = 'entries' and merged->>'competence_date' is null then
      merged := merged || jsonb_build_object('competence_date', merged->>'due_date');
    end if;
    foreach reference_key in array array['account_id', 'category_id', 'rule_id'] loop
      if merged->>reference_key is not null then
        reference_table := case reference_key when 'account_id' then 'accounts' when 'category_id' then 'categories' else 'rules' end;
        execute format('select exists(select 1 from public.%I where id = $1 and household_id = $2)', reference_table)
          into allowed using merged->>reference_key, p_household_id;
        if not allowed then raise exception 'Foreign reference' using errcode = '42501'; end if;
      end if;
    end loop;
    execute format('insert into public.%1$I as target (%2$s) select %2$s from jsonb_populate_record(null::public.%1$I, $1)
      on conflict (id) do update set %3$s where target.household_id = $2', p_table, columns_sql, updates_sql)
      using merged, p_household_id;
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'Record conflict' using errcode = '42501'; end if;
  end loop;
end;
$$;
revoke all on function public.save_finance_batch(text, text, jsonb, text[]) from public, anon, authenticated;
grant execute on function public.save_finance_batch(text, text, jsonb, text[]) to service_role;

create or replace function public.accept_household_invitation(p_user_id uuid, p_email text, p_token text)
returns text language plpgsql security invoker set search_path = '' as $$
declare invitation public.household_invitations;
begin
  select * into invitation from public.household_invitations
    where token = p_token and accepted_at is null and expires_at > now() for update;
  if not found then raise exception 'Convite inválido ou expirado' using errcode = '22023'; end if;
  if lower(trim(invitation.email)) <> lower(trim(p_email)) then
    raise exception 'Este convite não é para seu e-mail' using errcode = '42501';
  end if;
  insert into public.household_members(user_id, household_id, role)
    values (p_user_id, invitation.household_id, invitation.role)
    on conflict (user_id) do update set household_id = excluded.household_id, role = excluded.role;
  update public.household_invitations set accepted_at = now() where id = invitation.id;
  return invitation.household_id;
end;
$$;
revoke all on function public.accept_household_invitation(uuid, text, text) from public, anon, authenticated;
grant execute on function public.accept_household_invitation(uuid, text, text) to service_role;

-- Invitations must pass the verified server role check; direct clients cannot grant ownership.
drop policy if exists "invitations_insert" on public.household_invitations;
drop policy if exists "household_invitations_insert" on public.household_invitations;
revoke insert on public.household_invitations from public, anon, authenticated;
