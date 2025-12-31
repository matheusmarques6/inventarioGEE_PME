// =====================================================
// FATORES DE EMISSÃO - INCÊNDIOS FLORESTAIS
// Fonte: IPCC 2006
// =====================================================

// Fatores de emissão (g GEE / kg biomassa queimada)
export const FIRE_EMISSION_FACTORS = {
  CO2: 1580,
  CH4: 6.8,
  N2O: 0.2,
};

// Fator de combustão por tipo de floresta e severidade
export const COMBUSTION_FACTORS: Record<
  string,
  Record<string, number>
> = {
  // Vegetação nativa
  nativa: {
    rasteiro: 0.2275,
    copa: 0.455,
    default: 0.3,
  },
  // Floresta plantada
  plantada: {
    rasteiro: 0.315,
    copa: 0.63,
    default: 0.4,
  },
};

// Biomassa aérea por idade para floresta plantada (t m.s./ha)
export const PLANTED_FOREST_BIOMASS: Record<string, Record<number, number>> = {
  eucalipto: {
    1: 37.54,
    2: 55.56,
    3: 92.44,
    4: 120.9,
    5: 153.25,
    6: 177.6,
    7: 218.82,
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
  },
};

// Biomassa por bioma para vegetação nativa (t m.s./ha)
export const NATIVE_BIOMASS: Record<string, number> = {
  Amazônia: 300,
  Cerrado: 70,
  "Mata Atlântica": 200,
  Caatinga: 45,
  Pantanal: 100,
  Pampa: 50,
};

export interface FireEmissionResult {
  co2: number; // tCO2
  ch4: number; // tCH4
  n2o: number; // tN2O
  co2e: number; // tCO2e
  biogenic: boolean;
}

// Função para calcular emissões de incêndio
export function calculateFireEmissions(
  area: number, // hectares
  biomassPerHa: number, // t m.s./ha
  combustionFactor: number,
  gwpCh4: number = 28,
  gwpN2o: number = 265
): FireEmissionResult {
  // Biomassa queimada (kg)
  const burnedBiomass = area * biomassPerHa * combustionFactor * 1000;

  // Emissões (kg)
  const co2Kg = burnedBiomass * (FIRE_EMISSION_FACTORS.CO2 / 1000);
  const ch4Kg = burnedBiomass * (FIRE_EMISSION_FACTORS.CH4 / 1000);
  const n2oKg = burnedBiomass * (FIRE_EMISSION_FACTORS.N2O / 1000);

  // Converter para toneladas
  const co2 = co2Kg / 1000;
  const ch4 = ch4Kg / 1000;
  const n2o = n2oKg / 1000;

  // CO2 equivalente
  const co2e = co2 + ch4 * gwpCh4 + n2o * gwpN2o;

  return {
    co2,
    ch4,
    n2o,
    co2e,
    biogenic: true, // Emissões de incêndio são biogênicas
  };
}

// Função para obter biomassa de floresta plantada
export function getPlantedForestBiomass(
  species: string,
  age: number
): number {
  const speciesKey = species.toLowerCase().includes("pinus")
    ? "pinus"
    : "eucalipto";
  const biomassData = PLANTED_FOREST_BIOMASS[speciesKey];

  if (!biomassData) return 100; // Default

  // Encontrar idade mais próxima
  const ages = Object.keys(biomassData).map(Number);
  const closestAge = ages.reduce((prev, curr) =>
    Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
  );

  return biomassData[closestAge] || 100;
}

// Função para obter fator de combustão
export function getCombustionFactor(
  forestType: "nativa" | "plantada",
  severity: "rasteiro" | "copa" | "default" = "default"
): number {
  return COMBUSTION_FACTORS[forestType]?.[severity] || 0.3;
}
