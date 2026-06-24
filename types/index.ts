export interface ChatSessionMeta {
  id: string;
  userId: string;
  title: string;
  webSearch: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageMeta {
  id: string;
  chatSessionId: string;
  role: "user" | "assistant" | "tool";
  content: string;
  createdAt: Date;
}

export interface DocumentMeta {
  id: string;
  uploadedBy: string;
  fileName: string;
  title: string;
  fileType: "pdf" | "docx" | "txt";
  filePath: string;
  status: "ACTIVE" | "ARCHIVED";
  tags: string[];
  uploadedAt: Date;
}

export interface DocumentChunkMeta {
  id: string;
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  pageNumber: number | null;
}

export interface RetrievalResult {
  chunkText: string;
  chunkIndex: number;
  documentTitle: string;
  fileName: string;
  similarity: number;
}
