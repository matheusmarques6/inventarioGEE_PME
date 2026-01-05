import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { db } from "@/lib/db/supabase-db";

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
  const dbUser = await db.users.findBySupabaseId(user.id);

  // If user already exists in database, redirect to dashboard
  if (dbUser) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
