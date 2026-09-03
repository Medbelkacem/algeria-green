"use client";

/**
 * Last-resort boundary: it replaces the whole document, so it ships its own
 * <html>/<body> and no translated chrome. Stack traces are never rendered.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f7fbf8",
          color: "#14261d",
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.75rem" }}>حدث خطأ غير متوقع</h1>
          <p style={{ margin: "0 0 0.5rem", color: "#4b5f55" }}>
            Une erreur inattendue est survenue. An unexpected error occurred.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#7b8c83" }}>{error.digest}</p>
          ) : null}
          {/* This boundary replaces the whole document, outside the router,
              so a plain anchor is the only reliable way back. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1.25rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "0.5rem",
              background: "#0b5c39",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            العودة إلى الرئيسية
          </a>
        </main>
      </body>
    </html>
  );
}
