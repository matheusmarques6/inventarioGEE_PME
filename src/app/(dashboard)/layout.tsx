import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/client";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { InventoryProviderWrapper } from "@/components/providers/inventory-provider-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has completed onboarding
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { organization: true },
  });

  // Get current path from headers
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isOnboardingPage = pathname.includes("/onboarding");

  // If user doesn't exist in database, redirect to onboarding
  if (!dbUser && !isOnboardingPage) {
    redirect("/onboarding");
  }

  // If on onboarding page and already has org, redirect to dashboard
  if (dbUser && isOnboardingPage) {
    redirect("/dashboard");
  }

  // For onboarding page, render without sidebar
  if (!dbUser) {
    return <>{children}</>;
  }

  return (
    <InventoryProviderWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <Sidebar />
        <div className="lg:pl-64 min-h-screen flex flex-col">
          <Header user={user} />
          <main className="flex-1 p-4 lg:p-6 animate-fade-in">{children}</main>
        </div>
      </div>
    </InventoryProviderWrapper>
  );
}
