import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const role = getUserRole(
    (sessionClaims?.publicMetadata as Record<string, unknown>) ?? {}
  );

  if (role !== "admin") {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-500">Admin</h2>
        <nav className="mt-4 flex flex-col gap-1">
          <a href="/admin" className="rounded px-2 py-1 text-sm hover:bg-zinc-100">
            Dashboard
          </a>
          <a href="/admin/documents" className="rounded px-2 py-1 text-sm hover:bg-zinc-100">
            Documents
          </a>
          <a href="/admin/users" className="rounded px-2 py-1 text-sm hover:bg-zinc-100">
            Users
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
