-- Apply in the Supabase SQL editor (or with `supabase db push`).
-- This migration provisions no owner and publishes no sample products.
begin;

create schema if not exists catalog_private;
revoke all on schema catalog_private from public, anon, authenticated;

create table catalog_private.owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table catalog_private.media (
  public_id text primary key check (public_id ~ '^catalog/[a-f0-9]{32}$'),
  cloud_name text not null check (cloud_name ~ '^[A-Za-z0-9_-]{1,100}$'),
  secure_url text not null check (secure_url like 'https://res.cloudinary.com/%'),
  version bigint not null check (version > 0),
  width integer not null check (width between 1 and 1600),
  height integer not null check (height between 1 and 2000),
  bytes bigint not null check (bytes between 1 and 5242880),
  uploaded_by uuid references auth.users(id) on delete set null,
  state text not null default 'ready' check (state in ('ready', 'deleting')),
  cleanup_token uuid,
  cleanup_started_at timestamptz,
  created_at timestamptz not null default now()
);

alter table catalog_private.owners enable row level security;
alter table catalog_private.media enable row level security;
revoke all on all tables in schema catalog_private from public, anon, authenticated;

create function public.is_catalog_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from catalog_private.owners where user_id = (select auth.uid())); $$;
revoke all on function public.is_catalog_admin() from public, anon, authenticated;
grant execute on function public.is_catalog_admin() to authenticated;

-- Used only by the Edge Function AFTER auth.getUser has verified the token.
create function public.catalog_owner_for_user(p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from catalog_private.owners where user_id = p_user_id); $$;
revoke all on function public.catalog_owner_for_user(uuid) from public, anon, authenticated;
grant execute on function public.catalog_owner_for_user(uuid) to service_role;

create table public.products (
  id text primary key default gen_random_uuid()::text check (length(id) between 1 and 120),
  slug text not null unique check (length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 2 and 120),
  category text not null check (length(category) between 2 and 60 and lower(category) <> 'all'),
  price numeric check (price is null or (price >= 0 and price <= 99999999.99 and price = round(price, 2))),
  summary text not null default '' check (length(summary) <= 240),
  description text not null default '' check (length(description) <= 6000),
  details text[] not null default '{}' check (cardinality(details) <= 20),
  art_shape text not null default 'coaster',
  art_palette text not null default 'amber',
  image_public_id text references catalog_private.media(public_id) on delete restrict,
  image_cloud_name text,
  image_version bigint,
  image_url text,
  image_width integer,
  image_height integer,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  availability text not null default 'available' check (availability in ('available', 'sold_out')),
  metal text check (metal in ('Gold', 'Silver')),
  hallmark boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 99999),
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or length(summary) > 0),
  check ((category = 'Jewellery' and metal is not null and art_shape in ('ring','chain','hoops','bracelet','studs') and art_palette in ('gold','silver'))
      or (category <> 'Jewellery' and metal is null and hallmark = false and art_shape in ('coaster','tray','keychain','bookmark','vase','dish','frame','pendant','loop') and art_palette in ('amber','sage','clay','smoke','mist','honey')))
);
create index products_published_sort on public.products(status, sort_order, id);
create index products_image on public.products(image_public_id) where image_public_id is not null;

create function catalog_private.prepare_product()
returns trigger language plpgsql security definer set search_path = '' as $$
declare asset catalog_private.media%rowtype;
begin
  new.name := btrim(new.name);
  new.slug := btrim(new.slug);
  new.category := btrim(new.category);
  new.summary := btrim(new.summary);
  new.description := btrim(new.description);
  new.details := array(select btrim(value) from unnest(new.details) as value where btrim(value) <> '');
  if exists (select 1 from unnest(new.details) as value where length(value) > 300) then
    raise exception 'Product details must be at most 300 characters each.';
  end if;
  if new.image_public_id is not null then
    -- Cleanup and attachment lock the SAME registry row. A deleting asset cannot
    -- be attached, and cleanup cannot claim an asset attached by a pending save.
    select * into asset from catalog_private.media where public_id = new.image_public_id for update;
    if not found or asset.state <> 'ready' then
      raise exception 'This photo is unavailable. Upload it again before saving.';
    end if;
    new.image_cloud_name := asset.cloud_name;
    new.image_version := asset.version;
    new.image_url := asset.secure_url;
    new.image_width := asset.width;
    new.image_height := asset.height;
  else
    new.image_cloud_name := null;
    new.image_version := null;
    new.image_url := null;
    new.image_width := null;
    new.image_height := null;
  end if;
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.created_at := old.created_at;
    new.version := old.version + 1;
  else
    new.version := 1;
    new.created_at := clock_timestamp();
  end if;
  new.updated_at := clock_timestamp();
  return new;
