// =====================================================
// FATORES DE EMISSÃO - FERTILIZANTES
// Fonte: IPCC 2019
// =====================================================

// Fatores de emissão para fertilizantes nitrogenados
export const FERTILIZER_FACTORS = {
  // Emissões diretas de N2O
  directEmissionFactor: 0.01, // kg N2O-N / kg N aplicado

  // Emissões indiretas por volatilização
  volatilizationFraction: 0.11, // fração volatilizada como NH3 e NOx
  volatilizationEF: 0.01, // kg N2O-N / kg N volatilizado

  // Emissões indiretas por lixiviação/escoamento
  leachingFraction: 0.24, // fração lixiviada
  leachingEF: 0.011, // kg N2O-N / kg N lixiviado

  // Conversões
  n2oToN2Ratio: 44 / 28, // conversão N2O-N para N2O
  nToN2O: 44 / 28,

  // Emissões de CO2 por ureia
  ureaEF: 0.2, // kg C / kg ureia
  cToCO2: 44 / 12,

  // Emissões de CO2 por calcário
  calciteEF: 0.12, // kg C / kg carbonato (calcítico)
  dolomiteEF: 0.13, // kg C / kg carbonato (dolomítico)
};

// Teor de nitrogênio por tipo de fertilizante (fração)
export const NITROGEN_CONTENT: Record<string, number> = {
  Ureia: 0.46,
  "Sulfato de Amônio": 0.21,
  "Nitrato de Amônio": 0.34,
  MAP: 0.11, // Fosfato Monoamônico
  DAP: 0.18, // Fosfato Diamônico
  "Nitrato de Cálcio": 0.155,
  "Nitrato de Potássio": 0.13,
  "Cloreto de Amônio": 0.26,
  "NPK 04-14-08": 0.04,
  "NPK 10-10-10": 0.1,
  "NPK 20-05-20": 0.2,
  "NPK 04-30-10": 0.04,
  Default: 0.2,
};

export interface FertilizerEmissionResult {
  n2oDirect: number; // tN2O emissões diretas
  n2oVolatilization: number; // tN2O por volatilização
  n2oLeaching: number; // tN2O por lixiviação
  n2oTotal: number; // tN2O total
  co2Urea: number; // tCO2 da ureia
  co2Limestone: number; // tCO2 do calcário
  co2eTotal: number; // tCO2e total
}

// Função para calcular emissões de fertilizantes
export function calculateFertilizerEmissions(
  fertilizerType: string,
  quantity: number, // kg de fertilizante
  isUrea: boolean = false,
  limestoneQuantity: number = 0, // kg de calcário
  limestoneType: "calcítico" | "dolomítico" = "calcítico",
  gwpN2O: number = 265
): FertilizerEmissionResult {
  // Obter teor de N
  const nContent = NITROGEN_CONTENT[fertilizerType] || NITROGEN_CONTENT.Default;
  const nitrogenApplied = quantity * nContent; // kg N

  // Emissões diretas de N2O
  const n2oDirectN =
    nitrogenApplied * FERTILIZER_FACTORS.directEmissionFactor;
  const n2oDirect = (n2oDirectN * FERTILIZER_FACTORS.n2oToN2Ratio) / 1000; // toneladas

  // Emissões indiretas por volatilização
  const volatilizedN =
    nitrogenApplied * FERTILIZER_FACTORS.volatilizationFraction;
  const n2oVolN = volatilizedN * FERTILIZER_FACTORS.volatilizationEF;
  const n2oVolatilization =
    (n2oVolN * FERTILIZER_FACTORS.n2oToN2Ratio) / 1000;

  // Emissões indiretas por lixiviação
  const leachedN = nitrogenApplied * FERTILIZER_FACTORS.leachingFraction;
  const n2oLeachN = leachedN * FERTILIZER_FACTORS.leachingEF;
  const n2oLeaching = (n2oLeachN * FERTILIZER_FACTORS.n2oToN2Ratio) / 1000;

  // Total N2O
  const n2oTotal = n2oDirect + n2oVolatilization + n2oLeaching;

  // CO2 da ureia
  let co2Urea = 0;
  if (isUrea || fertilizerType.toLowerCase().includes("ureia")) {
    const carbonFromUrea = quantity * FERTILIZER_FACTORS.ureaEF;
    co2Urea = (carbonFromUrea * FERTILIZER_FACTORS.cToCO2) / 1000;
  }

  // CO2 do calcário
  let co2Limestone = 0;
  if (limestoneQuantity > 0) {
    const ef =
      limestoneType === "dolomítico"
        ? FERTILIZER_FACTORS.dolomiteEF
        : FERTILIZER_FACTORS.calciteEF;
    const carbonFromLimestone = limestoneQuantity * ef;
    co2Limestone = (carbonFromLimestone * FERTILIZER_FACTORS.cToCO2) / 1000;
  }

  // Total CO2e
  const co2eTotal = n2oTotal * gwpN2O + co2Urea + co2Limestone;

  return {
    n2oDirect,
    n2oVolatilization,
    n2oLeaching,
    n2oTotal,
    co2Urea,
    co2Limestone,
    co2eTotal,
  };
}

// Lista de fertilizantes disponíveis
export function getAllFertilizers(): string[] {
  return Object.keys(NITROGEN_CONTENT).filter((f) => f !== "Default");
}
