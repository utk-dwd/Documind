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
