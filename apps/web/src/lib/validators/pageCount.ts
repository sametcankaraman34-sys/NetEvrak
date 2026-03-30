const MAX_IMAGE_PAGE_COUNT = 1;

export function extractPageCount(input: {
  mimeType: string;
  fileBuffer: Buffer;
}): number {
  if (input.mimeType === "application/pdf") {
    const text = input.fileBuffer.toString("latin1");
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return Math.max(1, matches?.length ?? 1);
  }

  // jpg/png tek sayfa kabul edilir
  return MAX_IMAGE_PAGE_COUNT;
}

