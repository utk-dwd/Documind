import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { ingestDocument } from "@/lib/rag/ingest";

const DATA_DIR = path.join(process.cwd(), "data");

const EXTENSION_MAP: Record<string, string> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".txt": "txt",
};

async function main() {
  const files = await fs.readdir(DATA_DIR);
  const supported = files.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ext in EXTENSION_MAP;
  });

  if (supported.length === 0) {
    console.log("No supported files found in /data directory.");
    console.log('Supported formats: .pdf, .docx, .txt');
    process.exit(0);
  }

  console.log(`Found ${supported.length} file(s) to ingest:\n`);
  let totalChunks = 0;

  for (const fileName of supported) {
    const filePath = path.join(DATA_DIR, fileName);
    const ext = path.extname(fileName).toLowerCase();
    const fileType = EXTENSION_MAP[ext];

    const title = fileName.replace(ext, "").replace(/[-_]/g, " ");
    const uploadedBy = process.env.DEFAULT_UPLOADER || "system";

    const existing = await prisma.document.findFirst({
      where: { fileName, status: "ACTIVE" },
    });

    if (existing) {
      console.log(
        `SKIPPED ${fileName} — already ingested (${existing.id})`
      );
      const count = await prisma.documentChunk.count({
        where: { documentId: existing.id },
      });
      totalChunks += count;
      continue;
    }

    const document = await prisma.document.create({
      data: {
        uploadedBy,
        fileName,
        title,
        fileType,
        filePath,
      },
    });

    try {
      const result = await ingestDocument(filePath, {
        id: document.id,
        title,
        fileType,
      });
      console.log(
        `  OK  ${fileName} → ${result.chunksCreated} chunks embedded`
      );
      totalChunks += result.chunksCreated;
    } catch (err) {
      console.error(`  ERR ${fileName}:`, err);
    }
  }

  console.log(`\nDone. ${totalChunks} total chunks in database.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
