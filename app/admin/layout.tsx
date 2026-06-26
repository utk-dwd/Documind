import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { AdminSidebarUser } from "@/components/admin/AdminSidebarUser";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const role = await getCurrentUserRole();
  if (role !== "admin") {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-500">Admin</h2>
        <nav className="mt-4 flex flex-1 flex-col gap-1">
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
        <div className="border-t border-zinc-200 pt-3">
          <AdminSidebarUser />
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
