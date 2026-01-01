import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// Type for emission result from Prisma
interface EmissionResultData {
  scope: number;
  category: string;
  co2Equivalent: unknown;
  biogenicCo2: unknown;
  co2Mass: unknown;
  ch4Mass: unknown;
  n2oMass: unknown;
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
  emissionResults: EmissionResultData[];
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

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        inventory: {
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
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Relatório não encontrado" },
        { status: 404 }
      );
    }

    const inventory = report.inventory;

    // Regenerate report data
    const emissionResults = inventory.emissionResults as EmissionResultData[];
    const activityData = inventory.activityData as ActivityDataRecord[];
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

    let reportData: Record<string, unknown>;

    switch (report.type) {
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
              categories: emissionsByCategory,
            },
            scope2: { total: totalScope2 },
            scope3: { total: totalScope3 },
            biogenic: totalBiogenic,
            total: totalScope1 + totalScope2 + totalScope3,
          },
          activityData: activityData.map(ad => ({
            id: ad.id,
            category: ad.category,
            sourceDescription: ad.sourceDescription,
            activityType: ad.activityType,
            quantity: Number(ad.quantity),
            unit: ad.quantityUnit,
            month: ad.month,
            year: ad.year,
            emissions: ad.emissionResults.map(er => ({
              co2Equivalent: Number(er.co2Equivalent),
              co2Mass: Number(er.co2Mass || 0),
              ch4Mass: Number(er.ch4Mass || 0),
              n2oMass: Number(er.n2oMass || 0),
              scope: er.scope,
            })),
          })),
          generatedAt: report.generatedAt.toISOString(),
        };
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
          generatedAt: report.generatedAt.toISOString(),
        };
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
          generatedAt: report.generatedAt.toISOString(),
        };
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
          generatedAt: report.generatedAt.toISOString(),
        };
    }

    // Return as JSON with download headers
    const contentType = report.format === "JSON" ? "application/json" : "application/json";

    return new NextResponse(JSON.stringify(reportData, null, 2), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${report.fileName}"`,
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
