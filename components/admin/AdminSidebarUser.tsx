"use client";

import { UserButton, useUser, useClerk } from "@clerk/nextjs";

export function AdminSidebarUser() {
  const { user } = useUser();
  const { openUserProfile } = useClerk();

  return (
    <div className="flex items-center gap-2.5">
      <UserButton />
      <button
        onClick={() => openUserProfile()}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-xs font-medium text-zinc-700">
          {user?.fullName || user?.firstName || "Admin"}
        </p>
        <p className="truncate text-[10px] text-zinc-400">
          {user?.primaryEmailAddress?.emailAddress}
        </p>
      </button>
    </div>
  );
}
