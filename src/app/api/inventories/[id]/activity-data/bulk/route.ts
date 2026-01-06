import { NextRequest, NextResponse } from "next/server";
import { db, EmissionCategory } from "@/lib/db/supabase-db";
import { requireAuth } from "@/lib/supabase/api";
import { z } from "zod";
import Decimal from "decimal.js";
import { quickCalculate } from "@/lib/calculation-engine";

const bulkActivityDataSchema = z.object({
  category: z.enum([
    "STATIONARY_COMBUSTION",
    "MOBILE_COMBUSTION",
    "FUGITIVE_EMISSIONS",
    "PROCESS_EMISSIONS",
    "AGRICULTURAL",
    "LULUCF",
    "WASTE_INTERNAL",
    "PURCHASED_ELECTRICITY",
    "PURCHASED_HEAT",
    "PURCHASED_GOODS",
    "CAPITAL_GOODS",
    "FUEL_ENERGY_ACTIVITIES",
    "UPSTREAM_TRANSPORT",
    "DOWNSTREAM_TRANSPORT",
    "WASTE_EXTERNAL",
    "BUSINESS_TRAVEL",
    "EMPLOYEE_COMMUTING",
    "LEASED_ASSETS",
    "INVESTMENTS",
  ] as const),
  scope: z.number().min(1).max(3),
  data: z.array(
    z.object({
      sourceDescription: z.string().optional().nullable(),
      activityType: z.string().min(1),
      quantity: z.number().positive(),
      quantityUnit: z.string().min(1),
      month: z.union([z.number().min(1).max(12), z.null(), z.undefined()]).optional(),
      year: z.number().min(2000).max(2100),
      notes: z.string().optional().nullable(),
    })
  ),
});

// POST /api/inventories/[id]/activity-data/bulk - Bulk import activity data
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
    const body = await request.json();

    // Validate input
    const validation = bulkActivityDataSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { category, scope, data } = validation.data;

    // Verify access to inventory
    const inventory = await db.inventories.findByIdWithOrg(inventoryId, dbUser.organization_id);
    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    const results: { success: number; errors: string[] } = {
      success: 0,
      errors: [],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Excel row (1-indexed + header)

      try {
        // Validate required fields
        if (!row.activityType) {
          results.errors.push(`Linha ${rowNum}: Tipo de atividade/combustível é obrigatório`);
          continue;
        }
        if (!row.quantity || row.quantity <= 0) {
          results.errors.push(`Linha ${rowNum}: Quantidade deve ser maior que zero`);
          continue;
        }
        if (!row.quantityUnit) {
          results.errors.push(`Linha ${rowNum}: Unidade é obrigatória`);
          continue;
        }

        // Create activity data
        const activityData = await db.activityData.create({
          inventory_id: inventoryId,
          category,
          scope,
          source_description: row.sourceDescription || `Importação linha ${rowNum}`,
          activity_type: row.activityType,
          quantity: row.quantity,
          quantity_unit: row.quantityUnit,
          month: row.month ?? undefined,
          year: row.year || inventory.base_year,
          data_source: "Importação Excel",
          data_quality: "PRIMARY",
          notes: row.notes || undefined,
          created_by: userId,
        });

        // Calculate emissions
        const calculationInput = {
          fuelType: row.activityType,
          quantity: new Decimal(row.quantity),
          unit: row.quantityUnit,
          year: row.year || inventory.base_year,
          month: row.month,
        };

        const emissionResult = quickCalculate(
          category,
          calculationInput as Record<string, unknown>,
          inventory.gwp_reference
        );

        // Convert Decimal to number safely
        const toNumber = (value: Decimal | null | undefined): number | null => {
          if (!value) return null;
          const num = value.toNumber();
          return isNaN(num) ? 0 : num;
        };

        // Save emission result
        await db.emissionResults.create({
          inventory_id: inventoryId,
          activity_data_id: activityData.id,
          co2_mass: toNumber(emissionResult.co2Mass),
          ch4_mass: toNumber(emissionResult.ch4Mass),
          n2o_mass: toNumber(emissionResult.n2oMass),
          co2_equivalent: toNumber(emissionResult.co2Equivalent) || 0,
          biogenic_co2: toNumber(emissionResult.biogenicCo2),
          removals: toNumber(emissionResult.removals),
          scope,
          category,
          is_kyoto_gas: emissionResult.isKyotoGas,
          gwp_reference: inventory.gwp_reference,
          factors_snapshot: emissionResult.factorsSnapshot || null,
        });

        results.success++;
      } catch (rowError) {
        console.error(`Error processing row ${rowNum}:`, rowError);
        results.errors.push(
          `Linha ${rowNum}: ${rowError instanceof Error ? rowError.message : "Erro desconhecido"}`
        );
      }
    }

    // Log the bulk action
    await db.auditLogs.create({
      inventory_id: inventoryId,
      action: "BULK_IMPORT",
      entity_type: "ActivityData",
      entity_id: inventoryId,
      user_id: userId!,
      user_email: dbUser.email,
      new_value: {
        category,
        scope,
        totalRows: data.length,
        successCount: results.success,
        errorCount: results.errors.length,
      },
    });

    return NextResponse.json(results, {
      status: results.success > 0 ? 201 : 400,
    });
  } catch (error) {
    console.error("Error in bulk import:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
