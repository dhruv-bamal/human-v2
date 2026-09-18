import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Together / Thirty",
  description: "A private daily training journal.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
