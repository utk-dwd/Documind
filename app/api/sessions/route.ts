import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionsByUser, createSession } from "@/lib/db/sessions";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await getSessionsByUser(userId);
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json().catch(() => ({}));
  const session = await createSession(userId, title || "New Conversation");
  return NextResponse.json(session, { status: 201 });
}
