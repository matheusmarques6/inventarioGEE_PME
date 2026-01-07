import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/api";

// GET /api/inventories/[id]/activity-log - Get recent activity for inventory
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
    const supabase = await createClient();

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Verify access to inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from("inventories")
      .select("id, organization_id")
      .eq("id", inventoryId)
      .eq("organization_id", dbUser.organization_id)
      .single();

    if (inventoryError || !inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    // Get recent audit logs for this inventory
    const { data: logs, error: logsError } = await supabase
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, user_email, created_at, new_value, old_value")
      .eq("inventory_id", inventoryId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (logsError) {
      console.error("Error fetching audit logs:", logsError);
      return NextResponse.json(
        { error: "Error fetching activity log" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: logs || [],
      total: logs?.length || 0,
    });
  } catch (error) {
    console.error("Error in activity-log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
