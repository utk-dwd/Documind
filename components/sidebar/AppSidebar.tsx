"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";

interface SessionItem {
  id: string;
  title: string;
  updatedAt: string;
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fetchSessions = async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [pathname]);

  useEffect(() => {
    const handler = () => fetchSessions();
    window.addEventListener("documind:message-saved", handler);
    return () => window.removeEventListener("documind:message-saved", handler);
  }, []);

  const handleNewChat = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Conversation" }),
    });
    if (res.ok) {
      const session = await res.json();
      setSessions((prev) => {
        const exists = prev.find((s) => s.id === session.id);
        return exists ? prev : [session, ...prev];
      });

      if (pathname !== `/chat/${session.id}`) {
        router.push(`/chat/${session.id}`);
      }
    }
    setLoading(false);
  }, [router, pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNewChat]);

  const handleDelete = async (e: React.MouseEvent, session: SessionItem) => {
    e.stopPropagation();

    if (!confirm(`Delete "${session.title}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== session.id));

      if (pathname === `/chat/${session.id}`) {
        router.push("/chat");
      }
    }
  };

  if (collapsed) {
    return (
      <aside className="flex w-14 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
        <div className="flex items-center justify-center py-3">
          <button
            onClick={() => setCollapsed(false)}
            className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
            title="Expand sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 px-2">
          <button
            onClick={handleNewChat}
            disabled={loading}
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50"
            title="New Chat (Ctrl+K)"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex justify-center border-t border-zinc-200 p-2">
          <UserButton />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 max-md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-800">Documind</h2>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <div className="px-3">
        <button
          onClick={handleNewChat}
          disabled={loading}
          className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          <Plus className="size-4" />
          New Chat
          <span className="ml-auto text-[10px] text-zinc-400">⌘K</span>
        </button>
      </div>

      <nav className="mt-2 flex-1 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {sessions.map((session) => (
            <div key={session.id} className="group relative">
              <button
                onClick={() => router.push(`/chat/${session.id}`)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 pr-8 text-left text-sm transition-colors hover:bg-zinc-200/60 ${
                  pathname === `/chat/${session.id}`
                    ? "bg-zinc-200 text-zinc-900"
                    : "text-zinc-600"
                }`}
              >
                <MessageSquare className="size-3.5 shrink-0" />
                <span className="truncate">{session.title}</span>
              </button>
              <button
                onClick={(e) => handleDelete(e, session)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
                title="Delete session"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <div className="flex items-center gap-2.5">
          <UserButton />
          <button
            onClick={() => openUserProfile()}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-xs font-medium text-zinc-700">
              {user?.fullName || user?.firstName || "User"}
            </p>
            <p className="truncate text-[10px] text-zinc-400">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </button>
        </div>
      </div>
    </aside>
  );
}
