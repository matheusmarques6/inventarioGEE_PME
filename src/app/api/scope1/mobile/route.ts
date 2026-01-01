import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import { calculateMobileCombustion, CombustionResult } from "@/lib/calculations/scope1";

// Type alias for Prisma transaction client
type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Schema for mobile combustion input
const mobileCombustionSchema = z.object({
  inventoryId: z.string(),
  unitId: z.string().optional(),
  sourceDescription: z.string().min(1, "Descrição da fonte é obrigatória"),
  activityType: z.string().default("Combustão móvel"),
  fuelName: z.string().min(1, "Combustível é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  unit: z.enum(["litros", "m3", "kg", "ton"]),
  vehicleType: z.enum(["road", "offroad"]).default("road"),
  vehicleCategory: z.string().optional(), // Caminhão, Veículo leve, Máquina agrícola, etc.
  ethanolPercentage: z.number().min(0).max(1).default(0.27),
  biodieselPercentage: z.number().min(0).max(1).default(0.14),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100),
  dataSource: z.string().optional(),
  dataQuality: z.enum(["PRIMARY", "PRIMARY_THIRD", "SECONDARY_CALC", "SECONDARY_ASSUMED", "EXTRAPOLATED"]).default("PRIMARY"),
  uncertainty: z.number().min(0).max(1).default(0.02),
  notes: z.string().optional(),
  // Additional metadata
  sector: z.string().optional(),
  fleet: z.string().optional(), // Frota veículos leves, Caminhões, etc.
});

// GET - List all mobile combustion data for an inventory
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
        category: "MOBILE_COMBUSTION",
        scope: 1,
      },
      include: {
        unit: true,
        emissionResults: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching mobile combustion data:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dados de combustão móvel" },
      { status: 500 }
    );
  }
}

// POST - Create new mobile combustion entry and calculate emissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = mobileCombustionSchema.parse(body);

    // Calculate emissions
    let emissionResult: CombustionResult;
    try {
      emissionResult = calculateMobileCombustion(
        {
          fuelName: validatedData.fuelName,
          quantity: validatedData.quantity,
          unit: validatedData.unit,
          ethanolPercentage: validatedData.ethanolPercentage,
          biodieselPercentage: validatedData.biodieselPercentage,
        },
        validatedData.vehicleType
      );
    } catch (calcError) {
      return NextResponse.json(
        { error: `Erro no cálculo: ${(calcError as Error).message}` },
        { status: 400 }
      );
    }

    // Create activity data with emission result in a transaction
    const result = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      // Create activity data
      const activityData = await tx.activityData.create({
        data: {
          inventoryId: validatedData.inventoryId,
          unitId: validatedData.unitId,
          category: "MOBILE_COMBUSTION",
          subcategory: validatedData.vehicleCategory || validatedData.fuelName,
          scope: 1,
          sourceDescription: validatedData.sourceDescription,
          activityType: validatedData.activityType,
          quantity: validatedData.quantity,
          quantityUnit: validatedData.unit,
          month: validatedData.month,
          year: validatedData.year,
          dataSource: validatedData.dataSource,
          dataQuality: validatedData.dataQuality,
          uncertainty: validatedData.uncertainty ? validatedData.uncertainty : null,
          notes: validatedData.notes,
          metadata: {
            fuelName: validatedData.fuelName,
            vehicleType: validatedData.vehicleType,
            vehicleCategory: validatedData.vehicleCategory,
            fleet: validatedData.fleet,
            sector: validatedData.sector,
            ethanolPercentage: validatedData.ethanolPercentage,
            biodieselPercentage: validatedData.biodieselPercentage,
            consumptionM3: emissionResult.consumptionM3,
            energyGJ: emissionResult.energyGJ,
          },
        },
      });

      // Create emission result
      const emission = await tx.emissionResult.create({
        data: {
          inventoryId: validatedData.inventoryId,
          activityDataId: activityData.id,
          co2Mass: emissionResult.co2Kg,
          ch4Mass: emissionResult.ch4Kg,
          n2oMass: emissionResult.n2oKg,
          co2Equivalent: emissionResult.totalTCO2e,
          biogenicCo2: emissionResult.biogenicTCO2e,
          scope: 1,
          category: "MOBILE_COMBUSTION",
          isKyotoGas: true,
          gwpReference: "AR5",
          factorsSnapshot: {
            fuelType: emissionResult.fuelType,
            energyGJ: emissionResult.energyGJ,
            co2Kg: emissionResult.co2Kg,
            ch4Kg: emissionResult.ch4Kg,
            n2oKg: emissionResult.n2oKg,
            co2BiogenicKg: emissionResult.co2BiogenicKg,
          },
        },
      });

      // Update inventory totals
      await updateInventoryTotals(tx, validatedData.inventoryId);

      return { activityData, emission, calculatedEmissions: emissionResult };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating mobile combustion data:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao salvar dados de combustão móvel" },
      { status: 500 }
    );
  }
}

// Helper function to update inventory totals
async function updateInventoryTotals(tx: PrismaTransactionClient, inventoryId: string) {
  const scope1Total = await tx.emissionResult.aggregate({
    where: { inventoryId, scope: 1 },
    _sum: { co2Equivalent: true, biogenicCo2: true },
  });

  await tx.inventory.update({
    where: { id: inventoryId },
    data: {
      totalEmissionsScope1: scope1Total._sum.co2Equivalent || 0,
      totalBiogenicEmissions: scope1Total._sum.biogenicCo2 || 0,
    },
  });
}
