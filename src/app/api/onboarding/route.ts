import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const onboardingSchema = z.object({
  userName: z.string().min(3),
  organizationName: z.string().min(2),
  cnpj: z.string().regex(/^\d{14}$/),
  sector: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = onboardingSchema.parse(body);

    const dbSupabase = getDb();

    // Check if user already has an organization
    const { data: existingUser } = await dbSupabase
      .from("users")
      .select("id")
      .eq("supabase_id", user.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já possui uma organização" },
        { status: 400 }
      );
    }

    // Check if CNPJ already exists
    const { data: existingOrg } = await dbSupabase
      .from("organizations")
      .select("id")
      .eq("cnpj", data.cnpj)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: "CNPJ já cadastrado no sistema" },
        { status: 400 }
      );
    }

    // Create organization
    const organization = await db.organizations.create({
      name: data.organizationName,
      cnpj: data.cnpj,
      sector: data.sector,
      city: data.city,
      state: data.state,
    });

    // Create user
    const dbUser = await db.users.create({
      supabase_id: user.id,
      email: user.email!,
      name: data.userName,
      role: "ADMIN",
      organization_id: organization.id,
    });

    // Create default inventory for current year
    const currentYear = new Date().getFullYear();
    const inventory = await db.inventories.create({
      organization_id: organization.id,
      name: `Inventário ${currentYear}`,
      base_year: currentYear,
      reporting_period: currentYear.toString(),
      gwp_reference: "AR5",
      status: "DRAFT",
      include_scope1: true,
      include_scope2: true,
      include_scope3: false,
    });

    return NextResponse.json({ organization, user: dbUser, inventory }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
