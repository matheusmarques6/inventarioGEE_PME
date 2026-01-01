import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { calculateStationaryCombustion, calculateMobileCombustion, calculateFugitiveEmissions } from "@/lib/calculations/scope1";
import { calculateFertilizerEmissions, calculateLimestoneEmissions } from "@/lib/emission-factors/fertilizers";

interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  errors: Array<{ row: number; error: string }>;
  category: string;
}

// Map Portuguese fuel names to standard names
const FUEL_NAME_MAP: Record<string, string> = {
  "DIESEL": "Óleo Diesel",
  "Diesel": "Óleo Diesel",
  "Óleo Diesel": "Óleo Diesel",
  "GASOLINA": "Gasolina Automotiva",
  "Gasolina": "Gasolina Automotiva",
  "Gasolina Automotiva": "Gasolina Automotiva",
  "ETANOL": "Álcool Etílico Hidratado",
  "Etanol": "Álcool Etílico Hidratado",
  "GLP": "GLP",
  "Gás GLP": "GLP",
  "Gás Natural": "Gás Natural",
  "GÁS NATURAL": "Gás Natural",
  "Biomassa": "Biomassa",
  "BIOMASSA": "Biomassa",
  "Biodiesel": "Biodiesel",
};

// Normalize fuel name
function normalizeFuelName(name: string): string {
  const trimmed = name?.trim() || "";
  return FUEL_NAME_MAP[trimmed] || trimmed;
}

// Parse unit from string
function parseUnit(unitStr: string): "litros" | "m3" | "kg" | "ton" {
  const normalized = unitStr?.toLowerCase().trim() || "litros";
  if (normalized.includes("litro") || normalized === "l") return "litros";
  if (normalized.includes("m³") || normalized.includes("m3")) return "m3";
  if (normalized.includes("ton")) return "ton";
  if (normalized === "kg") return "kg";
  return "litros";
}

// POST - Import Excel file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const inventoryId = formData.get("inventoryId") as string;
    const sheetType = formData.get("sheetType") as string; // stationary, mobile, fugitive, fertilizer

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    if (!inventoryId) {
      return NextResponse.json({ error: "inventoryId é obrigatório" }, { status: 400 });
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const results: ImportResult[] = [];

    // Process based on sheet type
    if (sheetType === "stationary" || !sheetType) {
      const stationaryResult = await processStationarySheet(workbook, inventoryId);
      if (stationaryResult) results.push(stationaryResult);
    }

    if (sheetType === "mobile" || !sheetType) {
      const mobileResult = await processMobileSheet(workbook, inventoryId);
      if (mobileResult) results.push(mobileResult);
    }

    if (sheetType === "fugitive" || !sheetType) {
      const fugitiveResult = await processFugitiveSheet(workbook, inventoryId);
      if (fugitiveResult) results.push(fugitiveResult);
    }

    if (sheetType === "fertilizer" || !sheetType) {
      const fertilizerResult = await processFertilizerSheet(workbook, inventoryId);
      if (fertilizerResult) results.push(fertilizerResult);
    }

    return NextResponse.json({
      success: true,
      results,
      totalImported: results.reduce((acc, r) => acc + r.imported, 0),
    });
  } catch (error) {
    console.error("Error importing Excel:", error);
    return NextResponse.json(
      { error: "Erro ao importar planilha" },
      { status: 500 }
    );
  }
}

