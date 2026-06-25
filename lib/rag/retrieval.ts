import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";

export interface RetrievedChunk {
  chunkText: string;
  documentTitle: string;
  chunkIndex: number;
  similarity: number;
}

export async function retrieveContext(
  query: string,
  topK = 5
): Promise<RetrievedChunk[]> {
  const queryVector = await generateEmbedding(query, "search_query");
  const vectorStr = `[${queryVector.join(",")}]`;

  const chunks = await prisma.$queryRawUnsafe<
    Array<{
      chunkText: string;
      documentTitle: string;
      chunkIndex: number;
      similarity: number;
    }>
  >(
    `SELECT dc."chunkText"  AS "chunkText",
            d.title         AS "documentTitle",
            dc."chunkIndex" AS "chunkIndex",
            1 - (dc.embedding <=> $1::vector) AS similarity
     FROM "DocumentChunk" dc
     JOIN "Document" d ON dc."documentId" = d.id
     WHERE d.status = 'ACTIVE'
     ORDER BY dc.embedding <=> $1::vector
     LIMIT $2`,
    vectorStr,
    topK
  );

  return chunks;
}
