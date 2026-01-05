import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";
import { requireAuth } from "@/lib/supabase/api";
import { z } from "zod";

const updateInventorySchema = z.object({
  name: z.string().min(3).optional(),
  status: z
    .enum(["DRAFT", "IN_REVIEW", "SUBMITTED", "VERIFIED", "PUBLISHED"])
    .optional(),
  gwpReference: z.enum(["AR4", "AR5", "AR6"]).optional(),
  consolidationApproach: z
    .enum(["OPERATIONAL_CONTROL", "FINANCIAL_CONTROL", "EQUITY_SHARE"])
    .optional(),
  includeScope1: z.boolean().optional(),
  includeScope2: z.boolean().optional(),
  includeScope3: z.boolean().optional(),
});

// GET /api/inventories/[id] - Get single inventory
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

    const { id } = await params;

    const inventory = await db.inventories.findByIdWithOrg(id, dbUser.organization_id);

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Get recent activity data and emission results
    const supabase = getDb();

    const [activityDataResult, emissionResultsResult, countsResult] = await Promise.all([
      supabase
        .from("activity_data")
        .select("*")
        .eq("inventory_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("emission_results")
        .select("*")
        .eq("inventory_id", id)
        .order("calculated_at", { ascending: false })
        .limit(10),
      Promise.all([
        supabase.from("activity_data").select("*", { count: "exact", head: true }).eq("inventory_id", id),
        supabase.from("emission_results").select("*", { count: "exact", head: true }).eq("inventory_id", id),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("inventory_id", id),
      ]),
    ]);

    return NextResponse.json({
      ...inventory,
      activityData: activityDataResult.data || [],
      emissionResults: emissionResultsResult.data || [],
      _count: {
        activityData: countsResult[0].count || 0,
        emissionResults: countsResult[1].count || 0,
        reports: countsResult[2].count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/inventories/[id] - Update inventory
export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();
    const data = updateInventorySchema.parse(body);

    // Check access
    const existingInventory = await db.inventories.findByIdWithOrg(id, dbUser.organization_id);

    if (!existingInventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Map camelCase to snake_case
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.status !== undefined) updates.status = data.status;
    if (data.gwpReference !== undefined) updates.gwp_reference = data.gwpReference;
    if (data.consolidationApproach !== undefined) updates.consolidation_approach = data.consolidationApproach;
    if (data.includeScope1 !== undefined) updates.include_scope1 = data.includeScope1;
    if (data.includeScope2 !== undefined) updates.include_scope2 = data.includeScope2;
    if (data.includeScope3 !== undefined) updates.include_scope3 = data.includeScope3;

    // Update inventory
    const inventory = await db.inventories.update(id, updates);

    // Log the action
    await db.auditLogs.create({
      inventory_id: inventory.id,
      action: "UPDATE",
      entity_type: "Inventory",
      entity_id: inventory.id,
      user_id: userId!,
      user_email: dbUser.email,
      previous_value: existingInventory as unknown as Record<string, unknown>,
      new_value: inventory as unknown as Record<string, unknown>,
    });

    return NextResponse.json(inventory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/inventories/[id] - Delete inventory
export async function DELETE(
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

    if (dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete inventories" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check access
    const existingInventory = await db.inventories.findByIdWithOrg(id, dbUser.organization_id);

    if (!existingInventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Delete inventory (cascades to activity data and results)
    await db.inventories.delete(id);

    // Log the action
    await db.auditLogs.create({
      action: "DELETE",
      entity_type: "Inventory",
      entity_id: id,
      user_id: userId!,
      user_email: dbUser.email,
      previous_value: existingInventory as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
