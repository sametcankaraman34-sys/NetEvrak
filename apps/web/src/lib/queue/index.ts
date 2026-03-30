import { InMemoryQueue } from "./inMemoryQueue";

type EnqueueExtractionInput = {
  documentId: string;
};

const queue = new InMemoryQueue();

export async function enqueueExtractionJob(
  input: EnqueueExtractionInput
): Promise<{ jobId: string }> {
  const provider = process.env.QUEUE_PROVIDER ?? "in_memory";

  if (provider !== "in_memory") {
    throw new Error(`UNSUPPORTED_QUEUE_PROVIDER:${provider}`);
  }

  return queue.enqueue({
    type: "PROCESS_DOCUMENT",
    documentId: input.documentId,
    enqueuedAt: Date.now(),
  });
}

