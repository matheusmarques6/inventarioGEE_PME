import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/api";

// Category labels in Portuguese
const CATEGORY_LABELS: Record<string, string> = {
  STATIONARY_COMBUSTION: "Combustão Estacionária",
  MOBILE_COMBUSTION: "Combustão Móvel",
  FUGITIVE_EMISSIONS: "Emissões Fugitivas",
  PROCESS_EMISSIONS: "Processos Industriais",
  AGRICULTURAL: "Agricultura",
  LULUCF: "Florestas (LULUCF)",
  WASTE_INTERNAL: "Resíduos Internos",
  PURCHASED_ELECTRICITY: "Eletricidade",
  PURCHASED_HEAT: "Calor/Vapor",
  PURCHASED_GOODS: "Bens Comprados",
  CAPITAL_GOODS: "Bens de Capital",
  FUEL_ENERGY_ACTIVITIES: "Energia (upstream)",
  UPSTREAM_TRANSPORT: "Transporte (upstream)",
  DOWNSTREAM_TRANSPORT: "Transporte (downstream)",
  WASTE_EXTERNAL: "Resíduos (downstream)",
  BUSINESS_TRAVEL: "Viagens",
  EMPLOYEE_COMMUTING: "Deslocamento",
  LEASED_ASSETS: "Ativos Arrendados",
  INVESTMENTS: "Investimentos",
};

// GET /api/inventories/[id]/stats/categories - Get emissions by category
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

    // Get emissions grouped by category and scope
    const { data: emissions, error: emissionsError } = await supabase
      .from("emission_results")
      .select("category, scope, co2_equivalent")
      .eq("inventory_id", inventoryId);

    if (emissionsError) {
      console.error("Error fetching emissions:", emissionsError);
      return NextResponse.json(
        { error: "Error fetching emissions" },
        { status: 500 }
      );
    }

    // Aggregate by category and scope
    const categoryMap = new Map<string, { scope1: number; scope2: number; scope3: number }>();

    for (const emission of emissions || []) {
      const category = emission.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { scope1: 0, scope2: 0, scope3: 0 });
      }
      const cat = categoryMap.get(category)!;
      const value = Number(emission.co2_equivalent) || 0;

      if (emission.scope === 1) cat.scope1 += value;
      else if (emission.scope === 2) cat.scope2 += value;
      else if (emission.scope === 3) cat.scope3 += value;
    }

    // Convert to array and calculate totals
    let totalScope1 = 0;
    let totalScope2 = 0;
    let totalScope3 = 0;

    const categories = Array.from(categoryMap.entries()).map(([category, values]) => {
      totalScope1 += values.scope1;
      totalScope2 += values.scope2;
      totalScope3 += values.scope3;

      return {
        category,
        categoryLabel: CATEGORY_LABELS[category] || category,
        scope1: Math.round(values.scope1 * 100) / 100,
        scope2: Math.round(values.scope2 * 100) / 100,
        scope3: Math.round(values.scope3 * 100) / 100,
        total: Math.round((values.scope1 + values.scope2 + values.scope3) * 100) / 100,
      };
    });

    // Sort by total descending
    categories.sort((a, b) => b.total - a.total);

    return NextResponse.json({
      categories,
      totalScope1: Math.round(totalScope1 * 100) / 100,
      totalScope2: Math.round(totalScope2 * 100) / 100,
      totalScope3: Math.round(totalScope3 * 100) / 100,
      totalEmissions: Math.round((totalScope1 + totalScope2 + totalScope3) * 100) / 100,
    });
  } catch (error) {
    console.error("Error in stats/categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
