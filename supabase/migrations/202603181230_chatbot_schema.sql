create extension if not exists vector;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null references public.assistants(id) on delete cascade,
  source_url text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.embeddings (
  id bigserial primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  assistant_id uuid not null references public.assistants(id) on delete cascade,
  content_chunk text not null,
  embedding vector(768),
  metadata jsonb
);

create index if not exists embeddings_assistant_id_idx on public.embeddings (assistant_id);
create index if not exists embeddings_document_id_idx on public.embeddings (document_id);

alter table public.documents enable row level security;
alter table public.embeddings enable row level security;

create policy "documents_select_own" on public.documents
for select to authenticated
using (exists(select 1 from public.assistants where assistants.id = documents.assistant_id and assistants.user_id = auth.uid()));

create policy "documents_insert_own" on public.documents
for insert to authenticated
with check (exists(select 1 from public.assistants where assistants.id = documents.assistant_id and assistants.user_id = auth.uid()));

create policy "documents_delete_own" on public.documents
for delete to authenticated
using (exists(select 1 from public.assistants where assistants.id = documents.assistant_id and assistants.user_id = auth.uid()));


create policy "embeddings_select_own" on public.embeddings
for select to authenticated
using (exists(select 1 from public.assistants where assistants.id = embeddings.assistant_id and assistants.user_id = auth.uid()));

create policy "embeddings_insert_own" on public.embeddings
for insert to authenticated
with check (exists(select 1 from public.assistants where assistants.id = embeddings.assistant_id and assistants.user_id = auth.uid()));

create policy "embeddings_delete_own" on public.embeddings
for delete to authenticated
using (exists(select 1 from public.assistants where assistants.id = embeddings.assistant_id and assistants.user_id = auth.uid()));

create or replace function match_embeddings (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_assistant_id uuid
)
returns table (
  id bigint,
  content_chunk text,
  similarity float
)
language sql stable
as $$
  select
    embeddings.id,
    embeddings.content_chunk,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from embeddings
  where embeddings.assistant_id = p_assistant_id
    and 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by embeddings.embedding <=> query_embedding
  limit match_count;
$$;
