"use client";

import { useMemo, type ReactNode } from "react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import type { UIMessage } from "@ai-sdk/react";

interface Props {
  sessionId: string;
  webSearchEnabled: boolean;
  initialMessages: UIMessage[];
  children: ReactNode;
}

export function ChatRuntimeProvider({
  sessionId,
  webSearchEnabled,
  initialMessages,
  children,
}: Props) {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: `/api/chat/${sessionId}`,
        body: { webSearchEnabled },
      }),
    [sessionId, webSearchEnabled]
  );

  const runtime = useChatRuntime({
    transport,
    messages: initialMessages,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
