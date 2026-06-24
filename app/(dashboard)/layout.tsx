"use client";

import { UserButton, useUser } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-500">Documind</h2>
        <div className="mt-auto flex items-center gap-2 pt-4">
          <UserButton />
          {user && (
            <span className="text-sm text-zinc-600">
              {user.firstName ?? user.username ?? "User"}
            </span>
          )}
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
