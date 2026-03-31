create extension if not exists pgcrypto;

create type public.subscription_tier as enum ('starter', 'pro', 'business');
create type public.assistant_status as enum ('draft', 'training', 'ready', 'archived');
create type public.training_source_type as enum ('url', 'document', 'plain_text');
create type public.training_source_status as enum ('pending', 'processing', 'ready', 'failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  company_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code public.subscription_tier not null unique,
  name text not null,
  description text,
  assistant_limit integer not null,
  training_source_limit integer not null,
  monthly_chat_limit integer not null,
  price_monthly_cents integer not null,
  features jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create table if not exists public.assistants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null,
  website_url text,
  business_summary text,
  welcome_message text not null default 'Hi, I am your AI assistant. How can I help?',
  tone text not null default 'helpful',
  status public.assistant_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, slug)
);

create table if not exists public.training_sources (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null references public.assistants (id) on delete cascade,
  source_type public.training_source_type not null,
  label text,
  source_url text,
  plain_text_content text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  status public.training_source_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (source_type = 'url' and source_url is not null and storage_path is null and plain_text_content is null)
    or (source_type = 'document' and storage_path is not null)
    or (source_type = 'plain_text' and plain_text_content is not null)
  )
);

create index if not exists assistants_user_id_idx on public.assistants (user_id);
create index if not exists training_sources_assistant_id_idx on public.training_sources (assistant_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_subscriptions_set_updated_at
before update on public.user_subscriptions
for each row execute function public.set_updated_at();

create trigger assistants_set_updated_at
before update on public.assistants
for each row execute function public.set_updated_at();

create trigger training_sources_set_updated_at
before update on public.training_sources
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  insert into public.user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  select
    new.id,
    subscription_plans.id,
    'trialing',
    timezone('utc', now()),
    timezone('utc', now()) + interval '14 days'
  from public.subscription_plans
  where subscription_plans.code = 'starter'
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.subscription_plans (
  code,
  name,
  description,
  assistant_limit,
  training_source_limit,
  monthly_chat_limit,
  price_monthly_cents,
  features
)
values
  (
    'starter',
    'Starter',
    'Best for first-time launches',
    1,
    15,
    1500,
    2900,
    '["1 assistant","Website and text training","Basic analytics"]'::jsonb
  ),
  (
    'pro',
    'Pro',
    'For growing teams with multiple assistants',
    5,
    100,
    10000,
    9900,
    '["5 assistants","Document uploads","Advanced analytics","Priority support"]'::jsonb
  ),
  (
    'business',
    'Business',
    'For large sites and advanced workflows',
    999,
    1000,
    100000,
    0,
    '["Unlimited assistants","Team access","Custom integrations","Dedicated support"]'::jsonb
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  assistant_limit = excluded.assistant_limit,
  training_source_limit = excluded.training_source_limit,
  monthly_chat_limit = excluded.monthly_chat_limit,
  price_monthly_cents = excluded.price_monthly_cents,
  features = excluded.features;

alter table public.profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.assistants enable row level security;
alter table public.training_sources enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "subscription_plans_select_authenticated"
on public.subscription_plans
for select
to authenticated
using (true);

create policy "user_subscriptions_select_own"
on public.user_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create policy "assistants_select_own"
on public.assistants
for select
to authenticated
using (auth.uid() = user_id);

create policy "assistants_insert_own"
on public.assistants
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "assistants_update_own"
on public.assistants
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "assistants_delete_own"
on public.assistants
for delete
to authenticated
using (auth.uid() = user_id);

create policy "training_sources_select_own"
on public.training_sources
for select
to authenticated
using (
  exists (
    select 1
    from public.assistants
    where assistants.id = training_sources.assistant_id
      and assistants.user_id = auth.uid()
  )
);

create policy "training_sources_insert_own"
on public.training_sources
for insert
to authenticated
with check (
  exists (
    select 1
    from public.assistants
    where assistants.id = training_sources.assistant_id
      and assistants.user_id = auth.uid()
  )
);

create policy "training_sources_update_own"
on public.training_sources
for update
to authenticated
using (
  exists (
    select 1
    from public.assistants
    where assistants.id = training_sources.assistant_id
      and assistants.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.assistants
    where assistants.id = training_sources.assistant_id
      and assistants.user_id = auth.uid()
  )
);

create policy "training_sources_delete_own"
on public.training_sources
for delete
to authenticated
using (
  exists (
    select 1
    from public.assistants
    where assistants.id = training_sources.assistant_id
      and assistants.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('assistant-documents', 'assistant-documents', false)
on conflict (id) do nothing;

create policy "assistant_documents_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'assistant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "assistant_documents_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'assistant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "assistant_documents_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'assistant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'assistant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "assistant_documents_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'assistant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
