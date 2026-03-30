export type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown> | undefined;

function formatMeta(meta?: LogMeta): string {
  if (!meta) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return "";
  }
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    // eslint-disable-next-line no-console
    console.info(`[INFO] ${message}${formatMeta(meta)}`);
  },
  warn(message: string, meta?: LogMeta) {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}${formatMeta(meta)}`);
  },
  error(message: string, meta?: LogMeta) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}${formatMeta(meta)}`);
  },
};

