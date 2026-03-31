-- Drop existing function first so we can change its return type (add metadata column)
drop function if exists match_embeddings(vector, float, int, uuid);

-- Recreate match_embeddings returning metadata column (backward compatible)
create or replace function match_embeddings (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_assistant_id uuid
)
returns table (
  id bigint,
  content_chunk text,
  similarity float,
  metadata jsonb
)
language sql stable
as $$
  select
    embeddings.id,
    embeddings.content_chunk,
    1 - (embeddings.embedding <=> query_embedding) as similarity,
    embeddings.metadata
  from embeddings
  where embeddings.assistant_id = p_assistant_id
    and 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by embeddings.embedding <=> query_embedding
  limit match_count;
$$;

-- New function: image-only vector search
create or replace function match_image_embeddings (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_assistant_id uuid
)
returns table (
  id bigint,
  content_chunk text,
  similarity float,
  metadata jsonb
)
language sql stable
as $$
  select
    embeddings.id,
    embeddings.content_chunk,
    1 - (embeddings.embedding <=> query_embedding) as similarity,
    embeddings.metadata
  from embeddings
  where embeddings.assistant_id = p_assistant_id
    and embeddings.metadata->>'type' = 'image'
    and 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by embeddings.embedding <=> query_embedding
  limit match_count;
$$;
