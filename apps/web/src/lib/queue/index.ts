import { InMemoryQueue } from "./inMemoryQueue";

type EnqueueExtractionInput = {
  documentId: string;
};

const queue = new InMemoryQueue();

export async function enqueueExtractionJob(
  input: EnqueueExtractionInput
): Promise<{ jobId: string }> {
  return queue.enqueue({
    type: "PROCESS_DOCUMENT",
    documentId: input.documentId,
    enqueuedAt: Date.now(),
  });
}

