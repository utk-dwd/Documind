import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { deepseek } from "@/lib/llm";
import { auth } from "@clerk/nextjs/server";
import { webSearchTool } from "@/lib/tools/tavily";
import { retrieveContext } from "@/lib/rag/retrieval";
import { buildSystemPrompt } from "@/lib/rag/prompt";
import { saveMessages } from "@/lib/db/messages";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;
  const { messages, webSearchEnabled } = await req.json();

  console.log(
    `[chat] session=${sessionId} webSearch=${webSearchEnabled} msgCount=${messages.length}`
  );

  const lastMsg = messages[messages.length - 1];
  const lastUserText =
    lastMsg?.parts
      ?.filter((p: { type: string; text?: string }) => p.type === "text")
      .map((p: { type: string; text?: string }) => p.text ?? "")
      .join("") ?? "";

  if (!lastUserText) {
    return new Response("No user message found", { status: 400 });
  }

  const ragContext = await retrieveContext(lastUserText, 5);

  const modelMessages = await convertToModelMessages(messages);

  const systemPrompt = buildSystemPrompt(ragContext, webSearchEnabled);

  const tools = webSearchEnabled
    ? { web_search: webSearchTool }
    : undefined;

  if (webSearchEnabled) {
    console.log("[chat] web search enabled, Tavily tool attached");
  }

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: webSearchEnabled ? stepCountIs(5) : stepCountIs(1),
    timeout: { totalMs: 120000 },
    onStepFinish: ({ toolCalls, toolResults, text }) => {
      if (toolCalls?.length) {
        console.log(
          `[chat] step tool calls: ${toolCalls.map((t) => t.toolName).join(", ")}`
        );
      }
      if (toolResults?.length) {
        console.log(
          `[chat] step tool results: ${toolResults.map((r) => r.toolName).join(", ")}`
        );
      }
    },
    onFinish: async ({ text, steps }) => {
      const toolCallCount = steps.reduce(
        (acc, s) => acc + (s.toolCalls?.length || 0),
        0
      );
      console.log(
        `[chat] finished: textLen=${text?.length || 0} steps=${steps.length} toolCalls=${toolCallCount}`
      );

      const allMessages = [
        ...messages.map(
          (m: { role: string; parts?: Array<{ type: string; text?: string }> }) => ({
            role: m.role,
            content:
              m.parts
                ?.filter((p) => p.type === "text")
                .map((p) => p.text ?? "")
                .join("") ?? "",
          })
        ),
        { role: "assistant", content: text },
      ];

      await saveMessages({
        sessionId,
        messages: allMessages,
      });
    },
  });

  return result.toUIMessageStreamResponse();
}
