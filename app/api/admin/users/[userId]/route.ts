import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/roles";

export async function PATCH(
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
  const body = await req.json();
  const { role } = body;

  if (!role || !["admin", "editor", "viewer"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be admin, editor, or viewer." },
      { status: 400 }
    );
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const currentMeta = (user.publicMetadata ?? {}) as Record<string, unknown>;

  await client.users.updateUser(userId, {
    publicMetadata: { ...currentMeta, role },
  });

  return NextResponse.json({ success: true, role });
}

export async function DELETE(
  _req: Request,
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

  if (userId === currentUserId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ success: true });
}
