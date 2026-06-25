import { clerkClient } from "@clerk/nextjs/server";

export type Role = "admin" | "editor" | "viewer";

export function getUserRole(
  publicMetadata: Record<string, unknown>
): Role {
  const role = publicMetadata.role;
  if (role === "admin" || role === "editor" || role === "viewer") {
    return role;
  }
  return "viewer";
}

export async function getCurrentUserRole(): Promise<Role> {
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return "viewer";

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return getUserRole((user.publicMetadata as Record<string, unknown>) ?? {});
}

export async function requireAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "admin";
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  editor: 2,
  viewer: 1,
};

export function hasRole(
  userRole: Role,
  requiredRole: Role
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
