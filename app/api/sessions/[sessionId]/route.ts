import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getSessionForUser,
  updateSessionTitle,
  deleteSession,
} from "@/lib/db/sessions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const session = await getSessionForUser(sessionId, userId);
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const { title } = await req.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const existing = await getSessionForUser(sessionId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await updateSessionTitle(sessionId, userId, title);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const existing = await getSessionForUser(sessionId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteSession(sessionId, userId);
  return NextResponse.json({ success: true });
}
