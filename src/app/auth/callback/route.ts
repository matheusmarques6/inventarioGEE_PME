import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/supabase-db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Try to create user and organization in database if they don't exist
      try {
        const existingUser = await db.users.findBySupabaseId(data.user.id);

        if (!existingUser) {
          // Get user metadata from registration
          const fullName = data.user.user_metadata?.full_name ||
                          data.user.user_metadata?.name ||
                          data.user.email?.split("@")[0] ||
                          "Usuário";
          const companyName = data.user.user_metadata?.company_name || "Minha Empresa";

          // Create organization with company name
          let organization = await db.organizations.findFirst();

          if (!organization) {
            organization = await db.organizations.upsert({
              name: companyName,
              cnpj: "00000000000000",
              sector: "outros",
            });
          }

          // Create the user in our database
          await db.users.create({
            supabase_id: data.user.id,
            email: data.user.email || "",
            name: fullName,
            role: "ADMIN",
            organization_id: organization.id,
          });

          console.log("User created successfully:", data.user.email);
        }
      } catch (dbError) {
        console.error("Error creating user in database:", dbError);
        // Continue anyway - user will be created on first API call
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
