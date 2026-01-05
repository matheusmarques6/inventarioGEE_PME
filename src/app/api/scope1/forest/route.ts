import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
// Type for JSON value to avoid Prisma type import issues
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];
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

    const activityData = await prisma.activityData.findMany({
      where: {
        inventoryId,
        category: "LULUCF",
        scope: 1,
      },
      include: {
        emissionResults: true,
        unit: true,
      },
      orderBy: { createdAt: "desc" },
    });

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
    const inventory = await prisma.inventory.findUnique({
      where: { id: data.inventoryId },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    const gwpReference = (inventory.gwpReference || "AR5") as GWPReference;

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

      // Removals are negative (sequestration)
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
      // Calculate for native forest
      if (data.activityType === "growth") {
        // Carbon sequestration
        removals = calculateNativeRemovals(data.biome, data.area, false);
        calculatedDetails = {
          type: "native_forest_growth",
          biome: data.biome,
          area: data.area,
          isPrimary: false,
          annualIncrement: ANNUAL_INCREMENT[data.biome]?.secundaria || 0,
        };
      } else if (data.activityType === "deforestation") {
        // Deforestation emissions
        const carbonStock = getNativeCarbonStock(data.biome, data.physiognomy);
        co2Equivalent = data.area * carbonStock * (44 / 12); // Convert tC to tCO2
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
      // Restoration removals (simplified)
      const incrementRate = 2.0; // tC/ha/year for restoration
      removals = -(data.area * incrementRate * (44 / 12)); // Negative = sequestration
      calculatedDetails = {
        type: "restoration",
        area: data.area,
        incrementRate,
      };
    }

    // Determine if this is an emission or removal for activity type naming
    const isRemoval = removals < 0;

    // Create activity data record
    const activityData = await prisma.activityData.create({
      data: {
        inventoryId: data.inventoryId,
        category: "LULUCF",
        subcategory: data.forestType,
        scope: 1,
        sourceDescription: data.sourceDescription,
        activityType: data.activityType,
        quantity: data.area,
        quantityUnit: "ha",
        month: data.month,
        year: data.year,
        dataSource: data.dataSource || "Manual",
        dataQuality: "CALCULATED",
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
        } as JsonValue,
      },
    });

    // Create emission result
    const emissionResult = await prisma.emissionResult.create({
      data: {
        inventoryId: data.inventoryId,
        activityDataId: activityData.id,
        co2Mass: co2Equivalent * 1000, // kg
        co2Equivalent,
        biogenicCo2,
        removals,
        scope: 1,
        category: "LULUCF",
        isKyotoGas: true,
        calculatedAt: new Date(),
        calculationVersion: "1.0",
        gwpReference,
        factorsSnapshot: calculatedDetails as JsonValue,
      },
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
  const totals = await prisma.emissionResult.groupBy({
    by: ["scope"],
    where: { inventoryId },
    _sum: { co2Equivalent: true, biogenicCo2: true, removals: true },
  });

  type ScopeTotals = { scope: number; _sum: { co2Equivalent: number | null; biogenicCo2: number | null; removals: number | null } };
  const scope1Total =
    totals.find((t: ScopeTotals) => t.scope === 1)?._sum.co2Equivalent || 0;
  const scope2Total =
    totals.find((t: ScopeTotals) => t.scope === 2)?._sum.co2Equivalent || 0;
  const scope3Total =
    totals.find((t: ScopeTotals) => t.scope === 3)?._sum.co2Equivalent || 0;
  const biogenicTotal = totals.reduce(
    (sum: number, t: ScopeTotals) => sum + Number(t._sum.biogenicCo2 || 0),
    0
  );
  const removalsTotal = totals.reduce(
    (sum: number, t: ScopeTotals) => sum + Number(t._sum.removals || 0),
    0
  );

  await prisma.inventory.update({
    where: { id: inventoryId },
    data: {
      totalEmissionsScope1: scope1Total,
      totalEmissionsScope2: scope2Total,
      totalEmissionsScope3: scope3Total,
      totalBiogenicEmissions: biogenicTotal,
      totalRemovals: removalsTotal,
    },
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
