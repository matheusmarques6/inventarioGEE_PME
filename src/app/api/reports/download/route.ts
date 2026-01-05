import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";

// Type for emission result
interface EmissionResultData {
  scope: number;
  category: string;
  co2_equivalent: number | null;
  biogenic_co2: number | null;
  co2_mass: number | null;
  ch4_mass: number | null;
  n2o_mass: number | null;
}

// Type for activity data
interface ActivityDataRecord {
  id: string;
  category: string;
  source_description: string;
  activity_type: string;
  quantity: number;
  quantity_unit: string;
  month: number | null;
  year: number;
}

// GET - Download a report by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");
    const rawData = searchParams.get("data");

    // If raw data is provided (for newly generated reports)
    if (rawData) {
      try {
        const data = JSON.parse(decodeURIComponent(rawData));
        return NextResponse.json(data, {
          headers: {
            "Content-Disposition": `attachment; filename="report.json"`,
          },
        });
      } catch {
        return NextResponse.json(
          { error: "Dados do relatório inválidos" },
          { status: 400 }
        );
      }
    }

    if (!reportId) {
      return NextResponse.json(
        { error: "ID do relatório é obrigatório" },
        { status: 400 }
      );
    }

    // Get the report
    const { data: report, error: reportError } = await getDb()
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 }
      );
    }

    // Get inventory with organization
    const inventory = await db.inventories.findById(report.inventory_id);

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    // Get organization
    const { data: organization } = await getDb()
      .from("organizations")
      .select("*")
      .eq("id", inventory.organization_id)
      .single();

    // Get emission results
    const { data: emissionResults } = await getDb()
      .from("emission_results")
      .select("scope, category, co2_equivalent, biogenic_co2, co2_mass, ch4_mass, n2o_mass")
      .eq("inventory_id", report.inventory_id);

    // Get activity data
    const { data: activityData } = await getDb()
      .from("activity_data")
      .select("id, category, source_description, activity_type, quantity, quantity_unit, month, year")
      .eq("inventory_id", report.inventory_id);

    // Cast to typed arrays
    const typedResults = (emissionResults as EmissionResultData[] | null) || [];
    const typedActivityData = (activityData as ActivityDataRecord[] | null) || [];

    const scope1Results = typedResults.filter((r) => r.scope === 1);
    const scope2Results = typedResults.filter((r) => r.scope === 2);
    const scope3Results = typedResults.filter((r) => r.scope === 3);

    const totalScope1 = scope1Results.reduce(
      (sum, r) => sum + Number(r.co2_equivalent || 0), 0
    );
    const totalScope2 = scope2Results.reduce(
      (sum, r) => sum + Number(r.co2_equivalent || 0), 0
    );
    const totalScope3 = scope3Results.reduce(
      (sum, r) => sum + Number(r.co2_equivalent || 0), 0
    );
    const totalBiogenic = typedResults.reduce(
      (sum, r) => sum + Number(r.biogenic_co2 || 0), 0
    );

    // Group emissions by category
    const emissionsByCategory: Record<string, number> = {};
    for (const result of typedResults) {
      const category = result.category;
      if (!emissionsByCategory[category]) {
        emissionsByCategory[category] = 0;
      }
      emissionsByCategory[category] += Number(result.co2_equivalent || 0);
    }

    const orgName = organization?.name || "Organização";
    const orgCnpj = organization?.cnpj || "";
    const orgSector = organization?.sector || "";

    let reportData: Record<string, unknown>;

    switch (report.type) {
      case "GHG_PROTOCOL":
        reportData = {
          title: `Inventário de Emissões de GEE - ${inventory.base_year}`,
          organization: orgName,
          cnpj: orgCnpj,
          sector: orgSector,
          reportingPeriod: inventory.reporting_period,
          gwpReference: inventory.gwp_reference,
          consolidationApproach: inventory.consolidation_approach,
          emissions: {
            scope1: {
              total: totalScope1,
              categories: emissionsByCategory,
            },
            scope2: { total: totalScope2 },
            scope3: { total: totalScope3 },
            biogenic: totalBiogenic,
            total: totalScope1 + totalScope2 + totalScope3,
          },
          activityData: typedActivityData.map(ad => ({
            id: ad.id,
            category: ad.category,
            sourceDescription: ad.source_description,
            activityType: ad.activity_type,
            quantity: Number(ad.quantity),
            unit: ad.quantity_unit,
            month: ad.month,
            year: ad.year,
          })),
          generatedAt: report.generated_at,
        };
        break;

      case "EXECUTIVE_SUMMARY":
        reportData = {
          title: `Sumário Executivo - Inventário GEE ${inventory.base_year}`,
          organization: orgName,
          highlights: {
            totalEmissions: totalScope1 + totalScope2 + totalScope3,
            scope1: totalScope1,
            scope2: totalScope2,
            scope3: totalScope3,
            biogenic: totalBiogenic,
          },
          topCategories: Object.entries(emissionsByCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([category, value]) => ({ category, value })),
          generatedAt: report.generated_at,
        };
        break;

      case "SBCE":
        reportData = {
          title: `Relatório SBCE - ${inventory.base_year}`,
          empresa: {
            razaoSocial: orgName,
            cnpj: orgCnpj,
            setor: orgSector,
          },
          emissoes: {
            escopo1: totalScope1,
            escopo2: totalScope2,
            escopo3: totalScope3,
            biogenicas: totalBiogenic,
            total: totalScope1 + totalScope2 + totalScope3,
          },
          metodologia: {
            gwp: inventory.gwp_reference,
            abordagem: inventory.consolidation_approach,
          },
          generatedAt: report.generated_at,
        };
        break;

      default:
        reportData = {
          inventory: {
            id: inventory.id,
            baseYear: inventory.base_year,
            organization: orgName,
          },
          emissions: {
            scope1: totalScope1,
            scope2: totalScope2,
            scope3: totalScope3,
            biogenic: totalBiogenic,
            total: totalScope1 + totalScope2 + totalScope3,
          },
          activityData: typedActivityData.map(ad => ({
            id: ad.id,
            category: ad.category,
            sourceDescription: ad.source_description,
            quantity: Number(ad.quantity),
            unit: ad.quantity_unit,
          })),
          generatedAt: report.generated_at,
        };
    }

    // Return as JSON with download headers
    const contentType = report.format === "JSON" ? "application/json" : "application/json";

    return new NextResponse(JSON.stringify(reportData, null, 2), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${report.file_name}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      { error: "Erro ao baixar relatório" },
      { status: 500 }
    );
  }
}
