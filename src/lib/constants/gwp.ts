// =====================================================
// POTENCIAIS DE AQUECIMENTO GLOBAL (GWP)
// Fonte: IPCC AR4, AR5, AR6
// =====================================================

export type GWPReference = "AR4" | "AR5" | "AR6";

export interface GWPValues {
  AR4: number;
  AR5: number;
  AR6: number;
}

export const GWP_KYOTO: Record<string, GWPValues> = {
  // Gases principais
  CO2: { AR4: 1, AR5: 1, AR6: 1 },
  CH4: { AR4: 25, AR5: 28, AR6: 28 },
  N2O: { AR4: 298, AR5: 265, AR6: 265 },

  // HFCs
  "HFC-23": { AR4: 14800, AR5: 12400, AR6: 12400 },
  "HFC-32": { AR4: 675, AR5: 677, AR6: 677 },
  "HFC-41": { AR4: 92, AR5: 116, AR6: 116 },
  "HFC-125": { AR4: 3500, AR5: 3170, AR6: 3170 },
  "HFC-134": { AR4: 1100, AR5: 1120, AR6: 1120 },
  "HFC-134a": { AR4: 1430, AR5: 1300, AR6: 1300 },
  "HFC-143": { AR4: 353, AR5: 328, AR6: 328 },
  "HFC-143a": { AR4: 4470, AR5: 4800, AR6: 4800 },
  "HFC-152": { AR4: 53, AR5: 16, AR6: 16 },
  "HFC-152a": { AR4: 124, AR5: 138, AR6: 138 },
  "HFC-227ea": { AR4: 3220, AR5: 3350, AR6: 3350 },
  "HFC-236fa": { AR4: 9810, AR5: 8060, AR6: 8060 },
  "HFC-245fa": { AR4: 1030, AR5: 858, AR6: 858 },
  "HFC-365mfc": { AR4: 794, AR5: 804, AR6: 804 },
  "HFC-43-10mee": { AR4: 1640, AR5: 1650, AR6: 1650 },

  // PFCs
  "PFC-14": { AR4: 7390, AR5: 6630, AR6: 6630 },
  "PFC-116": { AR4: 12200, AR5: 11100, AR6: 11100 },
  "PFC-218": { AR4: 8830, AR5: 8900, AR6: 8900 },
  "PFC-318": { AR4: 10300, AR5: 9540, AR6: 9540 },
  "PFC-3-1-10": { AR4: 8860, AR5: 7910, AR6: 7910 },
  "PFC-5-1-14": { AR4: 9300, AR5: 8550, AR6: 8550 },

  // Outros
  SF6: { AR4: 22800, AR5: 23500, AR6: 23500 },
  NF3: { AR4: 17200, AR5: 16100, AR6: 16100 },
};

export const GWP_MONTREAL: Record<string, GWPValues> = {
  // CFCs (Não são gases de efeito estufa do Protocolo de Quioto)
  "CFC-11": { AR4: 4750, AR5: 4660, AR6: 4660 },
  "CFC-12": { AR4: 10900, AR5: 10200, AR6: 10200 },
  "CFC-113": { AR4: 6130, AR5: 5820, AR6: 5820 },
  "CFC-114": { AR4: 10000, AR5: 8590, AR6: 8590 },
  "CFC-115": { AR4: 7370, AR5: 7670, AR6: 7670 },

  // HCFCs
  "HCFC-21": { AR4: 151, AR5: 148, AR6: 148 },
  "HCFC-22": { AR4: 1810, AR5: 1760, AR6: 1760 },
  "HCFC-123": { AR4: 77, AR5: 79, AR6: 79 },
  "HCFC-124": { AR4: 609, AR5: 527, AR6: 527 },
  "HCFC-141b": { AR4: 725, AR5: 782, AR6: 782 },
  "HCFC-142b": { AR4: 2310, AR5: 1980, AR6: 1980 },
  "HCFC-225ca": { AR4: 122, AR5: 127, AR6: 127 },
  "HCFC-225cb": { AR4: 595, AR5: 525, AR6: 525 },

  // Halons
  "Halon-1301": { AR4: 7140, AR5: 6290, AR6: 6290 },
  "Halon-1211": { AR4: 1890, AR5: 1750, AR6: 1750 },
  "Halon-2402": { AR4: 1640, AR5: 1470, AR6: 1470 },
};

// Composição de gases refrigerantes compostos
export const REFRIGERANT_BLENDS: Record<string, Record<string, number>> = {
  "R-410A": { "HFC-32": 0.5, "HFC-125": 0.5 },
  "R-407C": { "HFC-32": 0.23, "HFC-125": 0.25, "HFC-134a": 0.52 },
  "R-438A": { "HFC-32": 0.085, "HFC-125": 0.45, "HFC-134a": 0.42 },
  "R-404A": { "HFC-125": 0.44, "HFC-143a": 0.52, "HFC-134a": 0.04 },
  "R-507A": { "HFC-125": 0.5, "HFC-143a": 0.5 },
  "R-407A": { "HFC-32": 0.2, "HFC-125": 0.4, "HFC-134a": 0.4 },
  "R-407B": { "HFC-32": 0.1, "HFC-125": 0.7, "HFC-134a": 0.2 },
  "R-422A": { "HFC-125": 0.857, "HFC-134a": 0.115 },
  "R-422D": { "HFC-125": 0.656, "HFC-134a": 0.318 },
};

// Função para obter GWP por gás e referência
export function getGWP(gas: string, reference: GWPReference = "AR5"): number {
  // Verificar se é um gás simples
  if (GWP_KYOTO[gas]) {
    return GWP_KYOTO[gas][reference];
  }
  if (GWP_MONTREAL[gas]) {
    return GWP_MONTREAL[gas][reference];
  }

  // Verificar se é uma mistura refrigerante
  if (REFRIGERANT_BLENDS[gas]) {
    const blend = REFRIGERANT_BLENDS[gas];
    let totalGWP = 0;
    for (const [component, fraction] of Object.entries(blend)) {
      const componentGWP = GWP_KYOTO[component]?.[reference] || 0;
      totalGWP += componentGWP * fraction;
    }
    return Math.round(totalGWP);
  }

  return 0;
}

// Função para verificar se é gás do Protocolo de Quioto
export function isKyotoGas(gas: string): boolean {
  return gas in GWP_KYOTO || gas in REFRIGERANT_BLENDS;
}

// Lista de todos os gases disponíveis
export function getAllGases(): string[] {
  return [
    ...Object.keys(GWP_KYOTO),
    ...Object.keys(GWP_MONTREAL),
    ...Object.keys(REFRIGERANT_BLENDS),
  ];
}
