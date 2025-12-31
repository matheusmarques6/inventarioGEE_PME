// =====================================================
// FATORES DE EMISSÃO - TRANSPORTE
// Fonte: DEFRA 2022, GHG Protocol Brasil
// =====================================================

// Fatores de emissão para transporte marítimo (kg CO2e / t.km)
export interface MaritimeEmissionFactor {
  co2: number;
  ch4: number;
  n2o: number;
}

export const MARITIME_FACTORS: Record<string, MaritimeEmissionFactor> = {
  "Navio porta containers - acima de 8.000 TEU": {
    co2: 0.0125,
    ch4: 0.000004,
    n2o: 0.000001,
  },
  "Navio porta containers - 5.000 a 7.999 TEU": {
    co2: 0.0166,
    ch4: 0.000005,
    n2o: 0.000001,
  },
  "Navio porta containers - 3.000 a 4.999 TEU": {
    co2: 0.0166,
    ch4: 0.000005,
    n2o: 0.000001,
  },
  "Navio porta containers - 2.000 a 2.999 TEU": {
    co2: 0.02,
    ch4: 0.000006,
    n2o: 0.000001,
  },
  "Navio porta containers - 1.000 a 1.999 TEU": {
    co2: 0.0321,
    ch4: 0.00001,
    n2o: 0.000001,
  },
  "Navio porta containers - 0 a 999 TEU": {
    co2: 0.0363,
    ch4: 0.000011,
    n2o: 0.000002,
  },
  "Navio porta containers - Média": {
    co2: 0.01592,
    ch4: 0.000005,
    n2o: 0.000001,
  },
  "Bulk Carrier - 10.000 a 34.999 dwt": {
    co2: 0.0203,
    ch4: 0.000006,
    n2o: 0.000001,
  },
  "Bulk Carrier - 35.000 a 59.999 dwt": {
    co2: 0.0122,
    ch4: 0.000004,
    n2o: 0.000001,
  },
  "Bulk Carrier - 60.000 a 99.999 dwt": {
    co2: 0.0089,
    ch4: 0.000003,
    n2o: 0.000001,
  },
  "Bulk Carrier - 100.000 a 199.999 dwt": {
    co2: 0.0057,
    ch4: 0.000002,
    n2o: 0,
  },
  "Bulk Carrier - acima de 200.000 dwt": {
    co2: 0.004,
    ch4: 0.000001,
    n2o: 0,
  },
  "Tanker - Produtos": {
    co2: 0.0175,
    ch4: 0.000005,
    n2o: 0.000001,
  },
  "Tanker - Químico": {
    co2: 0.0145,
    ch4: 0.000004,
    n2o: 0.000001,
  },
};

// Fatores de emissão para viagens aéreas (kg / passageiro.km)
export const AIR_TRAVEL_FACTORS: Record<
  string,
  { co2: number; ch4: number; n2o: number }
> = {
  "Curta distância (≤ 500 km)": {
    co2: 0.119176,
    ch4: 0.000003,
    n2o: 0.000004,
  },
  "Média distância (500-3700 km)": {
    co2: 0.074444,
    ch4: 0,
    n2o: 0.000003,
  },
  "Longa distância (> 3700 km)": {
    co2: 0.09362,
    ch4: 0,
    n2o: 0.000003,
  },
};

// Distâncias aproximadas entre aeroportos brasileiros (km)
export const AIRPORT_DISTANCES: Record<string, Record<string, number>> = {
  GRU: {
    // São Paulo Guarulhos
    GIG: 360,
    BSB: 870,
    SSA: 1450,
    REC: 2100,
    FOR: 2380,
    BEL: 2520,
    MAO: 2800,
    POA: 850,
    CWB: 330,
    BHZ: 530,
  },
  GIG: {
    // Rio de Janeiro
    BSB: 930,
    SSA: 1190,
    REC: 1860,
    FOR: 2130,
    BEL: 2580,
    MAO: 2860,
    POA: 1110,
    CWB: 680,
    BHZ: 340,
  },
  // Adicionar mais conforme necessário
};

// Função para classificar distância de voo
export function getFlightDistanceCategory(
  distanceKm: number
): "Curta distância (≤ 500 km)" | "Média distância (500-3700 km)" | "Longa distância (> 3700 km)" {
  if (distanceKm <= 500) {
    return "Curta distância (≤ 500 km)";
  } else if (distanceKm <= 3700) {
    return "Média distância (500-3700 km)";
  }
  return "Longa distância (> 3700 km)";
}

// Função para calcular emissões de viagem aérea
export function calculateAirTravelEmissions(
  distanceKm: number,
  numberOfTrips: number = 1,
  gwpCh4: number = 28,
  gwpN2o: number = 265
): { co2: number; ch4: number; n2o: number; co2e: number } {
  const category = getFlightDistanceCategory(distanceKm);
  const factors = AIR_TRAVEL_FACTORS[category];

  // Total de passageiro.km
  const totalPkm = distanceKm * numberOfTrips;

  // Emissões em kg
  const co2Kg = totalPkm * factors.co2;
  const ch4Kg = totalPkm * factors.ch4;
  const n2oKg = totalPkm * factors.n2o;

  // Converter para toneladas
  const co2 = co2Kg / 1000;
  const ch4 = ch4Kg / 1000;
  const n2o = n2oKg / 1000;
  const co2e = co2 + ch4 * gwpCh4 + n2o * gwpN2o;

  return { co2, ch4, n2o, co2e };
}

// Função para calcular emissões de transporte marítimo
export function calculateMaritimeEmissions(
  distanceKm: number,
  cargoTonnes: number,
  vesselType: string,
  gwpCh4: number = 28,
  gwpN2o: number = 265
): { co2: number; ch4: number; n2o: number; co2e: number } {
  const factors =
    MARITIME_FACTORS[vesselType] ||
    MARITIME_FACTORS["Navio porta containers - Média"];

  // Total de t.km
  const totalTkm = distanceKm * cargoTonnes;

  // Emissões em kg
  const co2Kg = totalTkm * factors.co2;
  const ch4Kg = totalTkm * factors.ch4;
  const n2oKg = totalTkm * factors.n2o;

  // Converter para toneladas
  const co2 = co2Kg / 1000;
  const ch4 = ch4Kg / 1000;
  const n2o = n2oKg / 1000;
  const co2e = co2 + ch4 * gwpCh4 + n2o * gwpN2o;

  return { co2, ch4, n2o, co2e };
}

// Lista de tipos de navios disponíveis
export function getVesselTypes(): string[] {
  return Object.keys(MARITIME_FACTORS);
}
