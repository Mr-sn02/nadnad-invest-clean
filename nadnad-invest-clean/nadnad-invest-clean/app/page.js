export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        background: "radial-gradient(circle at top, #0f172a, #020617)",
        color: "white",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        Nadnad Invest
      </h1>
      <p style={{ maxWidth: "480px", opacity: 0.9, marginBottom: "1.5rem" }}>
        Versi sederhana untuk memastikan deploy di Vercel berjalan dengan benar.
      </p>
      <a
        href="/dashboard"
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "999px",
          border: "1px solid rgba(148, 163, 184, 0.8)",
          textDecoration: "none",
          color: "white",
          fontWeight: 500,
        }}
      >
        Buka Demo Dashboard
      </a>
    </main>
  );
}