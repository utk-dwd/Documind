import fs from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { prisma } from "@/lib/db";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/embeddings";

const BATCH_SIZE = 20;

interface IngestResult {
  chunksCreated: number;
  fileName: string;
}

type ParsedText = { text: string; numPages: number };

async function readPdf(filePath: string): Promise<ParsedText> {
  const dataBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const numPages = result.total;
  await parser.destroy();
  return { text: result.text, numPages };
}

async function readDocx(filePath: string): Promise<ParsedText> {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value, numPages: 1 };
}

async function readTxt(filePath: string): Promise<ParsedText> {
  const text = await fs.readFile(filePath, "utf-8");
  return { text, numPages: 1 };
}

async function readFile(
  filePath: string,
  fileType: string
): Promise<ParsedText> {
  switch (fileType) {
    case "pdf":
      return readPdf(filePath);
    case "docx":
      return readDocx(filePath);
    case "txt":
      return readTxt(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

export async function ingestDocument(
  filePath: string,
  documentRecord: { id: string; title: string; fileType: string }
): Promise<IngestResult> {
  const existingChunks = await prisma.documentChunk.count({
    where: { documentId: documentRecord.id },
  });
  if (existingChunks > 0) {
    return {
      chunksCreated: existingChunks,
      fileName: documentRecord.title,
    };
  }

  const parsed = await readFile(filePath, documentRecord.fileType);
  const chunks = chunkText(
    parsed.text,
    Number(process.env.RAG_CHUNK_SIZE) || 500,
    Number(process.env.RAG_CHUNK_OVERLAP) || 50
  );

  let totalCreated = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const embeddings = await generateEmbeddings(batch);
    const pagePerChunk = Math.ceil(parsed.numPages / chunks.length);

    const rows: string[] = [];
    const allParams: unknown[] = [];

    for (let j = 0; j < batch.length; j++) {
      const idx = i + j;
      const embeddingStr = `[${embeddings[j].join(",")}]`;
      const base = allParams.length + 1;

      rows.push(
        `($${base}::uuid, $${base + 1}::text, $${base + 2}::int, $${base + 3}::text, $${base + 4}::int, $${base + 5}::vector)`
      );

      allParams.push(
        crypto.randomUUID(),
        documentRecord.id,
        idx,
        batch[j],
        Math.floor(idx * pagePerChunk) + 1,
        embeddingStr
      );
    }

    if (rows.length > 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" (id, "documentId", "chunkIndex", "chunkText", "pageNumber", embedding) VALUES ${rows.join(", ")} ON CONFLICT DO NOTHING`,
        ...allParams
      );
      totalCreated += batch.length;
    }
  }

  return {
    chunksCreated: totalCreated,
    fileName: documentRecord.title,
  };
}
