import { createClient } from "./server";
import { prisma } from "@/lib/db/client";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, dbUser: null, error: "Unauthorized" };
  }

  // Get database user
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { organization: true },
  });

  return { user, dbUser, error: null };
}

export async function requireAuth() {
  const { user, dbUser, error } = await getAuthenticatedUser();

  if (!user) {
    return { user: null, dbUser: null, userId: null, error: "Unauthorized" };
  }

  return { user, dbUser, userId: user.id, error: null };
}
