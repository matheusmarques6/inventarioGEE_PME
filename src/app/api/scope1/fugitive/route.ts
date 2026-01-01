import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import { calculateFugitiveEmissions, FugitiveResult } from "@/lib/calculations/scope1";
import { GWP_REFRIGERANTS, isKyotoGas } from "@/lib/emission-factors/gwp";
import { Prisma } from "@prisma/client";

// Schema for fugitive emissions input
const fugitiveEmissionsSchema = z.object({
  inventoryId: z.string(),
  unitId: z.string().optional(),
  sourceDescription: z.string().min(1, "Descrição da fonte é obrigatória"),
  gasName: z.string().min(1, "Nome do gás refrigerante é obrigatório"),
  commercialName: z.string().optional(), // Nome comercial do produto
  quantity: z.number().positive("Quantidade deve ser positiva"),
  unit: z.enum(["kg"]).default("kg"),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100),
  dataSource: z.string().optional(),
  dataQuality: z.enum(["PRIMARY", "PRIMARY_THIRD", "SECONDARY_CALC", "SECONDARY_ASSUMED", "EXTRAPOLATED"]).default("PRIMARY"),
  uncertainty: z.number().min(0).max(1).default(0.02),
  notes: z.string().optional(),
  // Additional metadata
  sector: z.string().optional(),
  equipment: z.string().optional(), // Ar condicionado, Refrigerador, etc.
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

    const activityData = await prisma.activityData.findMany({
      where: {
        inventoryId,
        category: "FUGITIVE_EMISSIONS",
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

    // Determine HFC mass for the specific gas type
    const gasInfo = GWP_REFRIGERANTS[validatedData.gasName];
    const isKyoto = isKyotoGas(validatedData.gasName);

    // Create activity data with emission result in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create activity data
      const activityData = await tx.activityData.create({
        data: {
          inventoryId: validatedData.inventoryId,
          unitId: validatedData.unitId,
          category: "FUGITIVE_EMISSIONS",
          subcategory: validatedData.gasName,
          scope: 1,
          sourceDescription: validatedData.sourceDescription,
          activityType: "Emissões fugitivas",
          quantity: new Prisma.Decimal(validatedData.quantity),
          quantityUnit: validatedData.unit,
          month: validatedData.month,
          year: validatedData.year,
          dataSource: validatedData.dataSource,
          dataQuality: validatedData.dataQuality,
          uncertainty: validatedData.uncertainty ? new Prisma.Decimal(validatedData.uncertainty) : null,
          notes: validatedData.notes,
          metadata: {
            gasName: validatedData.gasName,
            commercialName: validatedData.commercialName,
            equipment: validatedData.equipment,
            sector: validatedData.sector,
            gwp: emissionResult.gwp,
            gasFamily: gasInfo?.family || "Unknown",
            isKyotoGas: isKyoto,
          } as Prisma.InputJsonValue,
        },
      });

      // Create emission result
      const emission = await tx.emissionResult.create({
        data: {
          inventoryId: validatedData.inventoryId,
          activityDataId: activityData.id,
          hfcMass: new Prisma.Decimal(validatedData.quantity),
          co2Equivalent: new Prisma.Decimal(emissionResult.totalTCO2e),
          scope: 1,
          category: "FUGITIVE_EMISSIONS",
          isKyotoGas: isKyoto,
          gwpReference: "AR5",
          factorsSnapshot: {
            gasName: validatedData.gasName,
            gwp: emissionResult.gwp,
            quantityKg: validatedData.quantity,
            kyotoTCO2e: emissionResult.kyotoTCO2e,
            nonKyotoTCO2e: emissionResult.nonKyotoTCO2e,
          } as Prisma.InputJsonValue,
        },
      });

      // Update inventory totals
      await updateInventoryTotals(tx, validatedData.inventoryId);

      return { activityData, emission, calculatedEmissions: emissionResult };
    });

    return NextResponse.json(result, { status: 201 });
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

// Helper function to update inventory totals
async function updateInventoryTotals(tx: Prisma.TransactionClient, inventoryId: string) {
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
