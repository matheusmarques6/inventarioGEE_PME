import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/client";
import Decimal from "decimal.js";
import { createCalculationEngine } from "@/lib/calculation-engine";

// POST /api/inventories/[id]/calculate - Recalculate all emissions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: inventoryId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get inventory with all activity data
    const inventory = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        organizationId: user.organizationId,
      },
      include: {
        activityData: true,
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Create calculation engine
    const engine = createCalculationEngine({
      gwpReference: inventory.gwpReference,
      year: inventory.baseYear,
      organizationId: user.organizationId,
      inventoryId: inventory.id,
    });

    // Delete existing results
    await prisma.emissionResult.deleteMany({
      where: { inventoryId },
    });

    // Calculate emissions for each activity data
    const results = [];
    let totalScope1 = new Decimal(0);
    let totalScope2 = new Decimal(0);
    let totalScope3 = new Decimal(0);
    let totalBiogenic = new Decimal(0);
    let totalRemovals = new Decimal(0);

    for (const activity of inventory.activityData) {
      const input = {
        fuelType: activity.activityType,
        quantity: new Decimal(activity.quantity.toString()),
        unit: activity.quantityUnit,
        year: activity.year,
        month: activity.month ?? undefined,
        ...(activity.metadata as Record<string, unknown>),
      };

      const result = engine.calculateActivity(activity.category, input);

      // Save result
      const savedResult = await prisma.emissionResult.create({
        data: {
          inventoryId,
          activityDataId: activity.id,
          co2Mass: result.co2Mass,
          ch4Mass: result.ch4Mass,
          n2oMass: result.n2oMass,
          hfcMass: result.hfcMass,
          pfcMass: result.pfcMass,
          sf6Mass: result.sf6Mass,
          nf3Mass: result.nf3Mass,
          co2Equivalent: result.co2Equivalent,
          biogenicCo2: result.biogenicCo2,
          removals: result.removals,
          scope: result.scope,
          category: result.category as never,
          isKyotoGas: result.isKyotoGas,
          uncertainty: result.uncertainty,
          gwpReference: inventory.gwpReference,
          factorsSnapshot: result.factorsSnapshot,
        },
      });

      results.push(savedResult);

      // Accumulate totals
      switch (result.scope) {
        case 1:
          totalScope1 = totalScope1.plus(result.co2Equivalent);
          break;
        case 2:
          totalScope2 = totalScope2.plus(result.co2Equivalent);
          break;
        case 3:
          totalScope3 = totalScope3.plus(result.co2Equivalent);
          break;
      }
      totalBiogenic = totalBiogenic.plus(result.biogenicCo2);
      totalRemovals = totalRemovals.plus(result.removals);
    }

    // Update inventory totals
    await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        totalEmissionsScope1: totalScope1,
        totalEmissionsScope2: totalScope2,
        totalEmissionsScope3: totalScope3,
        totalBiogenicEmissions: totalBiogenic,
        totalRemovals: totalRemovals,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        inventoryId,
        action: "CALCULATE",
        entityType: "Inventory",
        entityId: inventoryId,
        userId,
        userEmail: user.email,
        newValue: {
          totalScope1: totalScope1.toNumber(),
          totalScope2: totalScope2.toNumber(),
          totalScope3: totalScope3.toNumber(),
          totalBiogenic: totalBiogenic.toNumber(),
          totalRemovals: totalRemovals.toNumber(),
          resultsCount: results.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      totals: {
        scope1: totalScope1.toNumber(),
        scope2: totalScope2.toNumber(),
        scope3: totalScope3.toNumber(),
        biogenic: totalBiogenic.toNumber(),
        removals: totalRemovals.toNumber(),
        total: totalScope1.plus(totalScope2).plus(totalScope3).toNumber(),
      },
      resultsCount: results.length,
    });
  } catch (error) {
    console.error("Error calculating emissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
