import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";

// DELETE /api/inventories/[id]/activity-data/[activityId] - Delete activity data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const { id: inventoryId, activityId } = await params;

    // Verify the activity data exists and belongs to this inventory
    const activityData = await db.activityData.findById(activityId);

    if (!activityData || activityData.inventory_id !== inventoryId) {
      return NextResponse.json(
        { error: "Registro não encontrado" },
        { status: 404 }
      );
    }

    // Delete emission results first (cascade)
    await db.emissionResults.deleteByActivityId(activityId);

    // Delete the activity data
    await db.activityData.delete(activityId);

    // Update inventory totals
    const totals = await db.emissionResults.sumByInventory(inventoryId);

    await db.inventories.update(inventoryId, {
      total_emissions_scope1: totals.scope1.co2_equivalent,
      total_emissions_scope2: totals.scope2.co2_equivalent,
      total_emissions_scope3: totals.scope3.co2_equivalent,
      total_biogenic_emissions: totals.scope1.biogenic_co2,
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

    const activityData = await db.activityData.findById(activityId);

    if (!activityData || activityData.inventory_id !== inventoryId) {
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
