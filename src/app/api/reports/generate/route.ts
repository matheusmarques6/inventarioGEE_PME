import { NextRequest, NextResponse } from "next/server";
import { db, getDb } from "@/lib/db/supabase-db";
import { z } from "zod";
import type { ReportData } from "@/components/reports/report-viewer";

const categoryLabels: Record<string, string> = {
  STATIONARY_COMBUSTION: "Combustão Estacionária",
  MOBILE_COMBUSTION: "Combustão Móvel",
  FUGITIVE_EMISSIONS: "Emissões Fugitivas",
  PROCESS_EMISSIONS: "Emissões de Processo",
  AGRICULTURAL: "Agrícola",
  LULUCF: "Mudança de Uso do Solo",
  PURCHASED_ELECTRICITY: "Energia Elétrica",
  PURCHASED_HEAT: "Calor/Vapor",
  UPSTREAM_TRANSPORT: "Transporte Upstream",
  DOWNSTREAM_TRANSPORT: "Transporte Downstream",
  WASTE_EXTERNAL: "Resíduos",
  BUSINESS_TRAVEL: "Viagens a Negócio",
  EMPLOYEE_COMMUTING: "Deslocamento de Funcionários",
};

interface EmissionResultData {
  scope: number;
  category: string;
  co2_equivalent: number | null;
  biogenic_co2: number | null;
}

interface ActivityDataRecord {
  id: string;
  category: string;
  scope: number;
  source_description: string;
  activity_type: string;
  quantity: number;
  quantity_unit: string;
  month: number | null;
  year: number;
}

interface EmissionResultWithActivity {
  id: string;
  activity_data_id: string;
  scope: number;
  category: string;
  co2_equivalent: number | null;
  co2_mass: number | null;
  ch4_mass: number | null;
  n2o_mass: number | null;
  biogenic_co2: number | null;
}

const generateReportSchema = z.object({
  inventoryId: z.string(),
  title: z.string(),
  type: z.enum(["GHG_PROTOCOL", "EXECUTIVE_SUMMARY", "SBCE", "CUSTOM"]),
  description: z.string().optional(),
  includeCharts: z.boolean().default(true),
  includeDetails: z.boolean().default(true),
  includeMethodology: z.boolean().default(true),
  scopes: z.array(z.number()).min(1),
  categories: z.array(z.string()).optional(),
  dateRange: z.object({
    startMonth: z.number().optional(),
    endMonth: z.number().optional(),
  }).optional(),
  responsibleName: z.string().optional(),
  responsibleRole: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateReportSchema.parse(body);

    // Fetch inventory data
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

    // Build query for emission results with filters
    let emissionQuery = getDb()
      .from("emission_results")
      .select("id, activity_data_id, scope, category, co2_equivalent, co2_mass, ch4_mass, n2o_mass, biogenic_co2")
      .eq("inventory_id", validatedData.inventoryId)
      .in("scope", validatedData.scopes);

    if (validatedData.categories && validatedData.categories.length > 0) {
      emissionQuery = emissionQuery.in("category", validatedData.categories);
    }

    const { data: emissionResults } = await emissionQuery;

    // Build query for activity data with filters
    let activityQuery = getDb()
      .from("activity_data")
      .select("id, category, scope, source_description, activity_type, quantity, quantity_unit, month, year")
      .eq("inventory_id", validatedData.inventoryId)
      .in("scope", validatedData.scopes);

    if (validatedData.categories && validatedData.categories.length > 0) {
      activityQuery = activityQuery.in("category", validatedData.categories);
    }

    if (validatedData.dateRange?.startMonth) {
      activityQuery = activityQuery.gte("month", validatedData.dateRange.startMonth);
    }
    if (validatedData.dateRange?.endMonth) {
      activityQuery = activityQuery.lte("month", validatedData.dateRange.endMonth);
    }

    const { data: activityData } = await activityQuery;

    // Cast to typed arrays
    const typedResults = (emissionResults as EmissionResultWithActivity[] | null) || [];
    const typedActivityData = (activityData as ActivityDataRecord[] | null) || [];

    // Calculate emissions by scope
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
    const totalEmissions = totalScope1 + totalScope2 + totalScope3;

    // Group emissions by category
    const emissionsByCategory: Record<string, { scope: number; value: number }> = {};
    for (const result of typedResults) {
      const key = `${result.scope}-${result.category}`;
      if (!emissionsByCategory[key]) {
        emissionsByCategory[key] = { scope: result.scope, value: 0 };
      }
      emissionsByCategory[key].value += Number(result.co2_equivalent || 0);
    }

    // Create emissions by category array for the report
    const emissionsByCategoryArray = Object.entries(emissionsByCategory).map(
      ([key, data]) => {
        const [, category] = key.split("-");
        return {
          category,
          categoryLabel: categoryLabels[category] || category,
          scope: data.scope,
          value: data.value,
          percentage: totalEmissions > 0 ? (data.value / totalEmissions) * 100 : 0,
        };
      }
    );

    // Create activity data with emissions for the report
    const activityDataWithEmissions = typedActivityData.map((ad) => {
      const emission = typedResults.find((r) => r.activity_data_id === ad.id);
      return {
        id: ad.id,
        category: ad.category,
        sourceDescription: ad.source_description,
        activityType: ad.activity_type,
        quantity: Number(ad.quantity),
        unit: ad.quantity_unit,
        co2Equivalent: Number(emission?.co2_equivalent || 0),
      };
    });

    // Build the report data
    const reportData: ReportData = {
      id: crypto.randomUUID(),
      title: validatedData.title,
      type: validatedData.type,
      description: validatedData.description,
      organization: {
        name: organization?.name || "Organização",
        cnpj: organization?.cnpj || undefined,
        sector: organization?.sector || undefined,
      },
      inventory: {
        baseYear: inventory.base_year,
        gwpReference: inventory.gwp_reference,
        consolidationApproach: inventory.consolidation_approach,
      },
      emissions: {
        scope1: totalScope1,
        scope2: totalScope2,
        scope3: totalScope3,
        biogenic: totalBiogenic,
        total: totalEmissions,
      },
      emissionsByCategory: emissionsByCategoryArray,
      activityData: validatedData.includeDetails ? activityDataWithEmissions : undefined,
      generatedAt: new Date().toISOString(),
      config: {
        includeCharts: validatedData.includeCharts,
        includeDetails: validatedData.includeDetails,
        includeMethodology: validatedData.includeMethodology,
        responsibleName: validatedData.responsibleName,
        responsibleRole: validatedData.responsibleRole,
      },
    };

    // Generate file name
    const fileName = `${validatedData.title.replace(/\s+/g, "_")}_${inventory.base_year}.json`;

    // Save the report to database
    const report = await db.reports.create({
      inventory_id: validatedData.inventoryId,
      type: validatedData.type,
      format: "JSON",
      file_name: fileName,
      file_url: JSON.stringify(reportData), // Store as JSON string
    });

    return NextResponse.json({
      report: {
        id: report.id,
        type: report.type,
        format: report.format,
        fileName: report.file_name,
        generatedAt: report.generated_at,
      },
      reportData,
      message: "Relatório gerado com sucesso",
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
