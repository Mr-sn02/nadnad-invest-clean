export const metadata = {
  title: "Nadnad Invest",
  description: "Landing page sederhana Nadnad Invest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{
        margin: 0,
        backgroundColor: "#020617",
        color: "white"
      }}>
        {children}
      </body>
    </html>
  );
}