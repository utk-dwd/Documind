import { prisma } from "@/lib/db";

export async function createMessage(data: {
  chatSessionId: string;
  role: string;
  content: string;
}) {
  return prisma.message.create({ data });
}

export async function getMessagesBySession(chatSessionId: string) {
  return prisma.message.findMany({
    where: { chatSessionId },
    orderBy: { createdAt: "asc" },
  });
}

export { getMessagesBySession as getSessionMessages };

export async function getLatestMessages(
  chatSessionId: string,
  limit = 10
) {
  return prisma.message.findMany({
    where: { chatSessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

interface SaveMessage {
  role: string;
  content: string;
}

export async function saveMessages(params: {
  sessionId: string;
  messages: SaveMessage[];
}) {
  const { sessionId, messages } = params;

  await prisma.$transaction(async (tx) => {
    await tx.message.deleteMany({ where: { chatSessionId: sessionId } });

    if (messages.length > 0) {
      await tx.message.createMany({
        data: messages.map((m) => ({
          chatSessionId: sessionId,
          role: m.role,
          content: m.content,
        })),
      });

      const firstUserMsg = messages.find((m) => m.role === "user");
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 80)
        : "New Conversation";

      await tx.chatSession.update({
        where: { id: sessionId },
        data: { title },
      });
    }
  });
}
