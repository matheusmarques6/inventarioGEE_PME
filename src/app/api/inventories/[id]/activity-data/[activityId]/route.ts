import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// DELETE /api/inventories/[id]/activity-data/[activityId] - Delete activity data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const { id: inventoryId, activityId } = await params;

    // Verify the activity data exists and belongs to this inventory
    const activityData = await prisma.activityData.findFirst({
      where: {
        id: activityId,
        inventoryId,
      },
    });

    if (!activityData) {
      return NextResponse.json(
        { error: "Registro não encontrado" },
        { status: 404 }
      );
    }

    // Delete emission results first (cascade)
    await prisma.emissionResult.deleteMany({
      where: { activityDataId: activityId },
    });

    // Delete the activity data
    await prisma.activityData.delete({
      where: { id: activityId },
    });

    // Update inventory totals
    const totals = await prisma.emissionResult.groupBy({
      by: ["scope"],
      where: { inventoryId },
      _sum: { co2Equivalent: true, biogenicCo2: true },
    });

    type ScopeTotals = { scope: number; _sum: { co2Equivalent: number | null; biogenicCo2: number | null } };
    const scope1Total = totals.find((t: ScopeTotals) => t.scope === 1)?._sum.co2Equivalent || 0;
    const scope2Total = totals.find((t: ScopeTotals) => t.scope === 2)?._sum.co2Equivalent || 0;
    const scope3Total = totals.find((t: ScopeTotals) => t.scope === 3)?._sum.co2Equivalent || 0;
    const biogenicTotal = totals.reduce(
      (sum: number, t: ScopeTotals) => sum + Number(t._sum.biogenicCo2 || 0),
      0
    );

    await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        totalEmissionsScope1: scope1Total,
        totalEmissionsScope2: scope2Total,
        totalEmissionsScope3: scope3Total,
        totalBiogenicEmissions: biogenicTotal,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity data:", error);
    return NextResponse.json(
      { error: "Erro ao excluir registro" },
      { status: 500 }
    );
  }
}

// GET /api/inventories/[id]/activity-data/[activityId] - Get single activity data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const { id: inventoryId, activityId } = await params;

    const activityData = await prisma.activityData.findFirst({
      where: {
        id: activityId,
        inventoryId,
      },
      include: {
        emissionResults: true,
        unit: true,
      },
    });

    if (!activityData) {
      return NextResponse.json(
        { error: "Registro não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("Error fetching activity data:", error);
    return NextResponse.json(
      { error: "Erro ao buscar registro" },
      { status: 500 }
    );
  }
}
