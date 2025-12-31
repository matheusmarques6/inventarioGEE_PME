// =====================================================
// FATORES DE EMISSÃO - FLORESTAS (LULUCF)
// Fonte: IPCC 2019, MCTI 2020
// =====================================================

// Constantes para cálculo de biomassa florestal
export const FOREST_CONSTANTS = {
  // Fator de expansão da biomassa (BEF)
  bef: {
    eucalipto: 1.2,
    pinus: 1.25,
    acacia: 1.22,
    teca: 1.3,
    default: 1.25,
  },

  // Razão raiz/parte aérea (R)
  rootRatio: {
    tropical: 0.17,
    subtropical: 0.17,
    temperate: 0.2,
    default: 0.17,
  },

  // Fração de carbono (CF)
  carbonFraction: 0.47,

  // Conversão C para CO2
  cToCO2: 44 / 12, // 3.666667
};

// Densidade da madeira por espécie/clone e idade (t/m³)
export interface WoodDensityByAge {
  age2: number;
  age7: number;
  intercept: number;
  slope: number;
}

export const WOOD_DENSITY: Record<string, WoodDensityByAge> = {
  EUGR: { age2: 0.3038, age7: 0.434, intercept: 0.25172, slope: 0.02604 },
  EURG: { age2: 0.3038, age7: 0.434, intercept: 0.25172, slope: 0.02604 },
  EUUG: {
    age2: 0.307048,
    age7: 0.43864,
    intercept: 0.254411,
    slope: 0.026318,
  },
  EUSA: {
    age2: 0.325607,
    age7: 0.465153,
    intercept: 0.269788,
    slope: 0.027909,
  },
  EUDU: {
    age2: 0.313515,
    age7: 0.447879,
    intercept: 0.25977,
    slope: 0.026873,
  },
  PITA: {
    age2: 0.308593,
    age7: 0.440847,
    intercept: 0.255691,
    slope: 0.026451,
  },
  PCVH: {
    age2: 0.308593,
    age7: 0.440847,
    intercept: 0.255691,
    slope: 0.026451,
  },
  PIMX: {
    age2: 0.308593,
    age7: 0.440847,
    intercept: 0.255691,
    slope: 0.026451,
  },
  DEFAULT_EUCALIPTO: {
    age2: 0.31,
    age7: 0.44,
    intercept: 0.26,
    slope: 0.026,
  },
  DEFAULT_PINUS: {
    age2: 0.31,
    age7: 0.44,
    intercept: 0.26,
    slope: 0.026,
  },
};

// Função para calcular densidade por idade
export function getWoodDensity(
  clone: string,
  age: number
): number {
  const densityData = WOOD_DENSITY[clone] || WOOD_DENSITY.DEFAULT_EUCALIPTO;
  return densityData.intercept + densityData.slope * age;
}

// Biomassa por hectare por idade para florestas plantadas (t m.s./ha)
export const BIOMASS_BY_AGE: Record<string, Record<number, number>> = {
  eucalipto: {
    1: 37.54,
    2: 55.56,
    3: 92.44,
    4: 120.9,
    5: 153.25,
    6: 177.6,
    7: 218.82,
    8: 394.92,
  },
  pinus: {
    1: 5.53,
    2: 15.3,
    3: 32.35,
    4: 54.49,
    5: 79.54,
    6: 98.95,
    7: 116.77,
    8: 132.99,
    9: 148.66,
    10: 162.89,
    15: 225.0,
    20: 280.0,
  },
};

// Estoque de carbono em vegetação nativa (tC/ha) por bioma e fisionomia
export const NATIVE_CARBON_STOCK: Record<string, Record<string, number>> = {
  Amazônia: {
    "Floresta Ombrófila Densa": 164.0,
    "Floresta Ombrófila Aberta": 131.5,
    "Floresta Estacional Semidecidual": 115.0,
    Default: 150.0,
  },
  Cerrado: {
    Savana: 51.63,
    "Savana Florestada": 103.21,
    "Savana Arborizada": 41.31,
    "Floresta Ombrófila Mista": 89.89,
    "Floresta Estacional Semidecidual": 95.0,
    Default: 60.0,
  },
  "Mata Atlântica": {
    "Floresta Ombrófila Densa": 135.0,
    "Floresta Ombrófila Mista": 81.3,
    "Floresta Estacional Decidual": 93.09,
    "Floresta Estacional Semidecidual": 100.0,
    Default: 100.0,
  },
  Caatinga: {
    Caatinga: 25.0,
    Default: 25.0,
  },
  Pantanal: {
    "Floresta Estacional": 85.0,
    Savana: 50.0,
    Default: 65.0,
  },
  Pampa: {
    Estepe: 20.0,
    "Floresta Estacional": 80.0,
    Default: 45.0,
  },
};

// Incremento anual de carbono (tC/ha/ano) por bioma
export const ANNUAL_INCREMENT: Record<
  string,
  { primaria: number; secundaria: number }
> = {
  Amazônia: { primaria: 0.48, secundaria: 4.97 },
  Cerrado: { primaria: 0.2, secundaria: 1.72 },
  "Mata Atlântica": { primaria: 0.32, secundaria: 1.66 },
  Caatinga: { primaria: 0.1, secundaria: 1.03 },
  Pantanal: { primaria: 0.2, secundaria: 2.77 },
  Pampa: { primaria: 0.32, secundaria: 1.76 },
};

// Função para obter estoque de carbono de vegetação nativa
export function getNativeCarbonStock(
  biome: string,
  physiognomy?: string
): number {
  const biomeData = NATIVE_CARBON_STOCK[biome];
  if (!biomeData) return 50; // Default if biome not found

  if (physiognomy && biomeData[physiognomy]) {
    return biomeData[physiognomy];
  }
  return biomeData.Default || 50;
}

// Função para calcular remoções anuais de vegetação nativa
export function calculateNativeRemovals(
  biome: string,
  area: number,
  isPrimary: boolean = false
): number {
  const increment = ANNUAL_INCREMENT[biome];
  if (!increment) return 0;

  const carbonIncrement = isPrimary
    ? increment.primaria
    : increment.secundaria;
  const co2Removals = area * carbonIncrement * FOREST_CONSTANTS.cToCO2;
  return -co2Removals; // Negativo porque é remoção
}
