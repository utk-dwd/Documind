import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getCurrentUserRole();
  if (role !== "admin") redirect("/chat");

  const client = await clerkClient();
  const response = await client.users.getUserList({ limit: 100 });

  const users = response.data.map((user) => ({
    id: user.id,
    email:
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? "—",
    firstName: user.firstName ?? "—",
    lastName: user.lastName ?? "",
    role: (user.publicMetadata as Record<string, unknown>)?.role ?? "viewer",
    createdAt: new Date(user.createdAt).toLocaleDateString(),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Users</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {users.length} registered users
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th className="px-4 py-3 font-medium text-zinc-600">User</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Email</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Role</th>
              <th className="px-4 py-3 font-medium text-zinc-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <span className="font-medium text-zinc-700">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {String(user.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {user.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
