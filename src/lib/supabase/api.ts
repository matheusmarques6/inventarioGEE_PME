import { createClient } from "./server";
import { db, User } from "@/lib/db/supabase-db";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, dbUser: null, error: "Unauthorized" };
  }

  // Get database user
  let dbUser = await db.users.findBySupabaseId(user.id);

  // If user doesn't exist in database, create them automatically
  if (!dbUser) {
    try {
      // First ensure we have a default organization
      let organization = await db.organizations.findFirst();

      if (!organization) {
        organization = await db.organizations.upsert({
          name: "Minha Empresa",
          cnpj: "00000000000000",
          sector: "outros",
        });
      }

      // Create the user
      dbUser = await db.users.create({
        supabase_id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
        role: "ADMIN",
        organization_id: organization.id,
      });
    } catch (createError) {
      console.error("Error creating user:", createError);
      // If creation fails, continue without dbUser
    }
  }

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
