import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";
import { z } from "zod";
import { calculateFugitiveEmissions, FugitiveResult } from "@/lib/calculations/scope1";
import { GWP_REFRIGERANTS, isKyotoGas } from "@/lib/emission-factors/gwp";

// Schema for fugitive emissions input
const fugitiveEmissionsSchema = z.object({
  inventoryId: z.string(),
  unitId: z.string().optional(),
  sourceDescription: z.string().min(1, "Descrição da fonte é obrigatória"),
  gasName: z.string().min(1, "Nome do gás refrigerante é obrigatório"),
  commercialName: z.string().optional(),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  unit: z.enum(["kg"]).default("kg"),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100),
  dataSource: z.string().optional(),
  dataQuality: z.enum(["PRIMARY", "PRIMARY_THIRD", "SECONDARY_CALC", "SECONDARY_ASSUMED", "EXTRAPOLATED"]).default("PRIMARY"),
  uncertainty: z.number().min(0).max(1).default(0.02),
  notes: z.string().optional(),
  sector: z.string().optional(),
  equipment: z.string().optional(),
});

// GET - List all fugitive emissions data for an inventory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get("inventoryId");

    if (!inventoryId) {
      return NextResponse.json(
        { error: "inventoryId é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = getDb();
    const { data: activityData, error } = await supabase
      .from("activity_data")
      .select("*, unit:operational_units(*), emission_results(*)")
      .eq("inventory_id", inventoryId)
      .eq("category", "FUGITIVE_EMISSIONS")
      .eq("scope", 1)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching fugitive emissions data:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados de emissões fugitivas" },
      { status: 500 }
    );
  }
}

// POST - Create new fugitive emission entry and calculate emissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = fugitiveEmissionsSchema.parse(body);

    // Calculate emissions
    let emissionResult: FugitiveResult;
    try {
      emissionResult = calculateFugitiveEmissions({
        gasName: validatedData.gasName,
        quantity: validatedData.quantity,
      });
    } catch (calcError) {
      return NextResponse.json(
        { error: `Erro no cálculo: ${(calcError as Error).message}` },
        { status: 400 }
      );
    }

    const gasInfo = GWP_REFRIGERANTS[validatedData.gasName];
    const isKyoto = isKyotoGas(validatedData.gasName);

    // Create activity data
    const activityData = await db.activityData.create({
      inventory_id: validatedData.inventoryId,
      unit_id: validatedData.unitId,
      category: "FUGITIVE_EMISSIONS",
      subcategory: validatedData.gasName,
      scope: 1,
      source_description: validatedData.sourceDescription,
      activity_type: "Emissões fugitivas",
      quantity: validatedData.quantity,
      quantity_unit: validatedData.unit,
      month: validatedData.month,
      year: validatedData.year,
      data_source: validatedData.dataSource,
      data_quality: validatedData.dataQuality,
      uncertainty: validatedData.uncertainty || null,
      notes: validatedData.notes,
      metadata: {
        gasName: validatedData.gasName,
        commercialName: validatedData.commercialName,
        equipment: validatedData.equipment,
        sector: validatedData.sector,
        gwp: emissionResult.gwp,
        gasFamily: gasInfo?.family || "Unknown",
        isKyotoGas: isKyoto,
      },
    });

    // Create emission result
    const emission = await db.emissionResults.create({
      inventory_id: validatedData.inventoryId,
      activity_data_id: activityData.id,
      hfc_mass: validatedData.quantity,
      co2_equivalent: emissionResult.totalTCO2e,
      scope: 1,
      category: "FUGITIVE_EMISSIONS",
      is_kyoto_gas: isKyoto,
      gwp_reference: "AR5",
      factors_snapshot: {
        gasName: validatedData.gasName,
        gwp: emissionResult.gwp,
        quantityKg: validatedData.quantity,
        kyotoTCO2e: emissionResult.kyotoTCO2e,
        nonKyotoTCO2e: emissionResult.nonKyotoTCO2e,
      },
    });

    // Update inventory totals
    const totals = await db.emissionResults.sumByInventory(validatedData.inventoryId);
    await db.inventories.update(validatedData.inventoryId, {
      total_emissions_scope1: totals.scope1.co2_equivalent,
      total_biogenic_emissions: totals.scope1.biogenic_co2,
    });

    return NextResponse.json(
      { activityData, emission, calculatedEmissions: emissionResult },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating fugitive emissions data:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao salvar dados de emissões fugitivas" },
      { status: 500 }
    );
  }
}

// GET available refrigerant gases
export async function OPTIONS() {
  const gases = Object.entries(GWP_REFRIGERANTS).map(([name, info]) => ({
    name,
    gwp: info.gwp,
    family: info.family,
    formula: info.formula,
    isKyoto: isKyotoGas(name),
  }));

  return NextResponse.json({ gases });
}
