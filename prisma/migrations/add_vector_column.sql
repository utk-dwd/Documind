-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add the embedding column to DocumentChunk
ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS embedding VECTOR(1024);

-- Create IVFFlat index for fast approximate nearest-neighbor search
-- Run AFTER you have at least a few hundred rows of data
CREATE INDEX IF NOT EXISTS document_chunk_embedding_idx
  ON "DocumentChunk"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
