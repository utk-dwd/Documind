"use client";

import { useState, useEffect as useEffectAlias } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Plus, MessageSquare } from "lucide-react";

interface SessionItem {
  id: string;
  title: string;
  updatedAt: string;
}

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
  };

  useEffectAlias(() => {
    fetchSessions();
  }, [pathname]);

  const handleNewChat = async () => {
    setLoading(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Conversation" }),
    });
    if (res.ok) {
      const session = await res.json();
      setSessions((prev) => [session, ...prev]);
      router.push(`/chat/${session.id}`);
    }
    setLoading(false);
  };

  return (
    <aside className="flex w-60 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-800">Documind</h2>
      </div>

      <div className="px-3">
        <button
          onClick={handleNewChat}
          disabled={loading}
          className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          <Plus className="size-4" />
          New Chat
        </button>
      </div>

      <nav className="mt-2 flex-1 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => router.push(`/chat/${session.id}`)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-200/60 ${
                pathname === `/chat/${session.id}`
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-600"
              }`}
            >
              <MessageSquare className="size-3.5 shrink-0" />
              <span className="truncate">{session.title}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <UserButton />
      </div>
    </aside>
  );
}
