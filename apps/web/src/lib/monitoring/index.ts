type MonitorMeta = Record<string, unknown> | undefined;

export function captureError(error: unknown, meta?: MonitorMeta): void {
  const provider = process.env.ERROR_MONITOR_PROVIDER ?? "console";
  const message = error instanceof Error ? error.message : String(error);

  if (provider === "console") {
    // eslint-disable-next-line no-console
    console.error("[MONITOR] error", { message, meta });
    return;
  }

  // Sentry veya baska provider ileride buradan baglanir.
  // eslint-disable-next-line no-console
  console.error("[MONITOR:FALLBACK] error", { message, provider, meta });
}

