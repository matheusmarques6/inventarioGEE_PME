import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/supabase/api";

// GET /api/inventories/[id]/stats - Get emission statistics for an inventory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { dbUser, error } = await requireAuth();
    if (error || !dbUser) {
      return NextResponse.json(
        { error: error || "User not found" },
        { status: error ? 401 : 404 }
      );
    }

    const { id: inventoryId } = await params;

    // Verify access to inventory
    const inventory = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        organizationId: dbUser.organizationId,
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Aggregate emission results by scope
    const scopeAggregates = await prisma.emissionResult.groupBy({
      by: ["scope"],
      where: { inventoryId },
      _sum: {
        co2Equivalent: true,
        biogenicCo2: true,
        removals: true,
      },
    });

    // Calculate totals
    let scope1 = 0;
    let scope2 = 0;
    let scope3 = 0;
    let biogenic = 0;
    let removals = 0;

    for (const agg of scopeAggregates) {
      const co2e = Number(agg._sum.co2Equivalent || 0);
      const bio = Number(agg._sum.biogenicCo2 || 0);
      const rem = Number(agg._sum.removals || 0);

      if (agg.scope === 1) scope1 = co2e;
      else if (agg.scope === 2) scope2 = co2e;
      else if (agg.scope === 3) scope3 = co2e;

      biogenic += bio;
      removals += rem;
    }

    const totalEmissions = scope1 + scope2 + scope3;

    // Try to get previous year inventory for comparison
    const previousInventory = await prisma.inventory.findFirst({
      where: {
        organizationId: dbUser.organizationId,
        baseYear: inventory.baseYear - 1,
      },
    });

    let previousYear: number | undefined;
    if (previousInventory) {
      const prevAggregates = await prisma.emissionResult.groupBy({
        by: ["scope"],
        where: { inventoryId: previousInventory.id },
        _sum: { co2Equivalent: true },
      });
      previousYear = prevAggregates.reduce(
        (sum: number, agg: { scope: number; _sum: { co2Equivalent: unknown } }) =>
          sum + Number(agg._sum.co2Equivalent || 0),
        0
      );
    }

    // Update inventory totals if they've changed
    if (
      Number(inventory.totalEmissionsScope1 || 0) !== scope1 ||
      Number(inventory.totalEmissionsScope2 || 0) !== scope2 ||
      Number(inventory.totalEmissionsScope3 || 0) !== scope3 ||
      Number(inventory.totalBiogenicEmissions || 0) !== biogenic ||
      Number(inventory.totalRemovals || 0) !== removals
    ) {
      await prisma.inventory.update({
        where: { id: inventoryId },
        data: {
          totalEmissionsScope1: scope1,
          totalEmissionsScope2: scope2,
          totalEmissionsScope3: scope3,
          totalBiogenicEmissions: biogenic,
          totalRemovals: removals,
        },
      });
    }

    return NextResponse.json({
      totalEmissions,
      scope1,
      scope2,
      scope3,
      biogenic,
      removals,
      previousYear,
    });
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
