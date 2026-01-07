import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/supabase-db";
import { requireAuth } from "@/lib/supabase/api";
import { z } from "zod";

const updateUnitSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(["INDUSTRIAL", "FLORESTAL", "ADMINISTRATIVO", "AGRICOLA", "LOGISTICO"]).optional(),
  state: z.string().max(2).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

// GET /api/units/[id] - Get a specific unit
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
    const unit = await db.operationalUnits.findByIdWithOrg(id, dbUser.organization_id);

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      );
    }

    // Get activity count
    const activityCount = await db.operationalUnits.countActivityData(id);

    return NextResponse.json({ ...unit, activityCount });
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/units/[id] - Update a unit
export async function PATCH(
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

    // Verify unit belongs to organization
    const existingUnit = await db.operationalUnits.findByIdWithOrg(id, dbUser.organization_id);
    if (!existingUnit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateUnitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const unit = await db.operationalUnits.update(id, validation.data);
    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error updating unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/units/[id] - Delete a unit (soft delete)
export async function DELETE(
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

    // Verify unit belongs to organization
    const existingUnit = await db.operationalUnits.findByIdWithOrg(id, dbUser.organization_id);
    if (!existingUnit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      );
    }

    // Check if unit has activity data
    const activityCount = await db.operationalUnits.countActivityData(id);
    if (activityCount > 0) {
      // Soft delete
      await db.operationalUnits.delete(id);
      return NextResponse.json({
        message: "Unit deactivated (has associated data)",
        activityCount
      });
    }

    // Hard delete if no data
    await db.operationalUnits.hardDelete(id);
    return NextResponse.json({ message: "Unit deleted" });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
