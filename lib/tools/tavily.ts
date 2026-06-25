import { tool } from "ai";
import { z } from "zod";

export const webSearchTool = tool({
  description:
    "Search the web for current, real-time information. Use this when the user asks about recent events, news, or information not in the knowledge base.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }: { query: string }) => {
    console.log(`[tavily] searching: "${query}"`);

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        search_depth: "advanced",
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[tavily] API error ${res.status}: ${text}`);
      throw new Error(`Tavily search failed: ${res.status}`);
    }

    const data = await res.json();

    console.log(
      `[tavily] found ${data.results?.length || 0} results for "${query}"`
    );

    const results = (data.results || []).map(
      (r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        content: r.content.slice(0, 500),
      })
    );

    return {
      answer: data.answer || "",
      results,
    };
  },
} as ReturnType<
  typeof tool<
    { query: string },
    { answer: string; results: { title: string; url: string; content: string }[] }
  >
>);
