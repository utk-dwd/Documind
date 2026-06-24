# 🧠 DocuMind

> A full-stack, production-ready platform that enables organizations to upload, organize, and interact with documents through a conversational AI interface — powered by RAG, DeepSeek, Clerk Auth, and PostgreSQL with pgvector.

**DocuMind** is an AI-powered knowledge management platform that enables organizations to upload, organize, and interact with their documents through a conversational interface. Users securely upload documents and the platform automatically generates searchable knowledge indexes, making information retrieval fast, accurate, and context-aware.

---

## ✨ Key Features

- 🔐 **Clerk Authentication** — Sign in via Google, GitHub, or email. Prebuilt UI, MFA, session management out of the box
- 👥 **Role-Based Access Control** — `admin` role for document management; `user` role for chat
- 📄 **Document Upload & Indexing** — Upload PDFs, DOCX, or TXT files; auto-parsed, chunked, and embedded into pgvector
- 💬 **Conversational Chat Interface** — Ask natural language questions; answers grounded in uploaded documents
- 🔄 **Persistent Chat Sessions** — Full message history saved per user; resume any past conversation
- 🗂️ **Multi-Session Support** — Manage, rename, and delete multiple conversation threads
- 🌐 **Web Search Toggle** — Enable real-time web search per session to augment document-based answers
- 🗃️ **Document Archiving** — Active/archived lifecycle management; archived docs excluded from retrieval
- 📊 **Admin Dashboard** — Manage users, documents, and chat activity from a central panel
- ⚡ **Streaming Responses** — Token-by-token streaming from DeepSeek directly to the React UI

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router), React 19 | Full-stack framework, SSR, routing |
| **Styling** | Tailwind CSS v4, shadcn/ui | UI components and design system |
| **Language** | TypeScript (strict mode) | End-to-end type safety |
| **Auth** | Clerk (`@clerk/nextjs`) | Authentication, OAuth, RBAC |
| **Database** | PostgreSQL 16 + `pgvector` | Relational data + vector similarity search |
| **ORM** | Prisma v6 | Type-safe DB queries and migrations |
| **LLM** | DeepSeek V3 via `@ai-sdk/deepseek` | Primary chat model (fast, cheap) |
| **Embeddings** | OpenAI `text-embedding-3-small` | Convert text chunks to 1536-dim vectors |
| **AI SDK** | Vercel AI SDK v4 | `streamText` backend + `useChat` frontend |
| **Web Search** | Tavily Search API | Optional external search augmentation |
| **File Parsing** | `pdf-parse`, `mammoth` | Extract text from PDFs & Word docs |

---

## 📋 Prerequisites

- Node.js v20+
- PostgreSQL 16 with `pgvector` extension
- `pnpm` (recommended) or npm
- **Clerk** account (free at [clerk.com](https://clerk.com))
- **DeepSeek API** key ([platform.deepseek.com](https://platform.deepseek.com))
- **OpenAI API** key ([platform.openai.com](https://platform.openai.com)) — for embeddings only
- **Tavily API** key ([tavily.com](https://tavily.com)) — for web search

---

## 🚀 Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd documind
pnpm install
```

### 2. Set up PostgreSQL with pgvector

```bash
# Using Docker (easiest):
docker run -d \
  --name documind-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=documind \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Enable pgvector extension
docker exec -it documind-db psql -U postgres -d documind \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the `.env.local` with:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/documind"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/chat"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/chat"

# AI APIs
DEEPSEEK_API_KEY="sk-..."
OPENAI_API_KEY="sk-..."
TAVILY_API_KEY="tvly-..."

# RAG Config
RAG_TOP_K=5
RAG_CHUNK_SIZE=500
RAG_CHUNK_OVERLAP=50
```

### 4. Set up database schema

```bash
pnpm prisma generate
pnpm prisma migrate dev --name init

# Apply pgvector migration
psql $DATABASE_URL -f prisma/migrations/add_vector_column.sql
```

### 5. Configure Clerk admin user

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Enable OAuth providers (Google, GitHub)
3. Create or sign in with a test user
4. Go to **Users** → select user → **Metadata** → set:
   ```json
   { "role": "admin" }
   ```

### 6. Ingest initial documents (optional)

```bash
# Download Wikipedia PDFs to /data directory, then:
pnpm run ingest
```

### 7. Start development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
documind/
├── app/
│   ├── (public)/              # Landing, sign-in, sign-up
│   ├── (dashboard)/           # Protected chat & history
│   ├── admin/                 # Admin dashboard & management
│   └── api/
│       ├── chat/[sessionId]   # Main streaming chat endpoint
│       ├── sessions/          # Session CRUD
│       ├── documents/         # Document upload & management
│       └── ingest/            # Re-indexing trigger
├── components/
│   ├── chat/                  # ChatWindow, MessageBubble
│   ├── sidebar/               # AppSidebar, SessionItem
│   ├── documents/             # Upload, list, filters
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── rag/                   # RAG pipeline (ingest, retrieval)
│   ├── db/                    # Database helpers
│   ├── auth/                  # Role-based access control
│   └── tools/                 # Web search tool
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration files
├── scripts/
│   └── ingest-pdfs.ts         # Bulk PDF ingestion
└── .env.local                 # Environment variables
```

---

## 🎯 How It Works

### RAG Pipeline

1. **Document Ingestion** — Upload PDF/DOCX → Parse text → Split into chunks → Generate embeddings
2. **Vector Storage** — Store chunks with embeddings in PostgreSQL pgvector
3. **Query Retrieval** — Embed user query → Find similar chunks via cosine distance
4. **LLM Response** — Build context prompt → Stream response from DeepSeek V3 → Save to session history

### Chat Flow

```
User Message
    ↓
Retrieve context (pgvector similarity search)
    ↓
Build system prompt with context
    ↓
Stream response via DeepSeek V3
    ↓
Optional: Web search (Tavily) if enabled
    ↓
Save messages to database
    ↓
Render in chat UI
```

---

## 🔐 Authentication & Authorization

- **Clerk** handles all authentication (OAuth, email/password, MFA)
- **Roles** stored in Clerk's `publicMetadata`: `admin` or `user`
- **Route Protection** via `middleware.ts` and `requireAdmin()` helper
- **Row-Level Security** — Users can only access their own sessions

---

## 🌐 Web Search Integration

Toggle web search per conversation to augment document-based answers with real-time information from the web. Powered by Tavily API and Vercel AI SDK tools.

---

## 📝 Environment Variables

See [.env.example](.env.example) for a complete list. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Clerk auth
- `DEEPSEEK_API_KEY` — DeepSeek V3 LLM
- `OPENAI_API_KEY` — Embeddings (text-embedding-3-small)
- `TAVILY_API_KEY` — Web search
- `RAG_TOP_K`, `RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP` — RAG tuning

---

## 🚧 Development

### Run migrations

```bash
pnpm prisma migrate dev
```

### Generate Prisma types

```bash
pnpm prisma generate
```

### Open Prisma Studio (visual DB explorer)

```bash
pnpm prisma studio
```

### Run tests (if available)

```bash
pnpm test
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 📞 Support

For issues, questions, or suggestions, please open a GitHub issue or contact the maintainers.
