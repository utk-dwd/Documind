import { retrieveContext } from "@/lib/rag/retrieval";
import { buildSystemPrompt } from "@/lib/rag/prompt";
import { prisma } from "@/lib/db";

async function main() {
  const docCount = await prisma.document.count({ where: { status: "ACTIVE" } });
  const chunkCount = await prisma.documentChunk.count();

  console.log(`Database: ${docCount} active documents, ${chunkCount} total chunks\n`);

  if (chunkCount === 0) {
    console.log("No chunks found. Run `pnpm ingest` first.");
    process.exit(1);
  }

  const queries = [
    "Tell me about Kaziranga National Park",
    "What are the famous tourist places in Assam?",
    "Where is Tawang Monastery located?",
  ];

  for (const query of queries) {
    console.log(`\nQ: "${query}"`);
    console.log("-".repeat(60));

    const chunks = await retrieveContext(query, 3);

    if (chunks.length === 0) {
      console.log("  No results found.");
    } else {
      chunks.forEach((c, i) => {
        console.log(
          `  [${i + 1}] ${c.documentTitle} (similarity: ${c.similarity.toFixed(4)})`
        );
        const preview = c.chunkText.slice(0, 120).replace(/\n/g, " ");
        console.log(`      ${preview}...`);
      });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("System prompt preview:");
  const chunks = await retrieveContext("Kaziranga", 5);
  const prompt = buildSystemPrompt(chunks);
  console.log(prompt.slice(0, 500) + "...");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("Test failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
