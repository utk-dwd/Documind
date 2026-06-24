declare module "mammoth" {
  function extractRawText(options: { buffer: Buffer }): Promise<{ value: string }>;
}
