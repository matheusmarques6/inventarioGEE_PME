import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/supabase/api";
import { z } from "zod";
import Decimal from "decimal.js";
import { quickCalculate } from "@/lib/calculation-engine";

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean;

const createActivityDataSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  scope: z.number().min(1).max(3),
  sourceDescription: z.string(),
  activityType: z.string(),
  quantity: z.number().positive(),
  quantityUnit: z.string(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100),
  dataSource: z.string().optional(),
  dataQuality: z
    .enum([
      "PRIMARY",
      "PRIMARY_THIRD",
      "SECONDARY_CALC",
      "SECONDARY_ASSUMED",
      "EXTRAPOLATED",
    ])
    .optional(),
  uncertainty: z.number().min(0).max(1).optional(),
  evidenceUrl: z.string().url().optional(),
  notes: z.string().optional(),
  unitId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// GET /api/inventories/[id]/activity-data - List activity data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser, error } = await requireAuth();
    if (error || !dbUser) {
      return NextResponse.json(
        { error: error || "User not found" },
        { status: error ? 401 : 404 }
      );
    }

    const { id: inventoryId } = await params;
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Verify access to inventory
    const inventory = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        organizationId: dbUser.organizationId,
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Build filters
    const where: Record<string, unknown> = { inventoryId };
    if (scope) where.scope = parseInt(scope);
    if (category) where.category = category;

    const [activityData, total] = await Promise.all([
      prisma.activityData.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          unit: true,
          emissionResults: true,
        },
      }),
      prisma.activityData.count({ where }),
    ]);

    return NextResponse.json({
      data: activityData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inventories/[id]/activity-data - Create activity data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, dbUser, error } = await requireAuth();
    if (error || !dbUser) {
      return NextResponse.json(
        { error: error || "User not found" },
        { status: error ? 401 : 404 }
      );
    }

    const { id: inventoryId } = await params;
    const body = await request.json();
    const data = createActivityDataSchema.parse(body);

    // Verify access to inventory
    const inventory = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        organizationId: dbUser.organizationId,
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Create activity data
    const activityData = await prisma.activityData.create({
      data: {
        inventoryId,
        category: data.category as never,
        subcategory: data.subcategory,
        scope: data.scope,
        sourceDescription: data.sourceDescription,
        activityType: data.activityType,
        quantity: new Decimal(data.quantity),
        quantityUnit: data.quantityUnit,
        month: data.month,
        year: data.year,
        dataSource: data.dataSource,
        dataQuality: data.dataQuality as never,
        uncertainty: data.uncertainty
          ? new Decimal(data.uncertainty)
          : undefined,
        evidenceUrl: data.evidenceUrl,
        notes: data.notes,
        unitId: data.unitId,
        metadata: data.metadata as JsonValue,
        createdBy: userId,
      },
    });

    // Calculate emissions
    const calculationInput = {
      fuelType: data.activityType,
      quantity: new Decimal(data.quantity),
      unit: data.quantityUnit,
      year: data.year,
      month: data.month,
      ...data.metadata,
    };

    const emissionResult = quickCalculate(
      data.category,
      calculationInput as Record<string, unknown>,
      inventory.gwpReference
    );

    // Save emission result
    const savedResult = await prisma.emissionResult.create({
      data: {
        inventoryId,
        activityDataId: activityData.id,
        co2Mass: emissionResult.co2Mass,
        ch4Mass: emissionResult.ch4Mass,
        n2oMass: emissionResult.n2oMass,
        co2Equivalent: emissionResult.co2Equivalent,
        biogenicCo2: emissionResult.biogenicCo2,
        removals: emissionResult.removals,
        scope: data.scope,
        category: data.category as never,
        isKyotoGas: emissionResult.isKyotoGas,
        gwpReference: inventory.gwpReference,
        factorsSnapshot: emissionResult.factorsSnapshot as JsonValue,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        inventoryId,
        action: "CREATE",
        entityType: "ActivityData",
        entityId: activityData.id,
        userId: userId!,
        userEmail: dbUser.email,
        newValue: {
          activityData: JSON.parse(JSON.stringify(activityData)),
          emissionResult: JSON.parse(JSON.stringify(savedResult)),
        } as JsonValue,
      },
    });

    return NextResponse.json(
      {
        activityData,
        emissionResult: savedResult,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating activity data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
