export type StoragePutFileInput = {
  file: File;
  directory: string;
  originalFileName: string;
};

export type StoragePutFileOutput = {
  storageKey: string;
};

export async function putFile(
  input: StoragePutFileInput
): Promise<StoragePutFileOutput> {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  if (provider === "local") {
    const { putLocalFile } = await import("./localStorage");
    return putLocalFile(input);
  }

  throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
}

