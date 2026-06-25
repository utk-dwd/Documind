import { prisma } from "@/lib/db";
import type { DocumentStatus, Prisma } from "@prisma/client";

export async function createDocument(data: {
  uploadedBy: string;
  fileName: string;
  title: string;
  fileType: string;
  filePath: string;
  tags?: string[];
}) {
  return prisma.document.create({
    data: {
      ...data,
      tags: data.tags ?? [],
    },
  });
}

export async function listDocuments(params: {
  page: number;
  limit: number;
  status?: DocumentStatus;
  search?: string;
}) {
  const { page, limit, status, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.DocumentWhereInput = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { fileName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      skip,
      take: limit,
      include: { _count: { select: { chunks: true } } },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    documents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getDocumentsByUser(userId: string) {
  return prisma.document.findMany({
    where: { uploadedBy: userId, status: "ACTIVE" },
    orderBy: { uploadedAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });
}

export async function getAllActiveDocuments() {
  return prisma.document.findMany({
    where: { status: "ACTIVE" },
    orderBy: { uploadedAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });
}

export async function getDocument(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    include: { chunks: { orderBy: { chunkIndex: "asc" } } },
  });
}

export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus
) {
  return prisma.document.update({
    where: { id: documentId },
    data: {
      status,
      archivedAt: status === "ARCHIVED" ? new Date() : null,
    },
  });
}

export async function deleteDocument(documentId: string) {
  return prisma.document.delete({ where: { id: documentId } });
}
