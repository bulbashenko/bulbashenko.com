import { getSessionFromRequest } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const authed = await getSessionFromRequest();
  if (!authed) redirect("/admin/login");
  return <AdminDashboard />;
}
