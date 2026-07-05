import * as Sentry from "@sentry/nextjs";

export async function register() {
  // One init covers the nodejs and edge server runtimes; no-op without a DSN.
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

export const onRequestError = Sentry.captureRequestError;
