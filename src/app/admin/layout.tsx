import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ADMIN :: BULBASHENKO.COM",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
