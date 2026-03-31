insert into storage.buckets (id, name, public)
values ('widget-assets', 'widget-assets', true)
on conflict (id) do update set public = true;

create policy "widget_assets_select_public"
on storage.objects
for select
to public
using (bucket_id = 'widget-assets');

create policy "widget_assets_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'widget-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "widget_assets_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'widget-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'widget-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "widget_assets_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'widget-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
