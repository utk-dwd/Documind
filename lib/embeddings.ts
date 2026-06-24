import { CohereClient } from "cohere-ai";

export type CohereInputType = "search_document" | "search_query";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function generateEmbeddings(
  texts: string[],
  inputType: CohereInputType = "search_document"
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await cohere.v2.embed({
    texts,
    model: "embed-english-v3.0",
    inputType,
    embeddingTypes: ["float"],
  });

  if (!response.embeddings?.float) {
    throw new Error("Cohere embeddings response did not contain float embeddings");
  }

  return response.embeddings.float as number[][];
}

export async function generateEmbedding(
  text: string,
  inputType: CohereInputType = "search_query"
): Promise<number[]> {
  const embeddings = await generateEmbeddings([text], inputType);
  return embeddings[0];
}
