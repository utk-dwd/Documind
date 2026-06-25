import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/roles";
import { getDocument, updateDocumentStatus } from "@/lib/db/documents";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentId } = await params;
  const document = await getDocument(documentId);
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newStatus = document.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
  const updated = await updateDocumentStatus(documentId, newStatus);
  return NextResponse.json(updated);
}
