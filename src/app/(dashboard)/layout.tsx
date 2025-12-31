import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { InventoryProviderWrapper } from "@/components/providers/inventory-provider-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mock user - no authentication required
  const mockUser = {
    id: "mock-user-id",
    email: "usuario@exemplo.com",
  };

  return (
    <InventoryProviderWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <Sidebar />
        <div className="lg:pl-64 min-h-screen flex flex-col">
          <Header user={mockUser} />
          <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
        </div>
      </div>
    </InventoryProviderWrapper>
  );
}
