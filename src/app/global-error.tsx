"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#f6f8fc",
            color: "#0f172a",
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 720,
              border: "1px solid #e2e8f0",
              borderRadius: 32,
              background: "#ffffff",
              padding: 32,
              boxShadow: "0 24px 80px rgba(15,23,42,0.08)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 999,
                background: "#EAF3FF",
                color: "#0064E0",
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Octalve Workspace
            </div>

            <h1
              style={{
                margin: "24px 0 0",
                fontSize: 38,
                lineHeight: 1.04,
                letterSpacing: "-0.055em",
              }}
            >
              We could not load the workspace.
            </h1>

            <p
              style={{
                margin: "16px 0 0",
                color: "#475569",
                fontSize: 15,
                lineHeight: 1.8,
                fontWeight: 500,
              }}
            >
              A safe recovery screen is shown instead of technical details. No stack trace,
              token, provider reference, or private system data is displayed here.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 28,
              }}
            >
              <button
                type="button"
                onClick={reset}
                style={{
                  minHeight: 48,
                  border: 0,
                  borderRadius: 16,
                  background: "#0064E0",
                  color: "#ffffff",
                  padding: "0 20px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>

              <a
                href="/login"
                style={{
                  minHeight: 48,
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#0f172a",
                  padding: "0 20px",
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Go to login
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}