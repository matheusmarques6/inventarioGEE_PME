import { NextRequest, NextResponse } from "next/server";
import { db, EmissionCategory } from "@/lib/db/supabase-db";
import { requireAuth } from "@/lib/supabase/api";
import Decimal from "decimal.js";
import { createCalculationEngine } from "@/lib/calculation-engine";

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

    // Get inventory
    const inventory = await db.inventories.findByIdWithOrg(inventoryId, dbUser.organization_id);

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Get all activity data for this inventory
    const activityDataList = await db.activityData.findAll(inventoryId);

    // Create calculation engine
    const engine = createCalculationEngine({
      gwpReference: inventory.gwp_reference,
      year: inventory.base_year,
      organizationId: dbUser.organization_id,
      inventoryId: inventory.id,
    });

    // Delete existing results
    await db.emissionResults.deleteByInventoryId(inventoryId);

    // Calculate emissions for each activity data
    const results = [];
    let totalScope1 = new Decimal(0);
    let totalScope2 = new Decimal(0);
    let totalScope3 = new Decimal(0);
    let totalBiogenic = new Decimal(0);
    let totalRemovals = new Decimal(0);

    for (const activity of activityDataList) {
      const input = {
        fuelType: activity.activity_type,
        quantity: new Decimal(activity.quantity.toString()),
        unit: activity.quantity_unit,
        year: activity.year,
        month: activity.month ?? undefined,
        ...(activity.metadata as Record<string, unknown>),
      };

      const result = engine.calculateActivity(activity.category, input);

      // Save result
      const savedResult = await db.emissionResults.create({
        inventory_id: inventoryId,
        activity_data_id: activity.id,
        co2_mass: result.co2Mass ? Number(result.co2Mass) : null,
        ch4_mass: result.ch4Mass ? Number(result.ch4Mass) : null,
        n2o_mass: result.n2oMass ? Number(result.n2oMass) : null,
        hfc_mass: result.hfcMass ? Number(result.hfcMass) : null,
        pfc_mass: result.pfcMass ? Number(result.pfcMass) : null,
        sf6_mass: result.sf6Mass ? Number(result.sf6Mass) : null,
        nf3_mass: result.nf3Mass ? Number(result.nf3Mass) : null,
        co2_equivalent: Number(result.co2Equivalent),
        biogenic_co2: result.biogenicCo2 ? Number(result.biogenicCo2) : null,
        removals: result.removals ? Number(result.removals) : null,
        scope: result.scope,
        category: result.category as EmissionCategory,
        is_kyoto_gas: result.isKyotoGas,
        uncertainty: result.uncertainty ? Number(result.uncertainty) : null,
        gwp_reference: inventory.gwp_reference,
        factors_snapshot: result.factorsSnapshot || null,
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
      if (result.biogenicCo2) {
        totalBiogenic = totalBiogenic.plus(result.biogenicCo2);
      }
      if (result.removals) {
        totalRemovals = totalRemovals.plus(result.removals);
      }
    }

    // Update inventory totals
    await db.inventories.update(inventoryId, {
      total_emissions_scope1: totalScope1.toNumber(),
      total_emissions_scope2: totalScope2.toNumber(),
      total_emissions_scope3: totalScope3.toNumber(),
      total_biogenic_emissions: totalBiogenic.toNumber(),
      total_removals: totalRemovals.toNumber(),
    });

    // Log the action
    await db.auditLogs.create({
      inventory_id: inventoryId,
      action: "CALCULATE",
      entity_type: "Inventory",
      entity_id: inventoryId,
      user_id: userId!,
      user_email: dbUser.email,
      new_value: {
        totalScope1: totalScope1.toNumber(),
        totalScope2: totalScope2.toNumber(),
        totalScope3: totalScope3.toNumber(),
        totalBiogenic: totalBiogenic.toNumber(),
        totalRemovals: totalRemovals.toNumber(),
        resultsCount: results.length,
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
