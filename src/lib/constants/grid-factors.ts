// =====================================================
// FATORES DO GRID ELÉTRICO BRASILEIRO
// Fonte: MCTI/SIRENE
// =====================================================

export interface MonthlyGridFactors {
  [month: number]: number; // tCO2/MWh
  annual: number;
}

// Fatores de emissão do Sistema Interligado Nacional (SIN)
// tCO2/MWh por mês
export const GRID_EMISSION_FACTORS: Record<number, MonthlyGridFactors> = {
  2024: {
    1: 0.04212,
    2: 0.0376,
    3: 0.0278,
    4: 0.0195,
    5: 0.0283,
    6: 0.0365,
    7: 0.0571,
    8: 0.0739,
    9: 0.0917,
    10: 0.1127,
    11: 0.0701,
    12: 0.0564,
    annual: 0.0564,
  },
  2023: {
    1: 0.0679,
    2: 0.0705,
    3: 0.0622,
    4: 0.0403,
    5: 0.0323,
    6: 0.0357,
    7: 0.0363,
    8: 0.0608,
    9: 0.0705,
    10: 0.0807,
    11: 0.0709,
    12: 0.0489,
    annual: 0.0564,
  },
  2022: {
    1: 0.0871,
    2: 0.0783,
    3: 0.0727,
    4: 0.0674,
    5: 0.0649,
    6: 0.0752,
    7: 0.0836,
    8: 0.0918,
    9: 0.0857,
    10: 0.0731,
    11: 0.0537,
    12: 0.0487,
    annual: 0.0735,
  },
  2021: {
    1: 0.0879,
    2: 0.0674,
    3: 0.0635,
    4: 0.0601,
    5: 0.0987,
    6: 0.1126,
    7: 0.1356,
    8: 0.1455,
    9: 0.1324,
    10: 0.1124,
    11: 0.0987,
    12: 0.0754,
    annual: 0.0992,
  },
  2020: {
    1: 0.0671,
    2: 0.0635,
    3: 0.0587,
    4: 0.0534,
    5: 0.0589,
    6: 0.0698,
    7: 0.0835,
    8: 0.0912,
    9: 0.0878,
    10: 0.0756,
    11: 0.0654,
    12: 0.0587,
    annual: 0.0695,
  },
  2019: {
    1: 0.0467,
    2: 0.0456,
    3: 0.0423,
    4: 0.0398,
    5: 0.0456,
    6: 0.0587,
    7: 0.0698,
    8: 0.0845,
    9: 0.0912,
    10: 0.0834,
    11: 0.0657,
    12: 0.0534,
    annual: 0.0606,
  },
  2018: {
    1: 0.0856,
    2: 0.0743,
    3: 0.0678,
    4: 0.0612,
    5: 0.0678,
    6: 0.0787,
    7: 0.0912,
    8: 0.1023,
    9: 0.0945,
    10: 0.0823,
    11: 0.0687,
    12: 0.0598,
    annual: 0.0778,
  },
};

// Fator default para anos sem dados
export const DEFAULT_GRID_FACTOR = 0.0735; // tCO2/MWh

// Função para obter fator de emissão do grid
export function getGridFactor(year: number, month?: number): number {
  const yearFactors = GRID_EMISSION_FACTORS[year];

  if (!yearFactors) {
    // Se não tiver dados do ano, usar o mais recente disponível
    const availableYears = Object.keys(GRID_EMISSION_FACTORS).map(Number);
    const closestYear =
      availableYears.find((y) => y <= year) || Math.max(...availableYears);
    const closestFactors = GRID_EMISSION_FACTORS[closestYear];

    if (month && closestFactors[month]) {
      return closestFactors[month];
    }
    return closestFactors?.annual || DEFAULT_GRID_FACTOR;
  }

  if (month && yearFactors[month]) {
    return yearFactors[month];
  }

  return yearFactors.annual;
}

// Função para calcular emissões de eletricidade
export function calculateElectricityEmissions(
  consumptionKWh: number,
  year: number,
  month?: number
): { co2: number; biogenic: number } {
  const factor = getGridFactor(year, month);
  const consumptionMWh = consumptionKWh / 1000;

  return {
    co2: consumptionMWh * factor, // tCO2
    biogenic: 0, // Eletricidade do grid não tem emissões biogênicas
  };
}
