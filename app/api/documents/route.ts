import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/roles";
import {
  createDocument,
  listDocuments,
} from "@/lib/db/documents";
import { ingestDocument } from "@/lib/rag/ingest";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") === "ARCHIVED" ? "ARCHIVED" as const
    : searchParams.get("status") === "ACTIVE" ? "ACTIVE" as const
    : undefined;

  const result = await listDocuments({ page, limit, search, status });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded" },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name).toLowerCase();
  const fileTypeMap: Record<string, string> = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".txt": "txt",
  };

  const fileType = fileTypeMap[ext];
  if (!fileType) {
    return NextResponse.json(
      { error: `Unsupported file type: ${ext}. Use .pdf, .docx, or .txt` },
      { status: 400 }
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(UPLOAD_DIR, file.name);
  await fs.writeFile(filePath, buffer);

  const title = formData.get("title")?.toString() || file.name.replace(ext, "");

  const document = await createDocument({
    uploadedBy: userId,
    fileName: file.name,
    title,
    fileType,
    filePath,
  });

  ingestDocument(filePath, {
    id: document.id,
    title,
    fileType,
  }).catch((err) => {
    console.error(`Ingestion failed for ${file.name}:`, err);
  });

  return NextResponse.json(document, { status: 202 });
}
