import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bulbashenko.com";

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aleksandr Albekov — DevOps Engineer & Networks",
    template: "%s | Aleksandr Albekov",
  },
  description: "Personal website of Aleksandr Albekov — DevOps Engineer specializing in Linux, containers, Kubernetes, and CI/CD pipelines. Building reliable infrastructure.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Aleksandr Albekov",
    title: "Aleksandr Albekov — DevOps Engineer & Networks",
    description: "Personal website of Aleksandr Albekov — DevOps Engineer specializing in Linux, containers, Kubernetes, and CI/CD pipelines. Building reliable infrastructure.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aleksandr Albekov — DevOps Engineer & Networks",
    description: "Personal website of Aleksandr Albekov — DevOps Engineer specializing in Linux, containers, Kubernetes, and CI/CD pipelines. Building reliable infrastructure.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
