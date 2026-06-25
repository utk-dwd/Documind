"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Ban, Trash2, Loader2 } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const changeRole = async (user: UserItem) => {
    const options = ["admin", "editor", "viewer"];
    const current = options.indexOf(user.role);
    const next = options[(current + 1) % options.length];

    if (!confirm(`Change ${user.email} role from ${user.role} to ${next}?`)) return;

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });

    if (res.ok) {
      fetchUsers();
    }
  };

  const banUser = async (user: UserItem) => {
    if (!confirm(`Ban ${user.email}?`)) return;

    const res = await fetch(`/api/admin/users/${user.id}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: true }),
    });

    if (res.ok) {
      fetchUsers();
    }
  };

  const deleteUser = async (user: UserItem) => {
    if (!confirm(`Permanently delete ${user.email}? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin" /> Loading users...
      </div>
    );
  }

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
              <th className="px-4 py-3 font-medium text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
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
                        : user.role === "editor"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {user.createdAt}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => changeRole(user)}
                      className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
                      title="Change role"
                    >
                      <Shield className="size-4" />
                    </button>
                    <button
                      onClick={() => banUser(user)}
                      className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                      title="Ban user"
                    >
                      <Ban className="size-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(user)}
                      className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Delete user"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
