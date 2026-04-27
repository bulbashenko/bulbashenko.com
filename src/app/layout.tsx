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
  keywords: [
    "Aleksandr Albekov",
    "Александр Албеков",
    "Albekov",
    "DevOps Engineer",
    "Linux",
    "Kubernetes",
    "Docker",
    "CI/CD",
    "Networks",
    "Infrastructure",
    "bulbashenko",
  ],
  authors: [{ name: "Aleksandr Albekov", url: siteUrl }],
  creator: "Aleksandr Albekov",
  publisher: "Aleksandr Albekov",
  category: "technology",
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
    creator: "@bulbashenko",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
