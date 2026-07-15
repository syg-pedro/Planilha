insert into storage.buckets (id, name, public)
values ('android-releases', 'android-releases', true)
on conflict (id) do update set public = true;

create policy "Public read for Android releases"
on storage.objects for select
using (bucket_id = 'android-releases');
