import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </SessionProvider>
  );
}
