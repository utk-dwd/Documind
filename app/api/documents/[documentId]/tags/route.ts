import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
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
  const { tags } = await req.json();

  if (!Array.isArray(tags)) {
    return NextResponse.json({ error: "tags must be an array" }, { status: 400 });
  }

  const doc = await prisma.document.update({
    where: { id: documentId },
    data: { tags },
  });

  return NextResponse.json(doc);
}
