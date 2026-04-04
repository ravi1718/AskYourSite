create table public.user_integrations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  provider        text not null,
  access_token    text not null,
  refresh_token   text,
  token_expires_at timestamptz,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id, provider)
);

alter table public.user_integrations enable row level security;

create policy "Users can read own integrations"
  on public.user_integrations for select
  using (auth.uid() = user_id);

create policy "Users can insert own integrations"
  on public.user_integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own integrations"
  on public.user_integrations for update
  using (auth.uid() = user_id);

create policy "Users can delete own integrations"
  on public.user_integrations for delete
  using (auth.uid() = user_id);
