import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/supabase/api";
import { z } from "zod";

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

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

// GET /api/inventories - List all inventories for the organization
export async function GET() {
  try {
    const { dbUser, error } = await requireAuth();
    if (error || !dbUser) {
      return NextResponse.json(
        { error: error || "User not found. Please complete onboarding." },
        { status: error ? 401 : 404 }
      );
    }

    const inventories = await prisma.inventory.findMany({
      where: { organizationId: dbUser.organizationId },
      orderBy: { baseYear: "desc" },
      include: {
        _count: {
          select: { activityData: true, emissionResults: true },
        },
      },
    });

    return NextResponse.json(inventories);
  } catch (error) {
    console.error("Error fetching inventories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inventories - Create a new inventory
export async function POST(request: NextRequest) {
  try {
    const { userId, dbUser, error } = await requireAuth();
    if (error || !dbUser) {
      return NextResponse.json(
        { error: error || "User not found. Please complete onboarding." },
        { status: error ? 401 : 404 }
      );
    }

    const body = await request.json();
    const data = createInventorySchema.parse(body);

    // Check if inventory for this year already exists
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        organizationId: dbUser.organizationId,
        baseYear: data.baseYear,
      },
    });

    if (existingInventory) {
      return NextResponse.json(
        { error: `Já existe um inventário para o ano ${data.baseYear}` },
        { status: 400 }
      );
    }

    // Create inventory
    const inventory = await prisma.inventory.create({
      data: {
        organizationId: dbUser.organizationId,
        name: data.name,
        baseYear: data.baseYear,
        reportingPeriod: data.reportingPeriod,
        gwpReference: data.gwpReference,
        consolidationApproach: data.consolidationApproach,
        includeScope1: data.includeScope1,
        includeScope2: data.includeScope2,
        includeScope3: data.includeScope3,
        status: "DRAFT",
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        inventoryId: inventory.id,
        action: "CREATE",
        entityType: "Inventory",
        entityId: inventory.id,
        userId: userId!,
        userEmail: dbUser.email,
        newValue: JSON.parse(JSON.stringify(inventory)) as JsonValue,
      },
    });

    return NextResponse.json(inventory, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
