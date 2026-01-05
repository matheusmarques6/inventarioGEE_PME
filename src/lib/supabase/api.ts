import { createClient } from "./server";
import { db, User } from "@/lib/db/supabase-db";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, dbUser: null, error: "Unauthorized" };
  }

  // Get database user
  const dbUser = await db.users.findBySupabaseId(user.id);

  return { user, dbUser, error: null };
}

export async function requireAuth(): Promise<{
  user: { id: string } | null;
  dbUser: User | null;
  userId: string | null;
  error: string | null;
}> {
  const { user, dbUser, error } = await getAuthenticatedUser();

  if (!user) {
    return { user: null, dbUser: null, userId: null, error: "Unauthorized" };
  }

  return { user, dbUser, userId: user.id, error: null };
}
