-- match_fieldnotes_chunks: semantic search over Field Notes chunks
-- Embedding model: voyage-3.5-lite (1024 dimensions)
-- Index: HNSW with vector_cosine_ops
-- Note: dimension constraint is enforced at the column level, not the function signature

CREATE OR REPLACE FUNCTION public.match_fieldnotes_chunks(
  query_embedding vector,
  match_threshold double precision,
  match_count integer
)
RETURNS TABLE(
  id uuid,
  field_note_slug text,
  field_note_number text,
  field_note_title text,
  section_title text,
  content text,
  similarity double precision
)
LANGUAGE sql
STABLE
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT
    id, field_note_slug, field_note_number,
    field_note_title, section_title, content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM fieldnotes_chunks
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$function$;
