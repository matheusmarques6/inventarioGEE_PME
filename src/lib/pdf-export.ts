import jsPDF from "jspdf";
import "jspdf-autotable";
import type { ReportData } from "@/components/reports/report-viewer";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: {
      head?: string[][];
      body?: (string | number)[][];
      startY?: number;
      theme?: string;
      headStyles?: Record<string, unknown>;
      styles?: Record<string, unknown>;
      columnStyles?: Record<string, unknown>;
      margin?: { left?: number; right?: number };
    }) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

const SCOPE_COLORS = {
  1: [239, 68, 68], // red
  2: [59, 130, 246], // blue
  3: [34, 197, 94], // green
} as const;

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

const formatNumber = (value: number): string => {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export async function exportReportToPDF(data: ReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper to add new page if needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(34, 197, 94); // Primary green
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, margin, 25);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(data.organization.name, margin, 35);

  // Year badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 50, 15, 35, 20, 3, 3, "F");
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.inventory.baseYear.toString(), pageWidth - 42, 28);

  yPos = 55;

  // Organization Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (data.organization.cnpj) {
    doc.text(`CNPJ: ${data.organization.cnpj}`, margin, yPos);
    yPos += 6;
  }
  if (data.organization.sector) {
    doc.text(`Setor: ${data.organization.sector}`, margin, yPos);
    yPos += 6;
  }

  doc.text(
    `Gerado em: ${new Date(data.generatedAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    margin,
    yPos
  );
  yPos += 15;

  // Summary Section
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 35, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo das Emissões (tCO₂e)", margin + 5, yPos + 10);

  // Scope boxes
  const boxWidth = (pageWidth - 2 * margin - 30) / 4;
  const boxY = yPos + 15;

  // Scope 1
  doc.setFillColor(254, 226, 226);
  doc.rect(margin + 5, boxY, boxWidth, 15, "F");
  doc.setTextColor(153, 27, 27);
  doc.setFontSize(8);
  doc.text("ESCOPO 1", margin + 8, boxY + 5);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatNumber(data.emissions.scope1), margin + 8, boxY + 12);

  // Scope 2
  doc.setFillColor(219, 234, 254);
  doc.rect(margin + 10 + boxWidth, boxY, boxWidth, 15, "F");
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ESCOPO 2", margin + 13 + boxWidth, boxY + 5);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatNumber(data.emissions.scope2), margin + 13 + boxWidth, boxY + 12);

  // Scope 3
  doc.setFillColor(220, 252, 231);
  doc.rect(margin + 15 + boxWidth * 2, boxY, boxWidth, 15, "F");
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ESCOPO 3", margin + 18 + boxWidth * 2, boxY + 5);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatNumber(data.emissions.scope3), margin + 18 + boxWidth * 2, boxY + 12);

  // Total
  doc.setFillColor(229, 231, 235);
  doc.rect(margin + 20 + boxWidth * 3, boxY, boxWidth, 15, "F");
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL", margin + 23 + boxWidth * 3, boxY + 5);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatNumber(data.emissions.total), margin + 23 + boxWidth * 3, boxY + 12);

  yPos += 55;

  // Emissions by Category Table
  if (data.config.includeDetails && data.emissionsByCategory.length > 0) {
    checkNewPage(60);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Emissões por Categoria", margin, yPos);
    yPos += 8;

    const tableData = data.emissionsByCategory
      .sort((a, b) => b.value - a.value)
      .map((cat) => [
        cat.categoryLabel,
        `Escopo ${cat.scope}`,
        formatNumber(cat.value),
        `${cat.percentage.toFixed(1)}%`,
      ]);

    doc.autoTable({
      head: [["Categoria", "Escopo", "Emissões (tCO₂e)", "% Total"]],
      body: tableData,
      startY: yPos,
      theme: "striped",
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc.lastAutoTable?.finalY || yPos) + 15;
  }

  // Activity Data Details (if included)
  if (
    data.config.includeDetails &&
    data.activityData &&
    data.activityData.length > 0
  ) {
    checkNewPage(60);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Dados de Atividade", margin, yPos);
    yPos += 8;

    const activityTableData = data.activityData.slice(0, 30).map((activity) => [
      activity.sourceDescription.substring(0, 25),
      categoryLabels[activity.category] || activity.category,
      activity.activityType.substring(0, 15),
      `${formatNumber(activity.quantity)} ${activity.unit}`,
      formatNumber(activity.co2Equivalent),
    ]);

    doc.autoTable({
      head: [["Fonte", "Categoria", "Tipo", "Quantidade", "tCO₂e"]],
      body: activityTableData,
      startY: yPos,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        3: { halign: "right" },
        4: { halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc.lastAutoTable?.finalY || yPos) + 15;

    if (data.activityData.length > 30) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Mostrando 30 de ${data.activityData.length} registros`,
        margin,
        yPos
      );
      yPos += 10;
    }
  }

  // Methodology Section
  if (data.config.includeMethodology) {
    checkNewPage(80);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Metodologia", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.setFont("helvetica", "bold");
    doc.text("Referência GWP:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(data.inventory.gwpReference, margin + 40, yPos);
    yPos += 7;

    doc.setFont("helvetica", "bold");
    doc.text("Abordagem:", margin, yPos);
    doc.setFont("helvetica", "normal");
    const approachLabel =
      data.inventory.consolidationApproach === "OPERATIONAL_CONTROL"
        ? "Controle Operacional"
        : data.inventory.consolidationApproach === "FINANCIAL_CONTROL"
        ? "Controle Financeiro"
        : data.inventory.consolidationApproach;
    doc.text(approachLabel, margin + 40, yPos);
    yPos += 12;

    // Scope descriptions
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 45, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Sobre os Escopos:", margin + 5, yPos + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const scopeDescriptions = [
      "Escopo 1: Emissões diretas de fontes próprias ou controladas pela organização",
      "Escopo 2: Emissões indiretas provenientes da aquisição de energia elétrica, vapor ou calor",
      "Escopo 3: Outras emissões indiretas que ocorrem na cadeia de valor da organização",
    ];

    let descY = yPos + 15;
    scopeDescriptions.forEach((desc) => {
      doc.text(desc, margin + 5, descY);
      descY += 7;
    });

    yPos += 55;
  }

  // Biogenic Emissions
  if (data.emissions.biogenic > 0) {
    checkNewPage(40);

    doc.setFillColor(220, 252, 231);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25, "F");

    doc.setTextColor(22, 101, 52);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Emissões Biogênicas", margin + 5, yPos + 10);

    doc.setFontSize(14);
    doc.text(`${formatNumber(data.emissions.biogenic)} tCO₂`, margin + 5, yPos + 20);

    yPos += 35;
  }

  // Responsible person
  if (data.config.responsibleName) {
    checkNewPage(30);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Responsável pelo Inventário:", margin, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    doc.text(
      `${data.config.responsibleName}${
        data.config.responsibleRole ? ` - ${data.config.responsibleRole}` : ""
      }`,
      margin,
      yPos
    );
    yPos += 15;
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Relatório gerado pelo Sistema GEE Inventory - Em conformidade com GHG Protocol e Lei nº 15.042/2024",
      margin,
      pageHeight - 10
    );

    // Page number
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 25, pageHeight - 10);
  }

  // Save the PDF
  const fileName = `${data.title.replace(/\s+/g, "_")}_${data.inventory.baseYear}.pdf`;
  doc.save(fileName);
}
