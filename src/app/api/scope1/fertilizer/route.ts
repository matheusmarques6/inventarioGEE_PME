import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";
import { z } from "zod";
import {
  calculateFertilizerEmissions,
  calculateLimestoneEmissions,
  FertilizerEmissionResult,
  LimestoneEmissionResult,
} from "@/lib/emission-factors/fertilizers";

// Schema for fertilizer input
const fertilizerSchema = z.object({
  inventoryId: z.string(),
  unitId: z.string().optional(),
  sourceDescription: z.string().min(1, "Descrição é obrigatória"),
  fertilizerType: z.enum(["nitrogen", "limestone"]),
  fertilizerName: z.string().optional(),
  nitrogenContent: z.number().min(0).max(1).optional(),
  isUrea: z.boolean().optional(),
  limestoneType: z.enum(["calcitic", "dolomitic"]).optional(),
  caoContent: z.number().min(0).max(1).optional(),
  mgoContent: z.number().min(0).max(1).optional(),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  unit: z.enum(["kg", "ton"]).default("kg"),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100),
  dataSource: z.string().optional(),
  dataQuality: z.enum(["PRIMARY", "PRIMARY_THIRD", "SECONDARY_CALC", "SECONDARY_ASSUMED", "EXTRAPOLATED"]).default("PRIMARY"),
  uncertainty: z.number().min(0).max(1).default(0.02),
  notes: z.string().optional(),
  sector: z.string().optional(),
  activity: z.string().optional(),
});

// GET - List all fertilizer data for an inventory
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
      .eq("category", "AGRICULTURAL")
      .eq("scope", 1)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching fertilizer data:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados de fertilizantes" },
      { status: 500 }
    );
  }
}

// POST - Create new fertilizer entry and calculate emissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = fertilizerSchema.parse(body);

    // Convert quantity to kg
    let quantityKg = validatedData.quantity;
    if (validatedData.unit === "ton") {
      quantityKg = validatedData.quantity * 1000;
    }

    // Calculate emissions based on type
    let emissionResult: { co2Kg: number; n2oKg?: number; totalTCO2e: number; details: Record<string, unknown> };

    if (validatedData.fertilizerType === "nitrogen") {
      if (!validatedData.nitrogenContent) {
        return NextResponse.json(
          { error: "Teor de nitrogênio é obrigatório para fertilizantes nitrogenados" },
          { status: 400 }
        );
      }

      const fertResult: FertilizerEmissionResult = calculateFertilizerEmissions({
        fertilizerType: validatedData.fertilizerName || "Fertilizante nitrogenado",
        nitrogenContent: validatedData.nitrogenContent,
        isUrea: validatedData.isUrea || false,
        quantity: quantityKg,
      });

      emissionResult = {
        co2Kg: fertResult.co2Kg,
        n2oKg: fertResult.n2oKg,
        totalTCO2e: fertResult.totalTCO2e,
        details: {
          nitrogenApplied: fertResult.nitrogenApplied,
          directN2O: fertResult.details.directN2O,
          indirectN2OVolatilization: fertResult.details.indirectN2OVolatilization,
          indirectN2OLeaching: fertResult.details.indirectN2OLeaching,
          ureaCO2: fertResult.details.ureaCO2,
        },
      };
    } else {
      if (!validatedData.limestoneType || validatedData.caoContent === undefined) {
        return NextResponse.json(
          { error: "Tipo de calcário e teor de CaO são obrigatórios" },
          { status: 400 }
        );
      }

      const limeResult: LimestoneEmissionResult = calculateLimestoneEmissions({
        type: validatedData.limestoneType,
        caoContent: validatedData.caoContent,
        mgoContent: validatedData.mgoContent || 0,
        quantity: quantityKg,
      });

      emissionResult = {
        co2Kg: limeResult.co2Kg,
        totalTCO2e: limeResult.totalTCO2e,
        details: {
          caco3Equivalent: limeResult.caco3Equivalent,
          limestoneType: validatedData.limestoneType,
        },
      };
    }

    const subcategory = validatedData.fertilizerType === "nitrogen"
      ? validatedData.fertilizerName || "Fertilizante nitrogenado"
      : `Calcário ${validatedData.limestoneType === "calcitic" ? "calcítico" : "dolomítico"}`;

    // Create activity data
    const activityData = await db.activityData.create({
      inventory_id: validatedData.inventoryId,
      unit_id: validatedData.unitId,
      category: "AGRICULTURAL",
      subcategory,
      scope: 1,
      source_description: validatedData.sourceDescription,
      activity_type: "Aplicação de fertilizantes/calcário",
      quantity: quantityKg,
      quantity_unit: "kg",
      month: validatedData.month,
      year: validatedData.year,
      data_source: validatedData.dataSource,
      data_quality: validatedData.dataQuality,
      uncertainty: validatedData.uncertainty || null,
      notes: validatedData.notes,
      metadata: {
        fertilizerType: validatedData.fertilizerType,
        fertilizerName: validatedData.fertilizerName,
        nitrogenContent: validatedData.nitrogenContent,
        isUrea: validatedData.isUrea,
        limestoneType: validatedData.limestoneType,
        caoContent: validatedData.caoContent,
        mgoContent: validatedData.mgoContent,
        sector: validatedData.sector,
        activity: validatedData.activity,
        originalQuantity: validatedData.quantity,
        originalUnit: validatedData.unit,
        calculatedDetails: emissionResult.details,
      },
    });

    // Create emission result
    const emission = await db.emissionResults.create({
      inventory_id: validatedData.inventoryId,
      activity_data_id: activityData.id,
      co2_mass: emissionResult.co2Kg,
      n2o_mass: emissionResult.n2oKg || null,
      co2_equivalent: emissionResult.totalTCO2e,
      scope: 1,
      category: "AGRICULTURAL",
      is_kyoto_gas: true,
      gwp_reference: "AR5",
      factors_snapshot: {
        ...emissionResult.details,
        co2Kg: emissionResult.co2Kg,
        n2oKg: emissionResult.n2oKg,
        totalTCO2e: emissionResult.totalTCO2e,
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
    console.error("Error creating fertilizer data:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao salvar dados de fertilizantes" },
      { status: 500 }
    );
  }
}