// Process Stationary Combustion sheet (Estacionárias)
async function processStationarySheet(
  workbook: XLSX.WorkBook,
  inventoryId: string
): Promise<ImportResult | null> {
  const sheetName = workbook.SheetNames.find(
    (name) => name.toLowerCase().includes("estacion") || name === "Estacionárias"
  );

  if (!sheetName) return null;

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });

  const errors: Array<{ row: number; error: string }> = [];
  let imported = 0;

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length < 12) continue;

    try {
      // Map columns based on spreadsheet structure
      // [0]=Ano, [5]=Unidade, [7]=Atividade, [8]=Fonte, [9]=Combustível, [10]=De-Para, [11]=Consumo, [12]=Unidade
      const year = Number(row[0]) || 2024;
      const unitName = String(row[5] || "");
      const activity = String(row[7] || "");
      const source = String(row[8] || "");
      const fuelRaw = String(row[10] || row[9] || ""); // De-Para ou Combustível
      const quantity = Number(row[11]) || 0;
      const unitStr = String(row[12] || "litros");

      if (quantity <= 0) continue;

      const fuelName = normalizeFuelName(fuelRaw);
      const unit = parseUnit(unitStr);

      // Calculate emissions
      const emissions = calculateStationaryCombustion({
        fuelName,
        quantity,
        unit,
        ethanolPercentage: 0.27,
        biodieselPercentage: 0.14,
      });

      // Save to database
      await prisma.$transaction(async (tx) => {
        const activityData = await tx.activityData.create({
          data: {
            inventoryId,
            category: "STATIONARY_COMBUSTION",
            subcategory: fuelName,
            scope: 1,
            sourceDescription: `${source} - ${activity}`,
            activityType: "Combustão estacionária",
            quantity: new Prisma.Decimal(quantity),
            quantityUnit: unit,
            year,
            dataSource: "Importação Excel",
            dataQuality: "PRIMARY",
            metadata: {
              fuelName,
              activity,
              source,
              unitName,
              energyGJ: emissions.energyGJ,
              importedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        await tx.emissionResult.create({
          data: {
            inventoryId,
            activityDataId: activityData.id,
            co2Mass: new Prisma.Decimal(emissions.co2Kg),
            ch4Mass: new Prisma.Decimal(emissions.ch4Kg),
            n2oMass: new Prisma.Decimal(emissions.n2oKg),
            co2Equivalent: new Prisma.Decimal(emissions.totalTCO2e),
            biogenicCo2: new Prisma.Decimal(emissions.biogenicTCO2e),
            scope: 1,
            category: "STATIONARY_COMBUSTION",
            isKyotoGas: true,
            gwpReference: "AR5",
          },
        });
      });

      imported++;
    } catch (error) {
      errors.push({ row: i + 1, error: String(error) });
    }
  }

  return {
    success: errors.length === 0,
    totalRows: data.length - 1,
    imported,
    errors,
    category: "Combustão Estacionária",
  };
}

// Process Mobile Combustion sheet (Móvel_ConsumoCombustivel)
async function processMobileSheet(
  workbook: XLSX.WorkBook,
  inventoryId: string
): Promise<ImportResult | null> {
  const sheetName = workbook.SheetNames.find(
    (name) => name.toLowerCase().includes("móvel") || name.includes("Movel") || name.includes("Mobile")
  );

  if (!sheetName) return null;

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });

  const errors: Array<{ row: number; error: string }> = [];
  let imported = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length < 13) continue;

    try {
      // Map columns based on spreadsheet structure
      // [0]=Ano, [4]=Empresa, [5]=Unidade, [7]=Atividade, [8]=Fonte, [9]=Combustível, [10]=De-Para, [11]=Tipo, [12]=Quantidade
      const year = Number(row[0]) || 2024;
      const unitName = String(row[5] || "");
      const activity = String(row[7] || "");
      const source = String(row[8] || "");
      const fuelRaw = String(row[10] || row[9] || "");
      const vehicleType = String(row[11] || "");
      const quantity = Number(row[12]) || 0;
      const unitStr = String(row[13] || "litros");

      if (quantity <= 0) continue;

      const fuelName = normalizeFuelName(fuelRaw);
      const unit = parseUnit(unitStr);

      // Determine if road or offroad
      const isOffroad = vehicleType.toLowerCase().includes("trator") ||
        vehicleType.toLowerCase().includes("agric") ||
        activity.toLowerCase().includes("florestal");

      // Calculate emissions
      const emissions = calculateMobileCombustion(
        {
          fuelName,
          quantity,
          unit,
          ethanolPercentage: 0.27,
          biodieselPercentage: 0.14,
        },
        isOffroad ? "offroad" : "road"
      );

      // Save to database
      await prisma.$transaction(async (tx) => {
        const activityData = await tx.activityData.create({
          data: {
            inventoryId,
            category: "MOBILE_COMBUSTION",
            subcategory: vehicleType || fuelName,
            scope: 1,
            sourceDescription: `${source} - ${activity}`,
            activityType: "Combustão móvel",
            quantity: new Prisma.Decimal(quantity),
            quantityUnit: unit,
            year,
            dataSource: "Importação Excel",
            dataQuality: "PRIMARY",
            metadata: {
              fuelName,
              activity,
              source,
              unitName,
              vehicleType,
              isOffroad,
              energyGJ: emissions.energyGJ,
              importedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        await tx.emissionResult.create({
          data: {
            inventoryId,
            activityDataId: activityData.id,
            co2Mass: new Prisma.Decimal(emissions.co2Kg),
            ch4Mass: new Prisma.Decimal(emissions.ch4Kg),
            n2oMass: new Prisma.Decimal(emissions.n2oKg),
            co2Equivalent: new Prisma.Decimal(emissions.totalTCO2e),
            biogenicCo2: new Prisma.Decimal(emissions.biogenicTCO2e),
            scope: 1,
            category: "MOBILE_COMBUSTION",
            isKyotoGas: true,
            gwpReference: "AR5",
          },
        });
      });

      imported++;
    } catch (error) {
      errors.push({ row: i + 1, error: String(error) });
    }
  }

  return {
    success: errors.length === 0,
    totalRows: data.length - 1,
    imported,
    errors,
    category: "Combustão Móvel",
  };
}

// Process Fugitive Emissions sheet (Fugitivas)
async function processFugitiveSheet(
  workbook: XLSX.WorkBook,
  inventoryId: string
): Promise<ImportResult | null> {
  const sheetName = workbook.SheetNames.find(
    (name) => name.toLowerCase().includes("fugitiv")
  );

  if (!sheetName) return null;

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });

  const errors: Array<{ row: number; error: string }> = [];
  let imported = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length < 10) continue;

    try {
      // Map columns: [0]=Ano, [4]=Unidade, [7]=Produto, [8]=Gás, [9]=De-Para, [10]=Consumo
      const year = Number(row[0]) || 2024;
      const unitName = String(row[4] || "");
      const commercialName = String(row[7] || "");
      const gasRaw = String(row[9] || row[8] || "");
      const quantity = Number(row[10] || row[12]) || 0;

      if (quantity <= 0) continue;

      // Normalize gas name
      let gasName = gasRaw.trim().toUpperCase();
      if (!gasName.includes("-") && !gasName.includes("HFC") && !gasName.includes("HCFC")) {
        gasName = gasRaw.trim();
      }

      // Calculate emissions
      const emissions = calculateFugitiveEmissions({
        gasName,
        quantity,
      });

      // Save to database
      await prisma.$transaction(async (tx) => {
        const activityData = await tx.activityData.create({
          data: {
            inventoryId,
            category: "FUGITIVE_EMISSIONS",
            subcategory: gasName,
            scope: 1,
            sourceDescription: commercialName || gasName,
            activityType: "Emissões fugitivas",
            quantity: new Prisma.Decimal(quantity),
            quantityUnit: "kg",
            year,
            dataSource: "Importação Excel",
            dataQuality: "PRIMARY",
            metadata: {
              gasName,
              commercialName,
              unitName,
              gwp: emissions.gwp,
              isKyoto: emissions.isKyoto,
              importedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        await tx.emissionResult.create({
          data: {
            inventoryId,
            activityDataId: activityData.id,
            hfcMass: new Prisma.Decimal(quantity),
            co2Equivalent: new Prisma.Decimal(emissions.totalTCO2e),
            scope: 1,
            category: "FUGITIVE_EMISSIONS",
            isKyotoGas: emissions.isKyoto,
            gwpReference: "AR5",
          },
        });
      });

      imported++;
    } catch (error) {
      errors.push({ row: i + 1, error: String(error) });
    }
  }

  return {
    success: errors.length === 0,
    totalRows: data.length - 1,
    imported,
    errors,
    category: "Emissões Fugitivas",
  };
}

// Process Fertilizer sheet (Fertilizantes)
async function processFertilizerSheet(
  workbook: XLSX.WorkBook,
  inventoryId: string
): Promise<ImportResult | null> {
  const sheetName = workbook.SheetNames.find(
    (name) => name.toLowerCase().includes("fertiliz")
  );

  if (!sheetName) return null;

  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });

  const errors: Array<{ row: number; error: string }> = [];
  let imported = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length < 14) continue;

    try {
      // Map columns: [0]=Ano, [3]=Unidade, [6]=Fertilizante, [7]=Teor N, [8]=Tipo N/U, [10]=Calcário C/D, [11]=CaO%, [12]=MgO%, [13]=Quantidade
      const year = Number(row[0]) || 2024;
      const unitName = String(row[3] || "");
      const fertilizerName = String(row[6] || "");
      const nitrogenContentRaw = row[7];
      const nitrogenType = String(row[8] || "N");
      const limestoneType = String(row[10] || "");
      const caoContentRaw = row[11];
      const mgoContentRaw = row[12];
      const quantity = Number(row[13]) || 0;

      if (quantity <= 0) continue;

      // Determine type and calculate
      const isLimestone = fertilizerName.toLowerCase().includes("calcário") ||
        fertilizerName.toLowerCase().includes("calcario") ||
        limestoneType === "C" || limestoneType === "D";

      if (isLimestone) {
        const type = limestoneType === "C" ? "calcitic" : "dolomitic";
        const caoContent = Number(caoContentRaw) || 0.3;
        const mgoContent = Number(mgoContentRaw) || 0.12;

        const emissions = calculateLimestoneEmissions({
          type,
          caoContent,
          mgoContent,
          quantity,
        });

        await prisma.$transaction(async (tx) => {
          const activityData = await tx.activityData.create({
            data: {
              inventoryId,
              category: "AGRICULTURAL",
              subcategory: `Calcário ${type === "calcitic" ? "calcítico" : "dolomítico"}`,
              scope: 1,
              sourceDescription: fertilizerName,
              activityType: "Aplicação de calcário",
              quantity: new Prisma.Decimal(quantity),
              quantityUnit: "kg",
              year,
              dataSource: "Importação Excel",
              dataQuality: "PRIMARY",
              metadata: {
                fertilizerName,
                limestoneType: type,
                caoContent,
                mgoContent,
                unitName,
                caco3Equivalent: emissions.caco3Equivalent,
                importedAt: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          });

          await tx.emissionResult.create({
            data: {
              inventoryId,
              activityDataId: activityData.id,
              co2Mass: new Prisma.Decimal(emissions.co2Kg),
              co2Equivalent: new Prisma.Decimal(emissions.totalTCO2e),
              scope: 1,
              category: "AGRICULTURAL",
              isKyotoGas: true,
              gwpReference: "AR5",
            },
          });
        });
      } else {
        // Nitrogen fertilizer
        const nitrogenContent = Number(nitrogenContentRaw) || 0;
        const isUrea = nitrogenType === "U" || fertilizerName.toLowerCase().includes("uréia") || fertilizerName.toLowerCase().includes("ureia");

        const emissions = calculateFertilizerEmissions({
          fertilizerType: fertilizerName,
          nitrogenContent,
          isUrea,
          quantity,
        });

        await prisma.$transaction(async (tx) => {
          const activityData = await tx.activityData.create({
            data: {
              inventoryId,
              category: "AGRICULTURAL",
              subcategory: fertilizerName,
              scope: 1,
              sourceDescription: fertilizerName,
              activityType: "Aplicação de fertilizante",
              quantity: new Prisma.Decimal(quantity),
              quantityUnit: "kg",
              year,
              dataSource: "Importação Excel",
              dataQuality: "PRIMARY",
              metadata: {
                fertilizerName,
                nitrogenContent,
                isUrea,
                unitName,
                nitrogenApplied: emissions.nitrogenApplied,
                importedAt: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          });

          await tx.emissionResult.create({
            data: {
              inventoryId,
              activityDataId: activityData.id,
              co2Mass: new Prisma.Decimal(emissions.co2Kg),
              n2oMass: new Prisma.Decimal(emissions.n2oKg),
              co2Equivalent: new Prisma.Decimal(emissions.totalTCO2e),
              scope: 1,
              category: "AGRICULTURAL",
              isKyotoGas: true,
              gwpReference: "AR5",
            },
          });
        });
      }

      imported++;
    } catch (error) {
      errors.push({ row: i + 1, error: String(error) });
    }
  }

  return {
    success: errors.length === 0,
    totalRows: data.length - 1,
    imported,
    errors,
    category: "Fertilizantes",
  };
}
