import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/roles";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await clerkClient();
  const response = await client.users.getUserList({ limit: 100 });

  const users = response.data.map((user) => ({
    id: user.id,
    email:
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? "-",
    firstName: user.firstName ?? "-",
    lastName: user.lastName ?? "",
    role: (user.publicMetadata as Record<string, unknown>)?.role ?? "viewer",
    createdAt: new Date(user.createdAt).toLocaleDateString(),
  }));

  return NextResponse.json({ users });
}
