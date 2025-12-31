import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/client";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has an organization
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  // If user already exists in database, redirect to dashboard
  if (dbUser) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
