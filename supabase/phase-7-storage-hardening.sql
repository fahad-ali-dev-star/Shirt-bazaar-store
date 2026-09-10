-- Phase 7: Supabase Storage hardening for product images.
-- Run after Phase 1-6 migrations.
--
-- Storage model:
--   * product-images is a public-read bucket because storefront image URLs are
--     stored in product_images.url and rendered directly by the storefront.
--   * anon/authenticated can read objects but cannot upload, update, move, copy,
--     or delete them.
--   * trusted server code uses service_role for writes and therefore bypasses
--     storage RLS.
--   * bucket-level limits reject unsupported MIME types and objects > 5 MiB.

-- ------------------------------------------------------------
-- 1. Create/configure the product image bucket
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------
-- 2. Ensure storage object RLS is enabled
-- ------------------------------------------------------------
alter table storage.objects enable row level security;

-- ------------------------------------------------------------
-- 3. Remove only the policies owned by this project, then recreate them.
-- ------------------------------------------------------------
drop policy if exists "product_images_public_read" on storage.objects;
drop policy if exists "product_images_public_insert" on storage.objects;
drop policy if exists "product_images_public_update" on storage.objects;
drop policy if exists "product_images_public_delete" on storage.objects;

-- Public storefront reads. Because the bucket is public, direct object URLs
-- also work without a signed URL; this policy additionally permits normal
-- authenticated/anonymous storage SELECT operations for this bucket.
create policy "product_images_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

-- There are intentionally NO INSERT/UPDATE/DELETE policies for anon or
-- authenticated. Uploads are performed only by the protected admin API using
-- service_role.

-- ------------------------------------------------------------
-- 4. Verification queries (run separately in the SQL editor)
-- ------------------------------------------------------------
-- select id, name, public, file_size_limit, allowed_mime_types
-- from storage.buckets
-- where id = 'product-images';
--
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'storage'
--   and tablename = 'objects';
--
-- Expected project policy: SELECT for anon/authenticated on bucket
-- product-images, with no project INSERT/UPDATE/DELETE policies.
