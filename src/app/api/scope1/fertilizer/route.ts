import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import {
  calculateFertilizerEmissions,
  calculateLimestoneEmissions,
  FertilizerEmissionResult,
  LimestoneEmissionResult,
} from "@/lib/emission-factors/fertilizers";

// Type alias for Prisma transaction client
type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Schema for fertilizer input
const fertilizerSchema = z.object({
  inventoryId: z.string(),
  unitId: z.string().optional(),
  sourceDescription: z.string().min(1, "Descrição é obrigatória"),
  fertilizerType: z.enum(["nitrogen", "limestone"]),
  // For nitrogen fertilizers
  fertilizerName: z.string().optional(),
  nitrogenContent: z.number().min(0).max(1).optional(), // 0-100% as 0-1
  isUrea: z.boolean().optional(),
  // For limestone
  limestoneType: z.enum(["calcitic", "dolomitic"]).optional(),
  caoContent: z.number().min(0).max(1).optional(), // CaO %
  mgoContent: z.number().min(0).max(1).optional(), // MgO %
  // Common fields
  quantity: z.number().positive("Quantidade deve ser positiva"),
  unit: z.enum(["kg", "ton"]).default("kg"),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100),
  dataSource: z.string().optional(),
  dataQuality: z.enum(["PRIMARY", "PRIMARY_THIRD", "SECONDARY_CALC", "SECONDARY_ASSUMED", "EXTRAPOLATED"]).default("PRIMARY"),
  uncertainty: z.number().min(0).max(1).default(0.02),
  notes: z.string().optional(),
  // Additional metadata
  sector: z.string().optional(),
  activity: z.string().optional(), // Silvicultura, Agricultura, etc.
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

    const activityData = await prisma.activityData.findMany({
      where: {
        inventoryId,
        category: "AGRICULTURAL",
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
      // Limestone
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

    // Create activity data with emission result in a transaction
    const result = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const subcategory = validatedData.fertilizerType === "nitrogen"
        ? validatedData.fertilizerName || "Fertilizante nitrogenado"
        : `Calcário ${validatedData.limestoneType === "calcitic" ? "calcítico" : "dolomítico"}`;

      // Create activity data
      const activityData = await tx.activityData.create({
        data: {
          inventoryId: validatedData.inventoryId,
          unitId: validatedData.unitId,
          category: "AGRICULTURAL",
          subcategory,
          scope: 1,
          sourceDescription: validatedData.sourceDescription,
          activityType: "Aplicação de fertilizantes/calcário",
          quantity: quantityKg,
          quantityUnit: "kg",
          month: validatedData.month,
          year: validatedData.year,
          dataSource: validatedData.dataSource,
          dataQuality: validatedData.dataQuality,
          uncertainty: validatedData.uncertainty ? validatedData.uncertainty : null,
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
        },
      });

      // Create emission result
      const emission = await tx.emissionResult.create({
        data: {
          inventoryId: validatedData.inventoryId,
          activityDataId: activityData.id,
          co2Mass: emissionResult.co2Kg,
          n2oMass: emissionResult.n2oKg ? emissionResult.n2oKg : null,
          co2Equivalent: emissionResult.totalTCO2e,
          scope: 1,
          category: "AGRICULTURAL",
          isKyotoGas: true,
          gwpReference: "AR5",
          factorsSnapshot: {
            ...emissionResult.details,
            co2Kg: emissionResult.co2Kg,
            n2oKg: emissionResult.n2oKg,
            totalTCO2e: emissionResult.totalTCO2e,
          },
        },
      });

      // Update inventory totals
      await updateInventoryTotals(tx, validatedData.inventoryId);

      return { activityData, emission, calculatedEmissions: emissionResult };
    });

    return NextResponse.json(result, { status: 201 });
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
