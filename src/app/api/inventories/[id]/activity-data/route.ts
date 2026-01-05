import { NextRequest, NextResponse } from "next/server";
import { db, EmissionCategory, ActivityData } from "@/lib/db/supabase-db";
import { requireAuth } from "@/lib/supabase/api";
import { z } from "zod";
import Decimal from "decimal.js";
import { quickCalculate } from "@/lib/calculation-engine";

// Transform snake_case database response to camelCase for frontend
function transformActivityData(data: ActivityData) {
  return {
    id: data.id,
    inventoryId: data.inventory_id,
    unitId: data.unit_id,
    category: data.category,
    subcategory: data.subcategory,
    scope: data.scope,
    sourceDescription: data.source_description,
    activityType: data.activity_type,
    quantity: data.quantity,
    quantityUnit: data.quantity_unit,
    month: data.month,
    year: data.year,
    dataSource: data.data_source,
    dataQuality: data.data_quality,
    uncertainty: data.uncertainty,
    evidenceUrl: data.evidence_url,
    notes: data.notes,
    emissionFactorId: data.emission_factor_id,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
    unit: data.unit,
    emissionResults: data.emission_results?.map(transformEmissionResult),
  };
}

// Transform emission result to camelCase
function transformEmissionResult(er: {
  id: string;
  inventory_id: string;
  activity_data_id: string;
  co2_mass?: number | null;
  ch4_mass?: number | null;
  n2o_mass?: number | null;
  co2_equivalent: number;
  biogenic_co2?: number | null;
  removals?: number | null;
  scope: number;
  category: string;
  is_kyoto_gas: boolean;
  gwp_reference: string;
  factors_snapshot?: Record<string, unknown> | null;
}) {
  return {
    id: er.id,
    inventoryId: er.inventory_id,
    activityDataId: er.activity_data_id,
    co2Mass: er.co2_mass,
    ch4Mass: er.ch4_mass,
    n2oMass: er.n2o_mass,
    co2Equivalent: er.co2_equivalent,
    biogenicCo2: er.biogenic_co2,
    removals: er.removals,
    scope: er.scope,
    category: er.category,
    isKyotoGas: er.is_kyoto_gas,
    gwpReference: er.gwp_reference,
    factorsSnapshot: er.factors_snapshot,
  };
}

const emissionCategories: [EmissionCategory, ...EmissionCategory[]] = [
  "STATIONARY_COMBUSTION",
  "MOBILE_COMBUSTION",
  "FUGITIVE_EMISSIONS",
  "PROCESS_EMISSIONS",
  "AGRICULTURAL",
  "LULUCF",
  "WASTE_INTERNAL",
  "PURCHASED_ELECTRICITY",
  "PURCHASED_HEAT",
  "PURCHASED_GOODS",
  "CAPITAL_GOODS",
  "FUEL_ENERGY_ACTIVITIES",
  "UPSTREAM_TRANSPORT",
  "DOWNSTREAM_TRANSPORT",
  "WASTE_EXTERNAL",
  "BUSINESS_TRAVEL",
  "EMPLOYEE_COMMUTING",
  "LEASED_ASSETS",
  "INVESTMENTS",
];

const createActivityDataSchema = z.object({
  category: z.enum(emissionCategories),
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
    const inventory = await db.inventories.findByIdWithOrg(inventoryId, dbUser.organization_id);

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Build filters
    const [activityData, total] = await Promise.all([
      db.activityData.findMany({
        inventoryId,
        scope: scope ? parseInt(scope) : undefined,
        category: category || undefined,
        page,
        limit,
      }),
      db.activityData.count({
        inventoryId,
        scope: scope ? parseInt(scope) : undefined,
        category: category || undefined,
      }),
    ]);

    return NextResponse.json({
      data: activityData.map(transformActivityData),
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
    const inventory = await db.inventories.findByIdWithOrg(inventoryId, dbUser.organization_id);

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Create activity data
    const activityData = await db.activityData.create({
      inventory_id: inventoryId,
      category: data.category,
      subcategory: data.subcategory,
      scope: data.scope,
      source_description: data.sourceDescription,
      activity_type: data.activityType,
      quantity: data.quantity,
      quantity_unit: data.quantityUnit,
      month: data.month,
      year: data.year,
      data_source: data.dataSource,
      data_quality: data.dataQuality || "PRIMARY",
      uncertainty: data.uncertainty,
      evidence_url: data.evidenceUrl,
      notes: data.notes,
      unit_id: data.unitId,
      metadata: data.metadata || null,
      created_by: userId,
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

    console.log("Calculation input:", {
      fuelType: calculationInput.fuelType,
      quantity: calculationInput.quantity.toString(),
      unit: calculationInput.unit,
      year: calculationInput.year,
      category: data.category,
    });

    const emissionResult = quickCalculate(
      data.category,
      calculationInput as Record<string, unknown>,
      inventory.gwp_reference
    );

    console.log("Emission result:", {
      co2Mass: emissionResult.co2Mass?.toString(),
      ch4Mass: emissionResult.ch4Mass?.toString(),
      n2oMass: emissionResult.n2oMass?.toString(),
      co2Equivalent: emissionResult.co2Equivalent?.toString(),
      factorsSnapshot: emissionResult.factorsSnapshot,
    });

    // Convert Decimal to number safely
    const toNumber = (value: Decimal | null | undefined): number | null => {
      if (!value) return null;
      const num = value.toNumber();
      return isNaN(num) ? 0 : num;
    };

    // Save emission result
    const savedResult = await db.emissionResults.create({
      inventory_id: inventoryId,
      activity_data_id: activityData.id,
      co2_mass: toNumber(emissionResult.co2Mass),
      ch4_mass: toNumber(emissionResult.ch4Mass),
      n2o_mass: toNumber(emissionResult.n2oMass),
      co2_equivalent: toNumber(emissionResult.co2Equivalent) || 0,
      biogenic_co2: toNumber(emissionResult.biogenicCo2),
      removals: toNumber(emissionResult.removals),
      scope: data.scope,
      category: data.category,
      is_kyoto_gas: emissionResult.isKyotoGas,
      gwp_reference: inventory.gwp_reference,
      factors_snapshot: emissionResult.factorsSnapshot || null,
    });

    // Log the action
    await db.auditLogs.create({
      inventory_id: inventoryId,
      action: "CREATE",
      entity_type: "ActivityData",
      entity_id: activityData.id,
      user_id: userId!,
      user_email: dbUser.email,
      new_value: {
        activityData,
        emissionResult: savedResult,
      },
    });

    return NextResponse.json(
      {
        activityData,
        emissionResult: transformEmissionResult(savedResult),
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
