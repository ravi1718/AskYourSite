-- Chat messages table for tracking all conversations and analytics
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null references public.assistants(id) on delete cascade,
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes for fast analytics queries
create index if not exists chat_messages_assistant_id_idx on public.chat_messages (assistant_id);
create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages (created_at);
create index if not exists chat_messages_role_idx on public.chat_messages (role);

-- RLS
alter table public.chat_messages enable row level security;

-- Allow authenticated users to read their own assistants' messages
create policy "chat_messages_select_own" on public.chat_messages
for select to authenticated
using (exists(
  select 1 from public.assistants
  where assistants.id = chat_messages.assistant_id
    and assistants.user_id = auth.uid()
));

-- Allow inserts (used by the chat API via service role, but also allow authenticated)
create policy "chat_messages_insert_own" on public.chat_messages
for insert to authenticated
with check (exists(
  select 1 from public.assistants
  where assistants.id = chat_messages.assistant_id
    and assistants.user_id = auth.uid()
));

-- Allow service role full access (no policy needed, service role bypasses RLS)
-- Allow anon inserts for the embed widget chat (public chatbot visitors)
create policy "chat_messages_insert_anon" on public.chat_messages
for insert to anon
with check (true);
