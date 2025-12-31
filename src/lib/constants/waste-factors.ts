// =====================================================
// FATORES DE EMISSÃO - RESÍDUOS E EFLUENTES
// Fonte: IPCC 2006
// =====================================================

// Fatores de emissão para resíduos em aterro (kg CH4 / kg resíduo)
// Considerando decaimento de primeira ordem no ano do inventário
export const LANDFILL_FACTORS: Record<string, number> = {
  "Papéis / Papelão": 0.00352,
  "Resíduos têxteis": 0.002112,
  "Resíduos alimentícios": 0.002445,
  Madeira: 0.002123,
  "Resíduos de jardim e parque": 0.002517,
  Higiênicos: 0.003021,
  "Borracha e couro": 0.004909,
  Plástico: 0,
  Metal: 0,
  Vidro: 0,
  "Resíduos de construção e demolição": 0,
  "Outros inertes": 0,
  Lodo: 0.000815,
};

// Fatores de emissão para incineração (kg GEE / kg resíduo)
export interface IncinerationFactor {
  co2Fossil: number;
  co2Bio: number;
  ch4: number;
  n2o: number;
}

export const INCINERATION_FACTORS: Record<string, IncinerationFactor> = {
  "Papéis / Papelão": {
    co2Fossil: 0.01518,
    co2Bio: 1.50282,
    ch4: 0.000098,
    n2o: 0.00001,
  },
  "Resíduos têxteis": {
    co2Fossil: 0.293333,
    co2Bio: 1.173333,
    ch4: 0.000098,
    n2o: 0.000285,
  },
  "Resíduos alimentícios": {
    co2Fossil: 0,
    co2Bio: 0.557333,
    ch4: 0.000098,
    n2o: 0.000285,
  },
  Madeira: {
    co2Fossil: 0,
    co2Bio: 1.558333,
    ch4: 0.000098,
    n2o: 0.000285,
  },
  Higiênicos: {
    co2Fossil: 0.102667,
    co2Bio: 0.924,
    ch4: 0.000098,
    n2o: 0.000285,
  },
  "Borracha e couro": {
    co2Fossil: 0.41272,
    co2Bio: 1.65088,
    ch4: 0.000098,
    n2o: 0.000285,
  },
  Plástico: {
    co2Fossil: 2.75,
    co2Bio: 0,
    ch4: 0.000098,
    n2o: 0.00017,
  },
  "Outros inertes": {
    co2Fossil: 0.099,
    co2Bio: 0,
    ch4: 0.000098,
    n2o: 0.000285,
  },
};

// Fatores de emissão para tratamento biológico (kg GEE / kg resíduo - base úmida)
export const BIOLOGICAL_TREATMENT_FACTORS: Record<
  string,
  { ch4: number; n2o: number }
> = {
  Compostagem: { ch4: 0.004, n2o: 0.0003 },
  "Digestão anaeróbia em instalações de biogás": { ch4: 0.001, n2o: 0 },
};

// Fator de correção de metano (MCF) por tipo de tratamento de efluentes
export const MCF_FACTORS: Record<string, number> = {
  "Digestor anaeróbio": 0.8,
  "Digestor anaeróbio/ Lodo ativado": 0.52,
  "Fossa séptica": 0.5,
  "Fossas secas": 0.1,
  "Lagoa anaeróbia": 0.8,
  "Lagoa de maturação": 0.5,
  "Lagoa facultativa": 0.2,
  "Lagoa mista": 0.2,
  "Lançamento em cursos d'água com coleta": 0.11,
  "Lançamento em cursos d'água sem coleta": 0.11,
  "Lodo ativado": 0.1,
  "Reator anaeróbio": 0.8,
  "Tratamento aeróbio centralizado": 0,
  "Reator UASB": 0.8,
};

// Capacidade máxima de produção de CH4 (Bo)
export const CH4_CAPACITY: Record<string, number> = {
  DBO: 0.6, // kg CH4 / kg DBO
  DQO: 0.25, // kg CH4 / kg DQO
};

// Função para calcular emissões de aterro
export function calculateLandfillEmissions(
  wasteType: string,
  quantity: number, // kg
  gwpCh4: number = 28
): { ch4: number; co2e: number } {
  const factor = LANDFILL_FACTORS[wasteType] || 0;
  const ch4Kg = quantity * factor;
  const ch4 = ch4Kg / 1000; // toneladas
  const co2e = ch4 * gwpCh4;

  return { ch4, co2e };
}

// Função para calcular emissões de incineração
export function calculateIncinerationEmissions(
  wasteType: string,
  quantity: number, // kg
  gwpCh4: number = 28,
  gwpN2o: number = 265
): {
  co2Fossil: number;
  co2Bio: number;
  ch4: number;
  n2o: number;
  co2e: number;
} {
  const factors = INCINERATION_FACTORS[wasteType] || {
    co2Fossil: 0,
    co2Bio: 0,
    ch4: 0,
    n2o: 0,
  };

  const co2Fossil = (quantity * factors.co2Fossil) / 1000;
  const co2Bio = (quantity * factors.co2Bio) / 1000;
  const ch4 = (quantity * factors.ch4) / 1000;
  const n2o = (quantity * factors.n2o) / 1000;

  // CO2e não inclui biogênico
  const co2e = co2Fossil + ch4 * gwpCh4 + n2o * gwpN2o;

  return { co2Fossil, co2Bio, ch4, n2o, co2e };
}

// Função para calcular emissões de efluentes
export function calculateEffluentEmissions(
  dbdInput: number, // kg DBO de entrada
  dbdOutput: number, // kg DBO de saída
  treatmentType: string,
  gwpCh4: number = 28
): { ch4: number; co2e: number } {
  const mcf = MCF_FACTORS[treatmentType] || 0.2;
  const bo = CH4_CAPACITY.DBO;

  const dbdRemoved = dbdInput - dbdOutput;
  const ch4Kg = dbdRemoved * bo * mcf;
  const ch4 = ch4Kg / 1000; // toneladas
  const co2e = ch4 * gwpCh4;

  return { ch4, co2e };
}

// Lista de tipos de resíduos para aterro
export function getLandfillWasteTypes(): string[] {
  return Object.keys(LANDFILL_FACTORS);
}

// Lista de tipos de tratamento de efluentes
export function getEffluentTreatmentTypes(): string[] {
  return Object.keys(MCF_FACTORS);
}
