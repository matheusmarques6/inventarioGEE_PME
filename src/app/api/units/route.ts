import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/supabase-db";
import { requireAuth } from "@/lib/supabase/api";
import { z } from "zod";

const unitSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  type: z.enum(["INDUSTRIAL", "FLORESTAL", "ADMINISTRATIVO", "AGRICOLA", "LOGISTICO"]),
  state: z.string().max(2).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

// GET /api/units - List all units for the organization
export async function GET(request: NextRequest) {
  try {
    const { dbUser, error } = await requireAuth();
    if (error || !dbUser) {
      return NextResponse.json(
        { error: error || "User not found" },
        { status: error ? 401 : 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const inventoryId = searchParams.get("inventoryId");

    // If inventoryId is provided, get units with emissions stats
    if (inventoryId) {
      const stats = await db.operationalUnits.getEmissionsStats(
        dbUser.organization_id,
        inventoryId
      );
      return NextResponse.json(stats);
    }

    // Otherwise, just get units
    const units = await db.operationalUnits.findByOrganization(
      dbUser.organization_id,
      includeInactive
    );

    // Get activity count for each unit
    const unitsWithCounts = await Promise.all(
      units.map(async (unit) => ({
        ...unit,
        activityCount: await db.operationalUnits.countActivityData(unit.id),
      }))
    );

    return NextResponse.json({ units: unitsWithCounts });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/units - Create a new unit
export async function POST(request: NextRequest) {
  try {
    const { dbUser, error } = await requireAuth();
    if (error || !dbUser) {
      return NextResponse.json(
        { error: error || "User not found" },
        { status: error ? 401 : 404 }
      );
    }

    const body = await request.json();
    const validation = unitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const unit = await db.operationalUnits.create({
      ...validation.data,
      organization_id: dbUser.organization_id,
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
