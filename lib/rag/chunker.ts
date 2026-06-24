export function chunkText(
  text: string,
  chunkSize = 500,
  chunkOverlap = 50
): string[] {
  if (!text || text.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    const breakPoints = [
      text.lastIndexOf("\n\n", end),
      text.lastIndexOf(". ", end),
      text.lastIndexOf(" ", end),
    ];

    const bestBreak = Math.max(...breakPoints.filter((i) => i > start));
    if (bestBreak > start) {
      end = bestBreak + 1;
    }

    chunks.push(text.slice(start, end).trim());
    start = end - chunkOverlap;
    if (start < 0) start = 0;
  }

  return chunks.filter((c) => c.length > 0);
}
