# 🧠 DocuMind — AI-Powered Knowledge Management Platform

> A full-stack, production-ready platform that enables organizations to upload, organize, and interact with documents through a conversational AI interface — powered by RAG, DeepSeek, Clerk Auth, and PostgreSQL with pgvector.

---

## 📌 Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Vercel AI SDK — The Chat Engine](#vercel-ai-sdk--the-chat-engine)
6. [RAG Pipeline — How It Works](#rag-pipeline--how-it-works)
7. [Role-Based Access Control with Clerk](#role-based-access-control-with-clerk)
8. [Web Search Toggle](#web-search-toggle)
9. [Database Schema](#database-schema)
10. [Project Structure](#project-structure)
11. [Initial Data — North-East India Tourist Places](#initial-data--north-east-india-tourist-places)
12. [Environment Variables](#environment-variables)
13. [Setup & Installation](#setup--installation)
14. [Step-by-Step Build Plan](#step-by-step-build-plan)
15. [API Routes Reference](#api-routes-reference)
16. [Adding More Documents](#adding-more-documents)
17. [Contributing](#contributing)

---

## Project Overview

**DocuMind** is an AI-powered knowledge management platform that enables organizations to upload, organize, and interact with their documents through a conversational interface.

Users securely upload documents and the platform automatically generates searchable knowledge indexes, making information retrieval fast, accurate, and context-aware. Users ask natural language questions and receive relevant answers derived from the uploaded content, eliminating the need to manually search through large document repositories.

The initial knowledge base is seeded with **Wikipedia pages on major tourist destinations of North-East India** (saved as PDFs), demonstrating the platform's RAG capabilities on a real-world dataset. The same platform architecture scales to any organizational document corpus.

### Why This Architecture?

| Concern | Solution in this project |
|---------|--------------------------|
| Auth complexity | **Clerk** — prebuilt UI, OAuth, roles, sessions in < 30 min |
| Hallucination-free answers | **RAG with pgvector** — answers only from uploaded documents |
| Real-time streaming chat | **Vercel AI SDK** — `streamText` + `useChat` hook |
| Fast LLM at low cost | **DeepSeek V3** via `@ai-sdk/deepseek` |
| External info augmentation | **Web search toggle** — Tavily tool via AI SDK |
| Type safety end-to-end | **TypeScript + Prisma** throughout |

---

## Key Features

- 🔐 **Clerk Authentication** — Sign in via Google, GitHub, or email. Prebuilt UI, MFA, session management out of the box
- 👥 **Role-Based Access Control** — `admin` role for document management and dashboard; `user` role for chat
- 📄 **Document Upload & Indexing** — Upload PDFs, DOCX, or TXT files; auto-parsed, chunked, and embedded into pgvector
- 💬 **Conversational Chat Interface** — Ask natural language questions; answers grounded in uploaded documents
- 🔄 **Persistent Chat Sessions** — Full message history saved per user; resume any past conversation
- 🗂️ **Multi-Session Support** — Manage, rename, and delete multiple conversation threads
- 🌐 **Web Search Toggle** — Enable or disable real-time web search per session to augment document-based answers
- 🗃️ **Document Archiving** — Active/archived lifecycle management; archived docs excluded from retrieval
- 🔍 **Document Search & Filtering** — Search by title, type, date, tags; paginated list view
- 📊 **Admin Dashboard** — Manage users, documents, archived content, and chat activity from a central panel
- ⚡ **Streaming Responses** — Token-by-token streaming from DeepSeek directly to the React UI

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router), React 19 | Full-stack framework, SSR, routing |
| **Styling** | Tailwind CSS v4, shadcn/ui | UI components and design system |
| **Language** | TypeScript (strict mode) | End-to-end type safety |
| **Auth** | Clerk (`@clerk/nextjs`) | Authentication, OAuth, RBAC, session management |
| **Database** | PostgreSQL 16 + `pgvector` extension | Relational data + vector similarity search |
| **ORM** | Prisma v6 | Type-safe DB queries and migrations |
| **LLM** | DeepSeek V3 via `@ai-sdk/deepseek` | Primary chat model (OpenAI-compatible, cheap, fast) |
| **Embeddings** | OpenAI `text-embedding-3-small` | Convert text chunks to 1536-dim vectors for RAG |
| **AI SDK** | Vercel AI SDK v4 (`ai`, `@ai-sdk/react`) | `streamText` backend + `useChat` frontend hook |
| **Web Search** | Tavily Search API (AI SDK tool) | Optional external search augmentation |
| **PDF Parsing** | `pdf-parse` npm | Extract text from uploaded PDF files |
| **DOCX Parsing** | `mammoth` npm | Extract text from Word documents |
| **File Storage** | Local `/uploads` folder (dev) | Store raw uploaded files |

---

## System Architecture

```
╔═══════════════════════════════════════════════════════════════════════╗
║                          USER BROWSER                                 ║
║                                                                       ║
║  ┌────────────────┐    ┌──────────────────────────────────────────┐  ║
║  │  Clerk Sign-In │    │           App Layout                     │  ║
║  │  (prebuilt UI) │    │  ┌──────────────┐  ┌──────────────────┐ │  ║
║  └───────┬────────┘    │  │   Sidebar    │  │   Chat Window    │ │  ║
║          │             │  │  (sessions)  │  │  (useChat hook)  │ │  ║
║          │             │  └──────────────┘  └────────┬─────────┘ │  ║
║          │             └──────────────────────────────┼───────────┘  ║
╚══════════╪══════════════════════════════════════════════════════════╪═╝
           │ JWT                                         │ POST + SSE
           ▼                                             ▼
╔══════════════════════════════════════════════════════════════════════╗
║                     NEXT.JS SERVER (App Router)                      ║
║                                                                      ║
║  middleware.ts → clerkMiddleware() → protect all non-public routes   ║
║                                                                      ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │  API Routes                                                     │ ║
║  │                                                                 │ ║
║  │  /api/chat/[sessionId]  ← Main chat endpoint (streaming)        │ ║
║  │  /api/sessions          ← CRUD for chat sessions                │ ║
║  │  /api/documents         ← Upload, list, archive documents       │ ║
║  │  /api/ingest            ← Trigger re-indexing                   │ ║
║  │  /api/admin/*           ← Admin-only dashboard data             │ ║
║  └───────────────────────┬─────────────────────────────────────────┘ ║
║                          │                                           ║
║  ┌───────────────────────▼─────────────────────────────────────────┐ ║
║  │                  RAG PIPELINE  (lib/rag/)                       │ ║
║  │                                                                 │ ║
║  │  1. Embed user query  →  OpenAI text-embedding-3-small          │ ║
║  │  2. Similarity search →  pgvector cosine distance               │ ║
║  │  3. Build prompt      →  system + chunks + session history      │ ║
║  │  4. streamText()      →  @ai-sdk/deepseek (DeepSeek V3)         │ ║
║  │  5. onFinish()        →  save messages to PostgreSQL            │ ║
║  │  6. Web search tool   →  Tavily (if toggle is ON)               │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════╝
           │                              │
           ▼                              ▼
╔══════════════════╗          ╔═══════════════════════════════════════╗
║  CLERK (External)║          ║       POSTGRESQL DATABASE             ║
║                  ║          ║                                       ║
║  • OAuth tokens  ║          ║  • chat_sessions                      ║
║  • User profiles ║          ║  • messages                           ║
║  • Roles/meta    ║          ║  • documents                          ║
║  • Session JWTs  ║          ║  • document_chunks  (+ pgvector)      ║
╚══════════════════╝          ╚═══════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════╗
║                  DOCUMENT INGESTION PIPELINE (Offline / On-upload)    ║
║                                                                       ║
║  File Upload (PDF / DOCX / TXT)                                       ║
║      │                                                                ║
║      ├── pdf-parse / mammoth  →  Raw text extraction                  ║
║      │                                                                ║
║      ├── Recursive text splitter  →  ~500 token overlapping chunks    ║
║      │                                                                ║
║      ├── OpenAI Embeddings API  →  float[1536] per chunk              ║
║      │                                                                ║
║      └── INSERT INTO document_chunks (text, embedding, document_id)   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Vercel AI SDK — The Chat Engine

This section answers the core question: **how do you efficiently wire up Next.js backend + frontend for streaming chat with persistent sessions?**

The Vercel AI SDK (v4+) handles this beautifully with two parts that work together.

### Backend — `app/api/chat/[sessionId]/route.ts`

```typescript
import { streamText, appendResponseMessages } from 'ai'
import { deepseek } from '@ai-sdk/deepseek'
import { auth } from '@clerk/nextjs/server'
import { tool } from 'ai'
import { tavilySearch } from '@/lib/tools/tavily'
import { retrieveContext } from '@/lib/rag/retrieval'
import { getSessionMessages, saveMessages } from '@/lib/db/messages'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  // 1. Auth check via Clerk
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { sessionId } = await params
  const { messages, webSearchEnabled } = await req.json()

  // 2. Get the latest user message for RAG retrieval
  const latestUserMessage = messages.at(-1)?.content ?? ''

  // 3. Pull relevant chunks from pgvector
  const ragContext = await retrieveContext(latestUserMessage, { topK: 5 })

  // 4. Build the tools object (web search is conditional)
  const tools = webSearchEnabled
    ? { web_search: tool({ description: 'Search the web', ...tavilySearch }) }
    : undefined

  // 5. Stream response from DeepSeek
  const result = streamText({
    model: deepseek('deepseek-chat'),       // DeepSeek V3 — cheap, fast, capable
    system: buildSystemPrompt(ragContext),  // RAG context injected here
    messages,                              // Full session history from useChat
    tools,
    maxSteps: webSearchEnabled ? 3 : 1,   // Allow tool loops if web search on
    onFinish: async ({ response }) => {
      // 6. Persist messages to PostgreSQL after stream completes
      await saveMessages({
        sessionId,
        userId,
        messages: appendResponseMessages({
          messages,
          responseMessages: response.messages,
        }),
      })
    },
  })

  // 7. Return SSE stream to useChat on the client
  return result.toDataStreamResponse()
}
```

### Frontend — `components/chat/ChatWindow.tsx`

```typescript
'use client'
import { useChat } from '@ai-sdk/react'

interface Props {
  sessionId: string
  initialMessages: Message[]   // Loaded from DB on page load for session resumption
  webSearchEnabled: boolean
}

export function ChatWindow({ sessionId, initialMessages, webSearchEnabled }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/chat/${sessionId}`,
    initialMessages,             // ← This is how you resume past sessions
    body: { webSearchEnabled },  // Extra body fields forwarded to the API route
    onError: (err) => console.error('Chat error:', err),
  })

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </div>
  )
}
```

### How Session Persistence Works

```
User navigates to /chat/[sessionId]
        │
        ▼
Page Server Component:
  const messages = await getSessionMessages(sessionId)  // Load from DB
  return <ChatWindow initialMessages={messages} ... />
        │
        ▼
useChat({ initialMessages })
  → Pre-populates the chat UI with past messages
  → User types a new message and submits
        │
        ▼
POST /api/chat/[sessionId]
  → messages array contains FULL history (past + new)
  → DeepSeek sees the full conversation for coherent replies
  → onFinish() saves the new messages to the DB
        │
        ▼
Next page load: same flow, now with updated history
```

The key insight: **`useChat` manages messages in React state during a session. `initialMessages` seeds it from the DB. `onFinish` persists back to the DB.** No extra state management library needed.

### DeepSeek Setup with Vercel AI SDK

```typescript
// lib/llm.ts
import { createDeepSeek } from '@ai-sdk/deepseek'

export const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
})

// Models available:
// deepseek('deepseek-chat')      → DeepSeek V3 — best for chat/RAG (cheap)
// deepseek('deepseek-reasoner')  → DeepSeek R1 — chain-of-thought reasoning
```

> **Note:** DeepSeek R1 (`deepseek-reasoner`) does NOT support tool calling, so if web search is enabled, always use `deepseek-chat`. You can switch models dynamically based on the `webSearchEnabled` flag.

---

## RAG Pipeline — How It Works

### Phase 1 — Ingestion (triggered on document upload)

```
Uploaded File (PDF / DOCX / TXT)
  │
  ├─→ Extract raw text
  │     PDF  → pdf-parse
  │     DOCX → mammoth
  │     TXT  → fs.readFileSync
  │
  ├─→ Clean text (strip headers, page numbers, excessive whitespace)
  │
  ├─→ Recursive text splitter
  │     chunk_size    = 500 tokens (~375 words)
  │     chunk_overlap = 50 tokens  (maintains context at boundaries)
  │
  ├─→ OpenAI text-embedding-3-small
  │     Batch 20 chunks per API call to respect rate limits
  │     Each chunk → float[1536] embedding vector
  │
  └─→ INSERT INTO document_chunks
        (document_id, chunk_index, chunk_text, page_number, embedding)
```

### Phase 2 — Retrieval (every user message)

```
User query: "Which national parks in Assam are UNESCO World Heritage Sites?"
  │
  ├─→ Embed query → float[1536] vector via OpenAI
  │
  ├─→ pgvector cosine similarity search:
  │
  │     SELECT chunk_text, source_file,
  │            1 - (embedding <=> $1::vector) AS similarity
  │     FROM document_chunks dc
  │     JOIN documents d ON dc.document_id = d.id
  │     WHERE d.status = 'active'          -- exclude archived docs
  │     ORDER BY similarity DESC
  │     LIMIT 5
  │
  ├─→ Top-5 chunks injected into system prompt:
  │
  │     [SYSTEM]
  │     You are DocuMind, a knowledge assistant.
  │     Answer ONLY using the context below.
  │     If the answer is not in the context, say so.
  │
  │     --- CONTEXT ---
  │     [chunk 1 text] (source: kaziranga-national-park.pdf)
  │     [chunk 2 text] (source: assam-tourism.pdf)
  │     ...
  │
  │     [HISTORY] last 20 messages from this session
  │     [USER]    Which national parks in Assam...?
  │
  └─→ Stream DeepSeek response → save to DB → render in UI
```

---

## Role-Based Access Control with Clerk

Clerk handles authentication externally — **no auth tables in your PostgreSQL database**. Roles are stored in Clerk's `publicMetadata` per user.

### Setting a Role (Admin Operation)

```typescript
// In Clerk Dashboard OR via Clerk Backend API:
// Set user.publicMetadata = { role: 'admin' }

// lib/auth/roles.ts
import { auth, currentUser } from '@clerk/nextjs/server'

export type UserRole = 'admin' | 'user'

export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser()
  return (user?.publicMetadata?.role as UserRole) ?? 'user'
}

export async function requireAdmin() {
  const role = await getUserRole()
  if (role !== 'admin') {
    throw new Error('Forbidden: admin access required')
  }
}
```

### Route Protection in Middleware

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()   // Redirect to sign-in if not authenticated
  }
  // Admin route check is done inside the route handler via requireAdmin()
})
```

### Access Matrix

| Feature | `user` | `admin` |
|---------|--------|---------|
| Chat with documents | ✅ | ✅ |
| View own session history | ✅ | ✅ |
| Upload documents | ❌ | ✅ |
| Archive / delete documents | ❌ | ✅ |
| View all users | ❌ | ✅ |
| Access `/admin` dashboard | ❌ | ✅ |
| Re-trigger ingestion | ❌ | ✅ |

---

## Web Search Toggle

When the user enables web search (a toggle in the chat UI), the API route adds a Tavily search tool to the `streamText` call. DeepSeek decides when to call it.

```typescript
// lib/tools/tavily.ts
import { tool } from 'ai'
import { z } from 'zod'

export const webSearchTool = tool({
  description: 'Search the web for current information not in the document base',
  parameters: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 3,
        include_answer: true,
      }),
    })
    const data = await res.json()
    return {
      results: data.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    }
  },
})
```

The toggle state is stored in React local state on the frontend and sent as `webSearchEnabled: boolean` in the request body. The API route uses this to conditionally include the tool.

> ⚠️ **Important:** Use `deepseek-chat` (DeepSeek V3) when web search is enabled. `deepseek-reasoner` (R1) does not support tool calling.

---

## Database Schema

> Clerk manages all auth data externally. Your PostgreSQL only needs application data.

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ------------------------------------------------------------------
// Application tables (no NextAuth tables — Clerk handles auth)
// ------------------------------------------------------------------

model ChatSession {
  id          String    @id @default(cuid())
  userId      String                         // Clerk userId (e.g. "user_2abc...")
  title       String    @default("New Conversation")
  webSearch   Boolean   @default(false)      // Per-session web search toggle
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  messages    Message[]

  @@index([userId])
}

model Message {
  id            String      @id @default(cuid())
  chatSessionId String
  role          String      // "user" | "assistant" | "tool"
  content       String      @db.Text
  createdAt     DateTime    @default(now())
  chatSession   ChatSession @relation(fields: [chatSessionId], references: [id], onDelete: Cascade)
}

model Document {
  id          String          @id @default(cuid())
  uploadedBy  String                           // Clerk userId of uploader
  fileName    String
  title       String
  fileType    String                           // "pdf" | "docx" | "txt"
  filePath    String                           // Path on disk or storage URL
  status      DocumentStatus  @default(ACTIVE)
  tags        String[]        @default([])
  uploadedAt  DateTime        @default(now())
  archivedAt  DateTime?
  chunks      DocumentChunk[]

  @@index([status])
  @@index([uploadedBy])
}

enum DocumentStatus {
  ACTIVE
  ARCHIVED
}

model DocumentChunk {
  id          String   @id @default(uuid()) @db.Uuid
  documentId  String
  chunkIndex  Int
  chunkText   String   @db.Text
  pageNumber  Int?
  // embedding column added via raw SQL migration (pgvector):
  // ALTER TABLE "DocumentChunk" ADD COLUMN embedding VECTOR(1536);
  createdAt   DateTime @default(now())
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId])
}
```

### Raw SQL for pgvector (run after Prisma migration)

```sql
-- prisma/migrations/add_vector_column.sql

-- Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add the embedding column to DocumentChunk
ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Create IVFFlat index for fast approximate nearest-neighbor search
-- (Run AFTER you have at least a few hundred rows of data)
CREATE INDEX IF NOT EXISTS document_chunk_embedding_idx
  ON "DocumentChunk"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Similarity Search Query

```typescript
// lib/rag/retrieval.ts
import { prisma } from '@/lib/db'
import { openai } from '@/lib/embeddings'

export async function retrieveContext(query: string, { topK = 5 } = {}) {
  // 1. Embed the query
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })
  const queryVector = data[0].embedding

  // 2. Cosine similarity search via raw SQL (Prisma doesn't support VECTOR yet)
  const chunks = await prisma.$queryRaw<Array<{ chunk_text: string; similarity: number }>>`
    SELECT dc.chunk_text,
           1 - (dc.embedding <=> ${queryVector}::vector) AS similarity
    FROM "DocumentChunk" dc
    JOIN "Document" d ON dc."documentId" = d.id
    WHERE d.status = 'ACTIVE'
    ORDER BY similarity DESC
    LIMIT ${topK}
  `
  return chunks
}
```

---

## Project Structure

```
documind/
│
├── app/                                      # Next.js App Router
│   ├── (public)/                             # Unauthenticated pages
│   │   ├── page.tsx                          # Landing / marketing page
│   │   ├── sign-in/[[...sign-in]]/page.tsx   # Clerk hosted sign-in
│   │   └── sign-up/[[...sign-up]]/page.tsx   # Clerk hosted sign-up
│   │
│   ├── (dashboard)/                          # Protected — requires auth
│   │   ├── layout.tsx                        # Sidebar layout
│   │   ├── chat/
│   │   │   ├── page.tsx                      # New conversation (auto-creates session)
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx                  # Resume existing session
│   │   ├── history/
│   │   │   └── page.tsx                      # All past sessions
│   │   └── documents/
│   │       └── page.tsx                      # User's doc list (view only)
│   │
│   ├── admin/                                # Admin-only pages
│   │   ├── layout.tsx                        # Admin layout with role check
│   │   ├── page.tsx                          # Dashboard overview
│   │   ├── documents/page.tsx                # Upload, archive, delete docs
│   │   ├── users/page.tsx                    # User management
│   │   └── sessions/page.tsx                 # Chat activity overview
│   │
│   └── api/
│       ├── chat/
│       │   └── [sessionId]/route.ts          # ← Core: streamText + RAG + onFinish
│       ├── sessions/
│       │   ├── route.ts                      # GET all / POST new session
│       │   └── [sessionId]/route.ts          # GET messages / DELETE session
│       ├── documents/
│       │   ├── route.ts                      # GET list / POST upload
│       │   └── [documentId]/
│       │       ├── route.ts                  # GET / DELETE document
│       │       └── archive/route.ts          # POST to archive/unarchive
│       ├── ingest/route.ts                   # POST re-trigger ingestion (admin)
│       └── webhooks/clerk/route.ts           # Clerk webhook (user created events)
│
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx                    # useChat hook, message rendering
│   │   ├── MessageBubble.tsx                 # User and assistant message styles
│   │   ├── ChatInput.tsx                     # Textarea + submit + web search toggle
│   │   └── SourceBadge.tsx                   # Shows which document was cited
│   ├── sidebar/
│   │   ├── AppSidebar.tsx                    # Session list + nav
│   │   └── SessionItem.tsx                   # Individual session row
│   ├── documents/
│   │   ├── DocumentUpload.tsx                # Drag-and-drop upload zone
│   │   ├── DocumentCard.tsx                  # Document list item
│   │   └── DocumentFilters.tsx               # Search/filter bar
│   ├── admin/
│   │   ├── StatCard.tsx                      # Dashboard stat tiles
│   │   └── UserTable.tsx                     # User management table
│   └── ui/                                   # shadcn/ui components
│
├── lib/
│   ├── db.ts                                 # Prisma client singleton
│   ├── llm.ts                                # DeepSeek model config via @ai-sdk/deepseek
│   ├── embeddings.ts                         # OpenAI client for embeddings only
│   ├── auth/
│   │   └── roles.ts                          # getUserRole, requireAdmin helpers
│   ├── rag/
│   │   ├── ingest.ts                         # File → chunk → embed → store
│   │   ├── chunker.ts                        # Recursive text splitter
│   │   ├── retrieval.ts                      # Query → embed → pgvector search
│   │   └── prompt.ts                         # System prompt builder
│   ├── tools/
│   │   └── tavily.ts                         # Web search tool definition
│   └── db/
│       ├── sessions.ts                        # DB helpers for ChatSession
│       ├── messages.ts                        # DB helpers for Message
│       └── documents.ts                       # DB helpers for Document
│
├── scripts/
│   └── ingest-pdfs.ts                        # CLI: bulk-ingest all /data PDFs
│
├── data/                                     # Initial Wikipedia PDFs (NE India)
│   ├── kaziranga-national-park.pdf
│   ├── majuli.pdf
│   └── ... (see section below)
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── add_vector_column.sql
│
├── types/
│   └── index.ts                              # Shared TypeScript interfaces
│
├── middleware.ts                             # Clerk route protection
├── .env.local
├── .env.example
├── next.config.ts
└── README.md
```

---

## Initial Data — North-East India Tourist Places

Download these Wikipedia pages using **Ctrl+P → Save as PDF** (browser print method). Save to the `/data` directory. These seed the initial knowledge base.

| Place | State | Wikipedia URL |
|-------|-------|--------------|
| Kaziranga National Park | Assam | `wikipedia.org/wiki/Kaziranga_National_Park` |
| Majuli | Assam | `wikipedia.org/wiki/Majuli` |
| Kamakhya Temple | Assam | `wikipedia.org/wiki/Kamakhya_Temple` |
| Tawang Monastery | Arunachal Pradesh | `wikipedia.org/wiki/Tawang_Monastery` |
| Ziro Valley | Arunachal Pradesh | `wikipedia.org/wiki/Ziro,_Arunachal_Pradesh` |
| Shillong | Meghalaya | `wikipedia.org/wiki/Shillong` |
| Cherrapunji | Meghalaya | `wikipedia.org/wiki/Cherrapunji` |
| Living Root Bridges | Meghalaya | `wikipedia.org/wiki/Living_root_bridges` |
| Nohkalikai Falls | Meghalaya | `wikipedia.org/wiki/Nohkalikai_Falls` |
| Loktak Lake | Manipur | `wikipedia.org/wiki/Loktak_Lake` |
| Dzükou Valley | Nagaland | `wikipedia.org/wiki/Dz%C3%BCkou_Valley` |
| Kohima | Nagaland | `wikipedia.org/wiki/Kohima` |
| Gurudongmar Lake | Sikkim | `wikipedia.org/wiki/Gurudongmar_Lake` |
| Pelling | Sikkim | `wikipedia.org/wiki/Pelling` |
| Aizawl | Mizoram | `wikipedia.org/wiki/Aizawl` |
| Agartala | Tripura | `wikipedia.org/wiki/Agartala` |
| Neermahal | Tripura | `wikipedia.org/wiki/Neermahal` |

> ⚠️ Use **browser Print → Save as PDF**. Do NOT use Wikipedia's built-in "Download as PDF" — it produces a two-column layout that `pdf-parse` handles poorly.

---

## Environment Variables

```bash
# .env.local

# ─── Database ─────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/documind"

# ─── Clerk Auth ───────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."    # From Clerk Dashboard
CLERK_SECRET_KEY="sk_test_..."                     # From Clerk Dashboard
CLERK_WEBHOOK_SECRET="whsec_..."                   # From Clerk Webhook config

# Clerk redirect URLs (Clerk default — no need to change)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/chat"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/chat"

# ─── AI APIs ──────────────────────────────────────────────────────────
DEEPSEEK_API_KEY="sk-..."                          # From platform.deepseek.com
OPENAI_API_KEY="sk-..."                            # For embeddings only (text-embedding-3-small)

# ─── Web Search ───────────────────────────────────────────────────────
TAVILY_API_KEY="tvly-..."                          # From tavily.com

# ─── RAG Config ───────────────────────────────────────────────────────
RAG_TOP_K=5
RAG_CHUNK_SIZE=500
RAG_CHUNK_OVERLAP=50
```

---

## Setup & Installation

### Prerequisites

- Node.js v20+
- PostgreSQL 16 with `pgvector` extension
- `pnpm` (recommended)
- Clerk account (free at clerk.com — up to 10,000 MAU)
- DeepSeek API key (platform.deepseek.com)
- OpenAI API key (for embeddings only — very cheap usage)
- Tavily API key (tavily.com — free tier available)

### 1. Scaffold the project

```bash
npx create-next-app@latest documind \
  --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd documind
pnpm install
```

### 2. Install dependencies

```bash
# Core
pnpm add @clerk/nextjs prisma @prisma/client
pnpm add ai @ai-sdk/deepseek @ai-sdk/react openai

# Document parsing
pnpm add pdf-parse mammoth
pnpm add -D @types/pdf-parse

# UI
pnpm add @radix-ui/react-* class-variance-authority clsx tailwind-merge lucide-react
npx shadcn@latest init

# Dev
pnpm add -D tsx @types/node
```

### 3. Set up PostgreSQL with pgvector

```bash
# Local Docker setup (easiest):
docker run -d \
  --name documind-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=documind \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Then run the extension setup:
docker exec -it documind-db psql -U postgres -d documind \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 4. Configure environment

```bash
cp .env.example .env.local
# Fill in all values
```

### 5. Set up Clerk

1. Create a project at [clerk.com/dashboard](https://clerk.com/dashboard)
2. Enable Google + GitHub OAuth providers in Clerk dashboard
3. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`
4. Set your first admin user: in Clerk dashboard → Users → select user → Metadata → set `publicMetadata: { "role": "admin" }`

### 6. Run Prisma migrations

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init

# Run the pgvector raw migration
psql $DATABASE_URL -f prisma/migrations/add_vector_column.sql
```

### 7. Ingest initial PDFs

```bash
# Download Wikipedia PDFs to /data first, then:
pnpm run ingest

# Output:
# ✅ kaziranga-national-park.pdf → 42 chunks embedded
# ✅ shillong.pdf → 28 chunks embedded
# ...
# 🎉 Total: 17 documents, 487 chunks indexed
```

### 8. Start development

```bash
pnpm dev
# → http://localhost:3000
```

---

## Step-by-Step Build Plan

Use these phases in order when building with an LLM assistant (Claude Code, Cursor, etc.). Each phase has a ready-to-paste prompt.

---

### Phase 1 — Scaffold + Clerk Auth (Day 1)

**Prompt:**
> "Set up a Next.js 15 App Router project with TypeScript, Tailwind CSS, and Clerk authentication. Install `@clerk/nextjs`. Create `middleware.ts` using `clerkMiddleware` and `createRouteMatcher` from `@clerk/nextjs/server` to protect all routes except `/`, `/sign-in`, and `/sign-up`. Wrap `app/layout.tsx` with `<ClerkProvider>`. Create `app/(public)/sign-in/[[...sign-in]]/page.tsx` and `app/(public)/sign-up/[[...sign-up]]/page.tsx` using Clerk's `<SignIn />` and `<SignUp />` components. Create a basic protected `app/(dashboard)/chat/page.tsx` that shows the logged-in user's name."

- [ ] `@clerk/nextjs` installed
- [ ] `middleware.ts` with `clerkMiddleware` + route matchers
- [ ] `<ClerkProvider>` in root layout
- [ ] Sign-in and sign-up pages working
- [ ] `getUserRole()` helper in `lib/auth/roles.ts`
- [ ] Admin route guard in admin layout

---

### Phase 2 — Database + Prisma (Day 1)

**Prompt:**
> "Set up Prisma with PostgreSQL. Create the schema with these models: `ChatSession` (id, userId string from Clerk, title, webSearch boolean, timestamps), `Message` (id, chatSessionId, role, content, timestamps), `Document` (id, uploadedBy, fileName, title, fileType, filePath, status enum ACTIVE/ARCHIVED, tags array, timestamps), `DocumentChunk` (id uuid, documentId, chunkIndex, chunkText, pageNumber, timestamps). Run `prisma migrate dev`. Then write a raw SQL migration file at `prisma/migrations/add_vector_column.sql` that enables the `vector` extension and adds a `VECTOR(1536)` column to `DocumentChunk` with an IVFFlat index."

- [ ] `prisma/schema.prisma` with all models
- [ ] `pnpm prisma migrate dev` runs clean
- [ ] `add_vector_column.sql` applied to DB
- [ ] `lib/db.ts` Prisma singleton
- [ ] DB helper functions in `lib/db/sessions.ts`, `messages.ts`, `documents.ts`

---

### Phase 3 — Document Ingestion Pipeline (Day 2)

**Prompt:**
> "Create the document ingestion pipeline. In `lib/rag/chunker.ts`, write a recursive character text splitter that breaks text into chunks of 500 tokens with 50 token overlap. In `lib/rag/ingest.ts`, write a function `ingestDocument(filePath, documentRecord)` that: (1) reads the file using `pdf-parse` for PDFs or `mammoth` for DOCX, (2) passes text to the chunker, (3) calls OpenAI `text-embedding-3-small` in batches of 20 chunks, (4) inserts each chunk with its embedding into `DocumentChunk` via a raw Prisma SQL query. In `scripts/ingest-pdfs.ts`, write a CLI script that reads all PDFs from `/data`, creates Document records in the DB, and calls `ingestDocument` for each. Add `"ingest": "tsx scripts/ingest-pdfs.ts"` to `package.json`."

- [ ] `lib/rag/chunker.ts` — recursive text splitter
- [ ] `lib/rag/ingest.ts` — PDF/DOCX → chunks → embeddings → DB
- [ ] `scripts/ingest-pdfs.ts` — CLI bulk ingestion
- [ ] Test with 2 PDFs; verify chunks appear in DB
- [ ] `lib/embeddings.ts` — OpenAI client configured

---

### Phase 4 — RAG Retrieval + Prompt Builder (Day 2)

**Prompt:**
> "Create the RAG retrieval engine. In `lib/rag/retrieval.ts`, write `retrieveContext(query: string, topK = 5)` that embeds the query using OpenAI, then runs a raw Prisma SQL query using pgvector cosine distance (`<=>`) against `DocumentChunk.embedding`, joining with `Document` to filter only ACTIVE documents, returning the top K chunks with their similarity scores. In `lib/rag/prompt.ts`, write `buildSystemPrompt(chunks)` that creates the system prompt string injecting chunk content as context. Test retrieval with a sample query."

- [ ] `lib/rag/retrieval.ts` — working similarity search
- [ ] `lib/rag/prompt.ts` — system prompt builder
- [ ] Manual test: `retrieveContext('Kaziranga')` returns relevant chunks

---

### Phase 5 — Chat API Route with Vercel AI SDK (Day 3)

**Prompt:**
> "Create the main chat API route at `app/api/chat/[sessionId]/route.ts`. It should: (1) verify the Clerk userId using `auth()` from `@clerk/nextjs/server`; (2) parse the request body for `messages` (array) and `webSearchEnabled` (boolean); (3) call `retrieveContext` on the last user message; (4) call `streamText` from the `ai` package using `deepseek('deepseek-chat')` from `@ai-sdk/deepseek`, passing the system prompt with RAG context, the full messages array, and — if webSearchEnabled — a Tavily web search tool using `tool()` from `ai` with `maxSteps: 3`; (5) in the `onFinish` callback, use `appendResponseMessages` from `ai` to merge and save all messages to the DB via `saveMessages()`; (6) return `result.toDataStreamResponse()`. Also create `lib/tools/tavily.ts` with the Tavily search tool definition."

- [ ] `app/api/chat/[sessionId]/route.ts` — full streaming route
- [ ] `lib/tools/tavily.ts` — web search tool
- [ ] `lib/db/messages.ts` — `saveMessages` and `getSessionMessages`
- [ ] Test with a REST client (Postman/Bruno): send a message, verify stream + DB save

---

### Phase 6 — Session CRUD API (Day 3)

**Prompt:**
> "Create the session management API routes. `POST /api/sessions` creates a new ChatSession for the authenticated Clerk user (auto-title it 'New Conversation'). `GET /api/sessions` returns all sessions for the user ordered by updatedAt desc. `GET /api/sessions/[sessionId]` returns the session + all its messages. `DELETE /api/sessions/[sessionId]` deletes the session and cascades to messages. `PATCH /api/sessions/[sessionId]` updates the session title. All routes must verify the userId from Clerk's `auth()` and ensure users can only access their own sessions."

- [ ] All session CRUD routes
- [ ] Row-level security: users can only touch their own sessions
- [ ] Auto-generate session title from first user message (truncated to 40 chars)

---

### Phase 7 — Document Upload API (Day 4, admin only)

**Prompt:**
> "Create the document upload API. `POST /api/documents` should: (1) check the user is an admin via `getUserRole()`; (2) accept a multipart form upload; (3) save the file to `./uploads/` directory; (4) create a `Document` record in the DB; (5) call `ingestDocument()` to parse, chunk, embed, and store the document asynchronously (fire and forget, return 202 immediately so the client isn't blocked). `GET /api/documents` returns paginated documents with search and status filter. `POST /api/documents/[id]/archive` toggles the document status between ACTIVE and ARCHIVED."

- [ ] Upload route with admin guard
- [ ] File saved to disk + Document record created
- [ ] Ingestion triggered async
- [ ] Archive/unarchive toggle
- [ ] Document list with search/filter

---

### Phase 8 — Chat Frontend UI (Day 4–5)

**Prompt:**
> "Build the chat UI using the assistant-ui library. First, install @assistant-ui/react, @assistant-ui/react-ai-sdk, and lucide-react. Create a components/chat/MyRuntimeProvider.tsx that initializes the Vercel AI SDK runtime using the useVercelUseChatRuntime hook, passing the api: /api/chat/${sessionId} endpoint and mapping the initialMessages loaded from the database. Create components/chat/ChatWindow.tsx that wraps the assistant-ui <Thread/> component inside this provider. To handle the web search toggle, implement a custom composer control using Thread.Composer and Thread.Action to render a globe icon toggle, saving its state locally and forwarding it in the useChat body via the runtime configuration. Finally, update components/sidebar/AppSidebar.tsx to fetch sessions from /api/sessions and list them alongside a 'New Chat' button. Ensure the thread styling overrides in globals.css apply a custom glassmorphism aesthetic with translucent backgrounds and subtle blurs for the message bubbles."

- [ ] @assistant-ui/react and @assistant-ui/react-ai-sdk installed
- [ ] MyRuntimeProvider.tsx configured with useVercelUseChatRuntime
- [ ] ChatWindow.tsx utilizing the pre-built <Thread/> interface
- [ ] Custom Web Search toggle integrated into the <Thread.Composer>
- [ ] AppSidebar.tsx displaying the session list and navigation
- [ ] Session pages correctly seed the runtime with initialMessages from the server
- [ ] CSS variables updated in globals.css to apply the glassmorphism theme to the chat interface

---

### Phase 9 — Admin Dashboard (Day 5–6)

**Prompt:**
> "Create the admin dashboard at `app/admin/`. The layout should check `getUserRole()` server-side and redirect non-admins to `/chat`. The main dashboard page (`app/admin/page.tsx`) should show stat cards: total documents, total chunks indexed, active chat sessions, registered users. `app/admin/documents/page.tsx` should show a table of all documents with upload date, type, status, chunk count, and action buttons (archive, delete). `app/admin/documents/page.tsx` should include a drag-and-drop file upload component `DocumentUpload.tsx`. `app/admin/users/page.tsx` should list all Clerk users (call Clerk's backend API `clerkClient.users.getUserList()`) with their role shown."

- [ ] Admin layout with server-side role guard
- [ ] Dashboard stat cards
- [ ] Document management table with archive/delete
- [ ] Drag-and-drop upload UI
- [ ] User list from Clerk API

---

### Phase 10 — Polish (Day 6–7)

- [ ] Loading skeletons for sidebar and chat history
- [ ] Empty states: "Upload documents to get started" for admins; "Ask anything about the knowledge base" for users
- [ ] Error boundaries on chat components
- [ ] Optimistic UI for new sessions (add to sidebar immediately)
- [ ] Keyboard shortcut: `Ctrl+K` → new chat
- [ ] Mobile responsive: collapsible sidebar

---

## API Routes Reference

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| `GET` | `/api/sessions` | ✅ | any | Get all user's chat sessions |
| `POST` | `/api/sessions` | ✅ | any | Create a new chat session |
| `GET` | `/api/sessions/:id` | ✅ | any | Get session + all messages |
| `PATCH` | `/api/sessions/:id` | ✅ | any | Rename session |
| `DELETE` | `/api/sessions/:id` | ✅ | any | Delete session |
| `POST` | `/api/chat/:sessionId` | ✅ | any | Send message → RAG → stream |
| `GET` | `/api/documents` | ✅ | any | List documents (paginated) |
| `POST` | `/api/documents` | ✅ | admin | Upload new document |
| `GET` | `/api/documents/:id` | ✅ | any | Get document details |
| `DELETE` | `/api/documents/:id` | ✅ | admin | Delete document + chunks |
| `POST` | `/api/documents/:id/archive` | ✅ | admin | Toggle archive status |
| `POST` | `/api/ingest` | ✅ | admin | Re-trigger full ingestion |
| `POST` | `/api/webhooks/clerk` | public | — | Clerk user lifecycle events |

---


## Error Handling & Console Logging
  You need two layers of error handling: server-side logging for debugging, and client-side handling for user experience.

  Server-Side Console Logs
  Logs should be structured, contextual, and consistent. Avoid simple console.log(error). Instead, use a structured format, ideally JSON, or a consistent string pattern.

  Format: [TIMESTAMP] [LEVEL] [MODULE] [USER_ID] Message - Metadata

  Example (Success): [2026-06-24T12:51:06Z] [INFO] [RAG_INGEST] [user_2abc] Successfully chunked and embedded kaziranga.pdf - { chunks: 42 }

  Example (Error): [2026-06-24T12:51:08Z] [ERROR] [API_CHAT] [user_2abc] OpenAI embedding rate limit exceeded - { query: "Assam parks" }

  Client-Side UI Handling

  Wrap API calls in try...catch blocks.

  Use the onError callback in the useChat hook to catch streaming failures.

  Display errors via toast notifications (e.g., using sonner from the ShadCN UI) so the user knows why a process failed (e.g., "Failed to upload document: File too large").

## Adding More Documents

To add new documents to the knowledge base (admin only):

**Via UI:** Go to `/admin/documents` → drag and drop files → ingestion triggers automatically.

**Via CLI (bulk):**
```bash
# Drop PDFs into /data, then:
pnpm run ingest
# Only new files are processed (tracked by fileName in Document table)
```

**Via API:**
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer <clerk-token>" \
  -F "file=@path/to/document.pdf"
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the existing TypeScript types in `types/index.ts`
4. Add new documents by following the [Adding More Documents](#adding-more-documents) guide
5. Submit a pull request with a description of your changes

---

## License

MIT License — see [LICENSE](./LICENSE)

---

*Built as a showcase project demonstrating full-stack AI application development with RAG, Clerk Auth, Vercel AI SDK, DeepSeek, and pgvector.*



