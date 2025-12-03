// components/NanadToast.js
"use client";

export default function NanadToast({
  open,
  type = "info", // "success" | "error" | "warning" | "info"
  title,
  message,
  onClose,
}) {
  if (!open) return null;

  const colorMap = {
    success: "#4ade80",
    error: "#f87171",
    warning: "#facc15",
    info: "#38bdf8",
  };

  const accent = colorMap[type] || colorMap.info;

  return (
    <div
      style={{
        position: "fixed",
        right: "1.25rem",
        top: "1.25rem",
        zIndex: 9999,
        maxWidth: "320px",
      }}
    >
      <div
        style={{
          borderRadius: "18px",
          padding: "0.9rem 1rem",
          background:
            "radial-gradient(circle at top, rgba(148,163,184,0.16), rgba(15,23,42,0.98))",
          border: `1px solid ${accent}`,
          boxShadow:
            "0 22px 45px rgba(15,23,42,0.85), 0 0 0 1px rgba(15,23,42,0.9)",
          color: "#e5e7eb",
          fontSize: "0.82rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}
      >
        {/* ikon bulat kecil */}
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "999px",
            marginTop: "0.4rem",
            background: accent,
          }}
        />

        {/* teks */}
        <div style={{ flex: 1 }}>
          {title && (
            <div
              style={{
                fontWeight: 600,
                marginBottom: "0.25rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontSize: "0.7rem",
              }}
            >
              {title}
            </div>
          )}
          {message && <div style={{ lineHeight: 1.6 }}>{message}</div>}
        </div>

        {/* tombol close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            color: "#9ca3af",
            cursor: "pointer",
            padding: 0,
            marginLeft: "0.25rem",
            fontSize: "1rem",
          }}
          aria-label="Tutup notifikasi"
        >
          ×
        </button>
      </div>
    </div>
  );
}
