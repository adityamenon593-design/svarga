-- Enable vector extension for semantic search
create extension if not exists vector with schema public;

-- Documents uploaded by users
create table public.documents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    file_path text not null,
    kind text not null check (kind in ('pdf', 'text', 'epub', 'other')),
    status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'error')),
    error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;

alter table public.documents enable row level security;

create policy "Users can manage their own documents"
  on public.documents
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Chunks extracted from documents, with embeddings for semantic retrieval
create table public.document_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid references public.documents(id) on delete cascade not null,
    chunk_index int not null,
    content text not null,
    embedding vector(3072),
    unique (document_id, chunk_index)
);

grant select, insert, update, delete on public.document_chunks to authenticated;
grant all on public.document_chunks to service_role;

alter table public.document_chunks enable row level security;

create policy "Users can access chunks of their own documents"
  on public.document_chunks
  for all
  to authenticated
  using (
    document_id in (
      select id from public.documents where user_id = auth.uid()
    )
  )
  with check (
    document_id in (
      select id from public.documents where user_id = auth.uid()
    )
  );

-- Semantic match over a user's document chunks

create or replace function public.match_document_chunks(
  query_embedding vector(3072),
  match_count int default 6,
  p_user_id uuid default null
)
returns table (
    id uuid,
    document_id uuid,
    content text,
    title text,
    similarity float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    d.title,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where dc.embedding is not null
    and (p_user_id is null or d.user_id = p_user_id)
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_document_chunks(vector(3072), int, uuid) to authenticated;
grant execute on function public.match_document_chunks(vector(3072), int, uuid) to service_role;