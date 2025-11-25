import "./globals.css";

export const metadata = {
  title: "Nadnad Invest",
  description: "Landing page elegan Nadnad Invest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="page">
        {children}
      </body>
    </html>
  );
}
