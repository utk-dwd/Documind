import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";

export interface RetrievedChunk {
  chunkText: string;
  documentTitle: string;
  chunkIndex: number;
  similarity: number;
}

export interface SourceDoc {
  documentId: string;
  fileName: string;
  title: string;
}

export interface RetrieveResult {
  chunks: RetrievedChunk[];
  sources: SourceDoc[];
}

export async function retrieveContext(
  query: string,
  topK = 5
): Promise<RetrieveResult> {
  const queryVector = await generateEmbedding(query, "search_query");
  const vectorStr = `[${queryVector.join(",")}]`;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      chunkText: string;
      documentTitle: string;
      documentId: string;
      fileName: string;
      chunkIndex: number;
      similarity: number;
    }>
  >(
    `SELECT dc."chunkText"  AS "chunkText",
            d.title         AS "documentTitle",
            d.id            AS "documentId",
            d."fileName"    AS "fileName",
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

  const chunks: RetrievedChunk[] = rows.map((r) => ({
    chunkText: r.chunkText,
    documentTitle: r.documentTitle,
    chunkIndex: r.chunkIndex,
    similarity: r.similarity,
  }));

  const seen = new Set<string>();
  const sources: SourceDoc[] = [];
  for (const r of rows) {
    if (!seen.has(r.documentId)) {
      seen.add(r.documentId);
      sources.push({
        documentId: r.documentId,
        fileName: r.fileName,
        title: r.documentTitle,
      });
    }
  }

  return { chunks, sources };
}
