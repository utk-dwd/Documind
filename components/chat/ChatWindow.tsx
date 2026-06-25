"use client";

import { useEffect, useState, useRef } from "react";
import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useThread,
} from "@assistant-ui/react";
import { Search, ArrowUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ChatRuntimeProvider } from "@/components/chat/ChatRuntimeProvider";
import type { UIMessage } from "@ai-sdk/react";

interface ServerMessage {
  role: string;
  content: string;
}

function toUIMessages(msgs: ServerMessage[]): UIMessage[] {
  return msgs
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m, i) => ({
      id: `init-${i}`,
      role: m.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: m.content }],
    }));
}

function UserBubble() {
  return (
    <div className="flex justify-end px-4 py-2">
      <MessagePrimitive.Parts
        components={{
          Text: ({ text }) => (
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
              {text}
            </div>
          ),
        }}
      />
    </div>
  );
}

function AssistantBubble() {
  return (
    <div className="px-4 py-2">
      <MessagePrimitive.Parts
        components={{
          Text: ({ text }) => (
            <div className="inline-block max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-100 bg-white/80 px-4 py-3 text-sm leading-relaxed text-zinc-700 shadow-sm backdrop-blur-sm">
              {text}
            </div>
          ),
        }}
      />
    </div>
  );
}

function StatusBar({ webSearchEnabled }: { webSearchEnabled: boolean }) {
  const isRunning = useThread((s) => s.isRunning);
  const [label, setLabel] = useState("Thinking...");
  const startRef = useRef(0);

  useEffect(() => {
    if (!isRunning) return;

    startRef.current = Date.now();
    setLabel(webSearchEnabled ? "Searching the web..." : "Thinking...");

    const t1 = setTimeout(() => {
      const t = (Date.now() - startRef.current) / 1000;
      if (webSearchEnabled && t > 3) setLabel("Sorting search results...");
    }, 3500);

    const t2 = setTimeout(() => {
      const t = (Date.now() - startRef.current) / 1000;
      if (webSearchEnabled && t > 7) setLabel("About to answer...");
    }, 7500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isRunning, webSearchEnabled]);

  if (!isRunning) return null;

  return (
    <div className="px-4 py-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/60 px-4 py-2 text-xs font-medium text-indigo-600">
        <Spinner className="size-3.5" />
        <span>{label}</span>
      </div>
    </div>
  );
}

interface Props {
  sessionId: string;
}

export function ChatWindow({ sessionId }: Props) {
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setInitialMessages([]);

    fetch(`/api/sessions/${sessionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages) {
          setInitialMessages(toUIMessages(data.messages));
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
        Loading conversation...
      </div>
    );
  }

  return (
    <ChatRuntimeProvider
      sessionId={sessionId}
      webSearchEnabled={webSearchEnabled}
      initialMessages={initialMessages}
    >
      <ThreadPrimitive.Root className="flex h-full flex-col">
        <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
          <ThreadPrimitive.Empty>
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              Ask anything about your knowledge base.
            </div>
          </ThreadPrimitive.Empty>

          <div className="mx-auto w-full max-w-2xl">
            <ThreadPrimitive.Messages
              components={{
                UserMessage: UserBubble,
                AssistantMessage: AssistantBubble,
              }}
            />
            <StatusBar webSearchEnabled={webSearchEnabled} />
          </div>

          <ThreadPrimitive.ScrollToBottom />
        </ThreadPrimitive.Viewport>

        <div className="border-t bg-white/80 backdrop-blur-sm p-4">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <button
              onClick={() => setWebSearchEnabled((prev) => !prev)}
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                webSearchEnabled
                  ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                  : "border-zinc-200 text-zinc-400 hover:border-zinc-300"
              }`}
              title="Toggle web search"
            >
              <Search className="size-3.5" />
            </button>

            <ComposerPrimitive.Root className="flex flex-1 items-end gap-2">
              <ComposerPrimitive.Input
                placeholder="Ask a question..."
                className="min-h-[48px] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                rows={1}
              />
              <ComposerPrimitive.Send className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white transition-colors hover:bg-zinc-800 disabled:opacity-40">
                <ArrowUp className="size-4" />
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
          </div>
        </div>
      </ThreadPrimitive.Root>
    </ChatRuntimeProvider>
  );
}
