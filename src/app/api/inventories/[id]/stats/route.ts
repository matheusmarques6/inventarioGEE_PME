import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";
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
    const inventory = await db.inventories.findByIdWithOrg(inventoryId, dbUser.organization_id);

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Get emission results and aggregate by scope
    const { data: emissionResults, error: emError } = await getDb()
      .from("emission_results")
      .select("scope, co2_equivalent, biogenic_co2, removals")
      .eq("inventory_id", inventoryId);

    if (emError) throw emError;

    // Calculate totals by scope
    let scope1 = 0;
    let scope2 = 0;
    let scope3 = 0;
    let biogenic = 0;
    let removals = 0;

    type EmissionRow = { scope: number; co2_equivalent: number | null; biogenic_co2: number | null; removals: number | null };
    for (const result of (emissionResults as EmissionRow[] | null) || []) {
      const co2e = Number(result.co2_equivalent || 0);
      const bio = Number(result.biogenic_co2 || 0);
      const rem = Number(result.removals || 0);

      if (result.scope === 1) scope1 += co2e;
      else if (result.scope === 2) scope2 += co2e;
      else if (result.scope === 3) scope3 += co2e;

      biogenic += bio;
      removals += rem;
    }

    const totalEmissions = scope1 + scope2 + scope3;

    // Try to get previous year inventory for comparison
    const { data: previousInventory } = await getDb()
      .from("inventories")
      .select("id")
      .eq("organization_id", dbUser.organization_id)
      .eq("base_year", inventory.base_year - 1)
      .single();

    let previousYear: number | undefined;
    const prevInv = previousInventory as { id: string } | null;
    if (prevInv) {
      const { data: prevResults } = await getDb()
        .from("emission_results")
        .select("co2_equivalent")
        .eq("inventory_id", prevInv.id);

      type PrevRow = { co2_equivalent: number | null };
      previousYear = ((prevResults as PrevRow[] | null) || []).reduce(
        (sum, r) => sum + Number(r.co2_equivalent || 0),
        0
      );
    }

    // Update inventory totals if they've changed
    if (
      Number(inventory.total_emissions_scope1 || 0) !== scope1 ||
      Number(inventory.total_emissions_scope2 || 0) !== scope2 ||
      Number(inventory.total_emissions_scope3 || 0) !== scope3 ||
      Number(inventory.total_biogenic_emissions || 0) !== biogenic ||
      Number(inventory.total_removals || 0) !== removals
    ) {
      await db.inventories.update(inventoryId, {
        total_emissions_scope1: scope1,
        total_emissions_scope2: scope2,
        total_emissions_scope3: scope3,
        total_biogenic_emissions: biogenic,
        total_removals: removals,
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
