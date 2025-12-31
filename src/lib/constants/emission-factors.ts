// =====================================================
// FATORES DE EMISSÃO - COMBUSTÃO
// Fonte: IPCC 2006, BEN 2022, MCTI
// =====================================================

export interface CombustionFactor {
  name: string;
  co2: number; // ton CO2/GJ
  ch4: number; // ton CH4/GJ
  n2o: number; // ton N2O/GJ
  energyContent: number; // GJ por unidade (m³, L, kg)
  unit: string;
  density?: number; // kg por unidade (L, m³)
  renewable: boolean;
  source: string;
}

// Fatores de emissão para combustão estacionária
export const STATIONARY_COMBUSTION_FACTORS: Record<string, CombustionFactor> = {
  "Gás Natural": {
    name: "Gás Natural",
    co2: 0.0561,
    ch4: 0.000001,
    n2o: 0,
    energyContent: 0.04158,
    unit: "m³",
    renewable: false,
    source: "IPCC 2006",
  },
  GLP: {
    name: "GLP",
    co2: 0.0631,
    ch4: 0.000001,
    n2o: 0,
    energyContent: 25.58,
    unit: "m³",
    density: 552,
    renewable: false,
    source: "IPCC 2006",
  },
  "Óleo Diesel": {
    name: "Óleo Diesel",
    co2: 0.0741,
    ch4: 0.000003,
    n2o: 0.000001,
    energyContent: 35.5,
    unit: "m³",
    density: 840,
    renewable: false,
    source: "IPCC 2006",
  },
  "Gasolina Automotiva": {
    name: "Gasolina Automotiva",
    co2: 0.0693,
    ch4: 0.000003,
    n2o: 0.000001,
    energyContent: 32.24,
    unit: "m³",
    density: 742,
    renewable: false,
    source: "IPCC 2006",
  },
  "Álcool Etílico Anidro": {
    name: "Álcool Etílico Anidro",
    co2: 0.0796,
    ch4: 0.000003,
    n2o: 0.000001,
    energyContent: 22.36,
    unit: "m³",
    density: 791,
    renewable: true,
    source: "IPCC 2006",
  },
  "Álcool Etílico Hidratado": {
    name: "Álcool Etílico Hidratado",
    co2: 0.0796,
    ch4: 0.000003,
    n2o: 0.000001,
    energyContent: 21.35,
    unit: "m³",
    density: 809,
    renewable: true,
    source: "IPCC 2006",
  },
  Biodiesel: {
    name: "Biodiesel",
    co2: 0.0708,
    ch4: 0.000003,
    n2o: 0.000001,
    energyContent: 33.14,
    unit: "m³",
    density: 880,
    renewable: true,
    source: "IPCC 2006",
  },
  Biomassa: {
    name: "Biomassa",
    co2: 0.1,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 5.06,
    unit: "m³",
    renewable: true,
    source: "IPCC 2006",
  },
  "Óleo Combustível": {
    name: "Óleo Combustível",
    co2: 0.0774,
    ch4: 0.000003,
    n2o: 0.000001,
    energyContent: 40.87,
    unit: "m³",
    density: 980,
    renewable: false,
    source: "IPCC 2006",
  },
  "Querosene de Aviação": {
    name: "Querosene de Aviação",
    co2: 0.0715,
    ch4: 0.000003,
    n2o: 0.000001,
    energyContent: 33.1,
    unit: "m³",
    density: 799,
    renewable: false,
    source: "IPCC 2006",
  },
  "Coque de Petróleo": {
    name: "Coque de Petróleo",
    co2: 0.0973,
    ch4: 0.000003,
    n2o: 0.000001,
    energyContent: 32.4,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Carvão Mineral": {
    name: "Carvão Mineral",
    co2: 0.0947,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 24.3,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Lenha": {
    name: "Lenha",
    co2: 0.112,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 12.65,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  "Carvão Vegetal": {
    name: "Carvão Vegetal",
    co2: 0.112,
    ch4: 0.0002,
    n2o: 0.000001,
    energyContent: 29.93,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  "Bagaço de Cana": {
    name: "Bagaço de Cana",
    co2: 0.1,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 7.2,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
};

// Fatores de emissão para combustão móvel
export const MOBILE_COMBUSTION_FACTORS: Record<string, CombustionFactor> = {
  "Gasolina Automotiva": {
    name: "Gasolina Automotiva",
    co2: 0.0693,
    ch4: 0.000004,
    n2o: 0.000006,
    energyContent: 32.24,
    unit: "m³",
    density: 742,
    renewable: false,
    source: "IPCC 2006",
  },
  "Óleo Diesel": {
    name: "Óleo Diesel",
    co2: 0.0741,
    ch4: 0.000004,
    n2o: 0.000004,
    energyContent: 35.5,
    unit: "m³",
    density: 840,
    renewable: false,
    source: "IPCC 2006",
  },
  "Álcool Etílico Hidratado": {
    name: "Álcool Etílico Hidratado",
    co2: 0.0796,
    ch4: 0.000018,
    n2o: 0.000001,
    energyContent: 21.35,
    unit: "m³",
    density: 809,
    renewable: true,
    source: "IPCC 2006",
  },
  GLP: {
    name: "GLP",
    co2: 0.0631,
    ch4: 0.000062,
    n2o: 0,
    energyContent: 25.58,
    unit: "m³",
    density: 552,
    renewable: false,
    source: "IPCC 2006",
  },
  GNV: {
    name: "GNV",
    co2: 0.0561,
    ch4: 0.000092,
    n2o: 0.000003,
    energyContent: 0.04158,
    unit: "m³",
    renewable: false,
    source: "IPCC 2006",
  },
};

// Eficiência de veículos (km/L)
export const VEHICLE_EFFICIENCY: Record<string, number> = {
  "Caminhão semileve a diesel": 8.69,
  "Caminhão leve a diesel": 6.08,
  "Caminhão médio a diesel": 4.13,
  "Caminhão semipesado a diesel": 3.69,
  "Caminhão pesado a diesel": 2.5,
  "Micro-ônibus a diesel": 3.8,
  "Ônibus urbano a diesel": 2.3,
  "Ônibus rodoviário a diesel": 3.03,
  "Veículo comercial leve a diesel": 9.1,
  "Veículo comercial leve a gasolina": 10.2,
  "Veículo comercial leve a etanol": 8.3,
  "Automóvel a gasolina": 11.5,
  "Automóvel a etanol": 8.1,
  "Automóvel flex a gasolina": 11.2,
  "Automóvel flex a etanol": 7.7,
  "Motocicleta a gasolina": 37.2,
  "Motocicleta flex a gasolina": 43.2,
  "Motocicleta flex a etanol": 29.3,
};

// Função para obter fator de emissão
export function getEmissionFactor(
  fuelType: string,
  combustionType: "stationary" | "mobile" = "stationary"
): CombustionFactor | undefined {
  const factors =
    combustionType === "stationary"
      ? STATIONARY_COMBUSTION_FACTORS
      : MOBILE_COMBUSTION_FACTORS;
  return factors[fuelType];
}

// Lista de todos os combustíveis disponíveis
export function getAllFuels(): string[] {
  return [
    ...new Set([
      ...Object.keys(STATIONARY_COMBUSTION_FACTORS),
      ...Object.keys(MOBILE_COMBUSTION_FACTORS),
    ]),
  ];
}