end; $$;
revoke all on function catalog_private.prepare_product() from public;
create trigger prepare_product before insert or update on public.products
for each row execute function catalog_private.prepare_product();

alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
create policy published_product_reads on public.products for select to anon, authenticated using (status = 'published');
create policy owner_product_reads on public.products for select to authenticated using ((select public.is_catalog_admin()));
create policy owner_product_inserts on public.products for insert to authenticated with check ((select public.is_catalog_admin()));
create policy owner_product_updates on public.products for update to authenticated using ((select public.is_catalog_admin())) with check ((select public.is_catalog_admin()));
create policy owner_product_deletes on public.products for delete to authenticated using ((select public.is_catalog_admin()));

create function public.register_catalog_media(p_asset jsonb, p_owner uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from catalog_private.owners where user_id = p_owner) then
    raise exception 'Owner access required.';
  end if;
  insert into catalog_private.media(public_id, cloud_name, secure_url, version, width, height, bytes, uploaded_by)
  values (p_asset->>'publicId', p_asset->>'cloudName', p_asset->>'url', (p_asset->>'version')::bigint,
          (p_asset->>'width')::integer, (p_asset->>'height')::integer, (p_asset->>'bytes')::bigint, p_owner);
end; $$;

create function public.claim_catalog_media_cleanup(p_public_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare asset catalog_private.media%rowtype; token uuid;
begin
  select * into asset from catalog_private.media where public_id = p_public_id for update;
  if not found then return jsonb_build_object('state', 'missing'); end if;
  if exists (select 1 from public.products where image_public_id = p_public_id) then
    return jsonb_build_object('state', 'referenced');
  end if;
  if asset.state = 'deleting' and asset.cleanup_started_at > now() - interval '5 minutes' then
    return jsonb_build_object('state', 'busy');
  end if;
  token := gen_random_uuid();
  update catalog_private.media set state = 'deleting', cleanup_token = token, cleanup_started_at = now() where public_id = p_public_id;
  return jsonb_build_object('state', 'claimed', 'token', token, 'cloudName', asset.cloud_name);
end; $$;

create function public.finish_catalog_media_cleanup(p_public_id text, p_token uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  delete from catalog_private.media where public_id = p_public_id and state = 'deleting' and cleanup_token = p_token;
  return found;
end; $$;

create function public.list_catalog_unused_media()
returns setof text language sql stable security definer set search_path = '' as $$
  select m.public_id from catalog_private.media m
  where m.created_at < now() - interval '1 hour'
    and (m.state = 'ready' or m.cleanup_started_at < now() - interval '5 minutes')
    and not exists (select 1 from public.products p where p.image_public_id = m.public_id)
  order by m.created_at limit 5;
$$;

revoke all on function public.register_catalog_media(jsonb, uuid) from public, anon, authenticated;
revoke all on function public.claim_catalog_media_cleanup(text) from public, anon, authenticated;
revoke all on function public.finish_catalog_media_cleanup(text, uuid) from public, anon, authenticated;
revoke all on function public.list_catalog_unused_media() from public, anon, authenticated;
grant execute on function public.register_catalog_media(jsonb, uuid) to service_role;
grant execute on function public.claim_catalog_media_cleanup(text) to service_role;
grant execute on function public.finish_catalog_media_cleanup(text, uuid) to service_role;
grant execute on function public.list_catalog_unused_media() to service_role;

-- Optional, explicit import from the owner panel. All entries are forced to draft.
create function public.import_catalog_drafts(p_products jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare item jsonb; imported integer := 0;
begin
  if not public.is_catalog_admin() then raise exception 'Owner access required.'; end if;
  if jsonb_typeof(p_products) <> 'array' or jsonb_array_length(p_products) > 50 then
    raise exception 'Invalid sample import.';
  end if;
  lock table public.products in exclusive mode;
  if exists (select 1 from public.products) then raise exception 'Samples can only be imported into an empty catalogue.'; end if;
  for item in select value from jsonb_array_elements(p_products) loop
    insert into public.products(id, slug, name, category, price, summary, description, details, art_shape, art_palette, featured, metal, hallmark, status)
    values (item->>'id', item->>'slug', item->>'name', item->>'category', null, item->>'summary', item->>'description',
            array(select jsonb_array_elements_text(item->'details')), item->>'art_shape', item->>'art_palette',
            coalesce((item->>'featured')::boolean, false), nullif(item->>'metal', ''), coalesce((item->>'hallmark')::boolean, false), 'draft');
    imported := imported + 1;
  end loop;
  return imported;
end; $$;
revoke all on function public.import_catalog_drafts(jsonb) from public, anon;
grant execute on function public.import_catalog_drafts(jsonb) to authenticated;

commit;
