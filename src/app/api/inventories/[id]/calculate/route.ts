import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/supabase/api";
import Decimal from "decimal.js";
import { createCalculationEngine } from "@/lib/calculation-engine";
import { Prisma } from "@prisma/client";

// POST /api/inventories/[id]/calculate - Recalculate all emissions
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

    // Get inventory with all activity data
    const inventory = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        organizationId: dbUser.organizationId,
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
      organizationId: dbUser.organizationId,
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
          factorsSnapshot: result.factorsSnapshot as Prisma.InputJsonValue | undefined,
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
        userId: userId!,
        userEmail: dbUser.email,
        newValue: {
          totalScope1: totalScope1.toNumber(),
          totalScope2: totalScope2.toNumber(),
          totalScope3: totalScope3.toNumber(),
          totalBiogenic: totalBiogenic.toNumber(),
          totalRemovals: totalRemovals.toNumber(),
          resultsCount: results.length,
        } as Prisma.InputJsonValue,
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
