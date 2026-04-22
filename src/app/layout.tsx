import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BULBASHENKO.COM",
  description: "Aleksandr Albekov — DevOps Engineer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
