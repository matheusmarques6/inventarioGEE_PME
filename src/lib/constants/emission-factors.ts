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
// Fonte: IPCC 2006 Guidelines for National Greenhouse Gas Inventories
// Volume 2: Energy, Chapter 2: Stationary Combustion
export const STATIONARY_COMBUSTION_FACTORS: Record<string, CombustionFactor> = {
  // ========== COMBUSTÍVEIS GASOSOS ==========
  "Gás Natural": {
    name: "Gás Natural",
    co2: 0.0561,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 0.04158,
    unit: "m³",
    renewable: false,
    source: "IPCC 2006",
  },
  "Gás de Refinaria": {
    name: "Gás de Refinaria",
    co2: 0.0573,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 0.049,
    unit: "m³",
    renewable: false,
    source: "IPCC 2006",
  },
  "Gás de Coqueria": {
    name: "Gás de Coqueria",
    co2: 0.0441,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 0.0387,
    unit: "m³",
    renewable: false,
    source: "IPCC 2006",
  },
  "Gás de Alto-Forno": {
    name: "Gás de Alto-Forno",
    co2: 0.26,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 0.00247,
    unit: "m³",
    renewable: false,
    source: "IPCC 2006",
  },

  // ========== GLP E DERIVADOS ==========
  GLP: {
    name: "GLP",
    co2: 0.0631,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 25.58,
    unit: "m³",
    density: 552,
    renewable: false,
    source: "IPCC 2006",
  },
  Propano: {
    name: "Propano",
    co2: 0.0631,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 25.3,
    unit: "m³",
    density: 508,
    renewable: false,
    source: "IPCC 2006",
  },
  Butano: {
    name: "Butano",
    co2: 0.0631,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 27.1,
    unit: "m³",
    density: 584,
    renewable: false,
    source: "IPCC 2006",
  },
  Etano: {
    name: "Etano",
    co2: 0.0617,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 16.89,
    unit: "m³",
    density: 356,
    renewable: false,
    source: "IPCC 2006",
  },

  // ========== COMBUSTÍVEIS LÍQUIDOS - PETRÓLEO ==========
  "Petróleo Bruto": {
    name: "Petróleo Bruto",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 36.16,
    unit: "m³",
    density: 850,
    renewable: false,
    source: "IPCC 2006",
  },
  "Óleo Diesel": {
    name: "Óleo Diesel",
    co2: 0.0741,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 35.5,
    unit: "m³",
    density: 840,
    renewable: false,
    source: "IPCC 2006",
  },
  "Óleo Combustível": {
    name: "Óleo Combustível",
    co2: 0.0774,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 40.87,
    unit: "m³",
    density: 980,
    renewable: false,
    source: "IPCC 2006",
  },
  "Óleo Combustível Leve": {
    name: "Óleo Combustível Leve",
    co2: 0.0774,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 38.1,
    unit: "m³",
    density: 920,
    renewable: false,
    source: "IPCC 2006",
  },
  "Óleo Combustível Pesado": {
    name: "Óleo Combustível Pesado",
    co2: 0.0774,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 41.73,
    unit: "m³",
    density: 1010,
    renewable: false,
    source: "IPCC 2006",
  },
  "Óleo de Xisto": {
    name: "Óleo de Xisto",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 38.1,
    unit: "m³",
    density: 870,
    renewable: false,
    source: "IPCC 2006",
  },
  Orimulsão: {
    name: "Orimulsão",
    co2: 0.0774,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 27.5,
    unit: "m³",
    density: 1000,
    renewable: false,
    source: "IPCC 2006",
  },
  "Gasolina Automotiva": {
    name: "Gasolina Automotiva",
    co2: 0.0693,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 32.24,
    unit: "m³",
    density: 742,
    renewable: false,
    source: "IPCC 2006",
  },
  "Gasolina de Aviação": {
    name: "Gasolina de Aviação",
    co2: 0.07,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 33.29,
    unit: "m³",
    density: 715,
    renewable: false,
    source: "IPCC 2006",
  },
  "Querosene de Aviação": {
    name: "Querosene de Aviação",
    co2: 0.0715,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 33.1,
    unit: "m³",
    density: 799,
    renewable: false,
    source: "IPCC 2006",
  },
  "Querosene Iluminante": {
    name: "Querosene Iluminante",
    co2: 0.0719,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 34.0,
    unit: "m³",
    density: 780,
    renewable: false,
    source: "IPCC 2006",
  },
  Nafta: {
    name: "Nafta",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 31.4,
    unit: "m³",
    density: 725,
    renewable: false,
    source: "IPCC 2006",
  },
  "Nafta Petroquímica": {
    name: "Nafta Petroquímica",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 31.4,
    unit: "m³",
    density: 725,
    renewable: false,
    source: "IPCC 2006",
  },
  Lubrificantes: {
    name: "Lubrificantes",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 40.2,
    unit: "m³",
    density: 885,
    renewable: false,
    source: "IPCC 2006",
  },
  Asfalto: {
    name: "Asfalto",
    co2: 0.0807,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 41.9,
    unit: "m³",
    density: 1050,
    renewable: false,
    source: "IPCC 2006",
  },
  Solventes: {
    name: "Solventes",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 31.4,
    unit: "m³",
    density: 770,
    renewable: false,
    source: "IPCC 2006",
  },
  Parafinas: {
    name: "Parafinas",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 42.3,
    unit: "m³",
    density: 900,
    renewable: false,
    source: "IPCC 2006",
  },

  // ========== COMBUSTÍVEIS LÍQUIDOS - BIOCOMBUSTÍVEIS ==========
  "Álcool Etílico Anidro": {
    name: "Álcool Etílico Anidro",
    co2: 0.0796,
    ch4: 0.000003,
    n2o: 0.0000006,
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
    n2o: 0.0000006,
    energyContent: 21.35,
    unit: "m³",
    density: 809,
    renewable: true,
    source: "IPCC 2006",
  },
  Etanol: {
    name: "Etanol",
    co2: 0.0796,
    ch4: 0.000003,
    n2o: 0.0000006,
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
    n2o: 0.0000006,
    energyContent: 33.14,
    unit: "m³",
    density: 880,
    renewable: true,
    source: "IPCC 2006",
  },
  "Óleo Vegetal": {
    name: "Óleo Vegetal",
    co2: 0.0708,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 36.0,
    unit: "m³",
    density: 920,
    renewable: true,
    source: "IPCC 2006",
  },
  Metanol: {
    name: "Metanol",
    co2: 0.0631,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 15.8,
    unit: "m³",
    density: 792,
    renewable: false,
    source: "IPCC 2006",
  },

  // ========== COMBUSTÍVEIS SÓLIDOS - CARVÃO ==========
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
  Antracito: {
    name: "Antracito",
    co2: 0.0984,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 26.7,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Carvão Betuminoso": {
    name: "Carvão Betuminoso",
    co2: 0.0947,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 25.8,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Carvão Sub-Betuminoso": {
    name: "Carvão Sub-Betuminoso",
    co2: 0.0961,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 18.9,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Carvão Metalúrgico": {
    name: "Carvão Metalúrgico",
    co2: 0.094,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 28.2,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  Linhito: {
    name: "Linhito",
    co2: 0.101,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 9.8,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Xisto Betuminoso": {
    name: "Xisto Betuminoso",
    co2: 0.1067,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 8.9,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  Turfa: {
    name: "Turfa",
    co2: 0.106,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 9.76,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Coque de Carvão": {
    name: "Coque de Carvão",
    co2: 0.107,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 28.2,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Coque de Petróleo": {
    name: "Coque de Petróleo",
    co2: 0.0973,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 32.4,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },

  // ========== COMBUSTÍVEIS SÓLIDOS - BIOMASSA ==========
  Biomassa: {
    name: "Biomassa",
    co2: 0.1,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 15.6,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  Lenha: {
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
  "Resíduos de Madeira": {
    name: "Resíduos de Madeira",
    co2: 0.112,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 15.6,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  "Casca de Arroz": {
    name: "Casca de Arroz",
    co2: 0.1,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 13.8,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  "Palha de Milho": {
    name: "Palha de Milho",
    co2: 0.1,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 14.0,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  "Palha de Trigo": {
    name: "Palha de Trigo",
    co2: 0.1,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 14.5,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  "Cavaco de Madeira": {
    name: "Cavaco de Madeira",
    co2: 0.112,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 15.0,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  Pellets: {
    name: "Pellets",
    co2: 0.112,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 17.0,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  Briquetes: {
    name: "Briquetes",
    co2: 0.112,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 17.5,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },
  Licor: {
    name: "Licor Negro",
    co2: 0.095,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 11.8,
    unit: "t",
    renewable: true,
    source: "IPCC 2006",
  },

  // ========== RESÍDUOS E OUTROS ==========
  "Resíduos Industriais": {
    name: "Resíduos Industriais",
    co2: 0.143,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 15.0,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Resíduos Sólidos Urbanos": {
    name: "Resíduos Sólidos Urbanos",
    co2: 0.091,
    ch4: 0.0003,
    n2o: 0.000004,
    energyContent: 10.0,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Óleos Usados": {
    name: "Óleos Usados",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 40.2,
    unit: "m³",
    density: 900,
    renewable: false,
    source: "IPCC 2006",
  },
  "Pneus Usados": {
    name: "Pneus Usados",
    co2: 0.085,
    ch4: 0.00001,
    n2o: 0.0000015,
    energyContent: 32.0,
    unit: "t",
    renewable: false,
    source: "IPCC 2006",
  },
  "Biogás": {
    name: "Biogás",
    co2: 0.0548,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 0.0228,
    unit: "m³",
    renewable: true,
    source: "IPCC 2006",
  },
  "Gás de Aterro": {
    name: "Gás de Aterro",
    co2: 0.0548,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 0.0168,
    unit: "m³",
    renewable: true,
    source: "IPCC 2006",
  },

  // ========== COMBUSTÍVEIS ESPECIAIS / INDUSTRIAIS ==========
  Oxidante: {
    name: "Oxidante",
    co2: 0.0733,
    ch4: 0.000003,
    n2o: 0.0000006,
    energyContent: 35.0,
    unit: "m³",
    density: 850,
    renewable: false,
    source: "IPCC 2006",
  },
  "Gás de Síntese": {
    name: "Gás de Síntese",
    co2: 0.0561,
    ch4: 0.000001,
    n2o: 0.0000001,
    energyContent: 0.01,
    unit: "m³",
    renewable: false,
    source: "IPCC 2006",
  },
  Hidrogênio: {
    name: "Hidrogênio",
    co2: 0,
    ch4: 0,
    n2o: 0,
    energyContent: 0.01079,
    unit: "m³",
    renewable: false,
    source: "IPCC 2006",
  },
};

// Mapa de aliases para variações de nomes de combustíveis
// Permite reconhecer variações comuns e mapear para o nome padrão
export const FUEL_ALIASES: Record<string, string> = {
  // Variações em inglês
  "natural gas": "Gás Natural",
  "lpg": "GLP",
  "diesel": "Óleo Diesel",
  "diesel oil": "Óleo Diesel",
  "gasoline": "Gasolina Automotiva",
  "petrol": "Gasolina Automotiva",
  "fuel oil": "Óleo Combustível",
  "heavy fuel oil": "Óleo Combustível Pesado",
  "light fuel oil": "Óleo Combustível Leve",
  "shale oil": "Óleo de Xisto",
  "kerosene": "Querosene Iluminante",
  "jet fuel": "Querosene de Aviação",
  "coal": "Carvão Mineral",
  "charcoal": "Carvão Vegetal",
  "wood": "Lenha",
  "firewood": "Lenha",
  "biomass": "Biomassa",
  "bagasse": "Bagaço de Cana",
  "ethanol": "Etanol",
  "biodiesel": "Biodiesel",
  "biogas": "Biogás",
  "hydrogen": "Hidrogênio",
  "propane": "Propano",
  "butane": "Butano",
  "naphtha": "Nafta",
  "coke": "Coque de Petróleo",
  "petroleum coke": "Coque de Petróleo",
  "peat": "Turfa",
  "lignite": "Linhito",
  "anthracite": "Antracito",
  "oxidizer": "Oxidante",
  "oxidyzer": "Oxidante",

  // Variações em português
  "gas natural": "Gás Natural",
  "gás liquefeito de petróleo": "GLP",
  "diesel s10": "Óleo Diesel",
  "diesel s500": "Óleo Diesel",
  "óleo diesel s10": "Óleo Diesel",
  "óleo diesel s500": "Óleo Diesel",
  "oleo diesel": "Óleo Diesel",
  "oleo combustivel": "Óleo Combustível",
  "oleo combustivel leve": "Óleo Combustível Leve",
  "oleo combustivel pesado": "Óleo Combustível Pesado",
  "oleo de xisto": "Óleo de Xisto",
  "xisto": "Óleo de Xisto",
  "gasolina": "Gasolina Automotiva",
  "gasolina comum": "Gasolina Automotiva",
  "gasolina aditivada": "Gasolina Automotiva",
  "etanol hidratado": "Álcool Etílico Hidratado",
  "etanol anidro": "Álcool Etílico Anidro",
  "alcool": "Álcool Etílico Hidratado",
  "álcool": "Álcool Etílico Hidratado",
  "querosene": "Querosene Iluminante",
  "qav": "Querosene de Aviação",
  "carvao mineral": "Carvão Mineral",
  "carvao vegetal": "Carvão Vegetal",
  "carvao": "Carvão Mineral",
  "carvão": "Carvão Mineral",
  "madeira": "Lenha",
  "bagaco de cana": "Bagaço de Cana",
  "bagaco": "Bagaço de Cana",
  "cavaco": "Cavaco de Madeira",
  "residuos de madeira": "Resíduos de Madeira",
  "serragem": "Resíduos de Madeira",
  "palha": "Biomassa",
  "casca de arroz": "Casca de Arroz",
  "gas de refinaria": "Gás de Refinaria",
  "gas de coqueria": "Gás de Coqueria",
  "gas de alto forno": "Gás de Alto-Forno",
  "gas de alto-forno": "Gás de Alto-Forno",
  "coque de carvao": "Coque de Carvão",
  "coque": "Coque de Petróleo",
  "oleo vegetal": "Óleo Vegetal",
  "oleos usados": "Óleos Usados",
  "oleo usado": "Óleos Usados",
  "pneu": "Pneus Usados",
  "pneus": "Pneus Usados",
  "rsu": "Resíduos Sólidos Urbanos",
  "lixo": "Resíduos Sólidos Urbanos",
  "residuos solidos": "Resíduos Sólidos Urbanos",
  "biometano": "Biogás",
  "licor negro": "Licor",
  "gas de aterro": "Gás de Aterro",
  "oxidante": "Oxidante",
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

// Função auxiliar para normalizar texto (remover acentos, lowercase)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Função para encontrar o nome padrão do combustível
export function findFuelName(input: string): string | undefined {
  const inputNorm = normalizeText(input);

  // 1. Verificar alias exato
  if (FUEL_ALIASES[inputNorm]) {
    return FUEL_ALIASES[inputNorm];
  }

  // 2. Verificar nome direto nos fatores de emissão
  const allFuels = Object.keys(STATIONARY_COMBUSTION_FACTORS);
  const exactMatch = allFuels.find(
    (fuel) => normalizeText(fuel) === inputNorm
  );
  if (exactMatch) return exactMatch;

  // 3. Verificar correspondência parcial
  const partialMatch = allFuels.find((fuel) => {
    const fuelNorm = normalizeText(fuel);
    return fuelNorm.includes(inputNorm) || inputNorm.includes(fuelNorm);
  });
  if (partialMatch) return partialMatch;

  // 4. Verificar aliases com correspondência parcial
  for (const [alias, standardName] of Object.entries(FUEL_ALIASES)) {
    if (alias.includes(inputNorm) || inputNorm.includes(alias)) {
      return standardName;
    }
  }

  return undefined;
}

// Função para obter fator de emissão (com suporte a aliases e fuzzy matching)
export function getEmissionFactor(
  fuelType: string,
  combustionType: "stationary" | "mobile" = "stationary"
): CombustionFactor | undefined {
  const factors =
    combustionType === "stationary"
      ? STATIONARY_COMBUSTION_FACTORS
      : MOBILE_COMBUSTION_FACTORS;

  // Tentar encontrar diretamente
  if (factors[fuelType]) {
    return factors[fuelType];
  }

  // Tentar encontrar usando o sistema de aliases
  const standardName = findFuelName(fuelType);
  if (standardName && factors[standardName]) {
    return factors[standardName];
  }

  return undefined;
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
