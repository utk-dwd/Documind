import type { RetrievedChunk } from "@/lib/rag/retrieval";

export function buildSystemPrompt(
  chunks: RetrievedChunk[],
  webSearchEnabled = false
): string {
  if (!webSearchEnabled) {
    if (chunks.length === 0) {
      return `You are Documind, an AI knowledge assistant.

No relevant documents were found for the user's question. Let them know you couldn't find relevant information in the knowledge base and suggest they upload relevant documents.

Always be helpful, concise, and truthful. Do not make up information.`;
    }

    const context = chunks
      .map(
        (c, i) =>
          `[Source ${i + 1}: ${c.documentTitle}]
${c.chunkText}`
      )
      .join("\n\n");

    return `You are Documind, an AI knowledge assistant. Answer questions using only the provided context.

## Context
${context}

## Instructions
- Answer based on the context above. If the answer cannot be found in the context, say so.
- Cite sources using [Source N] notation when referencing specific information.
- Keep answers concise but thorough.
- Do not make up information not present in the context.`;
  }

  const contextBlock =
    chunks.length > 0
      ? `\n## Knowledge Base Context\n${chunks
          .map(
            (c, i) =>
              `[Source ${i + 1}: ${c.documentTitle}]\n${c.chunkText}`
          )
          .join("\n\n")}`
      : "";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are Documind, an AI knowledge assistant with web search capability.

Today's date: ${today}

You have access to a web_search tool for finding current, real-time information from the internet.${contextBlock}

## Critical Instructions
- Today's date is ${today}. Use this date when constructing search queries — NOT your training cutoff date.
- Answer the user's question directly and completely in your final response.
- For questions about current events, news, or recent information, you MUST use the web_search tool.
- For factual questions, use the knowledge base context if available, then supplement with web search if needed.
- After receiving tool results, ALWAYS synthesize them into a clear, concise answer.
- Do NOT just list raw search results — provide a proper answer.
- Do NOT repeat the tool call messages verbatim — summarize the findings.
- Keep answers concise but thorough.
- Cite sources when possible.`;
}
