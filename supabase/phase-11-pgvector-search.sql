-- ============================================================
-- Phase 11: Supabase pgvector & AI Semantic Search
-- Run this in your Supabase SQL Editor to enable AI Vector Search
-- ============================================================

-- 1. Enable the pgvector extension
create extension if not exists vector;

-- 2. Add embedding column to products table (768 dimensions for Gemini text-embedding-004)
alter table products 
add column if not exists embedding vector(768);

-- 3. Create HNSW vector index for ultra-fast similarity search
create index if not exists idx_products_embedding 
on products 
using hnsw (embedding vector_cosine_ops);

-- 4. Create RPC similarity search function
create or replace function match_products (
  query_embedding vector(768),
  match_threshold float default 0.2,
  match_count int default 10
)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  base_price numeric,
  category text,
  similarity float
)
language sql stable
as $$
  select
    products.id,
    products.name,
    products.slug,
    products.description,
    products.base_price,
    products.category,
    (1 - (products.embedding <=> query_embedding))::float as similarity
  from products
  where products.is_active = true
    and products.embedding is not null
    and (1 - (products.embedding <=> query_embedding)) > match_threshold
  order by products.embedding <=> query_embedding
  limit match_count;
$$;
