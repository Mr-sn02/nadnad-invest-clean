// app/layout.js
import "./globals.css";

export const metadata = {
  title: "Nanad Invest",
  description: "Nanad Invest · Personal Planning & Wealth Space",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-black text-slate-100">
        {children}
      </body>
    </html>
  );
}
