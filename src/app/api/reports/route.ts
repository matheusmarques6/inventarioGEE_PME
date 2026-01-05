import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";
import { z } from "zod";

// Type for emission result
interface EmissionResultData {
  scope: number;
  category: string;
  co2_equivalent: number | null;
  biogenic_co2: number | null;
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

const generateReportSchema = z.object({
  inventoryId: z.string(),
  type: z.enum(["GHG_PROTOCOL", "GRI", "CDP", "SBCE", "EXECUTIVE_SUMMARY", "CUSTOM"]),
  format: z.enum(["PDF", "XLSX", "DOCX", "JSON"]),
});

// GET - List reports for an inventory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get("inventoryId");

    if (!inventoryId) {
      return NextResponse.json(
        { error: "inventoryId é obrigatório" },
        { status: 400 }
      );
    }

    const reports = await db.reports.findByInventory(inventoryId);

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Erro ao carregar relatórios" },
      { status: 500 }
    );
  }
}

// POST - Generate a new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateReportSchema.parse(body);

    // Fetch inventory data for the report
    const inventory = await db.inventories.findById(validatedData.inventoryId);

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
      .select("scope, category, co2_equivalent, biogenic_co2")
      .eq("inventory_id", validatedData.inventoryId);

    // Get activity data
    const { data: activityData } = await getDb()
      .from("activity_data")
      .select("id, category, source_description, activity_type, quantity, quantity_unit, month, year")
      .eq("inventory_id", validatedData.inventoryId);

    // Cast to typed arrays
    const typedResults = (emissionResults as EmissionResultData[] | null) || [];
    const typedActivityData = (activityData as ActivityDataRecord[] | null) || [];

    // Calculate emissions by scope and category
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

    // Generate report data based on type
    let reportData: Record<string, unknown>;
    let fileName: string;

    const reportTypeLabels: Record<string, string> = {
      GHG_PROTOCOL: "Relatório GHG Protocol",
      GRI: "Relatório GRI",
      CDP: "Relatório CDP",
      SBCE: "Relatório SBCE",
      EXECUTIVE_SUMMARY: "Sumário Executivo",
      CUSTOM: "Relatório Personalizado",
    };

    const orgName = organization?.name || "Organização";
    const orgCnpj = organization?.cnpj || "";
    const orgSector = organization?.sector || "";

    switch (validatedData.type) {
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
              categories: Object.fromEntries(
                Object.entries(emissionsByCategory).filter(([cat]) =>
                  ["STATIONARY_COMBUSTION", "MOBILE_COMBUSTION", "FUGITIVE_EMISSIONS", "AGRICULTURAL", "PROCESS_EMISSIONS"].includes(cat)
                )
              ),
            },
            scope2: {
              total: totalScope2,
              categories: Object.fromEntries(
                Object.entries(emissionsByCategory).filter(([cat]) =>
                  ["PURCHASED_ELECTRICITY", "PURCHASED_HEAT"].includes(cat)
                )
              ),
            },
            scope3: {
              total: totalScope3,
            },
            biogenic: totalBiogenic,
            total: totalScope1 + totalScope2 + totalScope3,
          },
          activityDataCount: typedActivityData.length,
          generatedAt: new Date().toISOString(),
        };
        fileName = `GHG_Protocol_${inventory.base_year}_${orgName.replace(/\s+/g, "_")}`;
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
          generatedAt: new Date().toISOString(),
        };
        fileName = `Sumario_Executivo_${inventory.base_year}`;
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
          generatedAt: new Date().toISOString(),
        };
        fileName = `SBCE_${inventory.base_year}_${orgCnpj}`;
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
          generatedAt: new Date().toISOString(),
        };
        fileName = `Relatorio_${inventory.base_year}`;
    }

    // Store the report data as JSON for now
    // In a production environment, this would generate actual PDF/XLSX files
    const fileExtension = validatedData.format.toLowerCase();
    const fullFileName = `${fileName}.${fileExtension}`;

    // Create the report record
    const report = await db.reports.create({
      inventory_id: validatedData.inventoryId,
      type: validatedData.type,
      format: validatedData.format,
      file_name: fullFileName,
      // In production, this would be the URL to the generated file
      file_url: `/api/reports/download?data=${encodeURIComponent(JSON.stringify(reportData))}`,
    });

    return NextResponse.json({
      report,
      data: reportData,
      message: `${reportTypeLabels[validatedData.type]} gerado com sucesso`,
    }, { status: 201 });
  } catch (error) {
    console.error("Error generating report:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a report
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json(
        { error: "ID do relatório é obrigatório" },
        { status: 400 }
      );
    }

    await getDb()
      .from("reports")
      .delete()
      .eq("id", reportId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Erro ao excluir relatório" },
      { status: 500 }
    );
  }
}
