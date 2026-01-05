import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { InventoryProviderWrapper } from "@/components/providers/inventory-provider-wrapper";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get authenticated user
  const user = await getUser();

  // If no user, redirect to login
  if (!user) {
    redirect("/login");
  }

  // Pass real user data to header
  const userData = {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
  };

  return (
    <InventoryProviderWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <Sidebar />
        <div className="lg:pl-64 min-h-screen flex flex-col">
          <Header user={userData} />
          <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
        </div>
      </div>
    </InventoryProviderWrapper>
  );
}
