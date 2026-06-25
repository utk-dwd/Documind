import { prisma } from "@/lib/db";

export async function getSession(sessionId: string) {
  return prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getSessionForUser(
  sessionId: string,
  userId: string
) {
  return prisma.chatSession.findUnique({
    where: { id: sessionId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getSessionsByUser(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
}

export async function createSession(
  userId: string,
  title = "New Conversation"
) {
  return prisma.chatSession.create({
    data: { userId, title },
  });
}

export async function updateSessionTitle(
  sessionId: string,
  userId: string,
  title: string
) {
  return prisma.chatSession.update({
    where: { id: sessionId, userId },
    data: { title },
  });
}

export async function deleteSession(
  sessionId: string,
  userId: string
) {
  return prisma.chatSession.delete({
    where: { id: sessionId, userId },
  });
}
