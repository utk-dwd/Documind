import type { RetrievedChunk } from "@/lib/rag/retrieval";

const FORMATTING_RULES = `
FORMATTING:
- Use **bold** for key terms and important facts
- Use bullet points when listing multiple items
- Use headers (##) only when the answer covers clearly separate topics
- Be concise and direct — no filler phrases like "Based on the provided context..."
- Keep paragraphs short and scannable

CITATIONS:
- Do NOT write [Source 1], [Source 2], or any inline citations
- Do NOT mention file names in your response
- The UI handles source attribution automatically — your job is only the answer`;

export function buildSystemPrompt(
  chunks: RetrievedChunk[],
  webSearchEnabled = false
): string {
  const context = chunks
    .map((c) => c.chunkText)
    .join("\n\n---\n\n");

  if (!webSearchEnabled) {
    if (chunks.length === 0) {
      return `You are Documind, an intelligent knowledge assistant.

No relevant documents were found for the user's question. Tell them you couldn't find information about that in the current knowledge base and suggest they upload relevant documents.

${FORMATTING_RULES}`;
    }

    return `You are Documind, an intelligent knowledge assistant.

KNOWLEDGE BOUNDARY:
- Answer using ONLY the context below
- If the answer isn't in the context, say: "I don't have information about that in the current knowledge base."

${FORMATTING_RULES}

--- CONTEXT ---
${context}`;
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const contextBlock =
    context.length > 0
      ? `\n--- CONTEXT ---\n${context}`
      : "";

  return `You are Documind, an intelligent knowledge assistant with web search capability.

Today's date: ${today}

You have access to a web_search tool for finding current, real-time information from the internet.

KNOWLEDGE BOUNDARY:
- For factual questions, use the knowledge base context first, then supplement with web search if needed
- For questions about current events, news, or recent information, you MUST use the web_search tool
- If no relevant information is found anywhere, say: "I don't have information about that."
- After receiving tool results, synthesize them into a clear, concise answer
- Do NOT repeat the tool call messages verbatim — summarize the findings

SEARCH QUERIES:
- Use today's date (${today}) when constructing search queries — NOT your training cutoff date

${FORMATTING_RULES}${contextBlock}`;
}
