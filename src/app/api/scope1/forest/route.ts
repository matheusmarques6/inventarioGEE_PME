import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";
import { z } from "zod";
import Decimal from "decimal.js";
import {
  calculateForestRemovals,
  getForestSpecies,
  getForestClones,
} from "@/lib/calculation-engine/calculators/forest";
import { calculateNativeRemovals, getNativeCarbonStock, ANNUAL_INCREMENT } from "@/lib/constants/forest-factors";
import type { GWPReference } from "@/lib/constants/gwp";

const forestSchema = z.object({
  inventoryId: z.string(),
  sourceDescription: z.string().min(1, "Descrição é obrigatória"),
  forestType: z.enum(["planted", "native", "restoration"]),
  activityType: z.enum(["growth", "harvest", "deforestation", "fire", "planting"]),
  species: z.string().optional(),
  clone: z.string().optional(),
  biome: z.string().optional(),
  physiognomy: z.string().optional(),
  age: z.number().min(0).max(100).optional(),
  area: z.number().positive("Área deve ser positiva"),
  volume: z.number().optional(),
  year: z.number().min(2000).max(2100),
  month: z.number().min(1).max(12).optional(),
  dataSource: z.string().optional(),
  notes: z.string().optional(),
});

// GET - List forest activity data
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
      .select("*, emission_results(*), unit:operational_units(*)")
      .eq("inventory_id", inventoryId)
      .eq("category", "LULUCF")
      .eq("scope", 1)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching forest data:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados florestais" },
      { status: 500 }
    );
  }
}

// POST - Create forest activity data and calculate emissions/removals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = forestSchema.parse(body);

    // Get inventory for GWP reference
    const inventory = await db.inventories.findById(data.inventoryId);

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    const gwpReference = (inventory.gwp_reference || "AR5") as GWPReference;

    let co2Equivalent = 0;
    let removals = 0;
    let biogenicCo2 = 0;
    let calculatedDetails: Record<string, unknown> = {};

    if (data.forestType === "planted" && data.species) {
      // Calculate for planted forest
      const forestInput = {
        species: data.species,
        clone: data.clone,
        age: data.age || 5,
        area: new Decimal(data.area),
        volume: data.volume ? new Decimal(data.volume) : undefined,
        year: data.year,
      };

      const result = calculateForestRemovals(forestInput, gwpReference);

      removals = result.removals ? Number(result.removals) : 0;
      co2Equivalent = result.co2Equivalent ? Number(result.co2Equivalent) : 0;
      biogenicCo2 = result.biogenicCo2 ? Number(result.biogenicCo2) : 0;

      calculatedDetails = {
        type: "planted_forest",
        species: data.species,
        clone: data.clone,
        age: data.age,
        area: data.area,
        volume: data.volume,
        factorsSnapshot: result.factorsSnapshot,
      };
    } else if (data.forestType === "native" && data.biome) {
      if (data.activityType === "growth") {
        removals = calculateNativeRemovals(data.biome, data.area, false);
        calculatedDetails = {
          type: "native_forest_growth",
          biome: data.biome,
          area: data.area,
          isPrimary: false,
          annualIncrement: ANNUAL_INCREMENT[data.biome]?.secundaria || 0,
        };
      } else if (data.activityType === "deforestation") {
        const carbonStock = getNativeCarbonStock(data.biome, data.physiognomy);
        co2Equivalent = data.area * carbonStock * (44 / 12);
        biogenicCo2 = co2Equivalent;
        calculatedDetails = {
          type: "deforestation",
          biome: data.biome,
          physiognomy: data.physiognomy,
          area: data.area,
          carbonStock,
        };
      }
    } else if (data.forestType === "restoration") {
      const incrementRate = 2.0;
      removals = -(data.area * incrementRate * (44 / 12));
      calculatedDetails = {
        type: "restoration",
        area: data.area,
        incrementRate,
      };
    }

    const isRemoval = removals < 0;

    // Create activity data record
    const activityData = await db.activityData.create({
      inventory_id: data.inventoryId,
      category: "LULUCF",
      subcategory: data.forestType,
      scope: 1,
      source_description: data.sourceDescription,
      activity_type: data.activityType,
      quantity: data.area,
      quantity_unit: "ha",
      month: data.month,
      year: data.year,
      data_source: data.dataSource || "Manual",
      data_quality: "SECONDARY_CALC",
      notes: data.notes,
      metadata: {
        forestType: data.forestType,
        activityType: data.activityType,
        species: data.species,
        clone: data.clone,
        biome: data.biome,
        physiognomy: data.physiognomy,
        age: data.age,
        volume: data.volume,
        isRemoval,
        calculatedDetails,
      },
    });

    // Create emission result
    const emissionResult = await db.emissionResults.create({
      inventory_id: data.inventoryId,
      activity_data_id: activityData.id,
      co2_mass: co2Equivalent * 1000,
      co2_equivalent: co2Equivalent,
      biogenic_co2: biogenicCo2,
      removals,
      scope: 1,
      category: "LULUCF",
      is_kyoto_gas: true,
      gwp_reference: gwpReference,
      factors_snapshot: calculatedDetails,
    });

    // Update inventory totals
    await updateInventoryTotals(data.inventoryId);

    return NextResponse.json(
      {
        activityData,
        emissionResult,
        calculatedEmissions: {
          co2Equivalent,
          removals,
          biogenicCo2,
          isRemoval,
          totalTCO2e: isRemoval ? removals : co2Equivalent,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating forest data:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao salvar dados florestais" },
      { status: 500 }
    );
  }
}

// Helper function to update inventory totals
async function updateInventoryTotals(inventoryId: string) {
  const supabase = getDb();

  const { data: results } = await supabase
    .from("emission_results")
    .select("scope, co2_equivalent, biogenic_co2, removals")
    .eq("inventory_id", inventoryId);

  type EmissionRow = { scope: number; co2_equivalent: number | null; biogenic_co2: number | null; removals: number | null };
  const typedResults = (results as EmissionRow[] | null) || [];

  const totals = typedResults.reduce(
    (acc, r) => {
      if (r.scope === 1) {
        acc.scope1 += Number(r.co2_equivalent) || 0;
        acc.biogenic += Number(r.biogenic_co2) || 0;
        acc.removals += Number(r.removals) || 0;
      } else if (r.scope === 2) {
        acc.scope2 += Number(r.co2_equivalent) || 0;
      } else if (r.scope === 3) {
        acc.scope3 += Number(r.co2_equivalent) || 0;
      }
      return acc;
    },
    { scope1: 0, scope2: 0, scope3: 0, biogenic: 0, removals: 0 }
  );

  await db.inventories.update(inventoryId, {
    total_emissions_scope1: totals.scope1,
    total_emissions_scope2: totals.scope2,
    total_emissions_scope3: totals.scope3,
    total_biogenic_emissions: totals.biogenic,
    total_removals: totals.removals,
  });
}

// GET endpoint for forest species and clones
export async function OPTIONS() {
  return NextResponse.json({
    species: getForestSpecies(),
    clones: {
      Eucalipto: getForestClones("Eucalipto"),
      Pinus: getForestClones("Pinus"),
    },
    biomes: Object.keys(ANNUAL_INCREMENT),
  });
}
