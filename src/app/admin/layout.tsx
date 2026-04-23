import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ADMIN :: BULBASHENKO.COM",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
