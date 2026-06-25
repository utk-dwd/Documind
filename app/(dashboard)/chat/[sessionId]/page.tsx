import { ChatWindow } from "@/components/chat/ChatWindow";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionChatPage({ params }: Props) {
  const { sessionId } = await params;

  return <ChatWindow sessionId={sessionId} />;
}
