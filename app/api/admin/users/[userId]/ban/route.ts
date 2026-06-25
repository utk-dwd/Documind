import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/roles";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json().catch(() => ({}));
  const banned = body.banned ?? true;

  if (userId === currentUserId) {
    return NextResponse.json(
      { error: "Cannot ban your own account" },
      { status: 400 }
    );
  }

  const client = await clerkClient();
  await client.users.banUser(userId);

  if (!banned) {
    await client.users.unbanUser(userId);
  }

  return NextResponse.json({ success: true, banned });
}
