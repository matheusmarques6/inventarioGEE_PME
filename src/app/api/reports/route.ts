import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

// Type for emission result from Prisma
interface EmissionResultData {
  scope: number;
  category: string;
  co2Equivalent: unknown;
  biogenicCo2: unknown;
}

// Type for activity data from Prisma
interface ActivityDataRecord {
  id: string;
  category: string;
  sourceDescription: string;
  activityType: string;
  quantity: unknown;
  quantityUnit: string;
  month: number | null;
  year: number;
  emissionResults: { co2Equivalent: unknown; scope: number }[];
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

    const reports = await prisma.report.findMany({
      where: { inventoryId },
      include: {
        inventory: {
          select: {
            name: true,
            baseYear: true,
          },
        },
      },
      orderBy: { generatedAt: "desc" },
    });

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
    const inventory = await prisma.inventory.findUnique({
      where: { id: validatedData.inventoryId },
      include: {
        organization: true,
        activityData: {
          include: {
            unit: true,
            emissionResults: true,
          },
        },
        emissionResults: true,
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    // Cast to typed arrays
    const emissionResults = inventory.emissionResults as EmissionResultData[];
    const activityData = inventory.activityData as unknown as ActivityDataRecord[];

    // Calculate emissions by scope and category
    const scope1Results = emissionResults.filter((r) => r.scope === 1);
    const scope2Results = emissionResults.filter((r) => r.scope === 2);
    const scope3Results = emissionResults.filter((r) => r.scope === 3);

    const totalScope1 = scope1Results.reduce(
      (sum, r) => sum + Number(r.co2Equivalent || 0), 0
    );
    const totalScope2 = scope2Results.reduce(
      (sum, r) => sum + Number(r.co2Equivalent || 0), 0
    );
    const totalScope3 = scope3Results.reduce(
      (sum, r) => sum + Number(r.co2Equivalent || 0), 0
    );
    const totalBiogenic = emissionResults.reduce(
      (sum, r) => sum + Number(r.biogenicCo2 || 0), 0
    );

    // Group emissions by category
    const emissionsByCategory: Record<string, number> = {};
    for (const result of emissionResults) {
      const category = result.category;
      if (!emissionsByCategory[category]) {
        emissionsByCategory[category] = 0;
      }
      emissionsByCategory[category] += Number(result.co2Equivalent || 0);
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

    switch (validatedData.type) {
      case "GHG_PROTOCOL":
        reportData = {
          title: `Inventário de Emissões de GEE - ${inventory.baseYear}`,
          organization: inventory.organization.name,
          cnpj: inventory.organization.cnpj,
          sector: inventory.organization.sector,
          reportingPeriod: inventory.reportingPeriod,
          gwpReference: inventory.gwpReference,
          consolidationApproach: inventory.consolidationApproach,
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
          activityDataCount: activityData.length,
          generatedAt: new Date().toISOString(),
        };
        fileName = `GHG_Protocol_${inventory.baseYear}_${inventory.organization.name.replace(/\s+/g, "_")}`;
        break;

      case "EXECUTIVE_SUMMARY":
        reportData = {
          title: `Sumário Executivo - Inventário GEE ${inventory.baseYear}`,
          organization: inventory.organization.name,
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
        fileName = `Sumario_Executivo_${inventory.baseYear}`;
        break;

      case "SBCE":
        reportData = {
          title: `Relatório SBCE - ${inventory.baseYear}`,
          empresa: {
            razaoSocial: inventory.organization.name,
            cnpj: inventory.organization.cnpj,
            setor: inventory.organization.sector,
          },
          emissoes: {
            escopo1: totalScope1,
            escopo2: totalScope2,
            escopo3: totalScope3,
            biogenicas: totalBiogenic,
            total: totalScope1 + totalScope2 + totalScope3,
          },
          metodologia: {
            gwp: inventory.gwpReference,
            abordagem: inventory.consolidationApproach,
          },
          generatedAt: new Date().toISOString(),
        };
        fileName = `SBCE_${inventory.baseYear}_${inventory.organization.cnpj}`;
        break;

      default:
        reportData = {
          inventory: {
            id: inventory.id,
            baseYear: inventory.baseYear,
            organization: inventory.organization.name,
          },
          emissions: {
            scope1: totalScope1,
            scope2: totalScope2,
            scope3: totalScope3,
            biogenic: totalBiogenic,
            total: totalScope1 + totalScope2 + totalScope3,
          },
          activityData: activityData.map(ad => ({
            id: ad.id,
            category: ad.category,
            sourceDescription: ad.sourceDescription,
            quantity: Number(ad.quantity),
            unit: ad.quantityUnit,
            emissions: ad.emissionResults.map(er => ({
              co2Equivalent: Number(er.co2Equivalent),
              scope: er.scope,
            })),
          })),
          generatedAt: new Date().toISOString(),
        };
        fileName = `Relatorio_${inventory.baseYear}`;
    }

    // Store the report data as JSON for now
    // In a production environment, this would generate actual PDF/XLSX files
    const fileExtension = validatedData.format.toLowerCase();
    const fullFileName = `${fileName}.${fileExtension}`;

    // Create the report record
    const report = await prisma.report.create({
      data: {
        inventoryId: validatedData.inventoryId,
        type: validatedData.type,
        format: validatedData.format,
        fileName: fullFileName,
        // In production, this would be the URL to the generated file
        fileUrl: `/api/reports/download?data=${encodeURIComponent(JSON.stringify(reportData))}`,
      },
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

    await prisma.report.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Erro ao excluir relatório" },
      { status: 500 }
    );
  }
}
