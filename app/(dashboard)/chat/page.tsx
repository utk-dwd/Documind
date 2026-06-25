"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Conversation" }),
    })
      .then((res) => res.json())
      .then((session) => {
        router.replace(`/chat/${session.id}`);
      })
      .catch(() => {
        router.replace("/");
      });
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
      Creating a new conversation...
    </div>
  );
}
