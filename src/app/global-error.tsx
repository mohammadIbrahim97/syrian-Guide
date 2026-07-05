"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Something went wrong</h1>
          <p style={{ color: "#666" }}>Please refresh the page or try again later.</p>
        </div>
      </body>
    </html>
  );
}
