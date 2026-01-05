import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/supabase-db";
import { z } from "zod";

const createInventorySchema = z.object({
  name: z.string().min(3),
  baseYear: z.number().min(2000).max(2100),
  reportingPeriod: z.string(),
  gwpReference: z.enum(["AR4", "AR5", "AR6"]),
  consolidationApproach: z.enum([
    "OPERATIONAL_CONTROL",
    "FINANCIAL_CONTROL",
    "EQUITY_SHARE",
  ]),
  includeScope1: z.boolean().default(true),
  includeScope2: z.boolean().default(true),
  includeScope3: z.boolean().default(false),
});

// Helper to get or create default organization
async function getOrCreateDefaultOrganization() {
  // Try to find existing organization
  let organization = await db.organizations.findFirst();

  if (organization) {
    return organization;
  }

  // Create default organization using upsert to avoid race conditions
  organization = await db.organizations.upsert({
    name: "Minha Empresa",
    cnpj: "00000000000000",
    sector: "outros",
  });

  return organization;
}

// GET /api/inventories - List all inventories
export async function GET() {
  try {
    // Test database connection first
    const health = await db.healthCheck();
    if (!health.connected) {
      throw new Error("Database not connected");
    }

    // Ensure organization exists before querying inventories
    await getOrCreateDefaultOrganization();

    const inventories = await db.inventories.getAllWithCounts();

    return NextResponse.json(inventories);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error fetching inventories:", {
      message: errorMessage,
      stack: errorStack,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET",
    });

    return NextResponse.json(
      {
        error: "Erro ao carregar inventários",
        details: errorMessage,
        supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      { status: 500 }
    );
  }
}

// POST /api/inventories - Create a new inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createInventorySchema.parse(body);

    // Get or create default organization
    const organization = await getOrCreateDefaultOrganization();

    const inventory = await db.inventories.create({
      organization_id: organization.id,
      name: data.name,
      base_year: data.baseYear,
      reporting_period: data.reportingPeriod,
      gwp_reference: data.gwpReference,
      consolidation_approach: data.consolidationApproach,
      include_scope1: data.includeScope1,
      include_scope2: data.includeScope2,
      include_scope3: data.includeScope3,
      status: "DRAFT",
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating inventory:", errorMessage);

    return NextResponse.json(
      {
        error: "Erro ao criar inventário",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
