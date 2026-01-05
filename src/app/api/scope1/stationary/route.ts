import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";
import { z } from "zod";
import { calculateStationaryCombustion, CombustionResult } from "@/lib/calculations/scope1";

// Schema for stationary combustion input
const stationaryCombustionSchema = z.object({
  inventoryId: z.string(),
  unitId: z.string().optional(),
  sourceDescription: z.string().min(1, "Descrição da fonte é obrigatória"),
  activityType: z.string().default("Combustão estacionária"),
  fuelName: z.string().min(1, "Combustível é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  unit: z.enum(["litros", "m3", "kg", "ton"]),
  ethanolPercentage: z.number().min(0).max(1).default(0.27),
  biodieselPercentage: z.number().min(0).max(1).default(0.14),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100),
  dataSource: z.string().optional(),
  dataQuality: z.enum(["PRIMARY", "PRIMARY_THIRD", "SECONDARY_CALC", "SECONDARY_ASSUMED", "EXTRAPOLATED"]).default("PRIMARY"),
  uncertainty: z.number().min(0).max(1).default(0.02),
  notes: z.string().optional(),
  // Additional metadata
  equipment: z.string().optional(),
  sector: z.string().optional(),
});

// GET - List all stationary combustion data for an inventory
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
      .eq("category", "STATIONARY_COMBUSTION")
      .eq("scope", 1)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching stationary combustion data:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados de combustão estacionária" },
      { status: 500 }
    );
  }
}

// POST - Create new stationary combustion entry and calculate emissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = stationaryCombustionSchema.parse(body);

    // Calculate emissions
    let emissionResult: CombustionResult;
    try {
      emissionResult = calculateStationaryCombustion({
        fuelName: validatedData.fuelName,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        ethanolPercentage: validatedData.ethanolPercentage,
        biodieselPercentage: validatedData.biodieselPercentage,
      });
    } catch (calcError) {
      return NextResponse.json(
        { error: `Erro no cálculo: ${(calcError as Error).message}` },
        { status: 400 }
      );
    }

    // Create activity data
    const activityData = await db.activityData.create({
      inventory_id: validatedData.inventoryId,
      unit_id: validatedData.unitId,
      category: "STATIONARY_COMBUSTION",
      subcategory: validatedData.fuelName,
      scope: 1,
      source_description: validatedData.sourceDescription,
      activity_type: validatedData.activityType,
      quantity: validatedData.quantity,
      quantity_unit: validatedData.unit,
      month: validatedData.month,
      year: validatedData.year,
      data_source: validatedData.dataSource,
      data_quality: validatedData.dataQuality,
      uncertainty: validatedData.uncertainty || null,
      notes: validatedData.notes,
      metadata: {
        fuelName: validatedData.fuelName,
        equipment: validatedData.equipment,
        sector: validatedData.sector,
        ethanolPercentage: validatedData.ethanolPercentage,
        biodieselPercentage: validatedData.biodieselPercentage,
        consumptionM3: emissionResult.consumptionM3,
        energyGJ: emissionResult.energyGJ,
      },
    });

    // Create emission result
    const emission = await db.emissionResults.create({
      inventory_id: validatedData.inventoryId,
      activity_data_id: activityData.id,
      co2_mass: emissionResult.co2Kg,
      ch4_mass: emissionResult.ch4Kg,
      n2o_mass: emissionResult.n2oKg,
      co2_equivalent: emissionResult.totalTCO2e,
      biogenic_co2: emissionResult.biogenicTCO2e,
      scope: 1,
      category: "STATIONARY_COMBUSTION",
      is_kyoto_gas: true,
      gwp_reference: "AR5",
      factors_snapshot: {
        fuelType: emissionResult.fuelType,
        energyGJ: emissionResult.energyGJ,
        co2Kg: emissionResult.co2Kg,
        ch4Kg: emissionResult.ch4Kg,
        n2oKg: emissionResult.n2oKg,
        co2BiogenicKg: emissionResult.co2BiogenicKg,
      },
    });

    // Update inventory totals
    const totals = await db.emissionResults.sumByInventory(validatedData.inventoryId);
    await db.inventories.update(validatedData.inventoryId, {
      total_emissions_scope1: totals.scope1.co2_equivalent,
      total_emissions_scope2: totals.scope2.co2_equivalent,
      total_emissions_scope3: totals.scope3.co2_equivalent,
      total_biogenic_emissions: totals.scope1.biogenic_co2,
    });

    return NextResponse.json(
      { activityData, emission, calculatedEmissions: emissionResult },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating stationary combustion data:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao salvar dados de combustão estacionária" },
      { status: 500 }
    );
  }
}
