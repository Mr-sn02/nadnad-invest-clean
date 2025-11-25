export default function DashboardPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        backgroundColor: "#020617",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Dashboard simulasi Nadnad Invest
      </h1>
      <p style={{ maxWidth: "640px", opacity: 0.9 }}>
        Ini hanya tampilan demo statis (belum terhubung ke backend). Jika halaman ini
        sudah muncul di Vercel, berarti setup Next.js kamu sudah berhasil.
      </p>
    </main>
  );
}