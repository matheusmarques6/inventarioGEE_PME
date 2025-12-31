import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

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

    // Check if user already has an organization
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já possui uma organização" },
        { status: 400 }
      );
    }

    // Check if CNPJ already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { cnpj: data.cnpj },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "CNPJ já cadastrado no sistema" },
        { status: 400 }
      );
    }

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: data.organizationName,
          cnpj: data.cnpj,
          sector: data.sector,
          city: data.city,
          state: data.state,
        },
      });

      // Create user
      const dbUser = await tx.user.create({
        data: {
          supabaseId: user.id,
          email: user.email!,
          name: data.userName,
          role: "ADMIN",
          organizationId: organization.id,
        },
      });

      // Create default inventory for current year
      const currentYear = new Date().getFullYear();
      const inventory = await tx.inventory.create({
        data: {
          organizationId: organization.id,
          name: `Inventário ${currentYear}`,
          baseYear: currentYear,
          reportingPeriod: currentYear.toString(),
          gwpReference: "AR5",
          status: "DRAFT",
          includeScope1: true,
          includeScope2: true,
          includeScope3: false,
        },
      });

      return { organization, user: dbUser, inventory };
    });

    return NextResponse.json(result, { status: 201 });
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
